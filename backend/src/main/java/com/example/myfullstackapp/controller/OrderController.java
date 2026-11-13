package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.order.CancelOrderRequest;
import com.example.myfullstackapp.dto.order.CreateOrderRequest;
import com.example.myfullstackapp.dto.order.UpdateOrderStatusRequest;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.entity.OrderItem;
import com.example.myfullstackapp.entity.OrderStatusRules;
import com.example.myfullstackapp.entity.Product;
import com.example.myfullstackapp.repository.OrderRepository;
import com.example.myfullstackapp.repository.ProductRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final com.example.myfullstackapp.service.LoyaltyService loyaltyService;

    private static final Set<String> NON_CANCELLABLE_STATUSES = Set.of("SHIPPING", "DELIVERED", "CANCELLED", "REFUNDED");


    @GetMapping
    public ResponseEntity<List<Order>> getOrders(
            @RequestParam(required = false) String email,
            Authentication authentication
    ) {
        boolean loggedIn = isLoggedIn(authentication);
        boolean manager = canManageDistribution(authentication);
        if ((email == null || email.isBlank()) && (!loggedIn || manager)) {
            return ResponseEntity.ok(orderRepository.findAllByOrderByCreatedAtDesc());
        }
        String targetEmail = (email == null || email.isBlank()) ? authentication.getName() : email.trim();
        return ResponseEntity.ok(orderRepository.findByUserEmailOrderByCreatedAtDesc(targetEmail));
    }

    private boolean canManageDistribution(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream().anyMatch(authority ->
                "ROLE_DISTRIBUTOR".equals(authority.getAuthority()) || "ROLE_ADMIN".equals(authority.getAuthority())
        );
    }

    /**
     * Tra cứu đơn theo mã. Được phép khi: là ADMIN/DISTRIBUTOR, là chủ đơn (đã đăng nhập),
     * hoặc khách cung cấp đúng số điện thoại người nhận. Sai điều kiện trả 404 để không lộ đơn tồn tại.
     */
    @GetMapping("/{orderCode}")
    public ResponseEntity<Order> getOrderByCode(
            @PathVariable String orderCode,
            @RequestParam(required = false) String phone,
            Authentication authentication
    ) {
        return orderRepository.findByOrderCode(orderCode.trim().toUpperCase())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private boolean canViewOrder(Order order, String phone, Authentication authentication) {
        if (isLoggedIn(authentication)) {
            if (canManageDistribution(authentication)) return true;
            if (order.getUserEmail() != null && order.getUserEmail().equalsIgnoreCase(authentication.getName())) return true;
        }
        String given = normalizePhone(phone);
        String actual = normalizePhone(order.getReceiverPhone());
        return given.length() >= 9 && given.equals(actual);
    }

    private static String normalizePhone(String phone) {
        if (phone == null) return "";
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.startsWith("84") && digits.length() > 10) digits = "0" + digits.substring(2);
        return digits;
    }

    private static boolean isLoggedIn(Authentication authentication) {
        return authentication != null && authentication.isAuthenticated()
                && !(authentication instanceof org.springframework.security.authentication.AnonymousAuthenticationToken);
    }

    private static final String ORDER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final java.security.SecureRandom RANDOM = new java.security.SecureRandom();

    private String generateOrderCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder("AGRI-");
            for (int i = 0; i < 8; i++) sb.append(ORDER_CODE_ALPHABET.charAt(RANDOM.nextInt(ORDER_CODE_ALPHABET.length())));
            String code = sb.toString();
            if (orderRepository.findByOrderCode(code).isEmpty()) return code;
        }
        throw new IllegalStateException("Không thể sinh mã đơn hàng, vui lòng thử lại");
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Order> createOrder(
            @Valid @RequestBody CreateOrderRequest req,
            Authentication authentication
    ) {
        // Đã đăng nhập: luôn dùng email trong token, bỏ qua userEmail gửi lên để tránh gán đơn/điểm cho người khác
        boolean loggedIn = isLoggedIn(authentication);
        String email = loggedIn ? authentication.getName() : req.getUserEmail();
        if (email == null || email.isBlank()) {
            email = "customer@gmail.com";
        }

        String orderCode = generateOrderCode();

        String paymentMethod = req.getPaymentMethod() != null ? req.getPaymentMethod().toUpperCase() : "COD";
        // Order lifecycle initial status based on payment method
        String initialStatus = "CONFIRMED";
        if ("PAYOS".equals(paymentMethod) || "BANK".equals(paymentMethod)) {
            initialStatus = "PENDING_PAYMENT";
        }

        // Subtotal calculation: prioritize accurate subtotal from request
        long subtotal = req.getSubtotal() != null ? req.getSubtotal() : 0L;
        if (subtotal <= 0L && req.getItems() != null) {
            for (var itemDto : req.getItems()) {
                long itemPrice = itemDto.getPrice() != null ? itemDto.getPrice() : 0L;
                subtotal += itemPrice;
            }
        }

        // Enforce 1-use per account for vouchers
        if (req.getVoucherUsed() != null && !req.getVoucherUsed().isBlank() && email != null) {
            String rawVoucher = req.getVoucherUsed().trim().toUpperCase();
            for (String code : List.of("AGRI30", "FREESHIP", "FREESHIP25", "VIPGOLD", "VIETGAP10")) {
                if (rawVoucher.contains(code) && orderRepository.hasUserUsedVoucher(email, code)) {
                    throw new IllegalArgumentException("Mỗi tài khoản chỉ được sử dụng mã giảm giá [" + code + "] một lần. Bạn đã áp dụng mã này ở đơn trước đó.");
                }
            }
        }

        long shippingFee = req.getShippingFee() != null ? req.getShippingFee() : 0L;
        long discount = req.getDiscount() != null ? req.getDiscount() : 0L;
        long total = (req.getTotal() != null && req.getTotal() > 0L)
                ? req.getTotal()
                : Math.max(0L, subtotal + shippingFee - discount);
        int points = (int) (total / 10000L); // 1 point for every 10k VND

        Order order = Order.builder()
                .orderCode(orderCode)
                .userEmail(email)
                .receiverName(req.getReceiverName())
                .receiverPhone(req.getReceiverPhone())
                .receiverAddress(req.getReceiverAddress())
                .deliverySlot(req.getDeliverySlot() != null ? req.getDeliverySlot() : "Bất kỳ lúc nào")
                .deliveryNote(req.getDeliveryNote())
                .driverName("Nguyễn Văn Thắng")
                .driverPhone("0912.888.777")
                .status(initialStatus)
                .paymentMethod(paymentMethod)
                .voucherUsed(req.getVoucherUsed())
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .discount(discount)
                .total(total)
                .pointsAwarded(points > 0 ? points : 20)
                .lotCode(req.getLotCode() != null ? req.getLotCode() : "XL-2026-08")
                .createdAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        if (req.getItems() != null) {
            for (var itemDto : req.getItems()) {
                OrderItem item = OrderItem.builder()
                        .order(order)
                        .name(itemDto.getName())
                        .origin(itemDto.getOrigin() != null ? itemDto.getOrigin() : "Đà Lạt, Lâm Đồng")
                        .cert(itemDto.getCert() != null ? itemDto.getCert() : "VietGAP")
                        .qty(itemDto.getQty() != null ? itemDto.getQty() : "1")
                        .price(itemDto.getPrice() != null ? itemDto.getPrice() : 0L)
                        .image(itemDto.getImage())
                        .build();
                order.getItems().add(item);

                // Deduct stock if matching product exists
                deductProductStock(itemDto.getName(), itemDto.getQty());
            }
        }

        Order saved = orderRepository.save(order);

        // Award loyalty points to the customer
        loyaltyService.awardOrderPoints(
                email,
                saved.getTotal() != null ? saved.getTotal() : 0L,
                saved.getOrderCode(),
                saved.getPointsAwarded() != null && saved.getPointsAwarded() > 0 ? saved.getPointsAwarded() : 20
        );

        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{orderCode}/cancel")
    @Transactional
    public ApiResponse<Order> cancelOrder(
            @PathVariable String orderCode,
            @RequestBody(required = false) CancelOrderRequest request,
            Authentication authentication
    ) {
        Order order = orderRepository.findByOrderCode(orderCode.trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + orderCode));

        if (NON_CANCELLABLE_STATUSES.contains(order.getStatus().toUpperCase())) {
            throw new IllegalArgumentException("Không thể hủy đơn hàng khi đơn đã sang trạng thái " + order.getStatus());
        }

        applyCancellation(order, request != null && request.getReason() != null ? request.getReason() : "Khách hàng yêu cầu hủy đơn");
        Order saved = orderRepository.save(order);
        return ApiResponse.ok("Hủy đơn hàng thành công!", saved);
    }

    /** Hủy đơn: đặt trạng thái, hoàn tồn kho và thu hồi điểm đã tích. Dùng chung cho /cancel và /status. */
    private void applyCancellation(Order order, String reason) {
        order.setStatus("CANCELLED");
        order.setCancelledAt(LocalDateTime.now());
        order.setCancelReason(reason);
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                restoreProductStock(item.getName(), item.getQty());
            }
        }
        loyaltyService.revokeOrderPoints(order.getUserEmail(), order.getOrderCode(),
                order.getTotal() != null ? order.getTotal() : 0L);
    }

    @PatchMapping("/{orderCode}/status")
    @Transactional
    public ApiResponse<Order> updateStatus(
            @PathVariable String orderCode,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        Order order = orderRepository.findByOrderCode(orderCode.trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + orderCode));

        String currentStatus = order.getStatus() != null ? order.getStatus().toUpperCase() : "CONFIRMED";
        String newStatus = request.getStatus().trim().toUpperCase();
        if (!OrderStatusRules.KNOWN_STATUSES.contains(newStatus)) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + newStatus);
        }
        if (newStatus.equals(currentStatus)) {
            return ApiResponse.ok("Trạng thái đơn hàng không thay đổi", order);
        }
        if (!OrderStatusRules.canTransition(currentStatus, newStatus)) {
            throw new IllegalArgumentException("Không thể chuyển đơn #" + orderCode + " từ " + currentStatus + " sang " + newStatus);
        }

        if ("CANCELLED".equals(newStatus)) {
            applyCancellation(order, "Quản trị viên hủy đơn");
        } else {
            order.setStatus(newStatus);
        }
        if ("REFUNDED".equals(newStatus)) {
            // Hoàn tiền: thu hồi điểm đã tích. Không hoàn kho vì hàng có thể đã giao tới khách.
            loyaltyService.revokeOrderPoints(order.getUserEmail(), order.getOrderCode(),
                    order.getTotal() != null ? order.getTotal() : 0L);
        }
        if ("PAID".equals(newStatus) && order.getPaidAt() == null) {
            order.setPaidAt(LocalDateTime.now());
        }
        Order saved = orderRepository.save(order);
        return ApiResponse.ok("Cập nhật trạng thái đơn hàng thành công", saved);
    }

    private void deductProductStock(String productName, String qtyStr) {
        if (productName == null) return;
        try {
            int qty = parseQuantity(qtyStr);
            List<Product> products = productRepository.findAll();
            for (Product p : products) {
                if (productName.equalsIgnoreCase(p.getName()) && p.getStockLeft() != null) {
                    p.setStockLeft(Math.max(0, p.getStockLeft() - qty));
                    productRepository.save(p);
                    break;
                }
            }
        } catch (Exception e) {
            log.warn("Could not deduct stock for {}: {}", productName, e.getMessage());
        }
    }

    private void restoreProductStock(String productName, String qtyStr) {
        if (productName == null) return;
        try {
            int qty = parseQuantity(qtyStr);
            List<Product> products = productRepository.findAll();
            for (Product p : products) {
                if (productName.equalsIgnoreCase(p.getName()) && p.getStockLeft() != null) {
                    p.setStockLeft(p.getStockLeft() + qty);
                    productRepository.save(p);
                    break;
                }
            }
        } catch (Exception e) {
            log.warn("Could not restore stock for {}: {}", productName, e.getMessage());
        }
    }

    private int parseQuantity(String qtyStr) {
        if (qtyStr == null || qtyStr.isBlank()) return 1;
        try {
            String firstToken = qtyStr.trim().split("\\s+")[0];
            return Math.max(1, Integer.parseInt(firstToken.replaceAll("[^0-9]", "")));
        } catch (Exception e) {
            return 1;
        }
    }
}
