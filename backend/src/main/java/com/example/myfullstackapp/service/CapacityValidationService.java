package com.example.myfullstackapp.service;

import com.example.myfullstackapp.exception.ConflictException;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class CapacityValidationService {
    public void validateAllocation(BigDecimal warehouseCapacity, BigDecimal allocatedCapacity) {
        if (warehouseCapacity == null
                || warehouseCapacity.signum() <= 0
                || allocatedCapacity == null
                || allocatedCapacity.signum() < 0) {
            throw new IllegalArgumentException(
                    "Capacities must be positive; allocated capacity may be zero");
        }
        if (allocatedCapacity.compareTo(warehouseCapacity) > 0) {
            throw new ConflictException("Storage location capacities exceed warehouse capacity");
        }
    }
}
