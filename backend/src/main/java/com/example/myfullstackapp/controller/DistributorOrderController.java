package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.distributor.DistributorOrderPageResponse;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.OrderRepository;
import com.example.myfullstackapp.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/** Operational order queue for Distributor and Admin accounts. */
@RestController
@RequestMapping("/api/v1/distributor/orders")
@PreAuthorize("hasAnyRole('DISTRIBUTOR', 'ADMIN')")
@RequiredArgsConstructor
public class DistributorOrderController {
    private static final List<String> OPERATIONAL_STATUSES = List.of("CONFIRMED", "PENDING", "SHIPPING", "DELIVERED", "COMPLETED");
    private final OrderRepository orderRepository;
    private final ShipmentRepository shipmentRepository;

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
        Set<String> assignedCodes = assignedOrderCodes(actor(authentication), isAdmin);
        Set<String> allAssignedCodes = isAdmin ? Set.of() : allAssignedOrderCodes();
        List<Order> matchingOrders = orderRepository.findAllByOrderByCreatedAtDesc().stream()
                // An unassigned operational order must be visible so a Distributor can
                // create its first shipment. Once assigned, only that Distributor (or
                // an Admin) can see it.
                .filter(order -> isAdmin || assignedCodes.contains(order.getOrderCode())
                        || !allAssignedCodes.contains(order.getOrderCode()))
                .filter(order -> allowedStatuses.contains(order.getStatus()))
                .toList();
        int totalElements = matchingOrders.size();
        int from = Math.min(safePage * safeSize, totalElements);
        int to = Math.min(from + safeSize, totalElements);
        List<Order> orders = matchingOrders.subList(from, to);
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / safeSize);
        return ApiResponse.ok("Distributor orders retrieved", new DistributorOrderPageResponse(
                orders, safePage, safeSize, totalElements, totalPages
        ));
    }

    @GetMapping("/{orderId}")
    public ApiResponse<Order> detail(@PathVariable String orderId, Authentication authentication) {
        Order order = findOrder(orderId);
        if (!isAdmin(authentication)
                && !assignedOrderCodes(actor(authentication), false).contains(order.getOrderCode())
                && allAssignedOrderCodes().contains(order.getOrderCode())) {
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

    private Set<String> assignedOrderCodes(String actorEmail, boolean isAdmin) {
        if (isAdmin) return Set.of();
        return shipmentRepository.findByDistributorEmailIgnoreCaseOrderByCreatedAtDesc(actorEmail).stream()
                .map(shipment -> shipment.getOrderCodes())
                .filter(value -> value != null && !value.isBlank())
                .flatMap(value -> Arrays.stream(value.split(",")))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toUnmodifiableSet());
    }

    private Set<String> allAssignedOrderCodes() {
        return shipmentRepository.findAll().stream()
                .map(shipment -> shipment.getOrderCodes())
                .filter(value -> value != null && !value.isBlank())
                .flatMap(value -> Arrays.stream(value.split(",")))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toUnmodifiableSet());
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
