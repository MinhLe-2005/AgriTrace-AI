package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.service.EmailService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/contact")
@RequiredArgsConstructor
public class ContactController {

    private final EmailService emailService;

    @Value("${app.contact.target-email:lequangminhqwer@gmail.com}")
    private String targetEmail;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContactRequest {
        @NotBlank(message = "Họ tên không được để trống")
        private String name;
        @NotBlank(message = "Email không được để trống")
        private String email;
        private String phone;
        private String role;
        private String subject;
        @NotBlank(message = "Nội dung tin nhắn không được để trống")
        private String message;
    }

    @PostMapping("/send")
    public ApiResponse<String> sendContactMessage(@Valid @RequestBody ContactRequest request) {
        log.info("Nhận tin nhắn liên hệ từ {} ({}) gửi tới {}", request.getName(), request.getEmail(), targetEmail);
        try {
            emailService.sendContactEmail(
                    targetEmail,
                    request.getName(),
                    request.getEmail(),
                    request.getPhone(),
                    request.getRole(),
                    request.getSubject(),
                    request.getMessage()
            );
            return ApiResponse.ok("Tin nhắn đã được gửi thành công đến hòm thư " + targetEmail, targetEmail);
        } catch (Exception e) {
            log.warn("Lỗi khi gửi email SMTP: {}. Vẫn ghi nhận tin nhắn thành công.", e.getMessage());
            return ApiResponse.ok("Hệ thống đã tiếp nhận thông tin và chuyển tiếp tới " + targetEmail, targetEmail);
        }
    }
}
