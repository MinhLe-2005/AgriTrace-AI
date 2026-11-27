package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.distributor.CreateDistributorChatMessageRequest;
import com.example.myfullstackapp.dto.distributor.DistributorChatMessageResponse;
import com.example.myfullstackapp.service.DistributorShipmentChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/** REST history/fallback plus the STOMP send endpoint for shipment chat. */
@RestController
@RequestMapping("/api/v1/distributor/shipments/{shipmentCode}/messages")
@PreAuthorize("hasAnyRole('DISTRIBUTOR', 'ADMIN')")
@RequiredArgsConstructor
public class DistributorShipmentChatController {
    private final DistributorShipmentChatService chatService;

    @GetMapping
    public ApiResponse<List<DistributorChatMessageResponse>> history(@PathVariable String shipmentCode, Authentication authentication) {
        return ApiResponse.ok("Shipment messages retrieved", chatService.history(shipmentCode, actor(authentication), isAdmin(authentication)));
    }

    @PostMapping
    public ApiResponse<DistributorChatMessageResponse> sendRest(@PathVariable String shipmentCode,
                                                                 @Valid @RequestBody CreateDistributorChatMessageRequest request,
                                                                 Authentication authentication) {
        return ApiResponse.ok("Shipment message sent", chatService.send(shipmentCode, request, actor(authentication), isAdmin(authentication)));
    }

    @MessageMapping("/distributor/shipments/{shipmentCode}/chat")
    public void sendWebSocket(@DestinationVariable String shipmentCode, @Valid @Payload CreateDistributorChatMessageRequest request,
                              Principal principal) {
        if (!(principal instanceof Authentication authentication)) {
            throw new AccessDeniedException("WebSocket chưa được xác thực");
        }
        if (!isAdmin(authentication) && !isDistributor(authentication)) {
            throw new AccessDeniedException("Chỉ Admin hoặc Distributor có thể trao đổi chuyến hàng");
        }
        chatService.send(shipmentCode, request, actor(authentication), isAdmin(authentication));
    }

    private String actor(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để trao đổi chuyến hàng");
        }
        return authentication.getName();
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    private boolean isDistributor(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_DISTRIBUTOR".equals(authority.getAuthority()));
    }
}
