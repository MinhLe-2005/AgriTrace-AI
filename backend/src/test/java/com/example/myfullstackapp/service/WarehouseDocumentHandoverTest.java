package com.example.myfullstackapp.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.HandoverInput;
import com.example.myfullstackapp.entity.Shipment;
import com.example.myfullstackapp.entity.WarehouseDocument;
import com.example.myfullstackapp.entity.WarehouseDocument.Status;
import com.example.myfullstackapp.entity.WarehouseDocument.Type;
import com.example.myfullstackapp.exception.ConflictException;
import com.example.myfullstackapp.repository.*;

import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

class WarehouseDocumentHandoverTest {
    private final InventoryService inventory = mock(InventoryService.class);
    private final FefoAllocationService fefo = mock(FefoAllocationService.class);
    private final StockReservationService reservations = mock(StockReservationService.class);
    private final WarehouseDocumentRepository documents = mock(WarehouseDocumentRepository.class);
    private final StockMovementRepository movements = mock(StockMovementRepository.class);
    private final WarehouseLotQuery lots = mock(WarehouseLotQuery.class);
    private final StockBalanceRepository balances = mock(StockBalanceRepository.class);
    private final QualityInspectionRepository inspections = mock(QualityInspectionRepository.class);
    private final ShipmentRepository shipments = mock(ShipmentRepository.class);
    private final OrderRepository orders = mock(OrderRepository.class);

    private final WarehouseDocumentService service =
            new WarehouseDocumentService(
                    inventory,
                    fefo,
                    reservations,
                    documents,
                    movements,
                    lots,
                    balances,
                    inspections,
                    shipments,
                    orders);

    @Test
    void rejectsHandoverToCancelledShipment() {
        UUID warehouseId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();
        WarehouseDocument doc = new WarehouseDocument();
        doc.setId(docId);
        doc.setWarehouseId(warehouseId);
        doc.setType(Type.OUTBOUND);
        doc.setStatus(Status.CONFIRMED);
        doc.setCreatedBy("staff");

        Shipment cancelled = Shipment.builder().shipmentCode("SHIP-CANCEL").status("CANCELLED").build();

        when(documents.findScopedForUpdate(docId, warehouseId)).thenReturn(Optional.of(doc));
        when(shipments.findByShipmentCodeIgnoreCase("SHIP-CANCEL")).thenReturn(Optional.of(cancelled));

        assertThrows(
                ConflictException.class,
                () -> service.handover(warehouseId, docId, new HandoverInput("BB-1", "SHIP-CANCEL"), "staff"));
    }

    @Test
    void allowsSupplementingShipmentAfterHandover() {
        UUID warehouseId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();
        WarehouseDocument doc = new WarehouseDocument();
        doc.setId(docId);
        doc.setWarehouseId(warehouseId);
        doc.setType(Type.OUTBOUND);
        doc.setStatus(Status.HANDED_OVER);
        doc.setHandoverReference("BB-1");
        doc.setCreatedBy("staff");

        Shipment active = Shipment.builder().shipmentCode("SHIP-ACTIVE").status("PREPARING").build();

        when(documents.findScopedForUpdate(docId, warehouseId)).thenReturn(Optional.of(doc));
        when(shipments.findByShipmentCodeIgnoreCase("SHIP-ACTIVE")).thenReturn(Optional.of(active));
        when(documents.saveAndFlush(any(WarehouseDocument.class))).thenAnswer(inv -> inv.getArgument(0));

        var view = service.handover(warehouseId, docId, new HandoverInput("BB-1", "SHIP-ACTIVE"), "staff");
        assertEquals("SHIP-ACTIVE", view.shipmentCode());
        assertEquals(Status.HANDED_OVER, view.status());
    }
}
