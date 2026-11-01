package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.distributor.*;
import com.example.myfullstackapp.service.DistributorQrService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/distributor")
@PreAuthorize("hasAnyRole('DISTRIBUTOR', 'ADMIN')")
@RequiredArgsConstructor
public class DistributorReceiveController {
    private final DistributorQrService distributorQrService;

    @PostMapping("/receive")
    public ApiResponse<ShipmentResponse> receive(
            @Valid @RequestBody ReceiveGoodsRequest request,
            Authentication authentication
    ) {
        return ApiResponse.ok("Goods received", distributorQrService.receive(request, actor(authentication), isAdmin(authentication)));
    }

    @PostMapping("/qr/generate")
    public ApiResponse<QrCodeResponse> generateQr(
            @Valid @RequestBody GenerateQrCodeRequest request,
            Authentication authentication
    ) {
        return ApiResponse.ok("QR code generated", distributorQrService.generate(request, actor(authentication), isAdmin(authentication)));
    }

    @GetMapping("/qr/{code}")
    public ApiResponse<QrCodeResponse> lookupQr(@PathVariable String code, Authentication authentication) {
        return ApiResponse.ok("QR code retrieved", distributorQrService.lookup(code, actor(authentication), isAdmin(authentication)));
    }

    private String actor(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để tiếp tục");
        }
        return authentication.getName();
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
