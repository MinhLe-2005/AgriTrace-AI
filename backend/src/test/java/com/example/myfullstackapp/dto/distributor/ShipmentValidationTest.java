package com.example.myfullstackapp.dto.distributor;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ShipmentValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsDeepFrozenTemperatureWithinSharedRange() {
        CreateTrackingEventRequest request = new CreateTrackingEventRequest(
                "Cold store", -25.0, 75.0, "ON_SCHEDULE", null);

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void rejectsOutOfRangeTelemetryAndBlankStatusLocation() {
        UpdateShipmentStatusRequest request = new UpdateShipmentStatusRequest(
                "IN_TRANSIT", " ", -31.0, 101.0, null, null);

        assertEquals(3, validator.validate(request).size());
    }

    @Test
    void rejectsInvalidShipmentTimestampBeforeItReachesTheService() {
        CreateShipmentRequest request = new CreateShipmentRequest(
                "SHIP-1", null, "Driver", null, "51A-123.45", "Warehouse", "Customer",
                "Produce", null, 4.0, "not-a-timestamp", "2026-10-27T15:00:00+07:00");

        assertEquals(1, validator.validate(request).size());
    }
}
