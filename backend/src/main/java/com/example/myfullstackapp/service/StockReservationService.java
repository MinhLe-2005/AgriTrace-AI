package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.exception.*;
import com.example.myfullstackapp.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StockReservationService {
    private final InventoryService inventory;
    private final FefoAllocationService fefo;
    private final StockReservationRepository reservations;
    private final WarehouseOrderQuery orders;

    @Transactional(
            readOnly = true,
            isolation = org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
    public List<AllocationView> preview(UUID warehouseId, FefoInput input) {
        return fefo.allocate(
                inventory.views(warehouseId, null, true),
                input.productId(),
                input.quantityKg(),
                InventoryService.today());
    }

    @Transactional
    public ReservationView create(UUID warehouseId, ReserveInput input, String actor) {
        inventory.lock(warehouseId, null);
        if (!inventory.requireWarehouse(warehouseId).isActive())
            throw new ConflictException("Warehouse is inactive");
        orders.lockOpen(input.orderId());
        BigDecimal demand = orders.demandKg(warehouseId, input.orderId(), input.productId());
        if (allocatedToOrder(input.orderId(), input.productId())
                        .add(input.quantityKg())
                        .compareTo(demand)
                > 0)
            throw new ConflictException(
                    "Reserved and dispatched stock would exceed the order quantity");
        var allocation =
                fefo.allocate(
                        inventory.views(warehouseId, null, true),
                        input.productId(),
                        input.quantityKg(),
                        InventoryService.today());
        var reservation = new StockReservation();
        reservation.setWarehouseId(warehouseId);
        reservation.setOrderId(input.orderId());
        reservation.setCreatedBy(actor);
        reservation.setExpiresAt(Instant.now().plusSeconds(input.ttlMinutes() * 60L));
        reservation.setLines(
                allocation.stream()
                        .map(a -> new StockReservation.Allocation(a.balanceId(), a.quantityKg()))
                        .toList());
        return view(reservations.saveAndFlush(reservation));
    }

    private BigDecimal allocatedToOrder(Long orderId, String product) {
        BigDecimal total = BigDecimal.ZERO;
        for (var reservation : reservations.findByOrderId(orderId)) {
            if (reservation.getStatus() == StockReservation.Status.ACTIVE
                    && !reservation.getExpiresAt().isAfter(Instant.now())) {
                reservation.setStatus(StockReservation.Status.EXPIRED);
                reservations.saveAndFlush(reservation);
            }
            boolean active =
                    reservation.getStatus() == StockReservation.Status.ACTIVE
                            && reservation.getExpiresAt().isAfter(Instant.now());
            for (var line : reservation.getLines()) {
                var balance = inventory.balance(reservation.getWarehouseId(), line.getBalanceId());
                if (balance.getProductId().equals(product))
                    total = total.add(active ? line.getQuantityKg() : line.getDispatchedKg());
            }
        }
        return total;
    }

    @Transactional
    public ReservationView release(UUID warehouseId, UUID id) {
        inventory.lock(warehouseId, null);
        var reservation = get(warehouseId, id);
        if (reservation.getStatus() == StockReservation.Status.CONSUMED)
            throw new ConflictException("Reservation has already been dispatched");
        reservation.setStatus(StockReservation.Status.RELEASED);
        return view(reservations.saveAndFlush(reservation));
    }

    @Transactional
    public ReservationView reconcile(UUID warehouseId, UUID id) {
        inventory.lock(warehouseId, null);
        var reservation = requireActive(warehouseId, id);
        var stock = inventory.views(warehouseId, id, true);
        Map<UUID, BalanceView> available = new HashMap<>();
        Map<UUID, BigDecimal> free = new HashMap<>();
        for (var balance : stock) {
            if (balance.availableKg().signum() > 0
                    && WarehouseExpiryPolicy.usableOn(
                            balance.expiryDate(), InventoryService.today())) {
                available.put(balance.id(), balance);
                free.put(balance.id(), balance.availableKg());
            }
        }
        Map<UUID, StockReservation.Allocation> result = new TreeMap<>();
        record Missing(UUID balanceId, String product, BigDecimal quantity) {}
        List<Missing> missing = new ArrayList<>();
        // Protect every valid original allocation before assigning replacement stock.
        for (var line : reservation.getLines()) {
            var balance = inventory.balance(warehouseId, line.getBalanceId());
            BigDecimal pending = line.remainingKg();
            if (pending.signum() == 0 || available.containsKey(balance.getId())) {
                merge(result, balance.getId(), line.getQuantityKg(), line.getDispatchedKg());
                if (pending.signum() > 0) {
                    BigDecimal remaining = free.get(balance.getId()).subtract(pending);
                    if (remaining.signum() < 0)
                        throw new ConflictException("Existing reservations exceed available stock");
                    free.put(balance.getId(), remaining);
                }
            } else {
                if (line.getDispatchedKg().signum() > 0)
                    merge(result, balance.getId(), line.getDispatchedKg(), line.getDispatchedKg());
                missing.add(new Missing(balance.getId(), balance.getProductId(), pending));
            }
        }
        for (var item : missing) {
            BigDecimal supply =
                    available.values().stream()
                            .filter(b -> b.productId().equals(item.product()))
                            .map(b -> free.get(b.id()))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal replace = supply.min(item.quantity());
            if (replace.signum() > 0) {
                var candidates =
                        available.values().stream()
                                .map(
                                        b ->
                                                new BalanceView(
                                                        b.id(),
                                                        b.warehouseId(),
                                                        b.locationId(),
                                                        b.lotId(),
                                                        b.productId(),
                                                        b.lotCode(),
                                                        b.expiryDate(),
                                                        b.quantityKg(),
                                                        BigDecimal.ZERO,
                                                        free.get(b.id()),
                                                        b.held(),
                                                        b.receivedAt()))
                                .toList();
                for (var allocation :
                        fefo.allocate(
                                candidates, item.product(), replace, InventoryService.today())) {
                    merge(result, allocation.balanceId(), allocation.quantityKg(), BigDecimal.ZERO);
                    free.compute(
                            allocation.balanceId(),
                            (key, value) -> value.subtract(allocation.quantityKg()));
                }
            }
            BigDecimal unresolved = item.quantity().subtract(replace);
            if (unresolved.signum() > 0)
                merge(result, item.balanceId(), unresolved, BigDecimal.ZERO);
        }
        reservation.setLines(new ArrayList<>(result.values()));
        return view(reservations.saveAndFlush(reservation));
    }

    private void merge(
            Map<UUID, StockReservation.Allocation> target,
            UUID balanceId,
            BigDecimal quantity,
            BigDecimal dispatched) {
        var allocation =
                target.computeIfAbsent(
                        balanceId, key -> new StockReservation.Allocation(key, BigDecimal.ZERO));
        allocation.setQuantityKg(allocation.getQuantityKg().add(quantity));
        allocation.setDispatchedKg(allocation.getDispatchedKg().add(dispatched));
    }

    @Transactional
    public void consume(UUID warehouseId, UUID id, Map<UUID, BigDecimal> quantities) {
        inventory.lock(warehouseId, null);
        var reservation = requireActive(warehouseId, id);
        Map<UUID, StockReservation.Allocation> allocations = new HashMap<>();
        for (var line : reservation.getLines()) allocations.put(line.getBalanceId(), line);
        for (var entry : quantities.entrySet()) {
            var line = allocations.get(entry.getKey());
            if (line == null
                    || entry.getValue().signum() <= 0
                    || entry.getValue().compareTo(line.remainingKg()) > 0)
                throw new ConflictException("Dispatch exceeds the remaining reservation");
            line.setDispatchedKg(line.getDispatchedKg().add(entry.getValue()));
        }
        if (reservation.getLines().stream().allMatch(line -> line.remainingKg().signum() == 0))
            reservation.setStatus(StockReservation.Status.CONSUMED);
        reservations.saveAndFlush(reservation);
    }

    public StockReservation get(UUID warehouseId, UUID id) {
        return reservations
                .findByIdAndWarehouseId(id, warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
    }

    public StockReservation requireActive(UUID warehouseId, UUID id) {
        var reservation = get(warehouseId, id);
        if (reservation.getStatus() == StockReservation.Status.ACTIVE
                && !reservation.getExpiresAt().isAfter(Instant.now())) {
            reservation.setStatus(StockReservation.Status.EXPIRED);
            reservations.save(reservation);
        }
        if (reservation.getStatus() != StockReservation.Status.ACTIVE)
            throw new ConflictException("Reservation is expired or no longer active");
        orders.lockOpen(reservation.getOrderId());
        Set<String> products = new HashSet<>();
        for (var line : reservation.getLines())
            products.add(inventory.balance(warehouseId, line.getBalanceId()).getProductId());
        for (String product : products)
            if (allocatedToOrder(reservation.getOrderId(), product)
                            .compareTo(
                                    orders.demandKg(warehouseId, reservation.getOrderId(), product))
                    > 0)
                throw new ConflictException(
                        "Order quantity changed; reconcile reservations before dispatch");
        return reservation;
    }

    @Transactional(readOnly = true)
    public List<ReservationView> list(UUID warehouseId, int page) {
        inventory.requireWarehouse(warehouseId);
        return reservations
                .findByWarehouseIdOrderByCreatedAtDesc(warehouseId, PageRequest.of(page, 100))
                .stream()
                .map(this::view)
                .toList();
    }

    public ReservationView view(StockReservation reservation) {
        var lines =
                reservation.getLines().stream()
                        .map(
                                a -> {
                                    var balance =
                                            inventory.balance(
                                                    reservation.getWarehouseId(), a.getBalanceId());
                                    return new AllocationView(
                                            balance.getId(),
                                            balance.getLotId(),
                                            balance.getLocationId(),
                                            balance.getLotCode(),
                                            balance.getExpiryDate(),
                                            a.getQuantityKg(),
                                            a.getDispatchedKg());
                                })
                        .toList();
        String status = reservation.getStatus().name();
        if (reservation.getStatus() == StockReservation.Status.ACTIVE
                && !reservation.getExpiresAt().isAfter(Instant.now())) {
            status = StockReservation.Status.EXPIRED.name();
        } else if (reservation.getStatus() == StockReservation.Status.ACTIVE
                && reservation.getLines().stream()
                        .anyMatch(a -> a.getDispatchedKg().signum() > 0)) {
            status = "PARTIALLY_CONSUMED";
        }
        return new ReservationView(
                reservation.getId(),
                reservation.getOrderId(),
                status,
                reservation.getExpiresAt(),
                lines);
    }
}
