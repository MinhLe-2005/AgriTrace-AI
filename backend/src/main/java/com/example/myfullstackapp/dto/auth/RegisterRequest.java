package com.example.myfullstackapp.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        @Size(max = 254)
        String email,

        @NotBlank(message = "Họ và tên không được để trống")
        @Size(max = 120)
        String fullName,

        @Size(max = 64)
        String username,

        @Size(max = 32)
        String phone,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 6, max = 72, message = "Mật khẩu tối thiểu 6 ký tự")
        String password
) { }
