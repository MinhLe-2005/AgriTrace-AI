package com.example.myfullstackapp.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * An unauthenticated credential-verification request used only to clear a
 * self-lock.  It intentionally cannot clear an administrator lock.
 */
public record UnlockOwnAccountRequest(
        @NotBlank(message = "Email là bắt buộc") @Email(message = "Email không hợp lệ") String email,
        @NotBlank(message = "Mật khẩu hiện tại là bắt buộc") String currentPassword
) { }
