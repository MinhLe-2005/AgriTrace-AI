package com.example.myfullstackapp.dto.warehouse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record StorageLocationResponse(UUID id, UUID warehouseId, String code, String name,
                                      BigDecimal capacityTons, BigDecimal tempTargetC, BigDecimal humidityTarget,
                                      boolean active, Instant createdAt, Instant updatedAt) { }
