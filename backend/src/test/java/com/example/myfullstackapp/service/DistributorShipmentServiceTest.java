package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.distributor.CreateShipmentRequest;
import com.example.myfullstackapp.dto.distributor.CreateTrackingEventRequest;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.entity.Shipment;
import com.example.myfullstackapp.exception.ConflictException;
import com.example.myfullstackapp.repository.HarvestLotRepository;
import com.example.myfullstackapp.repository.OrderRepository;
import com.example.myfullstackapp.repository.ShipmentReceiptRepository;
import com.example.myfullstackapp.repository.ShipmentRepository;
import com.example.myfullstackapp.repository.ShipmentTrackingEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DistributorShipmentServiceTest {
    private ShipmentRepository shipments;
    private ShipmentTrackingEventRepository trackingEvents;
    private ShipmentReceiptRepository receipts;
    private OrderRepository orders;
    private DistributorShipmentService service;

    @BeforeEach
    void setUp() {
        shipments = mock(ShipmentRepository.class);
        trackingEvents = mock(ShipmentTrackingEventRepository.class);
        receipts = mock(ShipmentReceiptRepository.class);
        orders = mock(OrderRepository.class);
        service = new DistributorShipmentService(shipments, trackingEvents, receipts, orders, mock(HarvestLotRepository.class));
        when(trackingEvents.findByShipmentIdOrderByEventTimeAsc(any())).thenReturn(List.of());
        when(receipts.findByShipmentId(any())).thenReturn(Optional.empty());
    }

    @Test
    void acceptsOnScheduleTrackingWithoutChangingShipmentLifecycle() {
        Shipment shipment = Shipment.builder().id(1L).shipmentCode("SHIP-1").distributorEmail("distributor@example.com")
                .status("IN_TRANSIT").driverName("Driver").vehicleNumber("51A-123.45").origin("A").destination("B")
                .productSummary("Produce").build();
        when(shipments.findByShipmentCodeIgnoreCase("SHIP-1")).thenReturn(Optional.of(shipment));

        service.addTrackingEvent("SHIP-1", new CreateTrackingEventRequest(
                "Toll station", 4.1, 82.0, "ON_SCHEDULE", "Cold chain stable"), "distributor@example.com", false);

        assertEquals("IN_TRANSIT", shipment.getStatus());
        verify(trackingEvents).save(argThat(event -> "ON_SCHEDULE".equals(event.getStatus())));
    }

    @Test
    void rejectsShipmentClaimWhenOrderIsAlreadyOwnedByAnotherDistributor() {
        Order order = Order.builder().orderCode("ORD-1").status("CONFIRMED").distributorEmail("other@example.com").build();
        when(shipments.findByShipmentCodeIgnoreCase(any())).thenReturn(Optional.empty());
        when(orders.findAllByOrderCodeInForUpdate(List.of("ORD-1"))).thenReturn(List.of(order));

        CreateShipmentRequest request = new CreateShipmentRequest("SHIP-2", List.of("ORD-1"), "Driver", "0900000000",
                "51A-123.45", "Warehouse", "Customer", "Produce", null, 4.0, null, null);

        assertThrows(ConflictException.class, () -> service.create(request, "distributor@example.com"));
        verify(shipments, never()).save(any());
    }
}
