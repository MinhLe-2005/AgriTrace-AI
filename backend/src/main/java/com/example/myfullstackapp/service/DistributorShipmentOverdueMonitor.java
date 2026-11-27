package com.example.myfullstackapp.service;

import com.example.myfullstackapp.entity.DistributorNotificationType;
import com.example.myfullstackapp.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/** Creates one durable, real-time alert when an in-transit shipment passes its ETA. */
@Component
@RequiredArgsConstructor
public class DistributorShipmentOverdueMonitor {
    private final ShipmentRepository shipmentRepository;
    private final DistributorNotificationService notificationService;

    @Scheduled(fixedDelayString = "${app.distributor.overdue-check-ms:300000}", initialDelayString = "${app.distributor.overdue-check-ms:300000}")
    @Transactional
    public void alertOverdueShipments() {
        Instant now = Instant.now();
        shipmentRepository.findByStatusAndEstimatedArrivalBeforeOrderByEstimatedArrivalAsc("IN_TRANSIT", now).stream()
                .forEach(shipment -> {
                    String content = "Chuyến " + shipment.getShipmentCode() + " đã quá thời gian dự kiến giao hàng.";
                    String dedupKey = shipment.getShipmentCode() + ":eta:" + shipment.getEstimatedArrival().toEpochMilli();
                    notificationService.notifyDistributorOverdueOnce(shipment.getDistributorEmail(),
                            "Chuyến hàng quá hạn", content, shipment.getShipmentCode(), dedupKey);
                    notificationService.notifyAdminsOverdueOnce(
                            "Chuyến hàng quá hạn", content, shipment.getShipmentCode(), dedupKey);
                });
    }
}
