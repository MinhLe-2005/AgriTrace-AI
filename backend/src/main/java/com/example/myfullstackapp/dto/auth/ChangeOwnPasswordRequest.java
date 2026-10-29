package com.example.myfullstackapp.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Self-service password change; email is derived from the access token. */
public record ChangeOwnPasswordRequest(
        @NotBlank(message = "Mật khẩu hiện tại không được để trống") String currentPassword,
        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 6, message = "Mật khẩu mới phải có ít nhất 6 ký tự") String newPassword,
        @NotBlank(message = "Xác nhận mật khẩu không được để trống") String confirmPassword
) { }
