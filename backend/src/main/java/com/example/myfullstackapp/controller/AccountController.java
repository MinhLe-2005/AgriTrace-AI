package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.auth.ChangeOwnPasswordRequest;
import com.example.myfullstackapp.dto.auth.ChangePasswordRequest;
import com.example.myfullstackapp.dto.auth.UpdateProfileRequest;
import com.example.myfullstackapp.dto.user.UserResponse;
import com.example.myfullstackapp.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/** Self-service account APIs. Existing admin /users APIs remain untouched. */
@RestController
@RequestMapping("/api/v1/users/me")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class AccountController {
    private final AuthService authService;

    @GetMapping
    public ApiResponse<UserResponse> profile(Authentication authentication) {
        return ApiResponse.ok("Profile retrieved", authService.currentProfile(actor(authentication)));
    }

    @PatchMapping
    public ApiResponse<UserResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication
    ) {
        return ApiResponse.ok("Profile updated", authService.updateProfile(actor(authentication), request));
    }

    /** Compatibility endpoint requested by the Distributor use-case document. */
    @PutMapping("/password")
    public ApiResponse<Void> changePassword(
            @Valid @RequestBody ChangeOwnPasswordRequest request,
            Authentication authentication
    ) {
        String email = actor(authentication);
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp");
        }
        authService.changePassword(email, new ChangePasswordRequest(email, request.currentPassword(), request.newPassword()));
        return ApiResponse.ok("Đổi mật khẩu thành công!", null);
    }

    private String actor(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để tiếp tục");
        }
        return authentication.getName();
    }
}
