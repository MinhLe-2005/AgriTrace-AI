package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.entity.OrderItem;
import com.example.myfullstackapp.entity.OrderMessage;
import com.example.myfullstackapp.repository.OrderMessageRepository;
import com.example.myfullstackapp.repository.OrderRepository;
import com.example.myfullstackapp.service.LoyaltyService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderMessageController {

    private final OrderRepository orderRepository;
    private final OrderMessageRepository orderMessageRepository;
    private final LoyaltyService loyaltyService;
    private final SimpMessagingTemplate messagingTemplate;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendMessageRequest {
        private String senderRole; // "CUSTOMER", "FARMER", "ADMIN"
        private String senderName;
        private String senderEmail;
        @NotBlank(message = "Nội dung tin nhắn không được để trống")
        private String message;
        private String imageUrl;
        private String messageType; // "CHAT", "DISPUTE_SUBMITTED", etc.
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateDisputeRequest {
        @NotBlank(message = "Vui lòng chọn lý do khiếu nại")
        private String reason;
        private String solution; // "REFUND_MONEY", "REPLACE_GOODS", "VOUCHER"
        private Long amount;
        private String photoUrl;
        private String note;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResolveDisputeRequest {
        @NotBlank(message = "Hành động duyệt (APPROVE/REJECT) không được để trống")
        private String action; // "APPROVE" or "REJECT"
        private String note;
        private Long refundAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversationSummary {
        private String orderCode;
        private String customerName;
        private String customerPhone;
        private String customerEmail;
        private String farmName;
        private String productSummary;
        private Long total;
        private String orderStatus;
        private String refundStatus;
        private String refundReason;
        private String lastMessage;
        private LocalDateTime lastMessageTime;
        private int messageCount;
        private boolean hasPendingDispute;
        private int unreadCount;
    }

    /**
     * Lấy danh sách tin nhắn theo mã đơn hàng.
     * Tự động khởi tạo tin nhắn chào mừng từ Nhà Vườn nếu đơn chưa có tin nhắn nào.
     */
    @GetMapping("/{orderCode}/messages")
    @Transactional
    public ApiResponse<List<OrderMessage>> getMessages(@PathVariable String orderCode) {
        String cleanCode = orderCode.trim().toUpperCase();
        List<OrderMessage> messages = orderMessageRepository.findByOrderCodeOrderByCreatedAtAsc(cleanCode);

        if (messages.isEmpty()) {
            Optional<Order> orderOpt = orderRepository.findByOrderCode(cleanCode);
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                String farmName = resolveFarmName(order);
                String firstItem = order.getItems() != null && !order.getItems().isEmpty()
                        ? order.getItems().get(0).getName()
                        : "Nông sản tươi";

                // Tin nhắn chào mừng tự động từ Nhà Vườn
                OrderMessage welcomeMsg = OrderMessage.builder()
                        .orderCode(cleanCode)
                        .farmName(farmName)
                        .senderRole("FARMER")
                        .senderName(farmName)
                        .message("Dạ chào bạn! Nông trại mình đã tiếp nhận đơn #" + cleanCode + " (" + firstItem + "). "
                                + "Hàng thu hoạch theo tiêu chuẩn VietGAP/GlobalGAP, bảo quản chuỗi lạnh 2°C - 5°C. "
                                + "Nếu cần hỗ trợ gấp hoặc tư vấn bảo quản, bạn cứ nhắn tin tại đây nhé!")
                        .messageType("CHAT")
                        .createdAt(order.getCreatedAt() != null ? order.getCreatedAt().plusMinutes(1) : LocalDateTime.now().minusHours(1))
                        .isRead(true)
                        .build();

                orderMessageRepository.save(welcomeMsg);
                messages = List.of(welcomeMsg);
            }
        }

        return ApiResponse.ok("Lấy lịch sử tin nhắn thành công", messages);
    }

    /**
     * Đánh dấu các tin nhắn từ phía đối phương trong đơn hàng là đã đọc.
     */
    @PatchMapping("/{orderCode}/messages/read")
    @Transactional
    public ApiResponse<Void> markAsRead(
            @PathVariable String orderCode,
            @RequestParam(required = false) String readerRole
    ) {
        String cleanCode = orderCode.trim().toUpperCase();
        List<OrderMessage> messages = orderMessageRepository.findByOrderCodeOrderByCreatedAtAsc(cleanCode);
        boolean hasUnread = false;
        for (OrderMessage m : messages) {
            if (m.isRead()) continue;
            if ("CUSTOMER".equalsIgnoreCase(readerRole) && "CUSTOMER".equalsIgnoreCase(m.getSenderRole())) {
                continue;
            }
            if (("FARMER".equalsIgnoreCase(readerRole) || "ADMIN".equalsIgnoreCase(readerRole))
                    && ("FARMER".equalsIgnoreCase(m.getSenderRole()) || "ADMIN".equalsIgnoreCase(m.getSenderRole()))) {
                continue;
            }
            m.setRead(true);
            hasUnread = true;
        }
        if (hasUnread) {
            orderMessageRepository.saveAll(messages);
        }
        return ApiResponse.ok("Đã đánh dấu đã đọc thành công", null);
    }

    /**
     * Gửi tin nhắn mới trong hội thoại của đơn hàng.
     */
    @PostMapping("/{orderCode}/messages")
    @Transactional
    public ApiResponse<OrderMessage> sendMessage(
            @PathVariable String orderCode,
            @Valid @RequestBody SendMessageRequest request,
            Authentication authentication
    ) {
        String cleanCode = orderCode.trim().toUpperCase();
        Order order = orderRepository.findByOrderCode(cleanCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + cleanCode));

        String farmName = resolveFarmName(order);

        String role = request.getSenderRole() != null ? request.getSenderRole().toUpperCase() : "CUSTOMER";
        String senderName = request.getSenderName();
        if (senderName == null || senderName.isBlank()) {
            if ("FARMER".equals(role)) senderName = farmName;
            else if ("ADMIN".equals(role)) senderName = "CSKH AgriTrace";
            else senderName = order.getReceiverName() != null ? order.getReceiverName() : "Khách hàng";
        }

        OrderMessage msg = OrderMessage.builder()
                .orderCode(cleanCode)
                .farmName(farmName)
                .senderRole(role)
                .senderName(senderName)
                .senderEmail(request.getSenderEmail() != null ? request.getSenderEmail() : (authentication != null ? authentication.getName() : null))
                .message(request.getMessage().trim())
                .imageUrl(request.getImageUrl())
                .messageType(request.getMessageType() != null ? request.getMessageType() : "CHAT")
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();

        OrderMessage saved = orderMessageRepository.save(msg);
        try {
            messagingTemplate.convertAndSend("/topic/orders/" + cleanCode + "/messages", saved);
        } catch (Exception e) {
            log.warn("WebSocket broadcast failed for order {}: {}", cleanCode, e.getMessage());
        }
        return ApiResponse.ok("Gửi tin nhắn thành công", saved);
    }

    /**
     * Khách hàng gửi Yêu cầu Trả hàng / Hoàn tiền (Khiếu nại).
     */
    @PostMapping("/{orderCode}/dispute")
    @Transactional
    public ApiResponse<Order> createDispute(
            @PathVariable String orderCode,
            @Valid @RequestBody CreateDisputeRequest request
    ) {
        String cleanCode = orderCode.trim().toUpperCase();
        Order order = orderRepository.findByOrderCode(cleanCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + cleanCode));

        long refundAmt = request.getAmount() != null && request.getAmount() > 0
                ? request.getAmount()
                : (order.getTotal() != null ? order.getTotal() : 0L);

        order.setRefundStatus("PENDING");
        order.setRefundReason(request.getReason());
        order.setRefundSolution(request.getSolution() != null ? request.getSolution() : "REFUND_MONEY");
        order.setRefundAmount(refundAmt);
        order.setRefundPhotoUrl(request.getPhotoUrl());
        order.setRefundNote(request.getNote());
        order.setRefundRequestedAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);

        // Tạo tin nhắn thông báo khiếu nại trong khung chat của đơn
        String solutionText = "Hoàn tiền " + String.format("%,d", refundAmt) + " đ";
        if ("REPLACE_GOODS".equalsIgnoreCase(request.getSolution())) solutionText = "Đổi giao bù combo mới";
        if ("VOUCHER".equalsIgnoreCase(request.getSolution())) solutionText = "Nhận Voucher đền bù 100%";

        String disputeMsgContent = "⚠️ [YÊU CẦU TRẢ HÀNG / HOÀN TIỀN]\n"
                + "• Lý do: " + request.getReason() + "\n"
                + "• Giải pháp mong muốn: " + solutionText + "\n"
                + (request.getNote() != null && !request.getNote().isBlank() ? "• Ghi chú: " + request.getNote().trim() + "\n" : "")
                + "• Đang chờ Quản trị viên & Chủ nông trại kiểm tra đối soát.";

        OrderMessage disputeMsg = OrderMessage.builder()
                .orderCode(cleanCode)
                .farmName(resolveFarmName(order))
                .senderRole("CUSTOMER")
                .senderName(order.getReceiverName() != null ? order.getReceiverName() : "Khách hàng")
                .message(disputeMsgContent)
                .imageUrl(request.getPhotoUrl())
                .messageType("DISPUTE_SUBMITTED")
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();

        OrderMessage savedDisputeMsg = orderMessageRepository.save(disputeMsg);
        try {
            messagingTemplate.convertAndSend("/topic/orders/" + cleanCode + "/messages", savedDisputeMsg);
        } catch (Exception e) {
            log.warn("WebSocket broadcast dispute failed for order {}: {}", cleanCode, e.getMessage());
        }
        log.info("Khách hàng đã gửi khiếu nại hoàn tiền cho đơn #{}: Lý do {}", cleanCode, request.getReason());

        return ApiResponse.ok("Gửi yêu cầu trả hàng / hoàn tiền thành công! Đội ngũ đang xử lý.", saved);
    }

    /**
     * Quản trị viên (Admin) hoặc Nhà vườn duyệt / từ chối khiếu nại hoàn tiền.
     */
    @PatchMapping("/{orderCode}/dispute/resolve")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'FARMER')")
    @Transactional
    public ApiResponse<Order> resolveDispute(
            @PathVariable String orderCode,
            @Valid @RequestBody ResolveDisputeRequest request,
            Authentication authentication
    ) {
        String cleanCode = orderCode.trim().toUpperCase();
        Order order = orderRepository.findByOrderCode(cleanCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + cleanCode));

        boolean isApprove = "APPROVE".equalsIgnoreCase(request.getAction());
        String adminNote = request.getNote() != null && !request.getNote().isBlank() ? request.getNote().trim() : (isApprove ? "Đã duyệt hoàn tiền thỏa đáng cho khách." : "Từ chối khiếu nại do không đủ căn cứ.");

        if (isApprove) {
            order.setRefundStatus("APPROVED");
            order.setStatus("REFUNDED");
            order.setRefundResolvedAt(LocalDateTime.now());
            order.setRefundNote(adminNote);

            // Thu hồi điểm tích lũy của đơn hàng hoàn tiền
            try {
                loyaltyService.revokeOrderPoints(order.getUserEmail(), order.getOrderCode(), order.getTotal() != null ? order.getTotal() : 0L);
            } catch (Exception e) {
                log.warn("Non-fatal revoking points: {}", e.getMessage());
            }

            // Ghi tin nhắn thông báo vào chat
            OrderMessage approvedMsg = OrderMessage.builder()
                    .orderCode(cleanCode)
                    .farmName(resolveFarmName(order))
                    .senderRole("ADMIN")
                    .senderName("CSKH AgriTrace")
                    .message("✅ [ĐÃ DUYỆT HOÀN TIỀN]\n"
                            + "Yêu cầu hoàn tiền đơn #" + cleanCode + " đã được Quản trị viên chấp thuận.\n"
                            + "Số tiền: " + String.format("%,d", order.getRefundAmount() != null ? order.getRefundAmount() : order.getTotal()) + " đ.\n"
                            + "Ghi chú: " + adminNote)
                    .messageType("DISPUTE_APPROVED")
                    .createdAt(LocalDateTime.now())
                    .build();
            OrderMessage savedApproved = orderMessageRepository.save(approvedMsg);
            try {
                messagingTemplate.convertAndSend("/topic/orders/" + cleanCode + "/messages", savedApproved);
            } catch (Exception e) {
                log.warn("WebSocket broadcast resolution failed: {}", e.getMessage());
            }
        } else {
            order.setRefundStatus("REJECTED");
            order.setRefundResolvedAt(LocalDateTime.now());
            order.setRefundNote(adminNote);

            // Ghi tin nhắn thông báo từ chối vào chat
            OrderMessage rejectedMsg = OrderMessage.builder()
                    .orderCode(cleanCode)
                    .farmName(resolveFarmName(order))
                    .senderRole("ADMIN")
                    .senderName("CSKH AgriTrace")
                    .message("❌ [TỪ CHỐI KHIẾU NẠI HOÀN TIỀN]\n"
                            + "Yêu cầu khiếu nại đơn #" + cleanCode + " không được chấp thuận.\n"
                            + "Lý do: " + adminNote + "\n"
                            + "Nếu cần giải đáp thêm, quý khách vui lòng phản hồi tại đây hoặc gọi Hotline 1900 1234.")
                    .messageType("DISPUTE_REJECTED")
                    .createdAt(LocalDateTime.now())
                    .build();
            OrderMessage savedRejected = orderMessageRepository.save(rejectedMsg);
            try {
                messagingTemplate.convertAndSend("/topic/orders/" + cleanCode + "/messages", savedRejected);
            } catch (Exception e) {
                log.warn("WebSocket broadcast resolution failed: {}", e.getMessage());
            }
        }

        Order saved = orderRepository.save(order);
        return ApiResponse.ok(isApprove ? "Đã duyệt hoàn tiền thành công!" : "Đã từ chối khiếu nại đơn hàng.", saved);
    }

    /**
     * Hộp thư đến (Inbox) cho Khách hàng (Customer), Chủ Nông Trại (Farmer) và Quản trị viên (Admin).
     * Hỗ trợ lọc theo farmName (cho Farmer) hoặc customerEmail (cho Customer).
     */
    @GetMapping("/messages/inbox")
    public ApiResponse<List<ConversationSummary>> getInbox(
            @RequestParam(required = false) String farmName,
            @RequestParam(required = false) String customerEmail,
            @RequestParam(required = false) String status
    ) {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        List<Order> matchedOrders = new ArrayList<>();

        for (Order order : orders) {
            if (customerEmail != null && !customerEmail.isBlank()) {
                String orderEmail = order.getUserEmail();
                if (orderEmail == null || !orderEmail.trim().equalsIgnoreCase(customerEmail.trim())) {
                    continue;
                }
            }

            String resolvedFarm = resolveFarmName(order);
            if (farmName != null && !farmName.isBlank() && !resolvedFarm.toLowerCase().contains(farmName.trim().toLowerCase())) {
                continue;
            }

            boolean hasPending = "PENDING".equalsIgnoreCase(order.getRefundStatus());
            if ("DISPUTE".equalsIgnoreCase(status) && !hasPending) {
                continue;
            }
            matchedOrders.add(order);
        }

        List<String> orderCodes = matchedOrders.stream()
                .map(Order::getOrderCode)
                .filter(Objects::nonNull)
                .toList();

        Map<String, List<OrderMessage>> messagesByOrder = orderCodes.isEmpty()
                ? Collections.emptyMap()
                : orderMessageRepository.findByOrderCodeInOrderByCreatedAtAsc(orderCodes)
                        .stream()
                        .collect(Collectors.groupingBy(
                                m -> m.getOrderCode() != null ? m.getOrderCode().toUpperCase() : "",
                                LinkedHashMap::new,
                                Collectors.toList()
                        ));

        List<ConversationSummary> summaries = new ArrayList<>(matchedOrders.size());

        for (Order order : matchedOrders) {
            List<OrderMessage> msgs = messagesByOrder.getOrDefault(
                    order.getOrderCode() != null ? order.getOrderCode().toUpperCase() : "",
                    Collections.emptyList()
            );
            boolean hasPending = "PENDING".equalsIgnoreCase(order.getRefundStatus());
            if (msgs.isEmpty() && !hasPending && order.getRefundStatus() == null) {
                continue;
            }

            String resolvedFarm = resolveFarmName(order);
            String lastMsgText = "Chưa có tin nhắn mới";
            LocalDateTime lastMsgTime = order.getCreatedAt();
            if (!msgs.isEmpty()) {
                OrderMessage last = msgs.get(msgs.size() - 1);
                lastMsgText = last.getMessage();
                lastMsgTime = last.getCreatedAt();
            }

            String productSummary = order.getItems() != null && !order.getItems().isEmpty()
                    ? order.getItems().stream().map(OrderItem::getName).collect(Collectors.joining(", "))
                    : "Nông sản VietGAP";

            long unread;
            if (customerEmail != null && !customerEmail.isBlank()) {
                // Khách hàng: chỉ đếm tin nhắn chưa đọc từ phía Nông trại hoặc Admin
                unread = msgs.stream()
                        .filter(m -> !m.isRead() && !"CUSTOMER".equalsIgnoreCase(m.getSenderRole()))
                        .count();
            } else {
                // Nông dân / Quản trị viên: đếm tin nhắn chưa đọc từ phía Khách hàng
                unread = msgs.stream()
                        .filter(m -> !m.isRead() && "CUSTOMER".equalsIgnoreCase(m.getSenderRole()))
                        .count();
            }

            summaries.add(ConversationSummary.builder()
                    .orderCode(order.getOrderCode())
                    .customerName(order.getReceiverName() != null ? order.getReceiverName() : "Khách hàng")
                    .customerPhone(order.getReceiverPhone())
                    .customerEmail(order.getUserEmail())
                    .farmName(resolvedFarm)
                    .productSummary(productSummary)
                    .total(order.getTotal())
                    .orderStatus(order.getStatus())
                    .refundStatus(order.getRefundStatus())
                    .refundReason(order.getRefundReason())
                    .lastMessage(lastMsgText)
                    .lastMessageTime(lastMsgTime)
                    .messageCount(msgs.size())
                    .hasPendingDispute(hasPending)
                    .unreadCount((int) unread)
                    .build());
        }

        // Ưu tiên đơn đang có khiếu nại PENDING lên đầu, sau đó sắp xếp theo thời gian tin nhắn mới nhất
        summaries.sort((a, b) -> {
            if (a.isHasPendingDispute() && !b.isHasPendingDispute()) return -1;
            if (!a.isHasPendingDispute() && b.isHasPendingDispute()) return 1;
            if (a.getLastMessageTime() == null) return 1;
            if (b.getLastMessageTime() == null) return -1;
            return b.getLastMessageTime().compareTo(a.getLastMessageTime());
        });

        return ApiResponse.ok("Lấy danh sách hộp thư thành công", summaries);
    }

    @MessageMapping("/orders/{orderCode}/typing")
    @SendTo("/topic/orders/{orderCode}/typing")
    public Map<String, Object> broadcastTyping(
            @DestinationVariable String orderCode,
            Map<String, Object> payload
    ) {
        return payload;
    }

    private static String resolveFarmName(Order order) {
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            for (OrderItem it : order.getItems()) {
                if (it.getOrigin() != null && !it.getOrigin().isBlank()) {
                    return it.getOrigin().trim();
                }
            }
        }
        if (order.getLotCode() != null && order.getLotCode().contains("MC")) {
            return "Hợp Tác Xã Nông Sản Mộc Châu";
        }
        return "Nông Trại Xanh Thủy Canh Đà Lạt";
    }
}
