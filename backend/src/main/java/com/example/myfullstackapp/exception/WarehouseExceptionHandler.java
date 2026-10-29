package com.example.myfullstackapp.exception;

import com.example.myfullstackapp.controller.InboundReceiptController;
import com.example.myfullstackapp.controller.OutboundReceiptController;
import com.example.myfullstackapp.controller.StockReservationController;
import com.example.myfullstackapp.controller.StorageLocationController;
import com.example.myfullstackapp.controller.WarehouseController;
import com.example.myfullstackapp.controller.WarehouseMonitoringController;
import com.example.myfullstackapp.controller.WarehouseQualityController;
import com.example.myfullstackapp.controller.WarehouseRiskController;
import com.example.myfullstackapp.controller.WarehouseTelemetryController;
import com.example.myfullstackapp.dto.ApiError;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(
        assignableTypes = {
            WarehouseController.class,
            StorageLocationController.class,
            InboundReceiptController.class,
            OutboundReceiptController.class,
            StockReservationController.class,
            WarehouseQualityController.class,
            WarehouseRiskController.class,
            WarehouseMonitoringController.class,
            WarehouseTelemetryController.class
        })
public class WarehouseExceptionHandler {
    @ExceptionHandler(WarehouseSensorAuthenticationException.class)
    ResponseEntity<ApiError> sensorAuthentication(WarehouseSensorAuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiError.of(ex.getMessage(), "INVALID_SENSOR_CREDENTIALS", List.of()));
    }

    @ExceptionHandler(WarehouseSensorRateLimitException.class)
    ResponseEntity<ApiError> sensorRateLimit(WarehouseSensorRateLimitException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(ApiError.of(ex.getMessage(), "SENSOR_RATE_LIMIT", List.of()));
    }

    @ExceptionHandler(ConflictException.class)
    ResponseEntity<ApiError> conflict(ConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiError.of(ex.getMessage(), "CONFLICT", List.of()));
    }

    @ExceptionHandler(WarehouseIntegrationException.class)
    ResponseEntity<ApiError> integration(WarehouseIntegrationException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiError.of(ex.getMessage(), "WAREHOUSE_INTEGRATION_UNAVAILABLE", List.of()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> malformedBody(HttpMessageNotReadableException exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(
                        ApiError.of(
                                "Invalid request",
                                "BAD_REQUEST",
                                List.of("Request body is missing or malformed")));
    }
}
