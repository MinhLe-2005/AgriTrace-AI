package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.auth.*;
import com.example.myfullstackapp.service.AuthService;
import com.example.myfullstackapp.service.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final OtpService otpService;

    @PostMapping("/send-otp")
    @Operation(summary = "Send 6-digit OTP code to email")
    public ApiResponse<String> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        otpService.generateAndSendOtp(request.email());
        return ApiResponse.ok("Mã xác thực OTP đã được gửi đến email", request.email());
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP code")
    public ApiResponse<Boolean> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        boolean valid = otpService.verifyOtp(request.email(), request.otp());
        if (!valid) {
            throw new IllegalArgumentException("Mã OTP không chính xác hoặc đã hết hạn!");
        }
        return ApiResponse.ok("Xác thực OTP thành công", true);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Send OTP to reset forgotten password")
    public ApiResponse<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        otpService.generateAndSendResetOtp(request.email());
        return ApiResponse.ok("Mã xác thực khôi phục mật khẩu đã được gửi đến email của bạn", request.email());
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using verified OTP")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        boolean valid = otpService.verifyOtp(request.email(), request.otp());
        if (!valid) {
            throw new IllegalArgumentException("Mã OTP không chính xác hoặc đã hết hiệu lực!");
        }
        authService.resetPassword(request);
        return ApiResponse.ok("Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.", null);
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password for logged-in user")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ApiResponse.ok("Đổi mật khẩu thành công!", null);
    }

    @PostMapping("/register")
    @Operation(summary = "Create an account")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Account created", authService.register(request)));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate and obtain tokens")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Authenticated", authService.login(request));
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Rotate a refresh token")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.ok("Token refreshed", authService.refresh(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke a refresh token")
    public ApiResponse<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
        return ApiResponse.ok("Logged out", null);
    }
}
