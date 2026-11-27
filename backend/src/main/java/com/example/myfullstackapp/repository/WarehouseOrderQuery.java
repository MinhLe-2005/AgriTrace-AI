package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.exception.*;
import com.example.myfullstackapp.service.WarehouseWeightService;

import lombok.RequiredArgsConstructor;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.*;

@Repository
@RequiredArgsConstructor
public class WarehouseOrderQuery {
    private final JdbcTemplate jdbc;
    private final WarehouseWeightService weights;
    private static final Set<String> CLOSED = Set.of("CANCELLED", "CANCELED", "DELIVERED", "COMPLETED", "REFUNDED");
    public record OrderHeader(long id, String code, String status) {}

    public void lockOpen(Long orderId) {
        var states =
                jdbc.queryForList(
                        "select status from agri_orders where id=? for update",
                        String.class,
                        orderId);
        if (states.isEmpty()) throw new ResourceNotFoundException("Order not found");
        requireOpen(states.getFirst());
    }

    private void requireOpen(String status) {
        if (status == null || status.isBlank() || CLOSED.contains(status.trim().toUpperCase(Locale.ROOT)))
            throw new ConflictException("Order is already closed");
    }

    public OrderHeader lookupOpen(String reference) {
        String ref = reference.trim();
        Long numericId = null;
        if (ref.matches("[0-9]{1,19}")) {
            try {
                numericId = Long.valueOf(ref);
            } catch (NumberFormatException ignored) {
                // A numeric order code may exceed the database ID range.
            }
        }
        var results = jdbc.query("""
                select id, order_code, status from agri_orders
                where upper(order_code)=upper(?) or id=?
                order by case when upper(order_code)=upper(?) then 0 else 1 end
                limit 1
                """, (rs, n) -> new OrderHeader(rs.getLong(1), rs.getString(2), rs.getString(3)),
                ref, numericId, ref);
        if (results.isEmpty()) throw new ResourceNotFoundException("Order not found");
        var order = results.getFirst();
        requireOpen(order.status());
        return order;
    }

    public Map<Long, String> codes(Collection<Long> orderIds) {
        if (orderIds.isEmpty()) return Map.of();
        String params = String.join(",", Collections.nCopies(orderIds.size(), "?"));
        Map<Long, String> codes = new HashMap<>();
        jdbc.query("select id, order_code from agri_orders where id in (" + params + ")",
                rs -> { codes.put(rs.getLong(1), rs.getString(2)); }, orderIds.toArray());
        return codes;
    }

    public List<String> products(long orderId) {
        return jdbc.queryForList("select distinct name from agri_order_items where order_id=? order by name",
                String.class, orderId);
    }

    public Map<String, BigDecimal> allocatedKg(long orderId) {
        Map<String, BigDecimal> amounts = new HashMap<>();
        jdbc.query("""
                select b.product_id, sum(case when r.status='ACTIVE' and r.expires_at > current_timestamp
                    then l.quantity_kg else l.dispatched_kg end)
                from wh_reservations r join wh_reservation_lines l on l.reservation_id=r.id
                join wh_stock_balances b on b.id=l.balance_id
                where r.order_id=? group by b.product_id
                """, rs -> { amounts.put(rs.getString(1), rs.getBigDecimal(2)); }, orderId);
        return amounts;
    }

    public BigDecimal demandKg(UUID warehouseId, Long orderId, String product) {
        var quantities =
                jdbc.queryForList(
                        "select qty from agri_order_items where order_id=? and name=?",
                        String.class,
                        orderId,
                        product);
        if (quantities.isEmpty())
            throw new ConflictException("Product is not present in the order");
        BigDecimal total = BigDecimal.ZERO;
        for (String value : quantities) {
            Matcher match =
                    Pattern.compile("^([0-9]+(?:\\.[0-9]{1,3})?)\\s*([^0-9]*)$")
                            .matcher(value == null ? "" : value.trim());
            if (!match.matches())
                throw new WarehouseIntegrationException(
                        "Order quantity needs an agreed numeric/unit contract");
            BigDecimal count = new BigDecimal(match.group(1));
            if (count.signum() <= 0)
                throw new WarehouseIntegrationException("Order quantity must be positive");
            String unit = match.group(2).trim();
            if (unit.isBlank()) {
                var units =
                        jdbc.queryForList(
                                "select unit from agri_products where name=? and active=true",
                                String.class,
                                product);
                if (units.size() != 1)
                    throw new WarehouseIntegrationException(
                            "Order product name must resolve to exactly one active product to"
                                    + " determine its unit");
                unit = units.getFirst();
            }
            total = total.add(weights.toKg(warehouseId, product, count, unit));
        }
        return total;
    }
}
