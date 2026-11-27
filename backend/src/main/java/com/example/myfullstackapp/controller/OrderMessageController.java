package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.entity.Farm;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.entity.OrderItem;
import com.example.myfullstackapp.entity.OrderMessage;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.repository.FarmRepository;
import com.example.myfullstackapp.repository.OrderMessageRepository;
import com.example.myfullstackapp.repository.OrderRepository;
import com.example.myfullstackapp.repository.UserRepository;
import com.example.myfullstackapp.service.FarmerOwnershipResolver;
import com.example.myfullstackapp.service.LoyaltyService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
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
    private final UserRepository userRepository;
    private final FarmRepository farmRepository;
    private final FarmerOwnershipResolver ownershipResolver;
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
        private String messageType; // "CHAT", "DISPUTE_SUBMITTED", "SUPPORT_ESCALATED", etc.
        private String channel; // "SHOP" (Customer <-> Farmer) or "ADMIN" (Customer <-> Admin)
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EscalateSupportRequest {
        private String reason;
        private String customerName;
        private String customerEmail;
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
        private boolean adminSupportRequested;
        private LocalDateTime adminSupportRequestedAt;
        private int unreadCount;
    }

    /**
     * Lấy danh sách tin nhắn theo mã đơn hàng và kênh chat ("SHOP" hoặc "ADMIN").
     * Không tự sinh tin nhắn mẫu giả lập khi GET.
     */
    @GetMapping("/{orderCode}/messages")
    @Transactional
    public ApiResponse<List<OrderMessage>> getMessages(
            @PathVariable String orderCode,
            @RequestParam(required = false, defaultValue = "SHOP") String channel,
            @RequestParam(required = false) String viewerRole,
            Authentication authentication
    ) {
        String cleanCode = normalizeOrderCode(orderCode);
        String targetChannel = normalizeChannel(channel);
        String effectiveViewer = resolveEffectiveViewerRole(viewerRole, authentication);

        List<OrderMessage> channelMessages = filterByChannel(
                orderMessageRepository.findByOrderCodeOrderByCreatedAtAsc(cleanCode),
                targetChannel
        );

        // Chỉ đánh dấu đã đọc những tin nhắn đến từ phía đối tác theo đúng vai trò đang mở hội thoại
        if (!channelMessages.isEmpty() && effectiveViewer != null) {
            List<OrderMessage> toUpdate = new ArrayList<>();
            for (OrderMessage m : channelMessages) {
                if (!m.isRead() && !effectiveViewer.equalsIgnoreCase(m.getSenderRole())) {
                    m.setRead(true);
                    toUpdate.add(m);
                }
            }
            if (!toUpdate.isEmpty()) {
                orderMessageRepository.saveAll(toUpdate);
            }
        }

        return ApiResponse.ok("Lấy lịch sử tin nhắn thành công", channelMessages);
    }

    /**
     * Đánh dấu tin nhắn trong một kênh chat của đơn hàng là đã đọc đối với vai trò hiện tại.
     */
    @PatchMapping("/{orderCode}/messages/read")
    @Transactional
    public ApiResponse<Void> markAsRead(
            @PathVariable String orderCode,
            @RequestParam(required = false, defaultValue = "SHOP") String channel,
            @RequestParam(required = false) String viewerRole,
            @RequestParam(required = false) String readerRole,
            Authentication authentication
    ) {
        String cleanCode = normalizeOrderCode(orderCode);
        String targetChannel = normalizeChannel(channel);
        String requestedRole = (viewerRole != null && !viewerRole.isBlank()) ? viewerRole : readerRole;
        String effectiveViewer = resolveEffectiveViewerRole(requestedRole, authentication);

        List<OrderMessage> messages = filterByChannel(
                orderMessageRepository.findByOrderCodeOrderByCreatedAtAsc(cleanCode),
                targetChannel
        );
        List<OrderMessage> toUpdate = new ArrayList<>();
        for (OrderMessage m : messages) {
            boolean isFromOtherSide = effectiveViewer == null || !effectiveViewer.equalsIgnoreCase(m.getSenderRole());
            if (!m.isRead() && isFromOtherSide) {
                m.setRead(true);
                toUpdate.add(m);
            }
        }
        if (!toUpdate.isEmpty()) {
            orderMessageRepository.saveAll(toUpdate);
        }
        return ApiResponse.ok("Đã đánh dấu đã đọc thành công", null);
    }

    /**
     * Gửi tin nhắn mới trong kênh chat riêng 2 người ("SHOP": Khách <-> Nông trại, hoặc "ADMIN": Khách <-> Admin CSKH).
     */
    @PostMapping("/{orderCode}/messages")
    @Transactional
    public ApiResponse<OrderMessage> sendMessage(
            @PathVariable String orderCode,
            @Valid @RequestBody SendMessageRequest request,
            Authentication authentication
    ) {
        String cleanCode = normalizeOrderCode(orderCode);
        Order order = orderRepository.findByOrderCode(cleanCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + cleanCode));

        String farmName = resolveFarmName(order);
        String role = request.getSenderRole() != null ? request.getSenderRole().trim().toUpperCase(Locale.ROOT) : "CUSTOMER";
        String targetChannel = "ADMIN".equals(role) ? "ADMIN" : normalizeChannel(request.getChannel());

        String senderName = resolveSenderDisplayName(role, request.getSenderName(), order, authentication, farmName);
        String senderEmail = request.getSenderEmail() != null && !request.getSenderEmail().isBlank()
                ? request.getSenderEmail().trim()
                : (authentication != null ? authentication.getName() : order.getUserEmail());

        if ("ADMIN".equals(targetChannel) && "CUSTOMER".equals(role) && !Boolean.TRUE.equals(order.getAdminSupportRequested())) {
            order.setAdminSupportRequested(true);
            order.setAdminSupportRequestedAt(LocalDateTime.now());
            orderRepository.save(order);
        }

        OrderMessage msg = OrderMessage.builder()
                .orderCode(cleanCode)
                .farmName(farmName)
                .senderRole(role)
                .senderName(senderName)
                .senderEmail(senderEmail)
                .message(request.getMessage().trim())
                .imageUrl(request.getImageUrl())
                .channel(targetChannel)
                .messageType(request.getMessageType() != null ? request.getMessageType() : "CHAT")
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();

        OrderMessage saved = orderMessageRepository.save(msg);
        broadcastOrderMessage(cleanCode, saved);
        if ("ADMIN".equals(targetChannel)) {
            broadcastAdminInboxEvent(cleanCode, "ADMIN_MESSAGE", resolveRealCustomerName(order));
        }
        return ApiResponse.ok("Gửi tin nhắn thành công", saved);
    }

    /**
     * Khách hàng bấm nút "Hỗ trợ tổng đài" để chuyển tiếp đơn hàng sang kênh chat riêng 1-1 với Quản trị viên (Admin).
     */
    @PostMapping("/{orderCode}/support-escalate")
    @Transactional
    public ApiResponse<Map<String, Object>> escalateToAdmin(
            @PathVariable String orderCode,
            @RequestBody(required = false) EscalateSupportRequest request,
            Authentication authentication
    ) {
        String cleanCode = normalizeOrderCode(orderCode);
        Order order = orderRepository.findByOrderCode(cleanCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + cleanCode));

        boolean firstEscalation = !Boolean.TRUE.equals(order.getAdminSupportRequested());
        order.setAdminSupportRequested(true);
        if (order.getAdminSupportRequestedAt() == null) {
            order.setAdminSupportRequestedAt(LocalDateTime.now());
        }
        Order savedOrder = orderRepository.save(order);

        String customerName = resolveSenderDisplayName(
                "CUSTOMER",
                request != null ? request.getCustomerName() : null,
                order,
                authentication,
                resolveFarmName(order)
        );
        String customerEmail = (request != null && request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank())
                ? request.getCustomerEmail().trim()
                : (authentication != null ? authentication.getName() : order.getUserEmail());
        String reason = request != null && request.getReason() != null ? request.getReason().trim() : "";

        OrderMessage savedMsg = null;
        if (firstEscalation || !reason.isBlank()) {
            StringBuilder content = new StringBuilder();
            content.append("[Yêu cầu Hỗ trợ Tổng đài]\n");
            content.append("Khách hàng ").append(customerName)
                    .append(" cần Quản trị viên hỗ trợ trực tiếp cho đơn hàng #").append(cleanCode).append(".");
            if (!reason.isBlank()) {
                content.append("\nNội dung cần hỗ trợ: ").append(reason);
            }

            OrderMessage escalateMsg = OrderMessage.builder()
                    .orderCode(cleanCode)
                    .farmName(resolveFarmName(order))
                    .senderRole("CUSTOMER")
                    .senderName(customerName)
                    .senderEmail(customerEmail)
                    .message(content.toString())
                    .channel("ADMIN")
                    .messageType("SUPPORT_ESCALATED")
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build();

            savedMsg = orderMessageRepository.save(escalateMsg);
            broadcastOrderMessage(cleanCode, savedMsg);
        }

        broadcastAdminInboxEvent(cleanCode, "SUPPORT_ESCALATED", customerName);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("order", savedOrder);
        result.put("message", savedMsg);
        return ApiResponse.ok("Đã kết nối Tổng đài CSKH! Quản trị viên đã tiếp nhận yêu cầu cho đơn #" + cleanCode + ".", result);
    }

    /**
     * Khách hàng gửi Yêu cầu Trả hàng / Hoàn tiền (Khiếu nại).
     */
    @PostMapping("/{orderCode}/dispute")
    @Transactional
    public ApiResponse<Order> createDispute(
            @PathVariable String orderCode,
            @Valid @RequestBody CreateDisputeRequest request,
            Authentication authentication
    ) {
        String cleanCode = normalizeOrderCode(orderCode);
        Order order = orderRepository.findByOrderCode(cleanCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + cleanCode));

        long refundAmt = request.getAmount() != null && request.getAmount() > 0
                ? request.getAmount()
                : (order.getTotal() != null ? order.getTotal() : 0L);

        order.setRefundStatus("PENDING");
        order.setRefundReason(request.getReason().trim());
        order.setRefundSolution(request.getSolution() != null ? request.getSolution() : "REFUND_MONEY");
        order.setRefundAmount(refundAmt);
        order.setRefundPhotoUrl(request.getPhotoUrl());
        order.setRefundNote(request.getNote());
        order.setRefundRequestedAt(LocalDateTime.now());
        order.setAdminSupportRequested(true);
        if (order.getAdminSupportRequestedAt() == null) {
            order.setAdminSupportRequestedAt(LocalDateTime.now());
        }

        Order saved = orderRepository.save(order);

        String solutionText = "Hoàn tiền " + String.format("%,d", refundAmt) + " đ";
        if ("REPLACE_GOODS".equalsIgnoreCase(request.getSolution())) solutionText = "Đổi giao bù combo mới";
        if ("VOUCHER".equalsIgnoreCase(request.getSolution())) solutionText = "Nhận Voucher đền bù 100%";

        String disputeMsgContent = "[Yêu cầu Trả hàng / Hoàn tiền]\n"
                + "• Lý do: " + request.getReason().trim() + "\n"
                + "• Giải pháp mong muốn: " + solutionText + "\n"
                + (request.getNote() != null && !request.getNote().isBlank() ? "• Ghi chú: " + request.getNote().trim() + "\n" : "")
                + "• Đã chuyển Quản trị viên Tổng đài & Chủ nông trại kiểm tra đối soát.";

        String customerName = resolveSenderDisplayName("CUSTOMER", null, order, authentication, resolveFarmName(order));
        String customerEmail = authentication != null ? authentication.getName() : order.getUserEmail();
        String farmName = resolveFarmName(order);
        LocalDateTime now = LocalDateTime.now();

        // Lưu thông báo khiếu nại vào kênh ADMIN (để Admin & Khách trao đổi giải quyết) và kênh SHOP (để Nhà vườn nắm thông tin đơn)
        for (String targetChannel : List.of("ADMIN", "SHOP")) {
            OrderMessage disputeMsg = OrderMessage.builder()
                    .orderCode(cleanCode)
                    .farmName(farmName)
                    .senderRole("CUSTOMER")
                    .senderName(customerName)
                    .senderEmail(customerEmail)
                    .message(disputeMsgContent)
                    .imageUrl(request.getPhotoUrl())
                    .channel(targetChannel)
                    .messageType("DISPUTE_SUBMITTED")
                    .createdAt(now)
                    .isRead(false)
                    .build();
            OrderMessage savedDisputeMsg = orderMessageRepository.save(disputeMsg);
            broadcastOrderMessage(cleanCode, savedDisputeMsg);
        }

        broadcastAdminInboxEvent(cleanCode, "DISPUTE_SUBMITTED", customerName);
        log.info("Khách hàng {} đã gửi khiếu nại hoàn tiền cho đơn #{}: {}", customerName, cleanCode, request.getReason());

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
        String cleanCode = normalizeOrderCode(orderCode);
        Order order = orderRepository.findByOrderCode(cleanCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + cleanCode));

        boolean isFarmerActor = ownershipResolver.isStrictFarmerSession(authentication);
        String actorRole = isFarmerActor ? "FARMER" : "ADMIN";
        String targetChannel = isFarmerActor ? "SHOP" : "ADMIN";
        String farmName = resolveFarmName(order);
        String actorName = resolveSenderDisplayName(actorRole, null, order, authentication, farmName);

        boolean isApprove = "APPROVE".equalsIgnoreCase(request.getAction());
        String adminNote = request.getNote() != null && !request.getNote().isBlank()
                ? request.getNote().trim()
                : (isApprove ? "Đã duyệt hoàn tiền thỏa đáng cho khách." : "Từ chối khiếu nại do chưa đủ căn cứ.");

        if (isApprove) {
            order.setRefundStatus("APPROVED");
            order.setStatus("REFUNDED");
            if (request.getRefundAmount() != null && request.getRefundAmount() > 0) {
                order.setRefundAmount(request.getRefundAmount());
            }
            order.setRefundResolvedAt(LocalDateTime.now());
            order.setRefundNote(adminNote);

            try {
                loyaltyService.revokeOrderPoints(order.getUserEmail(), order.getOrderCode(), order.getTotal() != null ? order.getTotal() : 0L);
            } catch (Exception e) {
                log.warn("Non-fatal revoking points: {}", e.getMessage());
            }

            String approvedText = "[Đã duyệt hoàn tiền]\n"
                    + "Yêu cầu hoàn tiền đơn #" + cleanCode + " đã được " + actorName + " chấp thuận.\n"
                    + "Số tiền: " + String.format("%,d", order.getRefundAmount() != null ? order.getRefundAmount() : order.getTotal()) + " đ.\n"
                    + "Ghi chú: " + adminNote;

            OrderMessage savedMsg = orderMessageRepository.save(OrderMessage.builder()
                    .orderCode(cleanCode)
                    .farmName(farmName)
                    .senderRole(actorRole)
                    .senderName(actorName)
                    .senderEmail(authentication != null ? authentication.getName() : null)
                    .message(approvedText)
                    .channel(targetChannel)
                    .messageType("DISPUTE_APPROVED")
                    .createdAt(LocalDateTime.now())
                    .build());
            broadcastOrderMessage(cleanCode, savedMsg);
        } else {
            order.setRefundStatus("REJECTED");
            order.setRefundResolvedAt(LocalDateTime.now());
            order.setRefundNote(adminNote);

            String rejectedText = "[Từ chối khiếu nại hoàn tiền]\n"
                    + "Yêu cầu khiếu nại đơn #" + cleanCode + " không được chấp thuận.\n"
                    + "Lý do: " + adminNote + "\n"
                    + "Nếu cần giải đáp thêm, quý khách vui lòng nhắn trực tiếp tại đây hoặc gọi Hotline 1900 888 666.";

            OrderMessage savedMsg = orderMessageRepository.save(OrderMessage.builder()
                    .orderCode(cleanCode)
                    .farmName(farmName)
                    .senderRole(actorRole)
                    .senderName(actorName)
                    .senderEmail(authentication != null ? authentication.getName() : null)
                    .message(rejectedText)
                    .channel(targetChannel)
                    .messageType("DISPUTE_REJECTED")
                    .createdAt(LocalDateTime.now())
                    .build());
            broadcastOrderMessage(cleanCode, savedMsg);
        }

        Order saved = orderRepository.save(order);
        broadcastAdminInboxEvent(cleanCode, isApprove ? "DISPUTE_APPROVED" : "DISPUTE_REJECTED", resolveRealCustomerName(saved));
        return ApiResponse.ok(isApprove ? "Đã duyệt hoàn tiền thành công!" : "Đã từ chối khiếu nại đơn hàng.", saved);
    }

    /**
     * Hộp thư đến (Inbox) tách biệt chuẩn nghiệp vụ theo vai trò:
     * - CUSTOMER: các đơn của khách hàng đó (trao đổi riêng với Shop / Admin).
     * - FARMER: chỉ đơn thuộc trang trại của Nông dân đang đăng nhập, và chỉ tính tin nhắn kênh SHOP.
     * - ADMIN: chỉ đơn có yêu cầu Hỗ trợ tổng đài hoặc Khiếu nại hoàn tiền, và chỉ hiển thị kênh ADMIN.
     */
    @GetMapping("/messages/inbox")
    public ApiResponse<List<ConversationSummary>> getInbox(
            @RequestParam(required = false) String farmName,
            @RequestParam(required = false) String farmNames,
            @RequestParam(required = false) String ownerId,
            @RequestParam(required = false) String customerEmail,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String viewerRole,
            @RequestParam(required = false) String channel,
            Authentication authentication
    ) {
        String effectiveViewer = resolveEffectiveViewerRole(viewerRole, authentication);
        if (effectiveViewer == null) {
            if (customerEmail != null && !customerEmail.isBlank()) effectiveViewer = "CUSTOMER";
            else if (ownerId != null && !ownerId.isBlank()) effectiveViewer = "FARMER";
            else if (farmName != null && !farmName.isBlank()) effectiveViewer = "FARMER";
            else if (farmNames != null && !farmNames.isBlank()) effectiveViewer = "FARMER";
            else effectiveViewer = "ADMIN";
        }

        String effectiveOwnerId = null;
        List<Farm> ownedFarms = Collections.emptyList();
        List<Farm> allFarms = farmRepository.findAllByOrderByIdAsc();
        if ("FARMER".equals(effectiveViewer)) {
            if (ownershipResolver.isStrictFarmerSession(authentication)) {
                effectiveOwnerId = ownershipResolver.resolveAuthenticatedOwnerId(authentication).orElse(ownerId);
            } else if (ownerId != null && !ownerId.isBlank()) {
                effectiveOwnerId = ownerId.trim();
            }
            if (effectiveOwnerId != null && !effectiveOwnerId.isBlank()) {
                ownedFarms = farmRepository.findByOwnerIdIgnoreCaseOrderByIdAsc(effectiveOwnerId);
            }
        }

        Set<String> requestedFarmNames = new HashSet<>();
        if (farmNames != null && !farmNames.isBlank()) {
            for (String fn : farmNames.split(",")) {
                if (!fn.isBlank()) requestedFarmNames.add(fn.trim().toLowerCase(Locale.ROOT));
            }
        }

        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        List<Order> matchedOrders = new ArrayList<>();

        for (Order order : orders) {
            if ("CUSTOMER".equals(effectiveViewer)) {
                if (customerEmail != null && !customerEmail.isBlank()) {
                    String orderEmail = order.getUserEmail();
                    if (orderEmail == null || !orderEmail.trim().equalsIgnoreCase(customerEmail.trim())) {
                        continue;
                    }
                }
            }

            String resolvedFarm = resolveFarmName(order);
            if ("FARMER".equals(effectiveViewer)) {
                if (effectiveOwnerId != null && !effectiveOwnerId.isBlank()) {
                    if (!doesOrderBelongToOwner(order, resolvedFarm, effectiveOwnerId, ownedFarms, allFarms)) {
                        continue;
                    }
                } else if (!requestedFarmNames.isEmpty()) {
                    String lowerResolved = resolvedFarm.toLowerCase(Locale.ROOT);
                    boolean matchedAny = requestedFarmNames.stream().anyMatch(req -> lowerResolved.contains(req) || req.contains(lowerResolved));
                    if (!matchedAny) {
                        continue;
                    }
                }
            }

            if (farmName != null && !farmName.isBlank() && !resolvedFarm.toLowerCase(Locale.ROOT).contains(farmName.trim().toLowerCase(Locale.ROOT))) {
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
            String resolvedFarm = resolveFarmName(order);
            List<OrderMessage> allOrderMsgs = messagesByOrder.getOrDefault(
                    order.getOrderCode() != null ? order.getOrderCode().toUpperCase() : "",
                    Collections.emptyList()
            );
            boolean hasPending = "PENDING".equalsIgnoreCase(order.getRefundStatus());
            boolean escalated = Boolean.TRUE.equals(order.getAdminSupportRequested());

            List<OrderMessage> visibleMsgs;
            if ("ADMIN".equals(effectiveViewer)) {
                visibleMsgs = filterByChannel(allOrderMsgs, "ADMIN");
                // Admin chỉ xem những đơn có bấm Hỗ trợ tổng đài, có khiếu nại, hoặc đã có tin nhắn trên kênh ADMIN
                if (!escalated && order.getRefundStatus() == null && visibleMsgs.isEmpty()) {
                    continue;
                }
            } else if ("FARMER".equals(effectiveViewer)) {
                // Farmer chỉ thấy tin nhắn kênh SHOP của trang trại mình, không lộ hội thoại riêng Khách <-> Admin
                visibleMsgs = filterByChannel(allOrderMsgs, "SHOP");
                if (visibleMsgs.isEmpty() && order.getRefundStatus() == null) {
                    continue;
                }
            } else {
                // CUSTOMER
                if (channel != null && !channel.isBlank()) {
                    visibleMsgs = filterByChannel(allOrderMsgs, normalizeChannel(channel));
                } else {
                    visibleMsgs = allOrderMsgs;
                }
                if (visibleMsgs.isEmpty() && !hasPending && order.getRefundStatus() == null && !escalated) {
                    continue;
                }
            }

            if ("SUPPORT".equalsIgnoreCase(status) && !escalated) {
                continue;
            }

            String lastMsgText = escalated
                    ? "Khách hàng yêu cầu Hỗ trợ Tổng đài CSKH"
                    : "Chưa có tin nhắn mới";
            LocalDateTime lastMsgTime = order.getAdminSupportRequestedAt() != null
                    ? order.getAdminSupportRequestedAt()
                    : order.getCreatedAt();

            if (!visibleMsgs.isEmpty()) {
                OrderMessage last = visibleMsgs.get(visibleMsgs.size() - 1);
                lastMsgText = last.getMessage();
                lastMsgTime = last.getCreatedAt();
            }

            String productSummary = order.getItems() != null && !order.getItems().isEmpty()
                    ? order.getItems().stream().map(OrderItem::getName).collect(Collectors.joining(", "))
                    : "Nông sản VietGAP";

            long unread;
            if ("CUSTOMER".equals(effectiveViewer)) {
                unread = visibleMsgs.stream()
                        .filter(m -> !m.isRead() && !"CUSTOMER".equalsIgnoreCase(m.getSenderRole()))
                        .count();
            } else if ("FARMER".equals(effectiveViewer)) {
                unread = visibleMsgs.stream()
                        .filter(m -> !m.isRead() && !"FARMER".equalsIgnoreCase(m.getSenderRole()))
                        .count();
            } else {
                // ADMIN: tin nhắn khách gửi chưa đọc hoặc ticket mới yêu cầu hỗ trợ / khiếu nại
                unread = visibleMsgs.stream()
                        .filter(m -> !m.isRead() && !"ADMIN".equalsIgnoreCase(m.getSenderRole()))
                        .count();
            }

            summaries.add(ConversationSummary.builder()
                    .orderCode(order.getOrderCode())
                    .customerName(resolveRealCustomerName(order))
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
                    .messageCount(visibleMsgs.size())
                    .hasPendingDispute(hasPending)
                    .adminSupportRequested(escalated)
                    .adminSupportRequestedAt(order.getAdminSupportRequestedAt())
                    .unreadCount((int) unread)
                    .build());
        }

        // Ưu tiên đơn đang có khiếu nại PENDING hoặc Hỗ trợ tổng đài mới lên đầu, sau đó sắp xếp theo thời gian mới nhất
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

    private void broadcastOrderMessage(String cleanCode, OrderMessage msg) {
        try {
            messagingTemplate.convertAndSend("/topic/orders/" + cleanCode + "/messages", msg);
        } catch (Exception e) {
            log.warn("WebSocket broadcast failed for order {}: {}", cleanCode, e.getMessage());
        }
    }

    private void broadcastAdminInboxEvent(String cleanCode, String eventType, String customerName) {
        try {
            Map<String, Object> event = new LinkedHashMap<>();
            event.put("orderCode", cleanCode);
            event.put("type", eventType);
            event.put("customerName", customerName);
            event.put("timestamp", LocalDateTime.now().toString());
            messagingTemplate.convertAndSend("/topic/admin/inbox", event);
        } catch (Exception e) {
            log.warn("Admin inbox WebSocket broadcast failed for order {}: {}", cleanCode, e.getMessage());
        }
    }

    private String resolveRealCustomerName(Order order) {
        if (order.getUserEmail() != null && !order.getUserEmail().isBlank()) {
            Optional<User> userOpt = userRepository.findByEmailIgnoreCase(order.getUserEmail().trim());
            if (userOpt.isPresent() && userOpt.get().getFullName() != null && !userOpt.get().getFullName().isBlank()) {
                return userOpt.get().getFullName().trim();
            }
        }
        if (order.getReceiverName() != null && !order.getReceiverName().isBlank()) {
            return order.getReceiverName().trim();
        }
        return "Khách hàng";
    }

    private String resolveSenderDisplayName(
            String role,
            String requestedName,
            Order order,
            Authentication authentication,
            String farmName
    ) {
        if (requestedName != null && !requestedName.isBlank()) {
            return requestedName.trim();
        }
        if (authentication != null && authentication.isAuthenticated()
                && authentication.getName() != null && !"anonymousUser".equalsIgnoreCase(authentication.getName())) {
            Optional<User> authUser = userRepository.findByEmailIgnoreCase(authentication.getName().trim());
            if (authUser.isPresent() && authUser.get().getFullName() != null && !authUser.get().getFullName().isBlank()) {
                return authUser.get().getFullName().trim();
            }
        }
        if ("FARMER".equalsIgnoreCase(role)) {
            return farmName;
        }
        if ("ADMIN".equalsIgnoreCase(role)) {
            return "Quản trị viên AgriTrace";
        }
        return resolveRealCustomerName(order);
    }

    private String resolveEffectiveViewerRole(String requestedRole, Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            boolean hasAdmin = hasAuthority(authentication, "ROLE_ADMIN");
            boolean isStrictFarmer = ownershipResolver.isStrictFarmerSession(authentication);
            if (isStrictFarmer && ("FARMER".equalsIgnoreCase(requestedRole) || requestedRole == null || requestedRole.isBlank())) {
                return "FARMER";
            }
            if (hasAdmin && "ADMIN".equalsIgnoreCase(requestedRole)) {
                return "ADMIN";
            }
        }
        if (requestedRole == null || requestedRole.isBlank()) {
            return null;
        }
        String norm = requestedRole.trim().toUpperCase(Locale.ROOT);
        if ("CUSTOMER".equals(norm) || "FARMER".equals(norm) || "ADMIN".equals(norm)) {
            return norm;
        }
        return null;
    }

    private boolean hasAuthority(Authentication auth, String authority) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority::equals);
    }

    private boolean doesOrderBelongToOwner(
            Order order,
            String resolvedFarm,
            String effectiveOwnerId,
            List<Farm> ownedFarms,
            List<Farm> allFarms
    ) {
        String lowerResolved = resolvedFarm.toLowerCase(Locale.ROOT);
        String lotCode = order.getLotCode() != null ? order.getLotCode().toLowerCase(Locale.ROOT) : "";

        // 1. Khớp trực tiếp theo trang trại của chủ vườn trong DB
        for (Farm owned : ownedFarms) {
            String ownedName = owned.getName() != null ? owned.getName().trim().toLowerCase(Locale.ROOT) : "";
            String ownedCode = owned.getCode() != null ? owned.getCode().trim().toLowerCase(Locale.ROOT) : "";
            if (!ownedName.isBlank() && (lowerResolved.contains(ownedName) || ownedName.contains(lowerResolved))) {
                return true;
            }
            if (!ownedCode.isBlank() && !lotCode.isBlank() && lotCode.contains(ownedCode)) {
                return true;
            }
        }

        // 2. Nếu tên/mã lô khớp rõ ràng với trang trại của chủ khác trong DB thì loại trừ
        for (Farm f : allFarms) {
            if (f.getOwnerId() != null && f.getOwnerId().equalsIgnoreCase(effectiveOwnerId)) {
                continue;
            }
            String otherName = f.getName() != null ? f.getName().trim().toLowerCase(Locale.ROOT) : "";
            String otherCode = f.getCode() != null ? f.getCode().trim().toLowerCase(Locale.ROOT) : "";
            if ((!otherName.isBlank() && (lowerResolved.contains(otherName) || otherName.contains(lowerResolved)))
                    || (!otherCode.isBlank() && !lotCode.isBlank() && lotCode.contains(otherCode))) {
                return false;
            }
        }

        // 3. Fallback phân vùng theo tên trang trại / mã lô của đơn hàng
        String inferred = ownershipResolver.inferOwnerIdFromFarm(resolvedFarm + " " + lotCode);
        return effectiveOwnerId.equalsIgnoreCase(inferred);
    }

    private static List<OrderMessage> filterByChannel(List<OrderMessage> messages, String targetChannel) {
        if ("ADMIN".equalsIgnoreCase(targetChannel)) {
            return messages.stream()
                    .filter(m -> "ADMIN".equalsIgnoreCase(m.getChannel())
                            || (m.getChannel() == null && "ADMIN".equalsIgnoreCase(m.getSenderRole())))
                    .collect(Collectors.toList());
        }
        return messages.stream()
                .filter(m -> !"ADMIN".equalsIgnoreCase(m.getChannel())
                        && !(m.getChannel() == null && "ADMIN".equalsIgnoreCase(m.getSenderRole())))
                .collect(Collectors.toList());
    }

    private static String normalizeOrderCode(String orderCode) {
        return orderCode == null ? "" : orderCode.replace("#", "").trim().toUpperCase(Locale.ROOT);
    }

    private static String normalizeChannel(String channel) {
        if (channel != null && "ADMIN".equalsIgnoreCase(channel.trim())) {
            return "ADMIN";
        }
        return "SHOP";
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
