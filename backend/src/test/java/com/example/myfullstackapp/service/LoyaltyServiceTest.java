package com.example.myfullstackapp.service;

import com.example.myfullstackapp.entity.LoyaltyMembership;
import com.example.myfullstackapp.entity.LoyaltyTransaction;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.repository.LoyaltyMembershipRepository;
import com.example.myfullstackapp.repository.LoyaltyTransactionRepository;
import com.example.myfullstackapp.repository.UserRepository;
import com.example.myfullstackapp.repository.VoucherRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LoyaltyServiceTest {
    private static final String EMAIL = "khach@agri.vn";

    private final LoyaltyMembershipRepository memberships = mock(LoyaltyMembershipRepository.class);
    private final LoyaltyTransactionRepository transactions = mock(LoyaltyTransactionRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final LoyaltyService service =
            new LoyaltyService(memberships, transactions, users, mock(VoucherRepository.class));

    private final User user = User.builder().id(UUID.randomUUID()).email(EMAIL).build();

    private LoyaltyMembership membership(int points, long spent) {
        LoyaltyMembership m = LoyaltyMembership.builder()
                .user(user).currentPoints(points).lifetimePoints(points).totalSpent(BigDecimal.valueOf(spent)).build();
        when(memberships.findByUserEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(m));
        when(memberships.findByUserId(user.getId())).thenReturn(Optional.of(m));
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        return m;
    }

    private static LoyaltyTransaction tx(String type, int points, String desc) {
        return LoyaltyTransaction.builder().transactionType(type).points(points).description(desc).build();
    }

    // ───── revokeOrderPoints ─────

    @Test
    void revokesExactlyTheOrdersEarnedPoints() {
        LoyaltyMembership m = membership(300, 1_000_000);
        when(transactions.findByUserEmailIgnoreCaseOrderByCreatedAtDesc(EMAIL)).thenReturn(List.of(
                tx("EARNED", 120, "Tích điểm từ đơn hàng #AGRI-AAAA1111 (Hạng BRONZE x1.0)"),
                tx("EARNED", 50, "Tích điểm từ đơn hàng #AGRI-BBBB2222 (Hạng BRONZE x1.0)")));

        service.revokeOrderPoints(EMAIL, "AGRI-AAAA1111", 400_000);

        assertEquals(180, m.getCurrentPoints());
        assertEquals(BigDecimal.valueOf(600_000), m.getTotalSpent());
        ArgumentCaptor<LoyaltyTransaction> saved = ArgumentCaptor.forClass(LoyaltyTransaction.class);
        verify(transactions).save(saved.capture());
        assertEquals("REVOKED", saved.getValue().getTransactionType());
        assertEquals(-120, saved.getValue().getPoints());
    }

    @Test
    void revokesFullAmountEvenIfPointsWereAlreadySpent() {
        LoyaltyMembership m = membership(0, 500_000);
        when(transactions.findByUserEmailIgnoreCaseOrderByCreatedAtDesc(EMAIL)).thenReturn(List.of(
                tx("EARNED", 500, "Tích điểm từ đơn hàng #AGRI-AAAA1111 (Hạng BRONZE x1.0)")));

        service.revokeOrderPoints(EMAIL, "AGRI-AAAA1111", 500_000);

        assertEquals(-500, m.getCurrentPoints(), "điểm đã tiêu phải thành nợ điểm, không được giữ lại");
    }

    @Test
    void isIdempotent() {
        membership(300, 1_000_000);
        when(transactions.findByUserEmailIgnoreCaseOrderByCreatedAtDesc(EMAIL)).thenReturn(List.of(
                tx("REVOKED", -120, "Thu hồi điểm do hủy đơn hàng #AGRI-AAAA1111 "),
                tx("EARNED", 120, "Tích điểm từ đơn hàng #AGRI-AAAA1111 (Hạng BRONZE x1.0)")));

        service.revokeOrderPoints(EMAIL, "AGRI-AAAA1111", 400_000);

        verify(transactions, never()).save(any());
        verify(memberships, never()).save(any());
    }

    @Test
    void doesNotMatchOrderCodeThatIsAPrefixOfAnother() {
        LoyaltyMembership m = membership(300, 1_000_000);
        when(transactions.findByUserEmailIgnoreCaseOrderByCreatedAtDesc(EMAIL)).thenReturn(List.of(
                tx("EARNED", 80, "Tích điểm từ đơn hàng #AGRI-12345 (Hạng BRONZE x1.0)")));

        service.revokeOrderPoints(EMAIL, "AGRI-1234", 100_000);

        assertEquals(300, m.getCurrentPoints());
    }

    // ───── adminAddBonusPoints ─────

    @Test
    void rejectsZeroBonus() {
        assertThrows(IllegalArgumentException.class, () -> service.adminAddBonusPoints(user.getId(), 0, "x"));
    }

    @Test
    void rejectsDeductionBelowZero() {
        membership(100, 0);
        assertThrows(IllegalArgumentException.class, () -> service.adminAddBonusPoints(user.getId(), -500, "x"));
        verify(memberships, never()).save(any());
    }

    @Test
    void appliesValidDeduction() {
        LoyaltyMembership m = membership(100, 0);
        service.adminAddBonusPoints(user.getId(), -40, "điều chỉnh");
        assertEquals(60, m.getCurrentPoints());
        assertEquals(100, m.getLifetimePoints());
    }
}
