package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.exception.*;
import com.example.myfullstackapp.repository.*;

import lombok.RequiredArgsConstructor;

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
                reservations.findByWarehouseIdAndStatus(
                        warehouseId, StockReservation.Status.ACTIVE)) {
            if (!reservation.getExpiresAt().isAfter(now) || reservation.getId().equals(except))
                continue;
            for (var line : reservation.getLines())
                sums.merge(line.getBalanceId(), line.getQuantityKg(), BigDecimal::add);
        }
        return sums;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public List<BalanceView> getBalances(UUID warehouseId) {
        return views(warehouseId, null, false);
    }

    public List<BalanceView> views(UUID warehouseId, UUID exceptReservation, boolean eligibleOnly) {
        Warehouse warehouse = requireWarehouse(warehouseId);
        var reserved = reserved(warehouseId, exceptReservation);
        Map<String, LotSummary> currentLots = new HashMap<>();
        Map<UUID, StorageLocation> currentLocations = new HashMap<>();
        return balances
                .findByWarehouseIdOrderByExpiryDateAscLotIdAscLocationIdAsc(warehouseId)
                .stream()
                .map(
                        b -> {
                            BigDecimal held = reserved.getOrDefault(b.getId(), BigDecimal.ZERO);
                            boolean eligible = !b.isHeld() && !b.getExpiryDate().isBefore(today());
                            var location =
                                    currentLocations.computeIfAbsent(
                                            b.getLocationId(),
                                            locationId -> location(warehouseId, locationId, false));
                            eligible &= warehouse.isActive() && location.isActive();
                            if (eligible && b.getQuantityKg().signum() > 0) {
                                try {
                                    var lot = currentLots.computeIfAbsent(b.getLotId(), lots::get);
                                    eligible &=
                                            "APPROVED".equals(lot.status())
                                                    && b.getExpiryDate().equals(lot.expiryDate())
                                                    && b.getProductId().equals(lot.productId());
                                } catch (ResourceNotFoundException deletedLot) {
                                    eligible = false;
                                }
                            }
                            BigDecimal available =
                                    eligible
                                            ? b.getQuantityKg().subtract(held).max(BigDecimal.ZERO)
                                            : BigDecimal.ZERO;
                            return new BalanceView(
                                    b.getId(),
                                    warehouseId,
                                    b.getLocationId(),
                                    b.getLotId(),
                                    b.getProductId(),
                                    b.getLotCode(),
                                    b.getExpiryDate(),
                                    b.getQuantityKg(),
                                    held,
                                    available,
                                    b.isHeld(),
                                    b.getReceivedAt());
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
        var location = location(warehouseId, locationId, delta.signum() > 0);
        if (delta.signum() > 0) {
            BigDecimal locationAfter = balances.sumQuantityByLocation(locationId).add(delta);
            if (locationAfter.compareTo(location.getCapacityTons().multiply(new BigDecimal("1000")))
                    > 0) throw new ConflictException("Location capacity exceeded");
            BigDecimal warehouseAfter =
                    balances
                            .findByWarehouseIdOrderByExpiryDateAscLotIdAscLocationIdAsc(warehouseId)
                            .stream()
                            .map(StockBalance::getQuantityKg)
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .add(delta);
            if (warehouseAfter.compareTo(
                            requireWarehouse(warehouseId)
                                    .getCapacityTons()
                                    .multiply(new BigDecimal("1000")))
                    > 0) throw new ConflictException("Warehouse capacity exceeded");
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
}
