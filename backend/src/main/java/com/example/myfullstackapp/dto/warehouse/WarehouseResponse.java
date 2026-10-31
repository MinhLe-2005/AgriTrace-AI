package com.example.myfullstackapp.dto.warehouse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record WarehouseResponse(
        UUID id,
        String name,
        String location,
        UUID managerId,
        BigDecimal capacityTons,
        BigDecimal tempTargetC,
        BigDecimal humidityTarget,
        boolean active,
        Instant createdAt) {}
