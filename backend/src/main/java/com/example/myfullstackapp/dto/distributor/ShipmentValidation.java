package com.example.myfullstackapp.dto.distributor;

/** Shared, annotation-compatible operating limits for shipment telemetry. */
public final class ShipmentValidation {
    /** Supports refrigerated and deep-frozen transport while rejecting sensor errors. */
    public static final String MIN_TEMPERATURE_C = "-30.0";
    public static final String MAX_TEMPERATURE_C = "40.0";
    public static final String MIN_HUMIDITY_PERCENT = "0.0";
    public static final String MAX_HUMIDITY_PERCENT = "100.0";

    private ShipmentValidation() { }
}
