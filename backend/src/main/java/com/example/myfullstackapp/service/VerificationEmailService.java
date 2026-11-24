package com.example.myfullstackapp.service;

import com.example.myfullstackapp.entity.VerificationStatus;
import com.example.myfullstackapp.entity.VerificationType;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationEmailService {
    private final JavaMailSender mailSender;
    @Value("${spring.mail.username:}") private String fromEmail;

    public void sendDecision(String toEmail, String recipientName, VerificationType type, VerificationStatus status, String reason) {
        String decision = status == VerificationStatus.APPROVED
                ? "đã được phê duyệt và kích hoạt quyền truy cập vị trí công việc"
                : status == VerificationStatus.REJECTED
                ? "bị từ chối"
                : "cần bổ sung thêm hồ sơ minh chứng";
        String roleLabel = switch (type) {
            case FARMER -> "Nông dân / Chủ trang trại (FARMER)";
            case WAREHOUSE -> "Nhân viên Kho lạnh (WAREHOUSE)";
            case DISTRIBUTOR -> "Nhà phân phối / Đội xe lạnh (DISTRIBUTOR)";
        };
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
            helper.setFrom(fromEmail, "AgriTrace AI");
            helper.setTo(toEmail);
            helper.setSubject("[AgriTrace] Kết quả thẩm định hồ sơ vị trí " + roleLabel);
            helper.setText("<html><body style='font-family:sans-serif;line-height:1.6;color:#1f2937;'>"
                    + "<h2 style='color:#047857;'>Kết quả xét duyệt hồ sơ vị trí AgriTrace</h2>"
                    + "<p>Xin chào <strong>" + recipientName + "</strong>,</p>"
                    + "<p>Hồ sơ đăng ký vị trí <strong>" + roleLabel + "</strong> của bạn <strong>" + decision + "</strong>.</p>"
                    + "<p><strong>Nhận xét từ Ban Quản Trị:</strong> " + reason + "</p>"
                    + (status == VerificationStatus.APPROVED
                    ? "<p style='color:#047857;font-weight:bold;'>Bạn đã có thể đăng nhập vào AgriTrace để truy cập trực tiếp Bảng điều khiển nghiệp vụ của vị trí này.</p>"
                    : "<p>Bạn có thể đăng nhập vào hệ thống để xem chi tiết và gửi lại hồ sơ bổ sung.</p>")
                    + "<p>Trân trọng,<br><strong>Ban Quản Trị AgriTrace AI</strong></p></body></html>", true);
            mailSender.send(message);
        } catch (MessagingException | java.io.UnsupportedEncodingException | RuntimeException exception) {
            log.error("Failed to send verification email to {}: {}", toEmail, exception.getMessage(), exception);
        }
    }
}
