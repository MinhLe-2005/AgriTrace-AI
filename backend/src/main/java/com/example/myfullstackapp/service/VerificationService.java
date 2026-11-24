package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.verification.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.exception.ConflictException;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.RoleRepository;
import com.example.myfullstackapp.repository.UserRepository;
import com.example.myfullstackapp.repository.VerificationRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VerificationService {
    private final VerificationRequestRepository repository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VerificationEmailService emailService;

    @Transactional
    public VerificationResponse submit(UUID subjectId, VerificationRequestCreate input) {
        User subject = resolveSubject(subjectId, input.subjectEmail());

        List<VerificationRequest> existingList = repository.findBySubjectIdOrderByCreatedAtDesc(subject.getId());
        VerificationRequest activePending = existingList.stream()
                .filter(r -> r.getStatus() == VerificationStatus.PENDING || r.getStatus() == VerificationStatus.UNDER_REVIEW)
                .findFirst()
                .orElse(null);

        VerificationRequest request;
        if (activePending != null) {
            activePending.setType(input.type());
            activePending.setOrganizationName(input.organizationName().trim());
            activePending.setDocumentType(input.documentType().trim());
            activePending.setDocumentUrl(input.documentUrl().trim());
            activePending.setNote(input.note() != null ? input.note().trim() : null);
            activePending.setStatus(VerificationStatus.PENDING);
            request = repository.save(activePending);
        } else {
            request = repository.save(VerificationRequest.builder()
                    .subject(subject)
                    .type(input.type())
                    .status(VerificationStatus.PENDING)
                    .organizationName(input.organizationName().trim())
                    .documentType(input.documentType().trim())
                    .documentUrl(input.documentUrl().trim())
                    .note(input.note() != null ? input.note().trim() : null)
                    .build());
        }
        return toResponse(request);
    }

    @Transactional(readOnly = true)
    public List<VerificationResponse> list(VerificationStatus status, VerificationType type) {
        List<VerificationRequest> requests;
        if (status != null && type != null) {
            requests = repository.findByStatusAndTypeOrderByCreatedAtAsc(status, type);
        } else if (status != null) {
            requests = repository.findByStatusOrderByCreatedAtAsc(status);
        } else if (type != null) {
            requests = repository.findByTypeOrderByCreatedAtDesc(type);
        } else {
            requests = repository.findAllByOrderByCreatedAtDesc();
        }
        return requests.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<VerificationResponse> listMyRequests(UUID subjectId, String email) {
        if (subjectId != null) {
            return repository.findBySubjectIdOrderByCreatedAtDesc(subjectId).stream().map(this::toResponse).toList();
        }
        if (email != null && !email.isBlank()) {
            return repository.findBySubjectEmailIgnoreCaseOrderByCreatedAtDesc(email.trim().toLowerCase(Locale.ROOT))
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }
        return List.of();
    }

    @Transactional(readOnly = true)
    public List<VerificationResponse> listMine(UUID subjectId) {
        return listMyRequests(subjectId, null);
    }

    @Transactional
    public VerificationResponse decide(UUID id, VerificationDecision input, VerificationStatus target, UUID adminId) {
        VerificationRequest request = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ xác minh"));
        if (request.getStatus() == VerificationStatus.APPROVED && target == VerificationStatus.APPROVED) {
            throw new ConflictException("Hồ sơ xác minh này đã được phê duyệt trước đó");
        }
        request.setStatus(target);
        request.setDecisionReason(input.reason().trim());
        if (adminId != null) {
            request.setReviewedBy(userRepository.findById(adminId).orElse(null));
        }
        request.setReviewedAt(Instant.now());
        VerificationRequest saved = repository.save(request);

        User subject = request.getSubject();
        RoleName targetRoleName = RoleName.valueOf(request.getType().name());
        if (target == VerificationStatus.APPROVED) {
            Role targetRole = roleRepository.findByName(targetRoleName)
                    .orElseGet(() -> roleRepository.save(Role.builder().name(targetRoleName).build()));
            Set<Role> roles = new HashSet<>(subject.getRoles() != null ? subject.getRoles() : Set.of());
            roles.add(targetRole);
            subject.setRoles(roles);
            if (request.getOrganizationName() != null && !request.getOrganizationName().isBlank()) {
                subject.setCompanyName(request.getOrganizationName().trim());
            }
            userRepository.save(subject);
        } else if (target == VerificationStatus.REJECTED || target == VerificationStatus.SUSPENDED) {
            Set<Role> roles = new HashSet<>(subject.getRoles() != null ? subject.getRoles() : Set.of());
            roles.removeIf(r -> r.getName() == targetRoleName);
            if (roles.isEmpty()) {
                roleRepository.findByName(RoleName.USER).ifPresent(roles::add);
            }
            subject.setRoles(roles);
            userRepository.save(subject);
        }

        emailService.sendDecision(subject.getEmail(), subject.getFullName(), request.getType(), target, input.reason());
        return toResponse(saved);
    }

    private User resolveSubject(UUID subjectId, String emailFallback) {
        if (subjectId != null) {
            return userRepository.findById(subjectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        }
        if (emailFallback != null && !emailFallback.isBlank()) {
            return userRepository.findByEmailIgnoreCase(emailFallback.trim().toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email: " + emailFallback));
        }
        throw new ResourceNotFoundException("Vui lòng đăng nhập để gửi hồ sơ xác minh vai trò");
    }

    private VerificationResponse toResponse(VerificationRequest request) {
        User subject = request.getSubject();
        return new VerificationResponse(
                request.getId(),
                subject.getId(),
                subject.getEmail(),
                subject.getFullName(),
                request.getType(),
                request.getStatus(),
                request.getOrganizationName(),
                request.getDocumentType(),
                request.getDocumentUrl(),
                request.getNote(),
                request.getDecisionReason(),
                request.getCreatedAt(),
                request.getReviewedAt()
        );
    }
}
