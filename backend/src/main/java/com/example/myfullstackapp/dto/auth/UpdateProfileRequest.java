package com.example.myfullstackapp.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 120) String fullName,
        @Size(max = 32) String phone,
        @Size(max = 160) String companyName,
        @Size(max = 500) String address
) { }
