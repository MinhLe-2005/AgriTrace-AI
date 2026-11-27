package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.dto.traceability.TraceabilityChainResponse.Measurement;
import com.example.myfullstackapp.dto.traceability.TraceabilityChainResponse.WarehouseStop;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class BatchWarehouseTraceQuery {
    private final NamedParameterJdbcTemplate jdbc;

    // Keep the ledger discoverable even if a Farmer record has since been removed.
    private static final String LOT_IDS = """
            WITH lot_ids AS (
                SELECT id::text AS id FROM agri_harvest_lots WHERE upper(code) = upper(:code)
                UNION SELECT lot_id FROM wh_stock_balances WHERE upper(lot_code) = upper(:code)
            )
            """;

    public List<WarehouseStop> warehouseStops(String code) {
        return jdbc.query(LOT_IDS + """
                , balances AS (
                    SELECT warehouse_id, sum(quantity_kg) AS on_hand
                    FROM wh_stock_balances WHERE lot_id IN (SELECT id FROM lot_ids) GROUP BY warehouse_id
                ), stays AS (
                    SELECT warehouse_id,
                        min(occurred_at) FILTER (WHERE type IN ('INBOUND','TRANSFER_IN')) AS first_receipt,
                        max(occurred_at) AS last_change
                    FROM wh_stock_movements WHERE lot_id IN (SELECT id FROM lot_ids) GROUP BY warehouse_id
                )
                SELECT w.id, w.name, w.location, w.temp_target_c::double precision AS temp_target_c, s.first_receipt,
                       coalesce(b.on_hand, 0) AS quantity, r.temperature, r.humidity, r.recorded_at, r.simulated
                FROM stays s JOIN warehouses w ON w.id = s.warehouse_id
                LEFT JOIN balances b ON b.warehouse_id = w.id
                LEFT JOIN LATERAL (
                    SELECT sr.temperature, sr.humidity, sr.recorded_at, dev.simulated
                    FROM wh_sensor_readings sr JOIN wh_sensor_devices dev ON dev.id = sr.device_id
                    WHERE sr.warehouse_id = w.id AND sr.location_id IS NULL
                      AND sr.recorded_at >= s.first_receipt
                      AND sr.recorded_at <= CASE WHEN coalesce(b.on_hand, 0) > 0 THEN now() ELSE s.last_change END
                    ORDER BY sr.recorded_at DESC, sr.received_at DESC, sr.id LIMIT 1
                ) r ON true
                WHERE s.first_receipt IS NOT NULL ORDER BY s.first_receipt, w.id
                """, Map.of("code", code), (rs, row) -> {
            var measured = rs.getTimestamp("recorded_at");
            var measurement = measured == null ? null : new Measurement(rs.getBigDecimal("temperature"),
                    rs.getBigDecimal("humidity"), measured.toInstant(), rs.getBoolean("simulated"));
            return new WarehouseStop(rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("location"),
                    rs.getTimestamp("first_receipt").toInstant(), rs.getObject("temp_target_c", Double.class),
                    rs.getBigDecimal("quantity"), measurement);
        });
    }

    public record Dispatch(long shipmentId, BigDecimal quantityKg, Instant handedOverAt) {}

    public List<Dispatch> dispatches(String code) {
        return jdbc.query(LOT_IDS + """
                SELECT d.handover_shipment_id, sum(l.quantity_kg) AS quantity, min(d.handed_over_at) AS handover
                FROM wh_document_lines l JOIN wh_documents d ON d.id = l.document_id
                WHERE l.lot_id IN (SELECT id FROM lot_ids)
                  AND d.type = 'OUTBOUND' AND d.status = 'HANDED_OVER' AND d.handover_shipment_id IS NOT NULL
                GROUP BY d.handover_shipment_id ORDER BY handover, d.handover_shipment_id
                """, Map.of("code", code), (rs, row) -> new Dispatch(rs.getLong("handover_shipment_id"),
                rs.getBigDecimal("quantity"), rs.getTimestamp("handover").toInstant()));
    }
}
