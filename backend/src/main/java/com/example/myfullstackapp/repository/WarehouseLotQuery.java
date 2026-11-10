package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.LotSummary;
import com.example.myfullstackapp.exception.*;

import lombok.RequiredArgsConstructor;

import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.*;
import java.util.*;

/** Read-only adapter for the Farmer-owned schema observed on origin/main. */
@Repository
@RequiredArgsConstructor
public class WarehouseLotQuery {
    private final JdbcTemplate jdbc;
    private static final String SELECT =
            "select id,product,code,expiry_date,qty,unit,status from agri_harvest_lots";

    /** Optional Farmer metadata, read in batches without altering its schema. */
    public Map<String, LocalDate> harvestDates(Collection<String> ids) {
        Map<String, LocalDate> result = new HashMap<>();
        if (ids.isEmpty()
                || !Boolean.TRUE.equals(
                        jdbc.queryForObject(
                                "select to_regclass('agri_harvest_lots') is not null",
                                Boolean.class))) return result;
        var ordered = new ArrayList<>(ids);
        for (int offset = 0; offset < ordered.size(); offset += 500) {
            var batch = ordered.subList(offset, Math.min(ordered.size(), offset + 500));
            jdbc.query(
                    "select id::text as"
                        + " lot_id,coalesce(to_jsonb(l)->>'harvest_date',to_jsonb(l)->>'harvestDate')"
                        + " as harvested from agri_harvest_lots l where id::text in ("
                            + String.join(",", Collections.nCopies(batch.size(), "?"))
                            + ")",
                    rs -> {
                        String raw = rs.getString("harvested");
                        if (raw == null || raw.isBlank()) return;
                        LocalDate day;
                        try {
                            day = LocalDate.parse(raw.trim());
                        } catch (DateTimeParseException first) {
                            try {
                                day =
                                        LocalDate.parse(
                                                raw.trim(),
                                                DateTimeFormatter.ofPattern("dd/MM/uuuu")
                                                        .withResolverStyle(ResolverStyle.STRICT));
                            } catch (DateTimeParseException invalid) {
                                return;
                            }
                        }
                        result.put(rs.getString("lot_id"), day);
                    },
                    batch.toArray());
        }
        return result;
    }

    public LotSummary get(String id) {
        return read(id, false);
    }

    public LotSummary lockForReceipt(String id) {
        return read(id, true);
    }

    private LotSummary read(String id, boolean lock) {
        long numericId;
        try {
            numericId = Long.parseLong(id);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Farmer lot ID must be numeric");
        }
        try {
            var rows =
                    jdbc.query(
                            SELECT + " where id=?" + (lock ? " for update" : ""),
                            (rs, n) ->
                                    map(
                                            Long.toString(rs.getLong("id")),
                                            rs.getString("product"),
                                            rs.getString("code"),
                                            rs.getString("expiry_date"),
                                            rs.getString("qty"),
                                            rs.getString("unit"),
                                            rs.getString("status")),
                            numericId);
            return rows.stream()
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Harvest lot not found"));
        } catch (DataAccessException ex) {
            throw new WarehouseIntegrationException(
                    "Farmer integration requires"
                            + " agri_harvest_lots(id,product,code,expiry_date,qty,unit,status). No"
                            + " Farmer table was created or changed.");
        }
    }

    public List<LotSummary> approved() {
        try {
            return jdbc
                    .query(
                            SELECT + " where status=? order by id desc limit 200",
                            (rs, n) ->
                                    map(
                                            Long.toString(rs.getLong("id")),
                                            rs.getString("product"),
                                            rs.getString("code"),
                                            rs.getString("expiry_date"),
                                            rs.getString("qty"),
                                            rs.getString("unit"),
                                            rs.getString("status")),
                            "Đã duyệt xuất kho")
                    .stream()
                    .filter(
                            l ->
                                    !l.expiryDate()
                                            .isBefore(
                                                    LocalDate.now(
                                                            java.time.ZoneId.of(
                                                                    "Asia/Ho_Chi_Minh"))))
                    .toList();
        } catch (DataAccessException ex) {
            throw new WarehouseIntegrationException(
                    "Farmer lot schema is not available. Integrate the Farmer module before"
                            + " receiving stock.");
        }
    }

    static LotSummary map(
            String id,
            String product,
            String code,
            String expiry,
            String qty,
            String unit,
            String status) {
        LocalDate expiryDate;
        try {
            expiryDate = LocalDate.parse(expiry, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException first) {
            try {
                expiryDate =
                        LocalDate.parse(
                                expiry,
                                DateTimeFormatter.ofPattern("dd/MM/uuuu")
                                        .withResolverStyle(ResolverStyle.STRICT));
            } catch (DateTimeParseException second) {
                throw new WarehouseIntegrationException(
                        "Lot " + id + " has an invalid expiry date");
            }
        }
        if (qty == null || !qty.trim().matches("[0-9]+(\\.[0-9]{1,3})?"))
            throw new WarehouseIntegrationException(
                    "Lot "
                            + id
                            + " requires a positive numeric quantity without unit text or grouping"
                            + " separators");
        BigDecimal initial = new BigDecimal(qty.trim());
        if (initial.signum() <= 0 || product == null || product.isBlank())
            throw new WarehouseIntegrationException("Lot quantity and product must be present");
        String weightUnit =
                switch (unit == null ? "" : unit.trim().toLowerCase(Locale.ROOT)) {
                    case "kg" -> "KG";
                    case "g" -> "G";
                    case "t", "ton", "tấn" -> "T";
                    default ->
                            throw new WarehouseIntegrationException(
                                    "Lot "
                                            + id
                                            + " requires an agreed conversion from "
                                            + unit
                                            + " to KG");
                };
        return new LotSummary(
                id,
                product,
                code,
                expiryDate,
                initial,
                weightUnit,
                "Đã duyệt xuất kho".equals(status) ? "APPROVED" : "PENDING");
    }
}
