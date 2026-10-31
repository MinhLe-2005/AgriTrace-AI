package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.entity.WarehouseDocument.Type;
import com.example.myfullstackapp.service.WarehouseDocumentService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/api/v1/warehouses/{warehouseId}/documents")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasAnyRole('WAREHOUSE','ADMIN')")
public class OutboundReceiptController {
    private final WarehouseDocumentService documents;

    @PostMapping("/{type}")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DocumentView> create(
            @PathVariable UUID warehouseId,
            @PathVariable Type type,
            @Valid @RequestBody DocumentInput input,
            Principal actor) {
        if (type != Type.INBOUND && type != Type.OUTBOUND)
            throw new IllegalArgumentException(
                    "This endpoint currently supports inbound and outbound receipts");
        return ApiResponse.ok(
                "Document drafted", documents.create(warehouseId, type, input, actor.getName()));
    }

    @GetMapping
    public ApiResponse<List<DocumentView>> list(
            @PathVariable UUID warehouseId, @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok("Documents retrieved", documents.list(warehouseId, page));
    }

    @GetMapping("/{id}")
    public ApiResponse<DocumentView> get(@PathVariable UUID warehouseId, @PathVariable UUID id) {
        return ApiResponse.ok("Document retrieved", documents.get(warehouseId, id));
    }

    @PutMapping("/{id}/confirm")
    public ApiResponse<DocumentView> confirm(
            @PathVariable UUID warehouseId, @PathVariable UUID id, Principal actor) {
        return ApiResponse.ok(
                "Document confirmed", documents.confirm(warehouseId, id, actor.getName()));
    }

    @PutMapping("/{id}/cancel")
    public ApiResponse<DocumentView> cancel(@PathVariable UUID warehouseId, @PathVariable UUID id) {
        return ApiResponse.ok("Document cancelled", documents.cancel(warehouseId, id));
    }

    @PutMapping("/{id}/handover")
    public ApiResponse<DocumentView> handover(
            @PathVariable UUID warehouseId,
            @PathVariable UUID id,
            @Valid @RequestBody HandoverInput input,
            Principal actor) {
        return ApiResponse.ok(
                "Handover recorded", documents.handover(warehouseId, id, input, actor.getName()));
    }
}
