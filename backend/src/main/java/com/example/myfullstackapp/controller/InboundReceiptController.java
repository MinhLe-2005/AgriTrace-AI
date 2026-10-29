package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.entity.WarehouseDocument;
import com.example.myfullstackapp.repository.WarehouseLotQuery;
import com.example.myfullstackapp.service.*;

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
@RequestMapping("/api/v1/warehouses/{warehouseId}/inbound-receipts")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasAnyRole('WAREHOUSE','ADMIN')")
public class InboundReceiptController {
    private final WarehouseDocumentService receipts;
    private final InventoryService inventory;
    private final WarehouseLotQuery lots;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DocumentView> create(
            @PathVariable
            UUID warehouseId,
            @Valid
            @RequestBody
            DocumentInput input,
            Principal actor) {
        return ApiResponse.ok(
                "Receipt drafted",
                receipts.create(
                        warehouseId, WarehouseDocument.Type.INBOUND, input, actor.getName()));
    }

    @GetMapping
    public ApiResponse<List<DocumentView>> list(
            @PathVariable
            UUID warehouseId, @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok("Receipts retrieved", receipts.list(warehouseId, page));
    }

    @GetMapping("/{id}")
    public ApiResponse<DocumentView> get(@PathVariable UUID warehouseId, @PathVariable UUID id) {
        return ApiResponse.ok("Receipt retrieved", receipts.get(warehouseId, id));
    }

    @PutMapping("/{id}/confirm")
    public ApiResponse<DocumentView> confirm(
            @PathVariable
            UUID warehouseId, @PathVariable UUID id, Principal actor) {
        return ApiResponse.ok(
                "Receipt confirmed", receipts.confirm(warehouseId, id, actor.getName()));
    }

    @PutMapping("/{id}/cancel")
    public ApiResponse<DocumentView> cancel(@PathVariable UUID warehouseId, @PathVariable UUID id) {
        return ApiResponse.ok("Receipt cancelled", receipts.cancel(warehouseId, id));
    }

    @GetMapping("/eligible-lots")
    public ApiResponse<List<LotSummary>> lots(@PathVariable UUID warehouseId) {
        inventory.requireWarehouse(warehouseId);
        return ApiResponse.ok("Eligible lots retrieved", lots.approved());
    }
}
