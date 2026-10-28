package com.example.myfullstackapp.service;

import com.example.myfullstackapp.exception.ConflictException;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

class CapacityValidationServiceTest {
    private final CapacityValidationService validator = new CapacityValidationService();

    @Test
    void decimalArithmeticAllowsExactBoundary() {
        assertDoesNotThrow(() -> validator.validateAllocation(new BigDecimal("0.30"), new BigDecimal("0.10").add(new BigDecimal("0.20"))));
        assertDoesNotThrow(() -> validator.validateAllocation(BigDecimal.ONE, BigDecimal.ZERO));
    }

    @Test
    void rejectsOverflowAndInvalidCapacities() {
        assertThrows(ConflictException.class, () -> validator.validateAllocation(BigDecimal.ONE, new BigDecimal("1.01")));
        assertThrows(IllegalArgumentException.class, () -> validator.validateAllocation(BigDecimal.ZERO, BigDecimal.ZERO));
        assertThrows(IllegalArgumentException.class, () -> validator.validateAllocation(BigDecimal.ONE, new BigDecimal("-0.01")));
    }
}
