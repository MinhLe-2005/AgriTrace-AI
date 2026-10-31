package com.example.myfullstackapp.dto.verification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerificationDecision(@NotBlank @Size(max = 1000) String reason) { }
