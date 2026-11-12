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
    private final FefoAllocationService fefo;
    private final StockReservationService reservationService;
    private final WarehouseDocumentRepository documents;
    private final StockMovementRepository movements;
    private final WarehouseLotQuery lots;

    @Transactional
    public DocumentView create(UUID warehouseId, Type type, DocumentInput input, String actor) {
        inventory.lock(warehouseId, input.targetWarehouseId());
        if (type != Type.TRANSFER && input.targetWarehouseId() != null)
            throw new IllegalArgumentException("Destination is only used for transfers");
        if (type == Type.TRANSFER && input.targetWarehouseId() == null)
            throw new IllegalArgumentException("Transfer destination is required");
        if (type != Type.OUTBOUND && input.reservationId() != null)
            throw new IllegalArgumentException("Reservations are only used for outbound");
        if ((type == Type.COUNT || type == Type.ADJUSTMENT)
                && (input.note() == null || input.note().isBlank()))
            throw new IllegalArgumentException("Count and adjustment require a reason");
        var document = new WarehouseDocument();
        document.setWarehouseId(warehouseId);
        document.setTargetWarehouseId(input.targetWarehouseId());
        document.setType(type);
        document.setReservationId(input.reservationId());
        document.setNote(input.note());
        document.setCreatedBy(actor);
        if (type == Type.TRANSFER && Boolean.TRUE.equals(input.inTransit())) {
            document.setInTransit(true);
        }
        Set<String> keys = new HashSet<>();
        for (var inputLine : input.lines()) {
            boolean count = type == Type.COUNT || type == Type.ADJUSTMENT;
            if (!count && inputLine.quantityKg().signum() <= 0)
                throw new IllegalArgumentException("Movement quantity must be positive");
            inventory.location(warehouseId, inputLine.locationId(), !count);
            var lot =
                    count
                            ? countLot(warehouseId, inputLine.locationId(), inputLine.lotId())
                            : lots.get(inputLine.lotId());
            if (!keys.add(key(inputLine.locationId(), lot.id())))
                throw new IllegalArgumentException("Duplicate lot/location line");
            if (!count) requireEligible(lot);
            if (type == Type.TRANSFER) {
                if (inputLine.targetLocationId() == null)
                    throw new IllegalArgumentException("Destination location is required");
                inventory.location(input.targetWarehouseId(), inputLine.targetLocationId(), true);
                if (warehouseId.equals(input.targetWarehouseId())
                        && inputLine.locationId().equals(inputLine.targetLocationId()))
                    throw new IllegalArgumentException(
                            "Source and destination locations must differ");
            } else if (inputLine.targetLocationId() != null)
                throw new IllegalArgumentException(
                        "Destination location is only used for transfers");
            var line = new WarehouseDocumentLine();
            line.setDocument(document);
            line.setLotId(lot.id());
            line.setLocationId(inputLine.locationId());
            line.setTargetLocationId(inputLine.targetLocationId());
            line.setQuantityKg(inputLine.quantityKg());
            if (count) {
                var balance = inventory.find(warehouseId, line.getLocationId(), line.getLotId());
                line.setExpectedKg(
                        balance.map(StockBalance::getQuantityKg).orElse(BigDecimal.ZERO));
                line.setExpectedVersion(balance.map(StockBalance::getVersion).orElse(-1L));
            }
            document.getLines().add(line);
        }
        return view(documents.saveAndFlush(document));
    }

    @Transactional
    public DocumentView confirm(UUID warehouseId, UUID id, String actor) {
        // Read lock scope before taking warehouse locks; reload document after the locks.
        var initial =
                documents
                        .findLockScopeByIdAndWarehouseId(id, warehouseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        inventory.lock(initial.getWarehouseId(), initial.getTargetWarehouseId());
        // Lock the document too: another transaction may have confirmed it while waiting for the
        // warehouse.
        var document =
                documents
                        .findScopedForUpdate(id, warehouseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (document.getStatus() == Status.CONFIRMED || document.getStatus() == Status.HANDED_OVER)
            return view(document);
        if (document.getStatus() == Status.IN_TRANSIT) {
            if (!warehouseId.equals(document.getTargetWarehouseId()))
                throw new ConflictException(
                        "In-transit transfer must be received by target warehouse");
            if (!inventory.requireWarehouse(warehouseId).isActive())
                throw new ConflictException("Warehouse is inactive");
            Map<UUID, BigDecimal> targetLocationDemands = new HashMap<>();
            for (var line : document.getLines()) {
                if (line.getTargetLocationId() == null) {
                    throw new ConflictException("Target location is required for transfer");
                }
                targetLocationDemands.merge(
                        line.getTargetLocationId(), line.getQuantityKg(), BigDecimal::add);
            }
            for (var entry : targetLocationDemands.entrySet()) {
                inventory.checkCapacity(
                        document.getTargetWarehouseId(), entry.getKey(), entry.getValue());
            }
            Map<String, LotSummary> lotData = new HashMap<>();
            for (String lotId :
                    document.getLines().stream()
                            .map(WarehouseDocumentLine::getLotId)
                            .distinct()
                            .sorted()
                            .toList()) {
                lotData.put(lotId, lots.get(lotId));
            }
            for (var line : document.getLines()) {
                var lot = lotData.get(line.getLotId());
                requireEligible(lot);
                inventory.change(
                        document.getTargetWarehouseId(),
                        line.getTargetLocationId(),
                        lot,
                        line.getQuantityKg(),
                        id,
                        "TRANSFER_IN",
                        actor,
                        null);
            }
            document.setStatus(Status.CONFIRMED);
            document.setConfirmedAt(Instant.now());
            document.setConfirmedBy(actor);
            return view(documents.saveAndFlush(document));
        }
        if (document.getStatus() != Status.DRAFT)
            throw new ConflictException(
                    "Document is in status "
                            + document.getStatus()
                            + "; only DRAFT documents can be confirmed");
        Type type = document.getType();
        if (type != Type.COUNT
                && type != Type.ADJUSTMENT
                && !inventory.requireWarehouse(warehouseId).isActive())
            throw new ConflictException("Warehouse is inactive");
        Map<String, LotSummary> lotData = new HashMap<>();
        // Stable lot order serializes receipts of the same harvest across different warehouses.
        for (String lotId :
                document.getLines().stream()
                        .map(WarehouseDocumentLine::getLotId)
                        .distinct()
                        .sorted()
                        .toList()) {
            if (type != Type.COUNT && type != Type.ADJUSTMENT) {
                lotData.put(
                        lotId, type == Type.INBOUND ? lots.lockForReceipt(lotId) : lots.get(lotId));
            }
        }
        if (type == Type.OUTBOUND) validateOutbound(document, lotData);
        if (type == Type.TRANSFER) {
            boolean interWarehouse = !warehouseId.equals(document.getTargetWarehouseId());
            boolean requiresTransit =
                    interWarehouse
                            && (Boolean.TRUE.equals(document.getInTransit())
                                    || document.getHandoverReference() != null);
            if (!requiresTransit) {
                Map<UUID, BigDecimal> targetLocationDemands = new HashMap<>();
                for (var line : document.getLines()) {
                    if (line.getTargetLocationId() == null) {
                        throw new ConflictException("Target location is required for transfer");
                    }
                    targetLocationDemands.merge(
                            line.getTargetLocationId(), line.getQuantityKg(), BigDecimal::add);
                }
                for (var entry : targetLocationDemands.entrySet()) {
                    inventory.checkCapacity(
                            document.getTargetWarehouseId(), entry.getKey(), entry.getValue());
                }
            }
        }
        for (var line : document.getLines()) {
            var lot = lotData.get(line.getLotId());
            BigDecimal quantity = line.getQuantityKg();
            switch (type) {
                case INBOUND -> {
                    requireEligible(lot);
                    if (movements.totalReceived(lot.id()).add(quantity).compareTo(initialKg(lot))
                            > 0)
                        throw new ConflictException(
                                "Total receipts exceed the Farmer lot initial quantity");
                    inventory.change(
                            warehouseId,
                            line.getLocationId(),
                            lot,
                            quantity,
                            id,
                            "INBOUND",
                            actor,
                            null);
                }
                case OUTBOUND -> {
                    requireEligible(lot);
                    inventory.location(warehouseId, line.getLocationId(), true);
                    inventory.change(
                            warehouseId,
                            line.getLocationId(),
                            lot,
                            quantity.negate(),
                            id,
                            "OUTBOUND",
                            actor,
                            document.getReservationId());
                }
                case TRANSFER -> {
                    requireEligible(lot);
                    inventory.location(warehouseId, line.getLocationId(), true);
                    inventory.change(
                            warehouseId,
                            line.getLocationId(),
                            lot,
                            quantity.negate(),
                            id,
                            "TRANSFER_OUT",
                            actor,
                            null);
                    boolean interWarehouse = !warehouseId.equals(document.getTargetWarehouseId());
                    boolean requiresTransit =
                            interWarehouse
                                    && (Boolean.TRUE.equals(document.getInTransit())
                                            || document.getHandoverReference() != null);
                    if (!requiresTransit) {
                        inventory.change(
                                document.getTargetWarehouseId(),
                                line.getTargetLocationId(),
                                lot,
                                quantity,
                                id,
                                "TRANSFER_IN",
                                actor,
                                null);
                    }
                }
                case COUNT, ADJUSTMENT -> {
                    var current =
                            inventory.find(warehouseId, line.getLocationId(), line.getLotId());
                    long version = current.map(StockBalance::getVersion).orElse(-1L);
                    if (version != line.getExpectedVersion())
                        throw new ConflictException(
                                "Stock changed after count snapshot; create a fresh count");
                    BigDecimal delta =
                            quantity.subtract(
                                    current.map(StockBalance::getQuantityKg)
                                            .orElse(BigDecimal.ZERO));
                    if (delta.signum() != 0) {
                        lot =
                                current.map(this::lotSnapshot)
                                        .orElseGet(() -> lots.get(line.getLotId()));
                        inventory.change(
                                warehouseId,
                                line.getLocationId(),
                                lot,
                                delta,
                                id,
                                type.name(),
                                actor,
                                null);
                    }
                }
            }
        }
        if (document.getReservationId() != null) {
            Map<UUID, BigDecimal> dispatched = new HashMap<>();
            for (var line : document.getLines()) {
                var balance =
                        inventory
                                .find(warehouseId, line.getLocationId(), line.getLotId())
                                .orElseThrow(
                                        () ->
                                                new ResourceNotFoundException(
                                                        "Stock balance not found"));
                dispatched.merge(balance.getId(), line.getQuantityKg(), BigDecimal::add);
            }
            reservationService.consume(warehouseId, document.getReservationId(), dispatched);
        }
        boolean isInterTransit =
                document.getType() == Type.TRANSFER
                        && !warehouseId.equals(document.getTargetWarehouseId())
                        && (Boolean.TRUE.equals(document.getInTransit())
                                || document.getHandoverReference() != null);
        if (isInterTransit) {
            document.setStatus(Status.IN_TRANSIT);
        } else {
            document.setStatus(Status.CONFIRMED);
        }
        document.setConfirmedAt(Instant.now());
        document.setConfirmedBy(actor);
        return view(documents.saveAndFlush(document));
    }

    private void validateOutbound(WarehouseDocument document, Map<String, LotSummary> lotData) {
        Map<String, BigDecimal> actual = new HashMap<>();
        for (var line : document.getLines())
            actual.merge(
                    key(line.getLocationId(), line.getLotId()),
                    line.getQuantityKg(),
                    BigDecimal::add);

        if (document.getReservationId() != null) {
            var reservation =
                    reservationService.requireActive(
                            document.getWarehouseId(), document.getReservationId());
            Map<UUID, BalanceView> eligible = new HashMap<>();
            for (var b : inventory.views(document.getWarehouseId(), reservation.getId(), true))
                if (b.availableKg().signum() > 0
                        && b.expiryDate().isAfter(InventoryService.today()))
                    eligible.put(b.id(), b);
            Map<String, BigDecimal> expected = new HashMap<>();
            for (var allocation : reservation.getLines()) {
                var b = inventory.balance(document.getWarehouseId(), allocation.getBalanceId());
                if (allocation.remainingKg().signum() > 0 && eligible.containsKey(b.getId())) {
                    expected.merge(
                            key(b.getLocationId(), b.getLotId()),
                            allocation.remainingKg(),
                            BigDecimal::add);
                }
            }
            if (expected.keySet().equals(actual.keySet())
                    && actual.entrySet().stream()
                            .allMatch(e -> expected.get(e.getKey()).compareTo(e.getValue()) == 0)) {
                return;
            }
            boolean matchesValidLines =
                    !actual.isEmpty()
                            && actual.entrySet().stream()
                                    .allMatch(
                                            e ->
                                                    expected.containsKey(e.getKey())
                                                            && expected.get(e.getKey())
                                                                            .compareTo(e.getValue())
                                                                    >= 0);
            if (matchesValidLines) {
                return;
            }
            throw new ConflictException(
                    "Outbound lines must match the active reservation or its reconciled eligible"
                        + " lines");
        } else {
            if (matchesFefoAllocation(document, lotData, actual)) {
                return;
            }
            throw new ConflictException(
                    "Outbound lines must match the current FEFO allocation or the initial draft"
                        + " allocation");
        }
    }

    private boolean matchesFefoAllocation(
            WarehouseDocument document,
            Map<String, LotSummary> lotData,
            Map<String, BigDecimal> actual) {
        if (matchesFefo(document.getWarehouseId(), document.getLines(), lotData, actual, null)) {
            return true;
        }
        if (document.getCreatedAt() != null
                && matchesFefo(
                        document.getWarehouseId(),
                        document.getLines(),
                        lotData,
                        actual,
                        document.getCreatedAt())) {
            var currentStockMap = new HashMap<String, BigDecimal>();
            for (var b : inventory.views(document.getWarehouseId(), null, true)) {
                currentStockMap.put(key(b.locationId(), b.lotId()), b.availableKg());
            }
            return actual.entrySet().stream()
                    .allMatch(
                            e ->
                                    currentStockMap
                                                    .getOrDefault(e.getKey(), BigDecimal.ZERO)
                                                    .compareTo(e.getValue())
                                            >= 0);
        }
        return false;
    }

    private boolean matchesFefo(
            UUID warehouseId,
            List<WarehouseDocumentLine> lines,
            Map<String, LotSummary> lotData,
            Map<String, BigDecimal> actual,
            Instant asOf) {
        Map<String, BigDecimal> byProduct = new HashMap<>();
        for (var line : lines) {
            var lot = lotData.get(line.getLotId());
            if (lot == null) return false;
            byProduct.merge(lot.productId(), line.getQuantityKg(), BigDecimal::add);
        }
        var stock = inventory.views(warehouseId, null, true);
        if (asOf != null) {
            stock =
                    stock.stream()
                            .filter(b -> b.receivedAt() != null && !b.receivedAt().isAfter(asOf))
                            .toList();
        }
        Map<String, BigDecimal> expected = new HashMap<>();
        try {
            for (var product : byProduct.entrySet()) {
                for (var allocation :
                        fefo.allocate(
                                stock,
                                product.getKey(),
                                product.getValue(),
                                InventoryService.today())) {
                    expected.merge(
                            key(allocation.locationId(), allocation.lotId()),
                            allocation.quantityKg(),
                            BigDecimal::add);
                }
            }
        } catch (ConflictException insufficient) {
            return false;
        }
        return expected.keySet().equals(actual.keySet())
                && actual.entrySet().stream()
                        .allMatch(e -> expected.get(e.getKey()).compareTo(e.getValue()) == 0);
    }

    @Transactional
    public DocumentView cancel(UUID warehouseId, UUID id) {
        inventory.lock(warehouseId, null);
        var document =
                documents
                        .findScopedForUpdate(id, warehouseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (document.getStatus() != Status.DRAFT && document.getStatus() != Status.CANCELLED)
            throw new ConflictException(
                    "Confirmed documents cannot be cancelled; use an audited correction");
        document.setStatus(Status.CANCELLED);
        return view(documents.saveAndFlush(document));
    }

    @Transactional
    public DocumentView receiveTransfer(UUID targetWarehouseId, UUID id, String actor) {
        return confirm(targetWarehouseId, id, actor);
    }

    @Transactional
    public DocumentView handover(UUID warehouseId, UUID id, HandoverInput input, String actor) {
        inventory.lock(warehouseId, null);
        var document =
                documents
                        .findScopedForUpdate(id, warehouseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (document.getType() != Type.OUTBOUND && document.getType() != Type.TRANSFER)
            throw new ConflictException("Only outbound and transfer documents can be handed over");
        if (document.getStatus() == Status.HANDED_OVER) {
            if (!input.reference().trim().equals(document.getHandoverReference()))
                throw new ConflictException("Handover already recorded with another reference");
            return view(document);
        }
        if (document.getStatus() != Status.CONFIRMED && document.getStatus() != Status.IN_TRANSIT)
            throw new ConflictException("Confirm document before handover");
        document.setHandoverReference(input.reference().trim());
        document.setHandoverBy(actor);
        document.setHandedOverAt(Instant.now());
        if (document.getStatus() == Status.CONFIRMED) {
            document.setStatus(Status.HANDED_OVER);
        }
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
                        .orElseThrow(() -> new ResourceNotFoundException("Document not found")));
    }

    private static String key(UUID locationId, String lotId) {
        return locationId + ":" + lotId;
    }

    private void requireEligible(LotSummary lot) {
        if (!"APPROVED".equals(lot.status()) || lot.expiryDate().isBefore(InventoryService.today()))
            throw new ConflictException("Lot must be approved and unexpired");
        initialKg(lot);
    }

    private LotSummary countLot(UUID warehouseId, UUID locationId, String lotId) {
        String canonicalId = Long.toString(Long.parseLong(lotId));
        return inventory
                .find(warehouseId, locationId, canonicalId)
                .map(this::lotSnapshot)
                .orElseGet(() -> lots.get(canonicalId));
    }

    private LotSummary lotSnapshot(StockBalance balance) {
        return new LotSummary(
                balance.getLotId(),
                balance.getProductId(),
                balance.getLotCode(),
                balance.getExpiryDate(),
                balance.getQuantityKg(),
                "KG",
                "STOCK_SNAPSHOT");
    }

    private BigDecimal initialKg(LotSummary lot) {
        return switch (lot.unit().toUpperCase(Locale.ROOT)) {
            case "KG" -> lot.initialQuantity();
            case "T", "TON", "TONNE" -> lot.initialQuantity().multiply(new BigDecimal("1000"));
            case "G" -> lot.initialQuantity().divide(new BigDecimal("1000"));
            default ->
                    throw new WarehouseIntegrationException(
                            "Lot unit needs an agreed weight conversion to KG: " + lot.unit());
        };
    }

    @Transactional(readOnly = true)
    public List<DocumentView> listInbound(UUID warehouseId, int page) {
        inventory.requireWarehouse(warehouseId);
        return documents
                .findByWarehouseIdAndTypeOrderByCreatedAtDesc(
                        warehouseId, Type.INBOUND, PageRequest.of(page, 100))
                .stream()
                .map(this::view)
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentView getInbound(UUID warehouseId, UUID id) {
        var result = get(warehouseId, id);
        if (result.type() != Type.INBOUND)
            throw new ResourceNotFoundException("Inbound receipt not found");
        return result;
    }

    @Transactional
    public DocumentView confirmInbound(UUID warehouseId, UUID id, String actor) {
        var initial =
                documents
                        .findLockScopeByIdAndWarehouseId(id, warehouseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (initial.getType() != Type.INBOUND)
            throw new ResourceNotFoundException("Inbound receipt not found");
        return confirm(warehouseId, id, actor);
    }

    @Transactional
    public DocumentView cancelInbound(UUID warehouseId, UUID id) {
        var initial =
                documents
                        .findLockScopeByIdAndWarehouseId(id, warehouseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (initial.getType() != Type.INBOUND)
            throw new ResourceNotFoundException("Inbound receipt not found");
        return cancel(warehouseId, id);
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
                        .toList(),
                d.getHandoverBy(),
                d.getHandedOverAt());
    }
}
