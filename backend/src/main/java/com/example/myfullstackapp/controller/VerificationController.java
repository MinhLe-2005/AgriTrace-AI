package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.verification.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.security.AppUserDetails;
import com.example.myfullstackapp.service.VerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/verifications")
@RequiredArgsConstructor
public class VerificationController {
    private final VerificationService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('FARMER','DISTRIBUTOR')")
    public ApiResponse<VerificationResponse> submit(@Valid @RequestBody VerificationRequestCreate input, AppUserDetails principal) {
        return ApiResponse.ok("Verification request submitted", service.submit(principal.getId(), input));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<VerificationResponse>> list(@RequestParam(required = false) VerificationStatus status, @RequestParam(required = false) VerificationType type) {
        return ApiResponse.ok("Verification requests retrieved", service.list(status, type));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<VerificationResponse> approve(@PathVariable UUID id, @Valid @RequestBody VerificationDecision input, AppUserDetails principal) {
        return ApiResponse.ok("Verification approved", service.decide(id, input, VerificationStatus.APPROVED, principal.getId()));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<VerificationResponse> reject(@PathVariable UUID id, @Valid @RequestBody VerificationDecision input, AppUserDetails principal) {
        return ApiResponse.ok("Verification rejected", service.decide(id, input, VerificationStatus.REJECTED, principal.getId()));
    }

    @PostMapping("/{id}/request-changes")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<VerificationResponse> requestChanges(@PathVariable UUID id, @Valid @RequestBody VerificationDecision input, AppUserDetails principal) {
        return ApiResponse.ok("Additional documents requested", service.decide(id, input, VerificationStatus.CHANGES_REQUESTED, principal.getId()));
    }
}
