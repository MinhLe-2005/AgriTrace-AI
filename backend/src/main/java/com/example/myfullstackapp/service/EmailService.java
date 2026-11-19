package com.example.myfullstackapp.service;

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
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:lequangminhqwer@gmail.com}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otpCode) {
        sendHtmlEmail(
                toEmail,
                "[AgriTrace] Mã xác thực đăng ký tài khoản: " + otpCode,
                "Đăng Ký Tài Khoản Mới",
                "Bạn đang thực hiện đăng ký tài khoản trên hệ thống <strong>AgriTrace</strong>.<br>Vui lòng sử dụng mã OTP dưới đây để hoàn tất việc đăng ký:",
                otpCode
        );
    }

    public void sendPasswordResetEmail(String toEmail, String otpCode) {
        sendHtmlEmail(
                toEmail,
                "[AgriTrace] Mã xác thực khôi phục mật khẩu: " + otpCode,
                "Khôi Phục Mật Khẩu",
                "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>AgriTrace</strong> của bạn.<br>Vui lòng nhập mã OTP dưới đây để tiến hành đổi mật khẩu mới:",
                otpCode
        );
    }

    public void sendCertificateExpiryWarningEmail(
            String toEmail,
            String certName,
            String certNumber,
            String farmName,
            int daysLeft,
            String expiryDate
    ) {
        String subject = String.format("[AgriTrace] CẢNH BÁO: Chứng nhận %s (%s) sắp hết hạn sau %d ngày",
                certName != null ? certName : "Chất lượng",
                certNumber != null ? certNumber : "N/A",
                daysLeft);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(fromEmail, "AgriTrace AI - Quản Lý Chứng Nhận");
            helper.setTo(toEmail);
            helper.setSubject(subject);

            String htmlTemplate = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f6fbf7; margin: 0; padding: 24px; color: #2d3748; }
                        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #fed7aa; }
                        .header { background: linear-gradient(135deg, #9a3412 0%, #ea580c 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
                        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
                        .header p { margin: 8px 0 0; font-size: 13px; color: #ffedd5; }
                        .content { padding: 32px 28px; }
                        .badge-alert { display: inline-block; background: #fee2e2; color: #b91c1c; font-weight: 800; font-size: 12px; padding: 6px 14px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 16px; }
                        .greeting { font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 12px; }
                        .desc { font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 24px; }
                        .card-info { background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 12px; padding: 18px; margin-bottom: 24px; }
                        .card-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
                        .card-row:last-child { margin-bottom: 0; }
                        .card-label { color: #6b7280; font-weight: 600; }
                        .card-value { color: #111827; font-weight: 700; text-align: right; }
                        .days-left { color: #dc2626; font-size: 16px; font-weight: 800; }
                        .warning { font-size: 12px; color: #6b7280; line-height: 1.5; border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 24px; }
                        .footer { background: #f9fafb; padding: 18px 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🌿 AgriTrace AI</h1>
                            <p>Hệ Thống Quản Lý Chất Lượng & Chứng Nhận Nông Sản</p>
                        </div>
                        <div class="content">
                            <div style="text-align: center;">
                                <span class="badge-alert">⚠️ Cảnh Báo Khẩn Cấp</span>
                            </div>
                            <div class="greeting">Kính gửi Chủ Nông Trại / Quản lý nông nghiệp,</div>
                            <div class="desc">
                                Hệ thống AgriTrace phát hiện chứng nhận tiêu chuẩn chất lượng của bạn sắp hết hạn trong <strong>{{DAYS_LEFT}} ngày tới</strong>. 
                                Vui lòng kiểm tra và tiến hành gia hạn ngay để không ảnh hưởng đến việc phân phối nông sản và xuất khẩu:
                            </div>
                            <div class="card-info">
                                <div class="card-row">
                                    <span class="card-label">Tên chứng nhận:</span>
                                    <span class="card-value">{{CERT_NAME}}</span>
                                </div>
                                <div class="card-row">
                                    <span class="card-label">Số hiệu chứng chỉ:</span>
                                    <span class="card-value" style="font-family: monospace;">{{CERT_NUMBER}}</span>
                                </div>
                                <div class="card-row">
                                    <span class="card-label">Nông trại:</span>
                                    <span class="card-value">{{FARM_NAME}}</span>
                                </div>
                                <div class="card-row">
                                    <span class="card-label">Ngày hết hạn:</span>
                                    <span class="card-value">{{EXPIRY_DATE}}</span>
                                </div>
                                <div class="card-row" style="border-top: 1px dashed #d1d5db; padding-top: 8px; margin-top: 8px;">
                                    <span class="card-label" style="color: #dc2626;">Thời gian còn lại:</span>
                                    <span class="days-left">{{DAYS_LEFT}} ngày</span>
                                </div>
                            </div>
                            <div class="warning">
                                📌 <strong>Khuyến nghị hành động:</strong><br>
                                1. Liên hệ với tổ chức đánh giá chứng nhận để hoàn thiện hồ sơ tái cấp.<br>
                                2. Cập nhật hồ sơ gia hạn mới trực tiếp tại tab <strong>Chứng nhận & Cảnh báo</strong> trên Cổng nông dân AgriTrace.<br>
                                3. Nếu nông trại đã có chứng nhận mới, vui lòng bấm nút <em>"Gia hạn +1 năm"</em> hoặc tải ảnh chứng chỉ mới lên hệ thống.
                            </div>
                        </div>
                        <div class="footer">
                            © 2026 AgriTrace Ecosystem. Nông sản sạch từ trang trại đến bàn ăn.
                        </div>
                    </div>
                </body>
                </html>
                """;

            String htmlContent = htmlTemplate
                    .replace("{{CERT_NAME}}", certName != null ? certName : "Chứng nhận Nông nghiệp")
                    .replace("{{CERT_NUMBER}}", certNumber != null ? certNumber : "N/A")
                    .replace("{{FARM_NAME}}", farmName != null ? farmName : "Nông trại AgriTrace")
                    .replace("{{EXPIRY_DATE}}", expiryDate != null ? expiryDate : "Sắp tới")
                    .replace("{{DAYS_LEFT}}", String.valueOf(daysLeft));

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Successfully sent cert expiry warning email for [{}] to: {}", certNumber, toEmail);
        } catch (Exception e) {
            log.error("Failed to send cert expiry email to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Không thể gửi email cảnh báo chứng nhận: " + e.getMessage(), e);
        }
    }

    private void sendHtmlEmail(String toEmail, String subject, String title, String description, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(fromEmail, "AgriTrace AI - Nông Sản Sạch");
            helper.setTo(toEmail);
            helper.setSubject(subject);

            String htmlTemplate = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f6fbf7; margin: 0; padding: 24px; color: #2d3748; }
                        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e6f4ea; }
                        .header { background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
                        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
                        .header p { margin: 8px 0 0; font-size: 13px; color: #a7f3d0; }
                        .content { padding: 32px 28px; text-align: center; }
                        .greeting { font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 12px; }
                        .desc { font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 28px; }
                        .otp-box { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 14px; padding: 20px; display: inline-block; margin: 0 auto 24px; }
                        .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #047857; font-family: 'Courier New', Courier, monospace; }
                        .timer { font-size: 13px; color: #6b7280; margin-top: 6px; }
                        .warning { font-size: 12px; color: #9ca3af; line-height: 1.5; border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 24px; }
                        .footer { background: #f9fafb; padding: 18px 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🌿 AgriTrace AI</h1>
                            <p>Hệ Thống Nông Sản Sạch & Truy Xuất Nguồn Gốc</p>
                        </div>
                        <div class="content">
                            <div class="greeting">{{TITLE}}</div>
                            <div class="desc">{{DESCRIPTION}}</div>
                            <div class="otp-box">
                                <div class="otp-code">{{OTP_CODE}}</div>
                                <div class="timer">⏱️ Mã có hiệu lực trong vòng <strong>5 phút</strong></div>
                            </div>
                            <div class="warning">
                                ⚠️ <strong>Lưu ý bảo mật:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nếu bạn không gửi yêu cầu này, vui lòng đổi mật khẩu ngay để bảo vệ tài khoản.
                            </div>
                        </div>
                        <div class="footer">
                            © 2026 AgriTrace Ecosystem. Nông sản sạch từ trang trại đến bàn ăn.
                        </div>
                    </div>
                </body>
                </html>
                """;

            String htmlContent = htmlTemplate
                    .replace("{{TITLE}}", title)
                    .replace("{{DESCRIPTION}}", description)
                    .replace("{{OTP_CODE}}", otpCode);

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Successfully sent email [{}] to: {}", title, toEmail);
        } catch (MessagingException | RuntimeException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Không thể gửi email OTP: " + e.getMessage(), e);
        }
    }
}
