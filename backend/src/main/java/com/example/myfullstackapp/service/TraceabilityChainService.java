package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.traceability.TraceabilityChainResponse;
import com.example.myfullstackapp.entity.HarvestLot;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.entity.Shipment;
import com.example.myfullstackapp.entity.ShipmentReceipt;
import com.example.myfullstackapp.entity.ShipmentTrackingEvent;
import com.example.myfullstackapp.entity.StockBalance;
import com.example.myfullstackapp.entity.TraceabilityRecord;
import com.example.myfullstackapp.entity.Warehouse;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.HarvestLotRepository;
import com.example.myfullstackapp.repository.OrderRepository;
import com.example.myfullstackapp.repository.ShipmentReceiptRepository;
import com.example.myfullstackapp.repository.ShipmentRepository;
import com.example.myfullstackapp.repository.ShipmentTrackingEventRepository;
import com.example.myfullstackapp.repository.StockBalanceRepository;
import com.example.myfullstackapp.repository.TraceabilityRecordRepository;
import com.example.myfullstackapp.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Builds a chain from persisted operational records.  The legacy
 * {@code agri_traceability} record is used only to enrich batches created
 * before harvest lots were introduced; no demonstration rows are generated.
 */
@Service
@RequiredArgsConstructor
public class TraceabilityChainService {
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Bangkok");

    private final HarvestLotRepository harvestLots;
    private final TraceabilityRecordRepository legacyRecords;
    private final StockBalanceRepository stockBalances;
    private final WarehouseRepository warehouses;
    private final ShipmentRepository shipments;
    private final ShipmentTrackingEventRepository trackingEvents;
    private final ShipmentReceiptRepository receipts;
    private final OrderRepository orders;

    @Transactional(readOnly = true)
    public TraceabilityChainResponse traceByBatchCode(String requestedBatchCode) {
        String batchCode = requiredBatchCode(requestedBatchCode);
        HarvestLot lot = harvestLots.findByCodeIgnoreCase(batchCode).orElse(null);
        TraceabilityRecord legacy = legacyRecords.findByBatchCodeIgnoreCase(batchCode).orElse(null);
        List<Order> batchOrders = new ArrayList<>(orders.findByLotCodeIgnoreCaseOrderByCreatedAtAsc(batchCode));
        List<StockBalance> balances = stockBalances.findByLotCodeIgnoreCaseOrderByReceivedAtAsc(batchCode);

        Map<Long, Shipment> shipmentsById = new LinkedHashMap<>();
        shipments.findByLotCodeIgnoreCaseOrderByCreatedAtAsc(batchCode)
                .forEach(shipment -> shipmentsById.put(shipment.getId(), shipment));

        Set<String> linkedShipmentCodes = batchOrders.stream()
                .map(Order::getShipmentCode)
                .filter(this::hasText)
                .map(code -> code.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
        if (!linkedShipmentCodes.isEmpty()) {
            shipments.findByShipmentCodeIgnoreCaseIn(linkedShipmentCodes)
                    .forEach(shipment -> shipmentsById.put(shipment.getId(), shipment));
        }
        List<Shipment> batchShipments = shipmentsById.values().stream()
                .sorted(Comparator.comparing(Shipment::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        // Shipment.orderCodes is retained for legacy records. Include those
        // orders too so delivery data is still linked when the old order rows
        // did not store lotCode or shipmentCode.
        List<String> shipmentOrderCodes = batchShipments.stream()
                .flatMap(shipment -> splitOrderCodes(shipment.getOrderCodes()).stream())
                .distinct()
                .toList();
        if (!shipmentOrderCodes.isEmpty()) {
            Set<String> knownOrderCodes = batchOrders.stream()
                    .map(Order::getOrderCode)
                    .filter(this::hasText)
                    .map(code -> code.toLowerCase(Locale.ROOT))
                    .collect(Collectors.toSet());
            orders.findByOrderCodeIn(shipmentOrderCodes).stream()
                    .filter(order -> hasText(order.getOrderCode())
                            && knownOrderCodes.add(order.getOrderCode().toLowerCase(Locale.ROOT)))
                    .forEach(batchOrders::add);
        }

        if (lot == null && legacy == null && balances.isEmpty() && batchOrders.isEmpty() && batchShipments.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy dữ liệu truy xuất cho lô " + batchCode);
        }

        Map<UUID, Warehouse> warehousesById = warehousesById(balances);
        List<TraceabilityChainResponse.WarehouseStop> warehouseStops = warehouseStops(balances, warehousesById);
        Map<Long, List<ShipmentTrackingEvent>> trackingByShipment = trackingByShipment(batchShipments);
        Map<Long, ShipmentReceipt> receiptsByShipment = receiptsByShipment(batchShipments);

        List<TraceabilityChainResponse.ShipmentInfo> shipmentInfo = batchShipments.stream()
                .map(shipment -> toShipmentInfo(shipment, trackingByShipment.getOrDefault(shipment.getId(), List.of())))
                .toList();

        TraceabilityChainResponse.DeliveryInfo delivery = deliveryInfo(batchOrders, receiptsByShipment.values());
        List<TraceabilityChainResponse.TimelineEvent> timeline = timeline(
                lot, legacy, warehouseStops, batchShipments, trackingByShipment, receiptsByShipment);

        return new TraceabilityChainResponse(
                batchCode,
                firstText(lot == null ? null : lot.getProduct(), legacy == null ? null : legacy.getProductName(),
                        batchShipments.stream().map(Shipment::getProductSummary).filter(this::hasText).findFirst().orElse(null)),
                new TraceabilityChainResponse.FarmInfo(
                        firstText(lot == null ? null : lot.getFarmName(), legacy == null ? null : legacy.getFarmName()),
                        legacy == null ? null : legacy.getLocation(),
                        firstText(lot == null ? null : lot.getCert(), legacy == null ? null : legacy.getCertType()),
                        lot == null ? null : lot.getCultivation()),
                new TraceabilityChainResponse.HarvestInfo(
                        firstText(lot == null ? null : lot.getHarvestDate(), legacy == null ? null : legacy.getHarvestDate()),
                        lot == null ? null : lot.getExpiryDate(),
                        legacy == null ? null : legacy.getLabResult()),
                new TraceabilityChainResponse.WarehouseInfo(warehouseStops),
                shipmentInfo,
                delivery,
                timeline
        );
    }

    private Map<UUID, Warehouse> warehousesById(List<StockBalance> balances) {
        Set<UUID> warehouseIds = balances.stream().map(StockBalance::getWarehouseId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (warehouseIds.isEmpty()) return Map.of();
        Map<UUID, Warehouse> result = new HashMap<>();
        warehouses.findAllById(warehouseIds).forEach(warehouse -> result.put(warehouse.getId(), warehouse));
        return result;
    }

    private List<TraceabilityChainResponse.WarehouseStop> warehouseStops(
            List<StockBalance> balances, Map<UUID, Warehouse> warehousesById) {
        Map<UUID, List<StockBalance>> byWarehouse = new LinkedHashMap<>();
        balances.forEach(balance -> byWarehouse.computeIfAbsent(balance.getWarehouseId(), ignored -> new ArrayList<>()).add(balance));
        return byWarehouse.entrySet().stream().map(entry -> {
            UUID warehouseId = entry.getKey();
            Warehouse warehouse = warehousesById.get(warehouseId);
            List<StockBalance> entries = entry.getValue();
            Instant receivedAt = entries.stream().map(StockBalance::getReceivedAt).filter(Objects::nonNull).min(Instant::compareTo).orElse(null);
            BigDecimal quantity = entries.stream().map(StockBalance::getQuantityKg).filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            return new TraceabilityChainResponse.WarehouseStop(
                    warehouseId,
                    warehouse == null ? null : warehouse.getName(),
                    warehouse == null ? null : warehouse.getLocation(),
                    receivedAt,
                    warehouse == null || warehouse.getTempTargetC() == null ? null : warehouse.getTempTargetC().doubleValue(),
                    quantity);
        }).toList();
    }

    private Map<Long, List<ShipmentTrackingEvent>> trackingByShipment(List<Shipment> batchShipments) {
        List<Long> shipmentIds = shipmentIds(batchShipments);
        if (shipmentIds.isEmpty()) return Map.of();
        return trackingEvents.findByShipmentIdInOrderByEventTimeAsc(shipmentIds).stream()
                .collect(Collectors.groupingBy(event -> event.getShipment().getId(), LinkedHashMap::new, Collectors.toList()));
    }

    private Map<Long, ShipmentReceipt> receiptsByShipment(List<Shipment> batchShipments) {
        List<Long> shipmentIds = shipmentIds(batchShipments);
        if (shipmentIds.isEmpty()) return Map.of();
        return receipts.findByShipmentIdIn(shipmentIds).stream()
                .collect(Collectors.toMap(receipt -> receipt.getShipment().getId(), receipt -> receipt));
    }

    private List<Long> shipmentIds(Collection<Shipment> values) {
        return values.stream().map(Shipment::getId).filter(Objects::nonNull).toList();
    }

    private TraceabilityChainResponse.ShipmentInfo toShipmentInfo(
            Shipment shipment, List<ShipmentTrackingEvent> shipmentTracking) {
        List<TraceabilityChainResponse.TrackingEventInfo> events = shipmentTracking.stream()
                .map(event -> new TraceabilityChainResponse.TrackingEventInfo(
                        event.getLocation(), event.getTemperatureC(), event.getHumidityPercent(), event.getStatus(),
                        event.getNote(), event.getEventTime()))
                .toList();
        return new TraceabilityChainResponse.ShipmentInfo(
                shipment.getShipmentCode(), shipment.getStatus(), shipment.getDriverName(), shipment.getVehicleNumber(),
                shipment.getOrigin(), shipment.getDestination(), shipment.getTemperatureC(), shipment.getDispatchTime(),
                shipment.getEstimatedArrival(), shipment.getActualArrival(), events);
    }

    private TraceabilityChainResponse.DeliveryInfo deliveryInfo(
            List<Order> batchOrders, Collection<ShipmentReceipt> shipmentReceipts) {
        ShipmentReceipt newestReceipt = shipmentReceipts.stream()
                .filter(Objects::nonNull)
                .max(Comparator.comparing(ShipmentReceipt::getReceivedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
        Order newestOrder = batchOrders.stream()
                .max(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
        if (newestReceipt == null && newestOrder == null) return null;
        return new TraceabilityChainResponse.DeliveryInfo(
                newestReceipt == null ? null : newestReceipt.getReceiverName(),
                newestReceipt == null ? null : newestReceipt.getReceiverPhone(),
                newestOrder == null ? null : newestOrder.getReceiverAddress(),
                newestReceipt == null ? null : newestReceipt.getReceivedAt(),
                newestReceipt == null ? null : newestReceipt.getQrValue());
    }

    private List<TraceabilityChainResponse.TimelineEvent> timeline(
            HarvestLot lot,
            TraceabilityRecord legacy,
            List<TraceabilityChainResponse.WarehouseStop> warehouseStops,
            List<Shipment> batchShipments,
            Map<Long, List<ShipmentTrackingEvent>> trackingByShipment,
            Map<Long, ShipmentReceipt> receiptsByShipment) {
        List<TraceabilityChainResponse.TimelineEvent> events = new ArrayList<>();
        if (lot != null || legacy != null) {
            events.add(new TraceabilityChainResponse.TimelineEvent(
                    "FARM", "Nguồn gốc nông trại", firstText(lot == null ? null : lot.getFarmName(), legacy == null ? null : legacy.getFarmName()),
                    legacy == null ? null : legacy.getLocation(), null, toInstant(lot == null ? null : lot.getCreatedAt())));
            events.add(new TraceabilityChainResponse.TimelineEvent(
                    "HARVEST", "Thu hoạch lô " + firstText(lot == null ? null : lot.getCode(), legacy == null ? null : legacy.getBatchCode()),
                    firstText(lot == null ? null : lot.getHarvestDate(), legacy == null ? null : legacy.getHarvestDate()),
                    legacy == null ? null : legacy.getLocation(), null,
                    firstNonNull(parseRecordedDate(lot == null ? null : lot.getHarvestDate()),
                            toInstant(lot == null ? null : lot.getCreatedAt()))));
        }
        warehouseStops.forEach(stop -> events.add(new TraceabilityChainResponse.TimelineEvent(
                "WAREHOUSE_IN", "Nhập kho", "Lô hàng đã được ghi nhận trong tồn kho", stop.location(),
                stop.targetTemperatureC(), stop.receivedAt())));
        for (Shipment shipment : batchShipments) {
            Instant dispatch = firstNonNull(shipment.getDispatchTime(), shipment.getCreatedAt());
            if (dispatch != null) {
                events.add(new TraceabilityChainResponse.TimelineEvent(
                        "WAREHOUSE_OUT", "Xuất kho cho chuyến " + shipment.getShipmentCode(), shipment.getStatus(),
                        shipment.getOrigin(), shipment.getTemperatureC(), dispatch));
            }
            trackingByShipment.getOrDefault(shipment.getId(), List.of()).forEach(event -> events.add(
                    new TraceabilityChainResponse.TimelineEvent("SHIPPING", "Theo dõi " + shipment.getShipmentCode(),
                            firstText(event.getStatus(), event.getNote()), event.getLocation(), event.getTemperatureC(), event.getEventTime())));
            ShipmentReceipt receipt = receiptsByShipment.get(shipment.getId());
            Instant deliveredAt = receipt == null ? shipment.getActualArrival() : receipt.getReceivedAt();
            if (deliveredAt != null) {
                events.add(new TraceabilityChainResponse.TimelineEvent(
                        "DELIVERED", "Đã giao/tiếp nhận", receipt == null ? shipment.getStatus() : receipt.getReceiverName(),
                        shipment.getDestination(), shipment.getTemperatureC(), deliveredAt));
            }
        }
        events.sort(Comparator.comparing(TraceabilityChainResponse.TimelineEvent::timestamp,
                Comparator.nullsLast(Comparator.naturalOrder())));
        return List.copyOf(events);
    }

    private Instant parseRecordedDate(String value) {
        if (!hasText(value)) return null;
        String text = value.trim();
        for (DateTimeFormatter formatter : List.of(DateTimeFormatter.ISO_INSTANT, DateTimeFormatter.ISO_OFFSET_DATE_TIME,
                DateTimeFormatter.ISO_LOCAL_DATE_TIME, DateTimeFormatter.ISO_LOCAL_DATE, DateTimeFormatter.ofPattern("dd/MM/uuuu"))) {
            try {
                if (formatter == DateTimeFormatter.ISO_INSTANT) return Instant.parse(text);
                if (formatter == DateTimeFormatter.ISO_OFFSET_DATE_TIME) return OffsetDateTime.parse(text).toInstant();
                if (formatter == DateTimeFormatter.ISO_LOCAL_DATE_TIME) return LocalDateTime.parse(text).atZone(BUSINESS_ZONE).toInstant();
                return LocalDate.parse(text, formatter).atStartOfDay(BUSINESS_ZONE).toInstant();
            } catch (DateTimeParseException ignored) {
                // Harvest lots historically accept more than one human-readable date representation.
            }
        }
        return null;
    }

    private Instant toInstant(LocalDateTime value) {
        return value == null ? null : value.atZone(BUSINESS_ZONE).toInstant();
    }

    private String requiredBatchCode(String value) {
        if (!hasText(value)) throw new IllegalArgumentException("Mã lô không được để trống");
        return value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private List<String> splitOrderCodes(String values) {
        if (!hasText(values)) return List.of();
        return Arrays.stream(values.split(","))
                .map(String::trim)
                .filter(this::hasText)
                .toList();
    }

    private String firstText(String... values) {
        for (String value : values) if (hasText(value)) return value.trim();
        return null;
    }

    private <T> T firstNonNull(T primary, T fallback) {
        return primary == null ? fallback : primary;
    }
}
