package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.verification.VerificationDecision;
import com.example.myfullstackapp.dto.verification.VerificationRequestCreate;
import com.example.myfullstackapp.dto.verification.VerificationResponse;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.repository.RoleRepository;
import com.example.myfullstackapp.repository.UserRepository;
import com.example.myfullstackapp.repository.VerificationRequestRepository;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class VerificationServiceTest {
    private final VerificationRequestRepository repository = mock(VerificationRequestRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final RoleRepository roleRepository = mock(RoleRepository.class);
    private final VerificationEmailService emailService = mock(VerificationEmailService.class);

    private final VerificationService service = new VerificationService(
            repository,
            userRepository,
            roleRepository,
            emailService
    );

    @Test
    void allowsCustomerToSubmitRoleApplicationWithoutPreAssignedRole() {
        UUID userId = UUID.randomUUID();
        Role userRole = Role.builder().id(1L).name(RoleName.USER).build();
        User applicant = User.builder()
                .id(userId)
                .email("nongdan_moi@agri.vn")
                .fullName("Lê Quang Minh")
                .roles(new HashSet<>(Set.of(userRole)))
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(applicant));
        when(repository.findBySubjectIdOrderByCreatedAtDesc(userId)).thenReturn(List.of());
        when(repository.save(any(VerificationRequest.class))).thenAnswer(inv -> {
            VerificationRequest req = inv.getArgument(0);
            req.setId(UUID.randomUUID());
            return req;
        });

        VerificationResponse response = service.submit(
                userId,
                new VerificationRequestCreate(
                        VerificationType.FARMER,
                        "Nông trại Xanh Đà Lạt",
                        "Chứng nhận VietGAP",
                        "VG-2026-8899",
                        "2.5ha rau thủy canh"
                )
        );

        assertEquals(VerificationStatus.PENDING, response.status());
        assertEquals(VerificationType.FARMER, response.type());
        assertFalse(applicant.getRoles().stream().anyMatch(r -> r.getName() == RoleName.FARMER),
                "Khi hồ sơ đang chờ duyệt, tài khoản chưa được cấp quyền FARMER");
    }

    @Test
    void approvingApplicationAutomaticallyGrantsTargetRoleToUser() {
        UUID reqId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        Role userRole = Role.builder().id(1L).name(RoleName.USER).build();
        Role warehouseRole = Role.builder().id(4L).name(RoleName.WAREHOUSE).build();

        User applicant = User.builder()
                .id(UUID.randomUUID())
                .email("thukho_ungtuyen@agri.vn")
                .fullName("Nguyễn Văn Kho")
                .roles(new HashSet<>(Set.of(userRole)))
                .build();

        VerificationRequest pendingReq = VerificationRequest.builder()
                .id(reqId)
                .subject(applicant)
                .type(VerificationType.WAREHOUSE)
                .status(VerificationStatus.PENDING)
                .organizationName("Kho Lạnh Trung Tâm Đà Lạt")
                .documentType("Chứng chỉ Vận hành Kho lạnh & FEFO")
                .documentUrl("QC-WH-2026")
                .build();

        when(repository.findById(reqId)).thenReturn(Optional.of(pendingReq));
        when(repository.save(any(VerificationRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(roleRepository.findByName(RoleName.WAREHOUSE)).thenReturn(Optional.of(warehouseRole));
        when(userRepository.findById(adminId)).thenReturn(Optional.empty());

        VerificationResponse response = service.decide(
                reqId,
                new VerificationDecision("Hồ sơ hợp lệ, duyệt vào vị trí Thủ kho"),
                VerificationStatus.APPROVED,
                adminId
        );

        assertEquals(VerificationStatus.APPROVED, response.status());
        assertTrue(applicant.getRoles().stream().anyMatch(r -> r.getName() == RoleName.WAREHOUSE),
                "Sau khi Admin phê duyệt, tài khoản phải được cấp quyền WAREHOUSE");
        assertEquals("Kho Lạnh Trung Tâm Đà Lạt", applicant.getCompanyName());
        verify(userRepository).save(applicant);
    }
}
