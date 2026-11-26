package com.example.myfullstackapp.service;

import com.example.myfullstackapp.controller.FarmerController;
import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.entity.Farm;
import com.example.myfullstackapp.repository.FarmRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FarmerFarmVerificationTest {

    @Mock
    private FarmRepository farmRepository;

    @Mock
    private FarmerOwnershipResolver ownershipResolver;

    private FarmerController buildController() {
        return new FarmerController(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                farmRepository,
                null,
                ownershipResolver
        );
    }

    @Test
    void createFarmWithoutLandDocsSavesAsNotSubmitted() {
        when(farmRepository.existsByCodeIgnoreCase("NT-NEW-01")).thenReturn(false);
        when(ownershipResolver.resolveEffectiveOwnerId("farmer_hung", "NT-NEW-01")).thenReturn("farmer_hung");
        when(farmRepository.save(any())).thenAnswer(inv -> {
            Farm f = inv.getArgument(0);
            f.setId(99L);
            return f;
        });

        Farm req = Farm.builder()
                .code("nt-new-01")
                .name("Vườn Hữu Cơ Mới")
                .ownerId("farmer_hung")
                .address("Đà Lạt, Lâm Đồng")
                .areaHectares(3.0)
                .build();

        ResponseEntity<ApiResponse<Farm>> resp = buildController().createFarm(req);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNotNull(resp.getBody());
        assertEquals("NOT_SUBMITTED", resp.getBody().data().getVerificationStatus());
    }

    @Test
    void attachLandDocsTransitionsFarmToPendingAndAdminApproves() {
        Farm stored = Farm.builder()
                .id(10L)
                .code("NT-DL-99")
                .name("Vườn Dâu Mới")
                .owner("Nguyễn Văn Hùng")
                .ownerId("farmer_hung")
                .address("Đà Lạt")
                .areaHectares(2.5)
                .verificationStatus("NOT_SUBMITTED")
                .build();

        when(farmRepository.findByCodeIgnoreCase("NT-DL-99")).thenReturn(Optional.of(stored));
        when(ownershipResolver.canModifyOwnedResource("farmer_hung")).thenReturn(true);
        when(farmRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        FarmerController controller = buildController();

        ResponseEntity<ApiResponse<Farm>> docResp = controller.resubmitFarmVerification(
                "NT-DL-99",
                Map.of(
                        "verificationDocType", "Giấy chứng nhận QSDĐ (Sổ đỏ)",
                        "verificationDocUrl", "/api/v1/farmer/uploads/so-do-test",
                        "verificationNote", "Sổ đỏ chính chủ thửa 12"
                )
        );
        assertEquals(HttpStatus.OK, docResp.getStatusCode());
        assertEquals("PENDING", stored.getVerificationStatus());

        var farmerAuth = new UsernamePasswordAuthenticationToken(
                "farmer@agritrace.vn",
                "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_FARMER"))
        );
        when(ownershipResolver.currentAuthentication()).thenReturn(farmerAuth);

        ResponseEntity<ApiResponse<Farm>> forbiddenResp = controller.decideFarmVerification(
                "NT-DL-99",
                Map.of("action", "approve", "reason", "Self approve")
        );
        assertEquals(HttpStatus.FORBIDDEN, forbiddenResp.getStatusCode());

        var adminAuth = new UsernamePasswordAuthenticationToken(
                "admin@sportvenue.com",
                "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        when(ownershipResolver.currentAuthentication()).thenReturn(adminAuth);

        ResponseEntity<ApiResponse<Farm>> approveResp = controller.decideFarmVerification(
                "NT-DL-99",
                Map.of("action", "approve", "reason", "Giấy tờ đất canh tác hợp lệ")
        );
        assertEquals(HttpStatus.OK, approveResp.getStatusCode());
        assertEquals("APPROVED", stored.getVerificationStatus());
        assertEquals("Giấy tờ đất canh tác hợp lệ", stored.getVerificationDecisionReason());
    }
}
