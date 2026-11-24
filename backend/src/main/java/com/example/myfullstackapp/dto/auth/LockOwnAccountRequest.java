package com.example.myfullstackapp.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Credentials required before an authenticated user can self-lock an account. */
public record LockOwnAccountRequest(
        @NotBlank(message = "Mật khẩu hiện tại là bắt buộc") String currentPassword,
        @Size(max = 500, message = "Lý do khoá không được vượt quá 500 ký tự") String reason
) { }
