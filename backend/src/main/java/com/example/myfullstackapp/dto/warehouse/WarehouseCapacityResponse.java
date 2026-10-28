package com.example.myfullstackapp.dto.warehouse;

import java.math.BigDecimal;
import java.util.UUID;

public record WarehouseCapacityResponse(UUID warehouseId, BigDecimal capacityTons,
                                        BigDecimal allocatedCapacityTons, BigDecimal unallocatedCapacityTons) { }
