package com.example.myfullstackapp.service;

import com.example.myfullstackapp.entity.Shipment;
import com.example.myfullstackapp.repository.ShipmentRepository;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DistributorShipmentOverdueMonitorTest {
    @Test
    void usesEtaAsTheIdempotencyKeyForAnOverdueShipment() {
        ShipmentRepository shipments = mock(ShipmentRepository.class);
        DistributorNotificationService notifications = mock(DistributorNotificationService.class);
        DistributorShipmentOverdueMonitor monitor = new DistributorShipmentOverdueMonitor(shipments, notifications);
        Instant eta = Instant.parse("2026-11-27T06:00:00Z");
        Shipment shipment = Shipment.builder()
                .shipmentCode("SHIP-123")
                .distributorEmail("driver@example.com")
                .estimatedArrival(eta)
                .build();
        when(shipments.findByStatusAndEstimatedArrivalBeforeOrderByEstimatedArrivalAsc(eq("IN_TRANSIT"), any(Instant.class)))
                .thenReturn(List.of(shipment));

        monitor.alertOverdueShipments();

        String key = "SHIP-123:eta:" + eta.toEpochMilli();
        verify(notifications).notifyDistributorOverdueOnce("driver@example.com", "Chuyến hàng quá hạn",
                "Chuyến SHIP-123 đã quá thời gian dự kiến giao hàng.", "SHIP-123", key);
        verify(notifications).notifyAdminsOverdueOnce("Chuyến hàng quá hạn",
                "Chuyến SHIP-123 đã quá thời gian dự kiến giao hàng.", "SHIP-123", key);
    }
}
