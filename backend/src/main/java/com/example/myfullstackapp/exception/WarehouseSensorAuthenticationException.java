package com.example.myfullstackapp.exception;

public class WarehouseSensorAuthenticationException extends RuntimeException {
    public WarehouseSensorAuthenticationException() {
        super("Invalid or inactive sensor credentials");
    }
}
