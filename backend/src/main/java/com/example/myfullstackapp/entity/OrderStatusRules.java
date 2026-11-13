package com.example.myfullstackapp.entity;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Nguồn duy nhất cho các bước chuyển trạng thái đơn hàng hợp lệ.
 * Frontend đọc danh sách này qua {@link Order#getAllowedNextStatuses()} thay vì tự sao chép.
 */
public final class OrderStatusRules {
    public static final Set<String> KNOWN_STATUSES = Set.of(
            "PENDING_PAYMENT", "PAID", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED", "REFUNDED");

    private static final Map<String, List<String>> TRANSITIONS = Map.of(
            "PENDING_PAYMENT", List.of("PAID", "CONFIRMED", "CANCELLED"),
            "PAID", List.of("CONFIRMED", "SHIPPING", "CANCELLED", "REFUNDED"),
            "CONFIRMED", List.of("PAID", "SHIPPING", "CANCELLED"),
            "SHIPPING", List.of("DELIVERED"),
            "DELIVERED", List.of("REFUNDED"),
            "CANCELLED", List.of(),
            "REFUNDED", List.of()
    );

    /** Trạng thái cũ/lạ (dữ liệu trước đây) vẫn cho phép xác nhận hoặc hủy để không bị kẹt. */
    private static final List<String> LEGACY_FALLBACK = List.of("CONFIRMED", "CANCELLED");

    private OrderStatusRules() {
    }

    public static String normalize(String status) {
        return status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
    }

    public static List<String> nextStatuses(String current) {
        return TRANSITIONS.getOrDefault(normalize(current), LEGACY_FALLBACK);
    }

    public static boolean canTransition(String current, String next) {
        return nextStatuses(current).contains(normalize(next));
    }
}
