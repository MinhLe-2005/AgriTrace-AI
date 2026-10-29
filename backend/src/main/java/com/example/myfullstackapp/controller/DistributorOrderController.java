package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.distributor.DistributorOrderPageResponse;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/** Operational order queue for Distributor and Admin accounts. */
@RestController
@RequestMapping("/api/v1/distributor/orders")
@PreAuthorize("hasAnyRole('DISTRIBUTOR', 'ADMIN')")
@RequiredArgsConstructor
public class DistributorOrderController {
    private static final List<String> OPERATIONAL_STATUSES = List.of("CONFIRMED", "PENDING", "SHIPPING", "DELIVERED", "COMPLETED");
    private final OrderRepository orderRepository;

    @GetMapping
    public ApiResponse<DistributorOrderPageResponse> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<String> statuses = parseStatuses(status);
        List<String> allowedStatuses = statuses.isEmpty() ? OPERATIONAL_STATUSES : statuses;
        boolean isAdmin = isAdmin(authentication);
        Page<Order> orders = orderRepository.findVisibleForDistributor(
                allowedStatuses, isAdmin, actor(authentication), PageRequest.of(safePage, safeSize));
        return ApiResponse.ok("Distributor orders retrieved", new DistributorOrderPageResponse(
                orders.getContent(), orders.getNumber(), orders.getSize(), orders.getTotalElements(), orders.getTotalPages()
        ));
    }

    @GetMapping("/{orderId}")
    public ApiResponse<Order> detail(@PathVariable String orderId, Authentication authentication) {
        Order order = findOrder(orderId);
        if (!isAdmin(authentication) && (!OPERATIONAL_STATUSES.contains(order.getStatus())
                || (order.getDistributorEmail() != null && !actor(authentication).equalsIgnoreCase(order.getDistributorEmail())))) {
            throw new AccessDeniedException("Đơn hàng này chưa được gán cho bạn");
        }
        return ApiResponse.ok("Distributor order retrieved", order);
    }

    private Order findOrder(String orderId) {
        try {
            return orderRepository.findById(Long.parseLong(orderId))
                    .orElseGet(() -> orderRepository.findByOrderCode(orderId)
                            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng")));
        } catch (NumberFormatException ignored) {
            return orderRepository.findByOrderCode(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        }
    }

    private List<String> parseStatuses(String status) {
        if (status == null || status.isBlank()) return List.of();
        return Arrays.stream(status.split(","))
                .map(value -> value.trim().toUpperCase(Locale.ROOT))
                .filter(value -> !value.isBlank())
                .toList();
    }

    private String actor(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để xem đơn hàng");
        }
        return authentication.getName();
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
