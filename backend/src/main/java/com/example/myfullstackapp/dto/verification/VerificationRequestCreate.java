package com.example.myfullstackapp.dto.verification;

import com.example.myfullstackapp.entity.VerificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record VerificationRequestCreate(
        @NotNull VerificationType type,
        @NotBlank @Size(max = 150) String organizationName,
        @NotBlank @Size(max = 50) String documentType,
        @NotBlank @Size(max = 500) String documentUrl,
        @Size(max = 1000) String note
) { }
