package com.example.myfullstackapp.service;

import com.example.myfullstackapp.entity.LoyaltyMembership;
import com.example.myfullstackapp.entity.LoyaltyTransaction;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.entity.Voucher;
import com.example.myfullstackapp.repository.LoyaltyMembershipRepository;
import com.example.myfullstackapp.repository.LoyaltyTransactionRepository;
import com.example.myfullstackapp.repository.UserRepository;
import com.example.myfullstackapp.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoyaltyService {

    private final LoyaltyMembershipRepository loyaltyMembershipRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final UserRepository userRepository;
    private final VoucherRepository voucherRepository;

    private static final BigDecimal TIER_SILVER_THRESHOLD = BigDecimal.valueOf(1_000_000);
    private static final BigDecimal TIER_GOLD_THRESHOLD = BigDecimal.valueOf(3_000_000);
    private static final BigDecimal TIER_DIAMOND_THRESHOLD = BigDecimal.valueOf(7_000_000);

    @Transactional
    public LoyaltyMembership getOrCreateMembership(String email) {
        String safeEmail = (email != null && !email.isBlank()) ? email.trim() : "customer@gmail.com";
        Optional<LoyaltyMembership> existing = loyaltyMembershipRepository.findByUserEmailIgnoreCase(safeEmail);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Try to find User by email, or fallback to default customer
        User user = userRepository.findByEmailIgnoreCase(safeEmail)
                .orElseGet(() -> userRepository.findByEmailIgnoreCase("customer@gmail.com")
                        .orElse(null));

        if (user == null) {
            log.warn("Cannot find user for email: {}, loyalty creation skipped", safeEmail);
            return null;
        }

        // Check again by user ID in case email matching differed
        Optional<LoyaltyMembership> byUserId = loyaltyMembershipRepository.findByUserId(user.getId());
        if (byUserId.isPresent()) {
            return byUserId.get();
        }

        LoyaltyMembership membership = LoyaltyMembership.builder()
                .user(user)
                .currentPoints(100)
                .lifetimePoints(100)
                .tier("BRONZE")
                .totalSpent(BigDecimal.ZERO)
                .build();

        LoyaltyMembership saved = loyaltyMembershipRepository.save(membership);

        LoyaltyTransaction welcomeTx = LoyaltyTransaction.builder()
                .user(user)
                .points(100)
                .transactionType("BONUS")
                .description("Thưởng 100 điểm chào mừng thành viên mới AgriClub")
                .build();
        loyaltyTransactionRepository.save(welcomeTx);

        log.info("Initialized new Loyalty membership for user: {} with 100 welcome points", safeEmail);
        return saved;
    }

    public List<LoyaltyTransaction> getRecentTransactions(String email) {
        String safeEmail = (email != null && !email.isBlank()) ? email.trim() : "customer@gmail.com";
        return loyaltyTransactionRepository.findByUserEmailIgnoreCaseOrderByCreatedAtDesc(safeEmail);
    }

    @Transactional
    public void awardOrderPoints(String email, long amount, String orderCode, int basePoints) {
        try {
            if (email == null || email.isBlank() || orderCode == null || orderCode.isBlank()) return;
            LoyaltyMembership membership = getOrCreateMembership(email);
            if (membership == null) return;

            String marker = "#" + orderCode + " ";
            List<LoyaltyTransaction> existingTxs = loyaltyTransactionRepository.findByUserEmailIgnoreCaseOrderByCreatedAtDesc(email);
            boolean alreadyEarned = existingTxs.stream().anyMatch(t ->
                    "EARNED".equalsIgnoreCase(t.getTransactionType())
                            && t.getDescription() != null
                            && t.getDescription().contains(marker));
            if (alreadyEarned) {
                log.debug("Points already awarded for order #{}, skipping duplicate award", orderCode);
                return;
            }

            double multiplier = switch (membership.getTier().toUpperCase()) {
                case "SILVER" -> 1.2;
                case "GOLD" -> 1.5;
                case "DIAMOND" -> 2.0;
                default -> 1.0;
            };

            int finalPoints = (int) Math.round(basePoints * multiplier);
            if (finalPoints <= 0) finalPoints = 10;

            membership.setCurrentPoints(membership.getCurrentPoints() + finalPoints);
            membership.setLifetimePoints(membership.getLifetimePoints() + finalPoints);
            membership.setTotalSpent(membership.getTotalSpent().add(BigDecimal.valueOf(amount)));

            // Re-evaluate Tier
            String oldTier = membership.getTier();
            String newTier = evaluateTier(membership.getTotalSpent());
            if (!newTier.equalsIgnoreCase(oldTier)) {
                membership.setTier(newTier);
                int bonusPoints = switch (newTier) {
                    case "SILVER" -> 50;
                    case "GOLD" -> 100;
                    case "DIAMOND" -> 200;
                    default -> 0;
                };
                if (bonusPoints > 0) {
                    membership.setCurrentPoints(membership.getCurrentPoints() + bonusPoints);
                    membership.setLifetimePoints(membership.getLifetimePoints() + bonusPoints);
                    loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                            .user(membership.getUser())
                            .points(bonusPoints)
                            .transactionType("BONUS")
                            .description(String.format("Thưởng %d điểm thăng hạng lên %s!", bonusPoints, newTier))
                            .build());
                }
            }

            loyaltyMembershipRepository.save(membership);

            loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                    .user(membership.getUser())
                    .points(finalPoints)
                    .transactionType("EARNED")
                    .description("Tích điểm từ đơn hàng #" + orderCode + " (Hạng " + oldTier + " x" + multiplier + ")")
                    .build());

            log.info("Awarded {} points to {} for order #{}", finalPoints, email, orderCode);
        } catch (Exception e) {
            log.error("Failed to award points for order #{}: {}", orderCode, e.getMessage(), e);
        }
    }

    @Transactional
    public Voucher redeemVoucher(String email, int pointsCost, String voucherType, String title) {
        LoyaltyMembership membership = getOrCreateMembership(email);
        if (membership == null) {
            throw new IllegalArgumentException("Không tìm thấy thông tin hội viên của bạn.");
        }

        if (membership.getCurrentPoints() < pointsCost) {
            throw new IllegalArgumentException(String.format("Bạn không đủ điểm! Cần %d điểm (Số dư hiện tại: %d điểm).",
                    pointsCost, membership.getCurrentPoints()));
        }

        // Deduct points
        membership.setCurrentPoints(membership.getCurrentPoints() - pointsCost);
        loyaltyMembershipRepository.save(membership);

        // Record transaction
        loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                .user(membership.getUser())
                .points(-pointsCost)
                .transactionType("REDEEMED")
                .description("Đổi điểm nhận ưu đãi: " + title)
                .build());

        // Generate unique code
        String randomSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String prefix = switch (voucherType.toUpperCase()) {
            case "FREESHIP" -> "FREESHIP-";
            case "DISCOUNT30" -> "AGRI30K-";
            case "DISCOUNT50" -> "VIPGOLD-";
            default -> "AGRI10K-";
        };
        String code = prefix + randomSuffix;

        String discount = switch (voucherType.toUpperCase()) {
            case "FREESHIP" -> "25000";
            case "DISCOUNT30" -> "30000";
            case "DISCOUNT50" -> "50000";
            default -> "10000";
        };

        String minOrder = switch (voucherType.toUpperCase()) {
            case "FREESHIP" -> "100000";
            case "DISCOUNT30" -> "150000";
            case "DISCOUNT50" -> "200000";
            default -> "0";
        };

        String badge = switch (voucherType.toUpperCase()) {
            case "FREESHIP" -> "FREESHIP";
            case "DISCOUNT30" -> "-30K";
            case "DISCOUNT50" -> "-50K";
            default -> "-10K";
        };

        LocalDate expDate = LocalDate.now().plusDays(30);
        String expStr = expDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        Voucher voucher = Voucher.builder()
                .code(code)
                .title(title)
                .description("Mã ưu đãi đổi từ " + pointsCost + " điểm AgriClub dành cho " + membership.getUser().getFullName())
                .badge(badge)
                .badgeColor("bg-emerald-100 text-emerald-800")
                .discount(discount)
                .minOrder(minOrder)
                .exp(expStr)
                .active(true)
                .build();

        Voucher savedVoucher = voucherRepository.save(voucher);
        log.info("User {} redeemed voucher [{}] with cost {} points", email, code, pointsCost);
        return savedVoucher;
    }

    @Transactional
    public void adminAddBonusPoints(UUID userId, int points, String reason) {
        if (points == 0) {
            throw new IllegalArgumentException("Số điểm điều chỉnh phải khác 0");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + userId));

        LoyaltyMembership membership = loyaltyMembershipRepository.findByUserId(userId)
                .orElseGet(() -> getOrCreateMembership(user.getEmail()));

        if (membership.getCurrentPoints() + points < 0) {
            throw new IllegalArgumentException("Không thể trừ " + (-points) + " điểm: hội viên chỉ còn "
                    + membership.getCurrentPoints() + " điểm");
        }
        membership.setCurrentPoints(membership.getCurrentPoints() + points);
        if (points > 0) {
            membership.setLifetimePoints(membership.getLifetimePoints() + points);
        }
        loyaltyMembershipRepository.save(membership);

        loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                .user(user)
                .points(points)
                .transactionType(points >= 0 ? "BONUS" : "REDEEMED")
                .description(reason != null && !reason.isBlank() ? reason : "Điều chỉnh điểm từ Quản trị viên (Admin)")
                .build());

        log.info("Admin updated points for user {}: {} pts, reason: {}", user.getEmail(), points, reason);
    }

    /**
     * Thu hồi điểm đã tích của một đơn khi đơn bị hủy/hoàn tiền: trừ đúng số điểm EARNED của đơn
     * và trừ lại tổng chi tiêu. Hạng thành viên giữ nguyên để tránh hạ hạng đột ngột.
     * Gọi nhiều lần cho cùng một đơn chỉ thu hồi một lần.
     */
    @Transactional
    public void revokeOrderPoints(String email, String orderCode, long orderTotal) {
        try {
            if (email == null || email.isBlank() || orderCode == null) return;
            LoyaltyMembership membership = getOrCreateMembership(email);
            if (membership == null) return;

            String marker = "#" + orderCode + " ";
            List<LoyaltyTransaction> txs = loyaltyTransactionRepository.findByUserEmailIgnoreCaseOrderByCreatedAtDesc(email);
            boolean alreadyRevoked = txs.stream().anyMatch(t ->
                    ("REVOKED".equalsIgnoreCase(t.getTransactionType()) || "REDEEMED".equalsIgnoreCase(t.getTransactionType()))
                            && t.getDescription() != null
                            && t.getDescription().contains("Thu hồi điểm")
                            && t.getDescription().contains(marker));
            if (alreadyRevoked) return;
            int earned = txs.stream()
                    .filter(t -> "EARNED".equalsIgnoreCase(t.getTransactionType())
                            && t.getDescription() != null && t.getDescription().contains(marker))
                    .mapToInt(t -> t.getPoints() != null ? t.getPoints() : 0)
                    .sum();
            if (earned <= 0) return;

            int currentPts = membership.getCurrentPoints() != null ? membership.getCurrentPoints() : 0;
            membership.setCurrentPoints(currentPts - earned);
            BigDecimal spent = membership.getTotalSpent() != null ? membership.getTotalSpent() : BigDecimal.ZERO;
            membership.setTotalSpent(spent.subtract(BigDecimal.valueOf(orderTotal)).max(BigDecimal.ZERO));
            loyaltyMembershipRepository.save(membership);

            loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                    .user(membership.getUser())
                    .points(-earned)
                    .transactionType("REVOKED")
                    .description("Thu hồi điểm do hủy/hoàn tiền đơn hàng #" + orderCode + " (-" + earned + " điểm)")
                    .build());
            log.info("Revoked {} points from {} for cancelled order #{}", earned, email, orderCode);
        } catch (Exception e) {
            log.error("Failed to revoke points for cancelled order #{}: {}", orderCode, e.getMessage());
        }
    }

    public List<LoyaltyMembership> getAllMembersForAdmin() {
        return loyaltyMembershipRepository.findAllByOrderByCurrentPointsDesc();
    }

    private String evaluateTier(BigDecimal totalSpent) {
        if (totalSpent == null) return "BRONZE";
        if (totalSpent.compareTo(TIER_DIAMOND_THRESHOLD) >= 0) return "DIAMOND";
        if (totalSpent.compareTo(TIER_GOLD_THRESHOLD) >= 0) return "GOLD";
        if (totalSpent.compareTo(TIER_SILVER_THRESHOLD) >= 0) return "SILVER";
        return "BRONZE";
    }
}
