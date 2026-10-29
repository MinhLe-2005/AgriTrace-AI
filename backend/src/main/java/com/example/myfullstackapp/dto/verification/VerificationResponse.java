package com.example.myfullstackapp.dto.verification;

import com.example.myfullstackapp.entity.VerificationStatus;
import com.example.myfullstackapp.entity.VerificationType;

import java.time.Instant;
import java.util.UUID;

public record VerificationResponse(UUID id, UUID subjectId, String subjectEmail, String subjectName,
                                   VerificationType type, VerificationStatus status, String organizationName,
                                   String documentType, String documentUrl, String note, String decisionReason,
                                   Instant createdAt, Instant reviewedAt) { }
