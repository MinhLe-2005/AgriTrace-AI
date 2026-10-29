package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.order.CreateOrderRequest;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.entity.OrderItem;
import com.example.myfullstackapp.repository.OrderRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRepository orderRepository;

    @GetMapping
    public ResponseEntity<List<Order>> getOrders(
            @RequestParam(required = false) String email,
            Authentication authentication
    ) {
        // Distributor/Admin need the operational order queue; preserve the
        // customer behavior below for all other authenticated callers.
        if (email == null && canManageDistribution(authentication)) {
            return ResponseEntity.ok(orderRepository.findAllByOrderByCreatedAtDesc());
        }
        String targetEmail = email;
        if (targetEmail == null && authentication != null) {
            targetEmail = authentication.getName();
        }
        if (targetEmail != null && !targetEmail.isBlank()) {
            return ResponseEntity.ok(orderRepository.findByUserEmailOrderByCreatedAtDesc(targetEmail));
        }
        return ResponseEntity.ok(orderRepository.findAllByOrderByCreatedAtDesc());
    }

    private boolean canManageDistribution(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream().anyMatch(authority ->
                "ROLE_DISTRIBUTOR".equals(authority.getAuthority()) || "ROLE_ADMIN".equals(authority.getAuthority())
        );
    }

    @GetMapping("/{orderCode}")
    public ResponseEntity<Order> getOrderByCode(@PathVariable String orderCode) {
        return orderRepository.findByOrderCode(orderCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(
            @Valid @RequestBody CreateOrderRequest req,
            Authentication authentication
    ) {
        String email = req.getUserEmail();
        if (email == null && authentication != null) {
            email = authentication.getName();
        }
        if (email == null) {
            email = "customer@gmail.com";
        }

        String orderCode = "AGRI-" + (int)(Math.random() * 9000 + 1000);

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
                .status("SHIPPING")
                .paymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod().toUpperCase() : "COD")
                .voucherUsed(req.getVoucherUsed())
                .subtotal(req.getSubtotal() != null ? req.getSubtotal() : 0L)
                .shippingFee(req.getShippingFee() != null ? req.getShippingFee() : 0L)
                .discount(req.getDiscount() != null ? req.getDiscount() : 0L)
                .total(req.getTotal() != null ? req.getTotal() : 0L)
                .pointsAwarded(req.getPointsAwarded() != null ? req.getPointsAwarded() : 20)
                .lotCode(req.getLotCode() != null ? req.getLotCode() : "XL-2026-08")
                .createdAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        if (req.getItems() != null) {
            for (var itemDto : req.getItems()) {
                OrderItem item = OrderItem.builder()
                        .order(order)
                        .name(itemDto.getName())
                        .origin(itemDto.getOrigin())
                        .cert(itemDto.getCert())
                        .qty(itemDto.getQty() != null ? itemDto.getQty() : "1")
                        .price(itemDto.getPrice() != null ? itemDto.getPrice() : 0L)
                        .image(itemDto.getImage())
                        .build();
                order.getItems().add(item);
            }
        }

        Order saved = orderRepository.save(order);
        return ResponseEntity.ok(saved);
    }
}
