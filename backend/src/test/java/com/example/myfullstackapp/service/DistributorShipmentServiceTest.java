package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.distributor.CreateShipmentRequest;
import com.example.myfullstackapp.dto.distributor.CreateTrackingEventRequest;
import com.example.myfullstackapp.dto.distributor.UpdateShipmentStatusRequest;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.entity.Shipment;
import com.example.myfullstackapp.entity.ShipmentTrackingEvent;
import com.example.myfullstackapp.exception.ConflictException;
import com.example.myfullstackapp.repository.HarvestLotRepository;
import com.example.myfullstackapp.repository.OrderRepository;
import com.example.myfullstackapp.repository.ShipmentReceiptRepository;
import com.example.myfullstackapp.repository.ShipmentRepository;
import com.example.myfullstackapp.repository.ShipmentTrackingEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

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
        service = new DistributorShipmentService(shipments, trackingEvents, receipts, orders, mock(HarvestLotRepository.class), mock(ApplicationEventPublisher.class));
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
                "Toll station", 4.1, 82.0, "ON_SCHEDULE", "Cold chain stable", 10.762622, 106.660172, 15.0), "distributor@example.com", false);

        assertEquals("IN_TRANSIT", shipment.getStatus());
        verify(trackingEvents).save(argThat(event -> "ON_SCHEDULE".equals(event.getStatus())
                && Double.valueOf(10.762622).equals(event.getLatitude())
                && Double.valueOf(106.660172).equals(event.getLongitude())
                && Double.valueOf(15.0).equals(event.getAccuracyMeters())));
    }

    @Test
    void rejectsDuplicateLifecycleStatusAndKeepsItForTrackingUpdates() {
        Shipment shipment = Shipment.builder().id(1L).shipmentCode("SHIP-1").distributorEmail("distributor@example.com")
                .status("IN_TRANSIT").driverName("Driver").vehicleNumber("51A-123.45").origin("A").destination("B")
                .productSummary("Produce").build();
        when(shipments.findByShipmentCodeIgnoreCase("SHIP-1")).thenReturn(Optional.of(shipment));

        assertThrows(IllegalArgumentException.class, () -> service.updateStatus("SHIP-1",
                new UpdateShipmentStatusRequest("IN_TRANSIT", "Toll station", 4.1, null, "Position ping", null, null, null, null),
                "distributor@example.com", false));
        verify(trackingEvents, never()).save(any());
    }

    @Test
    void refreshesRecentDuplicateGpsPingInsteadOfAddingAnotherTimelineMarker() {
        Shipment shipment = Shipment.builder().id(1L).shipmentCode("SHIP-1").distributorEmail("distributor@example.com")
                .status("IN_TRANSIT").driverName("Driver").vehicleNumber("51A-123.45").origin("A").destination("B")
                .productSummary("Produce").temperatureC(4.5).build();
        ShipmentTrackingEvent previousGps = ShipmentTrackingEvent.builder().shipment(shipment)
                .location("GPS: 10.762622, 106.660172").temperatureC(4.5).latitude(10.762622).longitude(106.660172)
                .accuracyMeters(15.0).status("IN_TRANSIT").note("Vị trí GPS trực tiếp từ thiết bị tài xế.")
                .eventTime(Instant.now().minusSeconds(10)).build();
        when(shipments.findByShipmentCodeIgnoreCase("SHIP-1")).thenReturn(Optional.of(shipment));
        when(trackingEvents.findFirstByShipmentIdAndLatitudeIsNotNullAndLongitudeIsNotNullOrderByEventTimeDesc(1L))
                .thenReturn(Optional.of(previousGps));
        when(trackingEvents.findByShipmentIdOrderByEventTimeAsc(1L)).thenReturn(List.of(previousGps));

        service.addTrackingEvent("SHIP-1", new CreateTrackingEventRequest(
                "GPS: 10.762622, 106.660172", 4.5, null, "IN_TRANSIT", "Vị trí GPS trực tiếp từ thiết bị tài xế.",
                10.762622, 106.660172, 8.0), "distributor@example.com", false);

        verify(trackingEvents).save(same(previousGps));
        assertEquals(8.0, previousGps.getAccuracyMeters());
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

    @Test
    void allowsShipmentClaimWhenOrderIsPaid() {
        Order order = Order.builder().orderCode("ORD-PAID").status("PAID").build();
        when(shipments.findByShipmentCodeIgnoreCase(any())).thenReturn(Optional.empty());
        when(orders.findAllByOrderCodeInForUpdate(List.of("ORD-PAID"))).thenReturn(List.of(order));
        when(shipments.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        CreateShipmentRequest request = new CreateShipmentRequest("SHIP-3", List.of("ORD-PAID"), "Driver", "0900000000",
                "51A-123.45", "Warehouse", "Customer", "Produce", null, 4.0, null, null);

        var response = service.create(request, "distributor@example.com");
        assertEquals("SHIP-3", response.shipmentCode());
        assertEquals("distributor@example.com", order.getDistributorEmail());
        assertEquals("SHIP-3", order.getShipmentCode());
    }
}
