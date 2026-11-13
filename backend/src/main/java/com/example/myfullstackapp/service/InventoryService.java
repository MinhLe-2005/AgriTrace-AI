package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.exception.*;
import com.example.myfullstackapp.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final WarehouseRepository warehouses;
    private final StorageLocationRepository locations;
    private final StockBalanceRepository balances;
    private final StockMovementRepository movements;
    private final StockReservationRepository reservations;
    private final WarehouseLotQuery lots;

    public static LocalDate today() {
        return LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    }

    public Warehouse requireWarehouse(UUID id) {
        return warehouses
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
    }

    public void lock(UUID source, UUID target) {
        var ids = new TreeSet<UUID>();
        ids.add(source);
        if (target != null) ids.add(target);
        for (UUID id : ids)
            warehouses
                    .findByIdForUpdate(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
    }

    public StorageLocation location(UUID warehouseId, UUID id, boolean requireActive) {
        Warehouse warehouse = requireWarehouse(warehouseId);
        StorageLocation location =
                locations
                        .findByIdAndWarehouseId(id, warehouseId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Location not found in warehouse"));
        if (requireActive && (!warehouse.isActive() || !location.isActive()))
            throw new ConflictException("Warehouse or location is inactive");
        return location;
    }

    public Map<UUID, BigDecimal> reserved(UUID warehouseId, UUID except) {
        Map<UUID, BigDecimal> sums = new HashMap<>();
        var now = Instant.now();
        for (var reservation :
                reservations.findByWarehouseIdAndStatusAndExpiresAtAfter(
                        warehouseId, StockReservation.Status.ACTIVE, now)) {
            if (reservation.getId().equals(except)) continue;
            for (var line : reservation.getLines())
                sums.merge(line.getBalanceId(), line.remainingKg(), BigDecimal::add);
        }
        return sums;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public List<BalanceView> getBalances(UUID warehouseId) {
        return views(warehouseId, null, false);
    }

    public List<BalanceView> views(UUID warehouseId, UUID exceptReservation, boolean eligibleOnly) {
        return project(
                warehouseId,
                balances.findByWarehouseIdOrderByExpiryDateAscLotIdAscLocationIdAsc(warehouseId),
                exceptReservation,
                new HashMap<>());
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public List<BalanceView> page(
            UUID warehouseId,
            String lotId,
            UUID locationId,
            boolean onlyAvailable,
            int page,
            int size) {
        if (page < 0 || size < 1 || size > 500)
            throw new IllegalArgumentException("Invalid inventory page");
        var warehouse = requireWarehouse(warehouseId);
        if (onlyAvailable && !warehouse.isActive()) return List.of();
        var sort = Sort.by("expiryDate", "lotId", "locationId", "id");
        if (!onlyAvailable) {
            var slice =
                    balances.searchWarehouse(
                            warehouseId,
                            lotId,
                            locationId,
                            false,
                            today(),
                            PageRequest.of(page, size, sort));
            return project(warehouseId, slice.getContent(), null, new HashMap<>());
        }
        // Farmer approval and live reservations are checked before counting an available row.
        // Scan bounded database slices rather than materializing every warehouse balance.
        var request = PageRequest.of(0, Math.max(size, 100), sort);
        long skip = (long) page * size;
        List<BalanceView> result = new ArrayList<>();
        Map<String, LotSummary> lotCache = new HashMap<>();
        while (true) {
            var slice =
                    balances.searchWarehouse(
                            warehouseId, lotId, locationId, true, today(), request);
            for (var value : project(warehouseId, slice.getContent(), null, lotCache)) {
                if (value.availableKg().signum() == 0) continue;
                if (skip > 0) {
                    skip--;
                    continue;
                }
                result.add(value);
                if (result.size() == size) return List.copyOf(result);
            }
            if (!slice.hasNext()) return List.copyOf(result);
            request = request.next();
        }
    }

    private List<BalanceView> project(
            UUID warehouseId,
            List<StockBalance> rows,
            UUID exceptReservation,
            Map<String, LotSummary> lotCache) {
        var warehouse = requireWarehouse(warehouseId);
        if (rows.isEmpty()) return List.of();
        Map<UUID, StorageLocation> locationData = new HashMap<>();
        var locationIds = rows.stream().map(StockBalance::getLocationId).distinct().toList();
        for (int offset = 0; offset < locationIds.size(); offset += 500) {
            for (var location :
                    locations.findForBalances(
                            warehouseId,
                            locationIds.subList(
                                    offset, Math.min(locationIds.size(), offset + 500))))
                locationData.put(location.getId(), location);
        }
        Set<String> needed = new HashSet<>();
        for (var balance : rows) {
            var location = locationData.get(balance.getLocationId());
            if (location == null)
                throw new ResourceNotFoundException("Location not found in warehouse");
            if (warehouse.isActive()
                    && location.isActive()
                    && !balance.isHeld()
                    && balance.getQuantityKg().signum() > 0
                    && WarehouseExpiryPolicy.usableOn(balance.getExpiryDate(), today())
                    && !lotCache.containsKey(balance.getLotId())) needed.add(balance.getLotId());
        }
        lotCache.putAll(lots.getMany(needed));
        for (String id : needed) lotCache.putIfAbsent(id, null);
        Map<UUID, BigDecimal> held = new HashMap<>();
        var balanceIds = rows.stream().map(StockBalance::getId).toList();
        var now = Instant.now();
        for (int offset = 0; offset < balanceIds.size(); offset += 500) {
            for (var total :
                    reservations.sumForBalances(
                            warehouseId,
                            StockReservation.Status.ACTIVE,
                            now,
                            exceptReservation,
                            balanceIds.subList(offset, Math.min(balanceIds.size(), offset + 500))))
                held.put(total.getBalanceId(), total.getQuantityKg());
        }
        return rows.stream()
                .map(
                        balance -> {
                            var location = locationData.get(balance.getLocationId());
                            var lot = lotCache.get(balance.getLotId());
                            boolean eligible =
                                    warehouse.isActive()
                                            && location.isActive()
                                            && !balance.isHeld()
                                            && WarehouseExpiryPolicy.usableOn(
                                                    balance.getExpiryDate(), today())
                                            && lot != null
                                            && "APPROVED".equals(lot.status())
                                            && balance.getExpiryDate().equals(lot.expiryDate())
                                            && balance.getProductId().equals(lot.productId());
                            var reserved = held.getOrDefault(balance.getId(), BigDecimal.ZERO);
                            var available =
                                    eligible
                                            ? balance.getQuantityKg()
                                                    .subtract(reserved)
                                                    .max(BigDecimal.ZERO)
                                            : BigDecimal.ZERO;
                            return new BalanceView(
                                    balance.getId(),
                                    warehouseId,
                                    balance.getLocationId(),
                                    balance.getLotId(),
                                    balance.getProductId(),
                                    balance.getLotCode(),
                                    balance.getExpiryDate(),
                                    balance.getQuantityKg(),
                                    reserved,
                                    available,
                                    balance.isHeld(),
                                    balance.getReceivedAt());
                        })
                .toList();
    }

    public Optional<StockBalance> find(UUID warehouseId, UUID locationId, String lotId) {
        return balances.findByWarehouseIdAndLocationIdAndLotId(warehouseId, locationId, lotId);
    }

    public StockBalance balance(UUID warehouseId, UUID id) {
        return balances.findByIdAndWarehouseId(id, warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock balance not found"));
    }

    /** All quantity changes are routed here while the caller holds the warehouse lock. */
    @Transactional(propagation = Propagation.MANDATORY)
    public StockBalance change(
            UUID warehouseId,
            UUID locationId,
            LotSummary lot,
            BigDecimal delta,
            UUID documentId,
            String type,
            String actor,
            UUID exceptReservation) {
        var existing = find(warehouseId, locationId, lot.id());
        StockBalance balance =
                existing.orElseGet(
                        () -> {
                            var b = new StockBalance();
                            b.setWarehouseId(warehouseId);
                            b.setLocationId(locationId);
                            b.setLotId(lot.id());
                            b.setProductId(lot.productId());
                            b.setLotCode(lot.lotCode());
                            b.setExpiryDate(lot.expiryDate());
                            return b;
                        });
        if (!balance.getProductId().equals(lot.productId())
                || !balance.getExpiryDate().equals(lot.expiryDate()))
            throw new ConflictException(
                    "Farmer lot identity or expiry changed; reconcile before moving stock");
        BigDecimal after = balance.getQuantityKg().add(delta);
        BigDecimal heldForOrders =
                reserved(warehouseId, exceptReservation)
                        .getOrDefault(balance.getId(), BigDecimal.ZERO);
        if (after.signum() < 0 || after.compareTo(heldForOrders) < 0)
            throw new ConflictException("Insufficient unreserved stock");
        if (delta.signum() < 0
                && balance.isHeld()
                && !"COUNT".equals(type)
                && !"ADJUSTMENT".equals(type))
            throw new ConflictException("Quarantined stock cannot be dispatched or transferred");
        location(warehouseId, locationId, delta.signum() > 0);
        if (delta.signum() > 0) {
            checkCapacity(warehouseId, locationId, delta);
        }
        balance.setQuantityKg(after);
        balances.saveAndFlush(balance);
        var movement = new StockMovement();
        movement.setWarehouseId(warehouseId);
        movement.setLocationId(locationId);
        movement.setLotId(lot.id());
        movement.setDocumentId(documentId);
        movement.setType(type);
        movement.setDeltaKg(delta);
        movement.setBalanceAfterKg(after);
        movement.setActor(actor);
        movements.save(movement);
        return balance;
    }

    public void checkCapacity(UUID warehouseId, UUID locationId, BigDecimal delta) {
        if (delta.signum() <= 0) return;
        var location = location(warehouseId, locationId, true);
        BigDecimal locationAfter = balances.sumQuantityByLocation(locationId).add(delta);
        if (locationAfter.compareTo(location.getCapacityTons().multiply(new BigDecimal("1000")))
                > 0) throw new ConflictException("Location capacity exceeded");
        BigDecimal warehouseAfter = balances.sumQuantityByWarehouse(warehouseId).add(delta);
        if (warehouseAfter.compareTo(
                        requireWarehouse(warehouseId)
                                .getCapacityTons()
                                .multiply(new BigDecimal("1000")))
                > 0) throw new ConflictException("Warehouse capacity exceeded");
    }
}
