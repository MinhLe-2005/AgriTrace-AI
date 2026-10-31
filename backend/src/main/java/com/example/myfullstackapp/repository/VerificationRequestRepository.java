package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.VerificationRequest;
import com.example.myfullstackapp.entity.VerificationStatus;
import com.example.myfullstackapp.entity.VerificationType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VerificationRequestRepository extends JpaRepository<VerificationRequest, UUID> {
    @EntityGraph(attributePaths = {"subject", "reviewedBy"})
    List<VerificationRequest> findByStatusAndTypeOrderByCreatedAtAsc(VerificationStatus status, VerificationType type);

    @EntityGraph(attributePaths = {"subject", "reviewedBy"})
    List<VerificationRequest> findAllByOrderByCreatedAtDesc();

    boolean existsBySubjectIdAndStatusIn(UUID subjectId, List<VerificationStatus> statuses);
}
