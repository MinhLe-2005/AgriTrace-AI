package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.traceability.TraceabilityChainResponse;
import com.example.myfullstackapp.dto.traceability.TraceabilityChainResponse.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TraceabilityChainService {
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final HarvestLotRepository harvestLots;
    private final TraceabilityRecordRepository legacyRecords;
    private final BatchWarehouseTraceQuery ledger;
    private final ShipmentRepository shipments;
    private final ShipmentTrackingEventRepository trackingEvents;
    private final ShipmentReceiptRepository receipts;

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public TraceabilityChainResponse traceByBatchCode(String requestedCode) {
        if (requestedCode == null || requestedCode.isBlank())
            throw new IllegalArgumentException("Mã lô không được để trống");
        String code = requestedCode.trim();
        var lot = harvestLots.findByCodeIgnoreCase(code).orElse(null);
        var legacy = legacyRecords.findByBatchCodeIgnoreCase(code).orElse(null);
        var stops = ledger.warehouseStops(code);
        var dispatches = ledger.dispatches(code);
        if (lot == null && legacy == null && stops.isEmpty() && dispatches.isEmpty())
            throw new ResourceNotFoundException("Không tìm thấy dữ liệu truy xuất cho lô " + code);

        var farm = lot != null
                ? new FarmInfo(lot.getFarmName(), null, lot.getCert(), lot.getCultivation())
                : new FarmInfo(legacy == null ? null : legacy.getFarmName(), legacy == null ? null : legacy.getLocation(),
                        legacy == null ? null : legacy.getCertType(), null);
        String harvestDate = lot != null ? lot.getHarvestDate() : legacy == null ? null : legacy.getHarvestDate();
        // Historical records also contain auto-generated lab claims. There is no verified lab-report link.
        var harvest = new HarvestInfo(harvestDate, lot == null ? null : lot.getExpiryDate(), null);
        List<TimelineEvent> timeline = new ArrayList<>();
        if (farm.name() != null)
            timeline.add(new TimelineEvent("FARM", "Nguồn gốc nông trại", farm.name(), farm.location(), null,
                    lot == null || lot.getCreatedAt() == null ? null : lot.getCreatedAt().atZone(BUSINESS_ZONE).toInstant()));
        if (harvestDate != null)
            timeline.add(new TimelineEvent("HARVEST", "Thu hoạch", harvestDate, null, null, dateAtStart(harvestDate)));
        for (var stop : stops)
            timeline.add(new TimelineEvent("WAREHOUSE_IN", "Đã nhập kho", stop.warehouseName(), stop.location(),
                    null, stop.receivedAt()));

        var shipmentViews = new ArrayList<ShipmentInfo>();
        Instant lastReceipt = null;
        if (!dispatches.isEmpty()) {
            var ids = dispatches.stream().map(BatchWarehouseTraceQuery.Dispatch::shipmentId).toList();
            var byId = shipments.findAllById(ids).stream().collect(Collectors.toMap(Shipment::getId, s -> s));
            var events = trackingEvents.findByShipmentIdInOrderByEventTimeAsc(ids).stream()
                    .collect(Collectors.groupingBy(e -> e.getShipment().getId()));
            var delivered = receipts.findByShipmentIdIn(ids).stream()
                    .filter(r -> r.getReceivedAt() != null)
                    .collect(Collectors.toMap(r -> r.getShipment().getId(), ShipmentReceipt::getReceivedAt, (a, b) -> b));
            for (var dispatch : dispatches) {
                var shipment = byId.get(dispatch.shipmentId());
                if (shipment == null) continue;
                var tracking = events.getOrDefault(shipment.getId(), List.of()).stream()
                        .filter(e -> e.getEventTime() != null && !e.getEventTime().isBefore(dispatch.handedOverAt()))
                        .map(e -> new TrackingEventInfo(e.getTemperatureC(), e.getHumidityPercent(), e.getStatus(),
                                e.getEventTime())).toList();
                var arrival = delivered.getOrDefault(shipment.getId(), shipment.getActualArrival());
                shipmentViews.add(new ShipmentInfo(shipment.getShipmentCode(), shipment.getStatus(), dispatch.quantityKg(),
                        shipment.getDispatchTime(), shipment.getEstimatedArrival(), arrival, tracking));
                timeline.add(new TimelineEvent("WAREHOUSE_OUT", "Bàn giao cho chuyến " + shipment.getShipmentCode(),
                        dispatch.quantityKg().stripTrailingZeros().toPlainString() + " kg", null, null, dispatch.handedOverAt()));
                for (var e : tracking)
                    timeline.add(new TimelineEvent("SHIPPING", "Theo dõi chuyến " + shipment.getShipmentCode(),
                            e.status(), null, e.temperatureC(), e.timestamp()));
                if (arrival != null) {
                    timeline.add(new TimelineEvent("DELIVERED", "Chuyến đã giao hàng", shipment.getShipmentCode(),
                            null, null, arrival));
                    if (lastReceipt == null || arrival.isAfter(lastReceipt)) lastReceipt = arrival;
                }
            }
        }
        timeline.sort(Comparator.comparing(TimelineEvent::timestamp, Comparator.nullsLast(Comparator.naturalOrder())));
        String source = lot != null ? "HARVEST_LOT" : legacy != null ? "LEGACY_RECORD" : "WAREHOUSE_LEDGER";
        return new TraceabilityChainResponse(lot != null ? lot.getCode() : legacy != null ? legacy.getBatchCode() : code,
                lot != null ? lot.getProduct() : legacy == null ? null : legacy.getProductName(), source, farm, harvest,
                new WarehouseInfo(stops), shipmentViews, lastReceipt == null ? null : new DeliveryInfo(lastReceipt), timeline);
    }

    private Instant dateAtStart(String value) {
        for (var format : List.of(DateTimeFormatter.ISO_LOCAL_DATE, DateTimeFormatter.ofPattern("dd/MM/uuuu"))) {
            try {
                return LocalDate.parse(value, format).atStartOfDay(BUSINESS_ZONE).toInstant();
            } catch (DateTimeParseException ignored) {
                // Preserve unrecognised legacy text without inventing a timestamp.
            }
        }
        return null;
    }
}
