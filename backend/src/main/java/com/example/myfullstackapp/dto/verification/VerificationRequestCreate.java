package com.example.myfullstackapp.dto.verification;

import com.example.myfullstackapp.entity.VerificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record VerificationRequestCreate(
        @NotNull VerificationType type,
        @NotBlank @Size(max = 150) String organizationName,
        @NotBlank @Size(max = 100) String documentType,
        @NotBlank @Size(max = 200000) String documentUrl,
        @Size(max = 1000) String note,
        @Size(max = 254) String subjectEmail
) {
    public VerificationRequestCreate(
            VerificationType type,
            String organizationName,
            String documentType,
            String documentUrl,
            String note
    ) {
        this(type, organizationName, documentType, documentUrl, note, null);
    }
}
