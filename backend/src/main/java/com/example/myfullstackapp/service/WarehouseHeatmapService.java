package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseHeatmap.*;
import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.*;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.exception.*;
import com.example.myfullstackapp.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

import java.math.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WarehouseHeatmapService {
    private final InventoryService inventory;
    private final StorageLocationRepository locations;
    private final WarehouseLocationLayoutRepository layouts;
    private final WarehouseMonitoringService monitoring;
    private final WarehouseRiskService risks;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    @Transactional
    public LayoutView place(UUID warehouseId, UUID locationId, LayoutInput input, String actor) {
        inventory.lock(warehouseId, null);
        inventory.location(warehouseId, locationId, false);
        if (input.row() < 1
                || input.row() > 30
                || input.column() < 1
                || input.column() > 30
                || input.level() < 1
                || input.level() > 10)
            throw new IllegalArgumentException("Rows/columns must be 1-30; levels 1-10");
        var occupied =
                layouts.findByWarehouseIdAndLevelAndRowAndColumn(
                        warehouseId, input.level(), input.row(), input.column());
        if (occupied.isPresent() && !occupied.get().getLocationId().equals(locationId))
            throw new ConflictException("This cell already contains another storage location");
        var layout = layouts.findById(locationId).orElseGet(WarehouseLocationLayout::new);
        layout.setLocationId(locationId);
        layout.setWarehouseId(warehouseId);
        layout.setRow(input.row());
        layout.setColumn(input.column());
        layout.setLevel(input.level());
        layout.setUpdatedBy(actor);
        layout.setUpdatedAt(clock.instant());
        layouts.saveAndFlush(layout);
        events.publishEvent(new Changed(warehouseId, "LAYOUT"));
        return view(layout);
    }

    @Transactional
    public void unplace(UUID warehouseId, UUID locationId) {
        inventory.lock(warehouseId, null);
        inventory.location(warehouseId, locationId, false);
        layouts.findById(locationId).ifPresent(layouts::delete);
        events.publishEvent(new Changed(warehouseId, "LAYOUT"));
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public MapView map(UUID warehouseId) {
        var warehouse = inventory.requireWarehouse(warehouseId);
        var now = clock.instant();
        var today = LocalDate.ofInstant(now, ZoneId.of("Asia/Ho_Chi_Minh"));
        int warning = risks.rule(warehouseId).expiryWarningDays();
        var definitions = monitoring.rules(warehouseId).stream().filter(RuleView::enabled).toList();
        var devices = monitoring.devices(warehouseId).stream().filter(DeviceView::active).toList();
        Map<UUID, ReadingView> latest = new HashMap<>();
        for (var r : monitoring.latest(warehouseId)) latest.put(r.deviceId(), r);
        Map<UUID, WarehouseLocationLayout> placed = new HashMap<>();
        for (var l : layouts.findByWarehouseId(warehouseId)) placed.put(l.getLocationId(), l);
        var activeAlerts =
                risks.list(warehouseId).stream()
                        .filter(a -> !"RESOLVED".equals(a.status()))
                        .toList();
        var stock = inventory.getBalances(warehouseId);
        Map<UUID, List<BalanceView>> grouped = new HashMap<>();
        for (var b : stock)
            if (b.quantityKg().signum() > 0)
                grouped.computeIfAbsent(b.locationId(), k -> new ArrayList<>()).add(b);
        List<Cell> cells = new ArrayList<>();
        for (var location : locations.findByWarehouseIdOrderByCodeAsc(warehouseId)) {
            var lots = grouped.getOrDefault(location.getId(), List.of());
            var quantity =
                    lots.stream()
                            .map(BalanceView::quantityKg)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
            var held =
                    lots.stream()
                            .filter(BalanceView::held)
                            .map(BalanceView::quantityKg)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
            var reserved =
                    lots.stream()
                            .map(BalanceView::reservedKg)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
            var available =
                    lots.stream()
                            .map(BalanceView::availableKg)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
            var capacityKg = location.getCapacityTons().multiply(new BigDecimal("1000"));
            var percent =
                    quantity.multiply(new BigDecimal("100"))
                            .divide(capacityKg, 1, RoundingMode.HALF_UP);
            var capacity =
                    quantity.signum() == 0
                            ? new Signal("EMPTY", "Kệ trống")
                            : quantity.compareTo(capacityKg) > 0
                                    ? new Signal("DANGER", "Vượt sức chứa")
                                    : quantity.multiply(BigDecimal.TEN)
                                                            .compareTo(
                                                                    capacityKg.multiply(
                                                                            new BigDecimal("7")))
                                                    >= 0
                                            ? new Signal("WARNING", "Đã dùng từ 70% sức chứa")
                                            : new Signal("GOOD", "Dưới 70% sức chứa");
            var earliest =
                    lots.stream()
                            .map(BalanceView::expiryDate)
                            .min(LocalDate::compareTo)
                            .orElse(null);
            long days =
                    earliest == null ? Long.MAX_VALUE : ChronoUnit.DAYS.between(today, earliest);
            var expiry =
                    earliest == null
                            ? new Signal("EMPTY", "Chưa có hàng")
                            : days < 0
                                    ? new Signal("DANGER", "Có lô quá hạn")
                                    : days <= warning
                                            ? new Signal(
                                                    "WARNING",
                                                    "Có lô còn " + days + " ngày đến hạn")
                                            : new Signal(
                                                    "GOOD",
                                                    "Hạn dùng còn trên " + warning + " ngày");
            var device =
                    devices.stream()
                            .filter(d -> location.getId().equals(d.locationId()))
                            .findFirst()
                            .or(
                                    () ->
                                            devices.stream()
                                                    .filter(d -> d.locationId() == null)
                                                    .findFirst())
                            .orElse(null);
            var reading = device == null ? null : latest.get(device.id());
            var scope =
                    device == null
                            ? "NONE"
                            : device.locationId() == null ? "WAREHOUSE" : "LOCATION";
            var related =
                    activeAlerts.stream()
                            .filter(
                                    a ->
                                            location.getId().equals(a.locationId())
                                                    || (device != null
                                                            && device.id().equals(a.deviceId()))
                                                    || (a.lotId() != null
                                                            && (a.locationId() == null
                                                                    || location.getId()
                                                                            .equals(a.locationId()))
                                                            && lots.stream()
                                                                    .anyMatch(
                                                                            b ->
                                                                                    b.lotId()
                                                                                            .equals(
                                                                                                    a
                                                                                                            .lotId()))))
                            .toList();
            var tempRules =
                    definitions.stream()
                            .filter(
                                    r ->
                                            r.kind() == RuleKind.TEMPERATURE_HIGH
                                                    || r.kind() == RuleKind.TEMPERATURE_LOW)
                            .filter(
                                    r ->
                                            r.locationId() == null
                                                    || (device != null
                                                            && r.locationId()
                                                                    .equals(device.locationId())))
                            .toList();
            String policy =
                    tempRules.isEmpty()
                            ? "Mục tiêu "
                                    + location.getTempTargetC().stripTrailingZeros().toPlainString()
                                    + " °C ± 2 °C"
                            : "Theo " + tempRules.size() + " quy tắc nhiệt độ đang bật";
            Signal temp;
            if (reading == null)
                temp =
                        new Signal(
                                "UNKNOWN", device == null ? "Chưa có cảm biến" : "Chưa nhận số đo");
            else if (!reading.fresh())
                temp = new Signal("UNKNOWN", "Số đo đã cũ; chưa biết nhiệt độ hiện tại");
            else if (related.stream().anyMatch(a -> a.type().startsWith("TEMPERATURE_")))
                temp = new Signal("DANGER", "Sự cố nhiệt độ đang theo dõi");
            else if (!tempRules.isEmpty()) {
                boolean breached =
                        tempRules.stream()
                                .anyMatch(
                                        r ->
                                                r.kind() == RuleKind.TEMPERATURE_HIGH
                                                        ? reading.temperature()
                                                                        .compareTo(r.threshold())
                                                                > 0
                                                        : reading.temperature()
                                                                        .compareTo(r.threshold())
                                                                < 0);
                temp =
                        breached
                                ? new Signal(
                                        "WARNING", "Vượt ngưỡng; đang theo dõi thời gian duy trì")
                                : new Signal("GOOD", "Trong ngưỡng quy tắc");
            } else
                temp =
                        reading.temperature()
                                                .subtract(location.getTempTargetC())
                                                .abs()
                                                .compareTo(new BigDecimal("2"))
                                        > 0
                                ? new Signal("DANGER", "Lệch mục tiêu quá 2 °C")
                                : new Signal("GOOD", "Trong ngưỡng mục tiêu");
            boolean danger =
                    List.of(capacity, expiry, temp).stream()
                                    .anyMatch(s -> s.state().equals("DANGER"))
                            || related.stream().anyMatch(a -> a.severity().equals("CRITICAL"));
            boolean caution =
                    held.signum() > 0
                            || !related.isEmpty()
                            || List.of(capacity, expiry, temp).stream()
                                    .anyMatch(s -> s.state().equals("WARNING"));
            var overall =
                    danger
                            ? new Signal("DANGER", "Cần xử lý")
                            : caution
                                    ? new Signal("WARNING", "Cần theo dõi")
                                    : temp.state().equals("UNKNOWN")
                                            ? new Signal("UNKNOWN", "Thiếu số đo nhiệt độ mới")
                                            : quantity.signum() == 0
                                                    ? new Signal("EMPTY", "Kệ trống")
                                                    : new Signal("GOOD", "Trong ngưỡng theo dõi");
            cells.add(
                    new Cell(
                            location.getId(),
                            location.getCode(),
                            location.getName(),
                            warehouse.isActive() && location.isActive(),
                            placed.containsKey(location.getId())
                                    ? view(placed.get(location.getId()))
                                    : null,
                            capacityKg,
                            quantity,
                            held,
                            reserved,
                            available,
                            percent,
                            earliest,
                            capacity,
                            expiry,
                            temp,
                            overall,
                            reading,
                            scope,
                            policy,
                            lots,
                            related));
        }
        return new MapView(
                warehouseId,
                now,
                warning,
                cells,
                activeAlerts.stream()
                        .filter(
                                a ->
                                        a.locationId() == null
                                                && a.deviceId() == null
                                                && a.lotId() == null)
                        .count());
    }

    private LayoutView view(WarehouseLocationLayout l) {
        return new LayoutView(
                l.getRow(), l.getColumn(), l.getLevel(), l.getUpdatedBy(), l.getUpdatedAt());
    }
}
