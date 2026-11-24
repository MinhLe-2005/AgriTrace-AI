package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.traceability.TraceabilityChainResponse;
import com.example.myfullstackapp.entity.HarvestLot;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.entity.Shipment;
import com.example.myfullstackapp.entity.ShipmentReceipt;
import com.example.myfullstackapp.entity.ShipmentTrackingEvent;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.HarvestLotRepository;
import com.example.myfullstackapp.repository.OrderRepository;
import com.example.myfullstackapp.repository.ShipmentReceiptRepository;
import com.example.myfullstackapp.repository.ShipmentRepository;
import com.example.myfullstackapp.repository.ShipmentTrackingEventRepository;
import com.example.myfullstackapp.repository.StockBalanceRepository;
import com.example.myfullstackapp.repository.TraceabilityRecordRepository;
import com.example.myfullstackapp.repository.WarehouseRepository;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TraceabilityChainServiceTest {
    private final HarvestLotRepository lots = mock(HarvestLotRepository.class);
    private final TraceabilityRecordRepository legacy = mock(TraceabilityRecordRepository.class);
    private final StockBalanceRepository balances = mock(StockBalanceRepository.class);
    private final WarehouseRepository warehouses = mock(WarehouseRepository.class);
    private final ShipmentRepository shipments = mock(ShipmentRepository.class);
    private final ShipmentTrackingEventRepository tracking = mock(ShipmentTrackingEventRepository.class);
    private final ShipmentReceiptRepository receipts = mock(ShipmentReceiptRepository.class);
    private final OrderRepository orders = mock(OrderRepository.class);
    private final TraceabilityChainService service = new TraceabilityChainService(
            lots, legacy, balances, warehouses, shipments, tracking, receipts, orders);

    @Test
    void buildsARealFarmToDeliveryChainForAPersistedLot() {
        HarvestLot lot = HarvestLot.builder()
                .code("LOT-1")
                .product("Rau cải")
                .farmName("Nông trại A")
                .harvestDate("2026-11-01")
                .expiryDate("2026-11-10")
                .createdAt(LocalDateTime.of(2026, 10, 30, 8, 0))
                .build();
        Shipment shipment = Shipment.builder()
                .id(10L)
                .shipmentCode("SHIP-1")
                .lotCode("LOT-1")
                .driverName("Tài xế A")
                .vehicleNumber("51A-123.45")
                .origin("Kho A")
                .destination("Khách B")
                .productSummary("Rau cải")
                .status("DELIVERED")
                .dispatchTime(Instant.parse("2026-11-02T01:00:00Z"))
                .actualArrival(Instant.parse("2026-11-02T04:00:00Z"))
                .createdAt(Instant.parse("2026-11-02T00:00:00Z"))
                .build();
        ShipmentTrackingEvent event = ShipmentTrackingEvent.builder()
                .shipment(shipment)
                .location("Trạm kiểm tra")
                .temperatureC(4.2)
                .status("ON_SCHEDULE")
                .eventTime(Instant.parse("2026-11-02T02:00:00Z"))
                .build();
        ShipmentReceipt receipt = ShipmentReceipt.builder()
                .shipment(shipment)
                .receiverName("Người nhận B")
                .receiverPhone("0900000000")
                .qrValue("QR-1")
                .receivedAt(Instant.parse("2026-11-02T04:00:00Z"))
                .build();
        Order order = Order.builder()
                .orderCode("ORD-1")
                .lotCode("LOT-1")
                .receiverAddress("Địa chỉ B")
                .createdAt(LocalDateTime.of(2026, 11, 1, 9, 0))
                .build();

        when(lots.findByCodeIgnoreCase("LOT-1")).thenReturn(Optional.of(lot));
        when(legacy.findByBatchCodeIgnoreCase("LOT-1")).thenReturn(Optional.empty());
        when(orders.findByLotCodeIgnoreCaseOrderByCreatedAtAsc("LOT-1")).thenReturn(List.of(order));
        when(balances.findByLotCodeIgnoreCaseOrderByReceivedAtAsc("LOT-1")).thenReturn(List.of());
        when(shipments.findByLotCodeIgnoreCaseOrderByCreatedAtAsc("LOT-1")).thenReturn(List.of(shipment));
        when(tracking.findByShipmentIdInOrderByEventTimeAsc(List.of(10L))).thenReturn(List.of(event));
        when(receipts.findByShipmentIdIn(List.of(10L))).thenReturn(List.of(receipt));

        TraceabilityChainResponse response = service.traceByBatchCode(" LOT-1 ");

        assertEquals("LOT-1", response.batchCode());
        assertEquals("Rau cải", response.productName());
        assertEquals("Nông trại A", response.farm().name());
        assertEquals("SHIP-1", response.shipments().getFirst().shipmentCode());
        assertEquals("Trạm kiểm tra", response.shipments().getFirst().trackingEvents().getFirst().location());
        assertEquals("Người nhận B", response.delivery().receiverName());
        assertEquals("DELIVERED", response.timeline().getLast().stage());
    }

    @Test
    void rejectsAnUnknownBatch() {
        when(lots.findByCodeIgnoreCase("UNKNOWN")).thenReturn(Optional.empty());
        when(legacy.findByBatchCodeIgnoreCase("UNKNOWN")).thenReturn(Optional.empty());
        when(orders.findByLotCodeIgnoreCaseOrderByCreatedAtAsc("UNKNOWN")).thenReturn(List.of());
        when(balances.findByLotCodeIgnoreCaseOrderByReceivedAtAsc("UNKNOWN")).thenReturn(List.of());
        when(shipments.findByLotCodeIgnoreCaseOrderByCreatedAtAsc("UNKNOWN")).thenReturn(List.of());

        assertThrows(ResourceNotFoundException.class, () -> service.traceByBatchCode("UNKNOWN"));
    }
}
