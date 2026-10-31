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
        String decision = status == VerificationStatus.APPROVED ? "đã được phê duyệt" : status == VerificationStatus.REJECTED ? "bị từ chối" : "cần bổ sung thông tin";
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
            helper.setFrom(fromEmail, "AgriTrace AI");
            helper.setTo(toEmail);
            helper.setSubject("[AgriTrace] Kết quả xác minh hồ sơ");
            helper.setText("<html><body><h2>Kết quả xác minh hồ sơ</h2><p>Xin chào " + recipientName + ", hồ sơ " + type + " của bạn " + decision + ".</p><p>Lý do: " + reason + "</p><p>Trân trọng,<br>AgriTrace AI</p></body></html>", true);
            mailSender.send(message);
        } catch (MessagingException | java.io.UnsupportedEncodingException | RuntimeException exception) {
            log.error("Failed to send verification email to {}: {}", toEmail, exception.getMessage(), exception);
        }
    }
}
