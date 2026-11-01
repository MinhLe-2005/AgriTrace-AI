package com.example.myfullstackapp.dto.distributor;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;

/** Keeps request validation aligned with the timestamp formats parsed by the service. */
public class ShipmentTimestampValidator implements ConstraintValidator<ValidShipmentTimestamp, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) return true;
        try {
            Instant.parse(value);
            return true;
        } catch (DateTimeParseException ignored) {
            try {
                OffsetDateTime.parse(value);
                return true;
            } catch (DateTimeParseException ignoredOffset) {
                try {
                    LocalDateTime.parse(value);
                    return true;
                } catch (DateTimeParseException ignoredLocal) {
                    return false;
                }
            }
        }
    }
}
