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

    public void lockOpen(Long orderId) {
        var states =
                jdbc.queryForList(
                        "select status from agri_orders where id=? for update",
                        String.class,
                        orderId);
        if (states.isEmpty()) throw new ResourceNotFoundException("Order not found");
        String status = states.getFirst();
        if (status == null
                || Set.of("CANCELLED", "CANCELED", "DELIVERED", "COMPLETED")
                        .contains(status.toUpperCase(Locale.ROOT)))
            throw new ConflictException("Order is already closed");
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
