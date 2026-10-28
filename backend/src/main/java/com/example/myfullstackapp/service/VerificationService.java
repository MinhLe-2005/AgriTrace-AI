package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.verification.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.exception.ConflictException;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.UserRepository;
import com.example.myfullstackapp.repository.VerificationRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VerificationService {
    private final VerificationRequestRepository repository;
    private final UserRepository userRepository;
    private final VerificationEmailService emailService;

    @Transactional
    public VerificationResponse submit(UUID subjectId, VerificationRequestCreate input) {
        User subject = findUser(subjectId);
        boolean matchingRole = subject.getRoles().stream().anyMatch(role -> role.getName().name().equals(input.type().name()));
        if (!matchingRole) throw new ConflictException("The account role does not match the verification type");
        if (repository.existsBySubjectIdAndStatusIn(subjectId, List.of(VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW))) {
            throw new ConflictException("An active verification request already exists");
        }
        VerificationRequest request = VerificationRequest.builder().subject(subject).type(input.type())
                .organizationName(input.organizationName().trim()).documentType(input.documentType().trim())
                .documentUrl(input.documentUrl().trim()).note(input.note()).build();
        return toResponse(repository.save(request));
    }

    @Transactional(readOnly = true)
    public List<VerificationResponse> list(VerificationStatus status, VerificationType type) {
        List<VerificationRequest> requests = status == null || type == null
                ? repository.findAllByOrderByCreatedAtDesc()
                : repository.findByStatusAndTypeOrderByCreatedAtAsc(status, type);
        return requests.stream().map(this::toResponse).toList();
    }

    @Transactional
    public VerificationResponse decide(UUID id, VerificationDecision input, VerificationStatus target, UUID adminId) {
        VerificationRequest request = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Verification request not found"));
        if (request.getStatus() == VerificationStatus.APPROVED || request.getStatus() == VerificationStatus.REJECTED) {
            throw new ConflictException("This verification request has already been decided");
        }
        request.setStatus(target);
        request.setDecisionReason(input.reason().trim());
        request.setReviewedBy(findUser(adminId));
        request.setReviewedAt(Instant.now());
        VerificationRequest saved = repository.save(request);
        emailService.sendDecision(request.getSubject().getEmail(), request.getSubject().getFullName(), request.getType(), target, input.reason());
        return toResponse(saved);
    }

    private User findUser(UUID id) { return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found")); }

    private VerificationResponse toResponse(VerificationRequest request) {
        User subject = request.getSubject();
        return new VerificationResponse(request.getId(), subject.getId(), subject.getEmail(), subject.getFullName(), request.getType(), request.getStatus(), request.getOrganizationName(), request.getDocumentType(), request.getDocumentUrl(), request.getNote(), request.getDecisionReason(), request.getCreatedAt(), request.getReviewedAt());
    }
}

