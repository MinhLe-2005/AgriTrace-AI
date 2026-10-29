package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.distributor.*;
import com.example.myfullstackapp.service.DistributorShipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** API used by the additive Distributor web routes. */
@RestController
@RequestMapping("/api/v1/distributor")
@PreAuthorize("hasAnyRole('DISTRIBUTOR', 'ADMIN')")
@RequiredArgsConstructor
public class DistributorShipmentController {
    private final DistributorShipmentService distributorShipmentService;

    @GetMapping("/dashboard")
    public ApiResponse<DistributorDashboardResponse> dashboard(Authentication authentication) {
        return ApiResponse.ok("Distributor dashboard retrieved", distributorShipmentService.dashboard(actor(authentication), isAdmin(authentication)));
    }

    @GetMapping("/shipments")
    public ApiResponse<List<ShipmentResponse>> listShipments(
            @RequestParam(required = false) String status,
            Authentication authentication
    ) {
        return ApiResponse.ok("Shipments retrieved", distributorShipmentService.list(actor(authentication), isAdmin(authentication), status));
    }

    @GetMapping("/shipments/history")
    public ApiResponse<List<ShipmentResponse>> history(Authentication authentication) {
        return ApiResponse.ok("Shipment history retrieved", distributorShipmentService.history(actor(authentication), isAdmin(authentication)));
    }

    @GetMapping("/shipments/{shipmentCode}")
    public ApiResponse<ShipmentResponse> getShipment(@PathVariable String shipmentCode, Authentication authentication) {
        return ApiResponse.ok("Shipment retrieved", distributorShipmentService.get(shipmentCode, actor(authentication), isAdmin(authentication)));
    }

    @PostMapping("/shipments")
    public ApiResponse<ShipmentResponse> createShipment(
            @Valid @RequestBody CreateShipmentRequest request,
            Authentication authentication
    ) {
        return ApiResponse.ok("Shipment created", distributorShipmentService.create(request, actor(authentication)));
    }

    @PutMapping("/shipments/{shipmentCode}")
    public ApiResponse<ShipmentResponse> updateShipment(
            @PathVariable String shipmentCode,
            @Valid @RequestBody UpdateShipmentRequest request,
            Authentication authentication
    ) {
        return ApiResponse.ok("Shipment updated", distributorShipmentService.update(shipmentCode, request, actor(authentication), isAdmin(authentication)));
    }

    @PutMapping("/shipments/{shipmentCode}/status")
    public ApiResponse<ShipmentResponse> updateStatus(
            @PathVariable String shipmentCode,
            @Valid @RequestBody UpdateShipmentStatusRequest request,
            Authentication authentication
    ) {
        return ApiResponse.ok("Shipment status updated", distributorShipmentService.updateStatus(shipmentCode, request, actor(authentication), isAdmin(authentication)));
    }

    /** Alias matching the documented REST contract without changing current clients. */
    @PatchMapping("/shipments/{shipmentCode}/status")
    public ApiResponse<ShipmentResponse> patchStatus(
            @PathVariable String shipmentCode,
            @Valid @RequestBody UpdateShipmentStatusRequest request,
            Authentication authentication
    ) {
        return ApiResponse.ok("Shipment status updated", distributorShipmentService.updateStatus(shipmentCode, request, actor(authentication), isAdmin(authentication)));
    }

    @PostMapping("/shipments/{shipmentCode}/tracking-events")
    public ApiResponse<ShipmentResponse> addTrackingEvent(
            @PathVariable String shipmentCode,
            @Valid @RequestBody CreateTrackingEventRequest request,
            Authentication authentication
    ) {
        return ApiResponse.ok("Tracking event created", distributorShipmentService.addTrackingEvent(shipmentCode, request, actor(authentication), isAdmin(authentication)));
    }

    /** Alias for POST /tracking in the use-case specification. */
    @PostMapping("/shipments/{shipmentCode}/tracking")
    public ApiResponse<ShipmentResponse> addTracking(
            @PathVariable String shipmentCode,
            @Valid @RequestBody CreateTrackingEventRequest request,
            Authentication authentication
    ) {
        return ApiResponse.ok("Tracking event created", distributorShipmentService.addTrackingEvent(shipmentCode, request, actor(authentication), isAdmin(authentication)));
    }

    @GetMapping("/shipments/{shipmentCode}/tracking")
    public ApiResponse<List<TrackingEventResponse>> tracking(
            @PathVariable String shipmentCode,
            Authentication authentication
    ) {
        return ApiResponse.ok("Shipment tracking retrieved", distributorShipmentService.tracking(shipmentCode, actor(authentication), isAdmin(authentication)));
    }

    @PostMapping("/shipments/{shipmentCode}/receive")
    public ApiResponse<ShipmentResponse> receiveShipment(
            @PathVariable String shipmentCode,
            @Valid @RequestBody ReceiveShipmentRequest request,
            Authentication authentication
    ) {
        return ApiResponse.ok("Shipment receipt recorded", distributorShipmentService.receive(shipmentCode, request, actor(authentication), isAdmin(authentication)));
    }

    private String actor(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để sử dụng nghiệp vụ vận chuyển");
        }
        return authentication.getName();
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
