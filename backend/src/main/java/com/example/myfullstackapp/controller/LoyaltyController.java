package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.loyalty.AdminBonusPointsRequest;
import com.example.myfullstackapp.dto.loyalty.LoyaltyProfileResponse;
import com.example.myfullstackapp.dto.loyalty.RedeemVoucherRequest;
import com.example.myfullstackapp.entity.LoyaltyMembership;
import com.example.myfullstackapp.entity.LoyaltyTransaction;
import com.example.myfullstackapp.entity.Voucher;
import com.example.myfullstackapp.service.LoyaltyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@RestController
@RequestMapping("/api/v1/loyalty")
@RequiredArgsConstructor
@Slf4j
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @GetMapping("/me")
    public ApiResponse<LoyaltyProfileResponse> getMyLoyalty(
            @RequestParam(required = false) String email,
            Authentication authentication
    ) {
        String targetEmail = resolveEmail(email, authentication);

        LoyaltyMembership membership = loyaltyService.getOrCreateMembership(targetEmail);
        if (membership == null) {
            return ApiResponse.error("Không tìm thấy thông tin hội viên");
        }

        List<LoyaltyTransaction> transactions = loyaltyService.getRecentTransactions(targetEmail);

        // Next tier thresholds
        BigDecimal totalSpent = membership.getTotalSpent() != null ? membership.getTotalSpent() : BigDecimal.ZERO;
        String tier = membership.getTier() != null ? membership.getTier().toUpperCase() : "BRONZE";

        String nextTier;
        BigDecimal nextTierThreshold;
        BigDecimal prevThreshold = BigDecimal.ZERO;
        double multiplier = 1.0;

        switch (tier) {
            case "SILVER" -> {
                nextTier = "GOLD";
                nextTierThreshold = BigDecimal.valueOf(3_000_000);
                prevThreshold = BigDecimal.valueOf(1_000_000);
                multiplier = 1.2;
            }
            case "GOLD" -> {
                nextTier = "DIAMOND";
                nextTierThreshold = BigDecimal.valueOf(7_000_000);
                prevThreshold = BigDecimal.valueOf(3_000_000);
                multiplier = 1.5;
            }
            case "DIAMOND" -> {
                nextTier = "MAX";
                nextTierThreshold = BigDecimal.valueOf(7_000_000);
                prevThreshold = BigDecimal.valueOf(7_000_000);
                multiplier = 2.0;
            }
            default -> { // BRONZE
                nextTier = "SILVER";
                nextTierThreshold = BigDecimal.valueOf(1_000_000);
                prevThreshold = BigDecimal.ZERO;
                multiplier = 1.0;
            }
        }

        int progressPercent;
        if ("MAX".equals(nextTier)) {
            progressPercent = 100;
        } else {
            BigDecimal range = nextTierThreshold.subtract(prevThreshold);
            BigDecimal currentInRange = totalSpent.subtract(prevThreshold);
            if (currentInRange.compareTo(BigDecimal.ZERO) <= 0) {
                progressPercent = 0;
            } else if (range.compareTo(BigDecimal.ZERO) > 0) {
                progressPercent = Math.min(100, currentInRange.divide(range, 2, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).intValue());
            } else {
                progressPercent = 100;
            }
        }

        LoyaltyProfileResponse resp = LoyaltyProfileResponse.builder()
                .membershipId(membership.getId())
                .userId(membership.getUser().getId())
                .userEmail(membership.getUser().getEmail())
                .fullName(membership.getUser().getFullName())
                .phone(membership.getUser().getPhone())
                .currentPoints(membership.getCurrentPoints())
                .lifetimePoints(membership.getLifetimePoints())
                .tier(membership.getTier())
                .totalSpent(totalSpent)
                .nextTier(nextTier)
                .nextTierThreshold(nextTierThreshold)
                .progressPercent(progressPercent)
                .pointsMultiplier(multiplier)
                .recentTransactions(transactions)
                .build();

        return ApiResponse.ok("Lấy thông tin hội viên thành công", resp);
    }

    @PostMapping("/redeem")
    public ApiResponse<Voucher> redeemVoucher(
            @Valid @RequestBody RedeemVoucherRequest req,
            Authentication authentication
    ) {
        // Chỉ đổi điểm cho chính tài khoản đang đăng nhập (admin được chỉ định email khác)
        String email = resolveEmail(req.getUserEmail(), authentication);

        Voucher voucher = loyaltyService.redeemVoucher(email, req.getPointsCost(), req.getVoucherType(), req.getTitle());
        return ApiResponse.ok("Đổi voucher thành công! Mã ưu đãi của bạn: " + voucher.getCode(), voucher);
    }

    /** Email đích = email của token; chỉ ADMIN mới được thao tác trên email khác. */
    private String resolveEmail(String requestedEmail, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof org.springframework.security.authentication.AnonymousAuthenticationToken) {
            throw new org.springframework.security.access.AccessDeniedException("Vui lòng đăng nhập để sử dụng AgriClub");
        }
        String own = authentication.getName();
        if (requestedEmail == null || requestedEmail.isBlank() || requestedEmail.trim().equalsIgnoreCase(own)) {
            return own;
        }
        boolean admin = authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!admin) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền truy cập điểm thưởng của tài khoản khác");
        }
        return requestedEmail.trim();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/members")
    public ApiResponse<List<LoyaltyMembership>> getAllMembers() {
        return ApiResponse.ok("Danh sách hội viên AgriClub", loyaltyService.getAllMembersForAdmin());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/bonus")
    public ApiResponse<String> adminAddBonus(@Valid @RequestBody AdminBonusPointsRequest req) {
        loyaltyService.adminAddBonusPoints(req.getUserId(), req.getPoints(), req.getReason());
        return ApiResponse.ok("Cập nhật điểm thưởng thành công", (req.getPoints() > 0 ? "Đã cộng " : "Đã trừ ") + Math.abs(req.getPoints()) + " điểm");
    }
}
