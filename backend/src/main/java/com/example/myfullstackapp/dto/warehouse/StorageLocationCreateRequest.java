package com.example.myfullstackapp.dto.warehouse;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record StorageLocationCreateRequest(
        @NotBlank @Size(max = 50) @Pattern(regexp = "[A-Za-z0-9][A-Za-z0-9_-]*") String code,
        @NotBlank @Size(max = 150) String name,
        @NotNull @DecimalMin("0.01") @Digits(integer = 8, fraction = 2) BigDecimal capacityTons,
        @NotNull @DecimalMin("-999.9") @DecimalMax("999.9") @Digits(integer = 3, fraction = 1)
                BigDecimal tempTargetC,
        @NotNull @DecimalMin("0.0") @DecimalMax("100.0") @Digits(integer = 3, fraction = 1)
                BigDecimal humidityTarget) {}
