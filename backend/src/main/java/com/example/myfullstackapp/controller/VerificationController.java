package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.verification.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.security.AppUserDetails;
import com.example.myfullstackapp.service.VerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/verifications")
@RequiredArgsConstructor
public class VerificationController {
    private final VerificationService service;

    @PostMapping
    public ApiResponse<VerificationResponse> submit(@Valid @RequestBody VerificationRequestCreate input, @AuthenticationPrincipal AppUserDetails principal) {
        return ApiResponse.ok("Verification request submitted", service.submit(principal != null ? principal.getId() : null, input));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<VerificationResponse>> list(@RequestParam(required = false) VerificationStatus status, @RequestParam(required = false) VerificationType type) {
        return ApiResponse.ok("Verification requests retrieved", service.list(status, type));
    }

    @GetMapping("/my")
    public ApiResponse<List<VerificationResponse>> myRequests(
            @RequestParam(required = false) String email,
            @AuthenticationPrincipal AppUserDetails principal
    ) {
        boolean isAdmin = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        String resolvedEmail = isAdmin && email != null && !email.isBlank()
                ? email
                : (principal != null ? principal.getUsername() : null);
        return ApiResponse.ok(
                "My verification requests retrieved",
                service.listMyRequests(principal != null ? principal.getId() : null, resolvedEmail)
        );
    }

    @GetMapping("/mine")
    public ApiResponse<List<VerificationResponse>> listMine(@AuthenticationPrincipal AppUserDetails principal) {
        return ApiResponse.ok("My verification requests retrieved", service.listMine(principal != null ? principal.getId() : null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<VerificationResponse> approve(@PathVariable UUID id, @Valid @RequestBody VerificationDecision input, @AuthenticationPrincipal AppUserDetails principal) {
        return ApiResponse.ok("Verification approved", service.decide(id, input, VerificationStatus.APPROVED, principal != null ? principal.getId() : null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<VerificationResponse> reject(@PathVariable UUID id, @Valid @RequestBody VerificationDecision input, @AuthenticationPrincipal AppUserDetails principal) {
        return ApiResponse.ok("Verification rejected", service.decide(id, input, VerificationStatus.REJECTED, principal != null ? principal.getId() : null));
    }

    @PostMapping("/{id}/request-changes")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<VerificationResponse> requestChanges(@PathVariable UUID id, @Valid @RequestBody VerificationDecision input, @AuthenticationPrincipal AppUserDetails principal) {
        return ApiResponse.ok("Additional documents requested", service.decide(id, input, VerificationStatus.CHANGES_REQUESTED, principal != null ? principal.getId() : null));
    }
}
