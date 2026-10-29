package com.example.myfullstackapp.exception;

public class WarehouseSensorRateLimitException extends RuntimeException {
    public WarehouseSensorRateLimitException() {
        super("Sensor ingestion limit is 180 new messages per minute");
    }
}
