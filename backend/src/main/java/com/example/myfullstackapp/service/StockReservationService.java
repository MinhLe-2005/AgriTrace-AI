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
            if (reservation.getStatus() == StockReservation.Status.RELEASED) continue;
            if (reservation.getStatus() == StockReservation.Status.ACTIVE
                    && !reservation.getExpiresAt().isAfter(Instant.now())) continue;
            for (var line : reservation.getLines()) {
                var balance = inventory.balance(reservation.getWarehouseId(), line.getBalanceId());
                if (balance.getProductId().equals(product)) total = total.add(line.getQuantityKg());
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

    public StockReservation get(UUID warehouseId, UUID id) {
        return reservations
                .findByIdAndWarehouseId(id, warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
    }

    public StockReservation requireActive(UUID warehouseId, UUID id) {
        var reservation = get(warehouseId, id);
        if (reservation.getStatus() != StockReservation.Status.ACTIVE
                || !reservation.getExpiresAt().isAfter(Instant.now()))
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
                                            a.getQuantityKg());
                                })
                        .toList();
        String status = reservation.getStatus().name();
        if (reservation.getStatus() == StockReservation.Status.ACTIVE
                && !reservation.getExpiresAt().isAfter(Instant.now())) status = "EXPIRED";
        return new ReservationView(
                reservation.getId(),
                reservation.getOrderId(),
                status,
                reservation.getExpiresAt(),
                lines);
    }
}
