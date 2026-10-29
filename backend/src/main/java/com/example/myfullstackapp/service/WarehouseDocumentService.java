package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.entity.WarehouseDocument.*;
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
public class WarehouseDocumentService {
    private final InventoryService inventory;
    private final WarehouseDocumentRepository documents;
    private final StockMovementRepository movements;
    private final WarehouseLotQuery lots;

    @Transactional
    public DocumentView create(UUID warehouseId, Type type, DocumentInput input, String actor) {
        inventory.lock(warehouseId, null);
        if (type != Type.INBOUND
                || input.targetWarehouseId() != null
                || input.reservationId() != null)
            throw new IllegalArgumentException("P02 accepts only inbound receipts");
        var document = new WarehouseDocument();
        document.setWarehouseId(warehouseId);
        document.setType(type);
        document.setNote(input.note());
        document.setCreatedBy(actor);
        Set<String> keys = new HashSet<>();
        for (var item : input.lines()) {
            if (item.quantityKg().signum() <= 0 || item.targetLocationId() != null)
                throw new IllegalArgumentException("Inbound quantity must be positive");
            inventory.location(warehouseId, item.locationId(), true);
            var lot = lots.get(item.lotId());
            requireEligible(lot);
            if (!keys.add(item.locationId() + ":" + lot.id()))
                throw new IllegalArgumentException("Duplicate lot/location line");
            var line = new WarehouseDocumentLine();
            line.setDocument(document);
            line.setLotId(lot.id());
            line.setLocationId(item.locationId());
            line.setQuantityKg(item.quantityKg());
            document.getLines().add(line);
        }
        return view(documents.saveAndFlush(document));
    }

    @Transactional
    public DocumentView confirm(UUID warehouseId, UUID id, String actor) {
        inventory.lock(warehouseId, null);
        var document =
                documents
                        .findScopedForUpdate(id, warehouseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
        if (document.getStatus() == Status.CONFIRMED) return view(document);
        if (document.getStatus() != Status.DRAFT || document.getType() != Type.INBOUND)
            throw new ConflictException("Receipt cannot be confirmed");
        Map<String, LotSummary> current = new TreeMap<>();
        for (String lotId :
                document.getLines().stream()
                        .map(WarehouseDocumentLine::getLotId)
                        .distinct()
                        .sorted()
                        .toList()) current.put(lotId, lots.lockForReceipt(lotId));
        for (var line : document.getLines()) {
            var lot = current.get(line.getLotId());
            requireEligible(lot);
            BigDecimal initial = initialKg(lot);
            if (movements.totalReceived(lot.id()).add(line.getQuantityKg()).compareTo(initial) > 0)
                throw new ConflictException("Total received quantity exceeds the harvest lot");
            inventory.change(
                    warehouseId,
                    line.getLocationId(),
                    lot,
                    line.getQuantityKg(),
                    id,
                    "INBOUND",
                    actor,
                    null);
        }
        document.setStatus(Status.CONFIRMED);
        document.setConfirmedAt(Instant.now());
        document.setConfirmedBy(actor);
        return view(documents.saveAndFlush(document));
    }

    @Transactional
    public DocumentView cancel(UUID warehouseId, UUID id) {
        inventory.lock(warehouseId, null);
        var document =
                documents
                        .findScopedForUpdate(id, warehouseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
        if (document.getStatus() != Status.DRAFT && document.getStatus() != Status.CANCELLED)
            throw new ConflictException("Only draft receipts can be cancelled");
        document.setStatus(Status.CANCELLED);
        return view(documents.saveAndFlush(document));
    }

    @Transactional(readOnly = true)
    public List<DocumentView> list(UUID warehouseId, int page) {
        inventory.requireWarehouse(warehouseId);
        return documents
                .findByWarehouseIdOrderByCreatedAtDesc(warehouseId, PageRequest.of(page, 100))
                .stream()
                .map(this::view)
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentView get(UUID warehouseId, UUID id) {
        return view(
                documents
                        .findByIdAndWarehouseId(id, warehouseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Receipt not found")));
    }

    private void requireEligible(LotSummary lot) {
        if (!"APPROVED".equals(lot.status()) || lot.expiryDate().isBefore(InventoryService.today()))
            throw new ConflictException("Lot must be approved and unexpired");
    }

    private BigDecimal initialKg(LotSummary lot) {
        return switch (lot.unit()) {
            case "KG" -> lot.initialQuantity();
            case "T" -> lot.initialQuantity().multiply(new BigDecimal("1000"));
            case "G" -> lot.initialQuantity().divide(new BigDecimal("1000"));
            default -> throw new WarehouseIntegrationException("Unknown weight unit");
        };
    }

    public DocumentView view(WarehouseDocument d) {
        return new DocumentView(
                d.getId(),
                d.getWarehouseId(),
                d.getTargetWarehouseId(),
                d.getType(),
                d.getStatus(),
                d.getReservationId(),
                d.getNote(),
                d.getHandoverReference(),
                d.getCreatedBy(),
                d.getConfirmedBy(),
                d.getCreatedAt(),
                d.getConfirmedAt(),
                d.getLines().stream()
                        .map(
                                l ->
                                        new LineView(
                                                l.getId(),
                                                l.getLotId(),
                                                l.getLocationId(),
                                                l.getTargetLocationId(),
                                                l.getQuantityKg(),
                                                l.getExpectedKg()))
                        .toList());
    }
}
