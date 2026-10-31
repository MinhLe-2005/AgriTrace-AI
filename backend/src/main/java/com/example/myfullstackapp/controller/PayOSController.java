package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.payment.CreatePaymentLinkRequest;
import com.example.myfullstackapp.dto.payment.PaymentLinkResponse;
import com.example.myfullstackapp.dto.payment.PayOSWebhookRequest;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.service.PayOSService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payment/payos")
@RequiredArgsConstructor
public class PayOSController {

    private final PayOSService payOSService;

    @PostMapping("/create-payment-link")
    public ApiResponse<PaymentLinkResponse> createPaymentLink(@Valid @RequestBody CreatePaymentLinkRequest request) {
        PaymentLinkResponse response = payOSService.createPaymentLink(
                request.getOrderCode(),
                request.getReturnUrl(),
                request.getCancelUrl()
        );
        return ApiResponse.ok("Khởi tạo liên kết thanh toán payOS thành công", response);
    }

    @PostMapping("/webhook")
    public ApiResponse<Map<String, Object>> handleWebhook(@RequestBody PayOSWebhookRequest request) {
        boolean processed = payOSService.processWebhook(request);
        return ApiResponse.ok("Xử lý webhook payOS thành công", Map.of("processed", processed));
    }

    @PostMapping("/simulate-success/{orderCode}")
    public ApiResponse<Order> simulatePaymentSuccess(@PathVariable String orderCode) {
        Order updated = payOSService.simulatePaymentSuccess(orderCode);
        return ApiResponse.ok("Giả lập thanh toán payOS thành công cho đơn hàng #" + orderCode, updated);
    }

    @GetMapping("/check-status/{orderCode}")
    public ApiResponse<Map<String, String>> checkStatus(@PathVariable String orderCode) {
        String status = payOSService.checkStatus(orderCode);
        return ApiResponse.ok("Lấy trạng thái đơn hàng thành công", Map.of("orderCode", orderCode, "status", status));
    }
}
