package com.example.myfullstackapp.service;

import com.example.myfullstackapp.entity.FarmerCertificate;
import com.example.myfullstackapp.entity.RoleName;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.repository.FarmerCertificateRepository;
import com.example.myfullstackapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class FarmerCertificateScheduler {

    private final FarmerCertificateRepository repository;
    private final EmailService emailService;
    private final UserRepository userRepository;

    @Value("${spring.mail.username:khonggidau0@gmail.com}")
    private String smtpFromEmail;

    /**
     * Khởi tạo dữ liệu chứng nhận mẫu nếu bảng còn trống,
     * tự động gán với Email tài khoản Nông dân đã đăng ký trong hệ thống.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void bootstrapDefaultCertificates() {
        if (repository.count() > 0) {
            return;
        }

        // Lấy email của tài khoản Nông dân đầu tiên đã đăng ký
        String primaryFarmerEmail = userRepository.findAll().stream()
                .filter(u -> u.getRoles() != null && u.getRoles().stream().anyMatch(r -> r.getName() == RoleName.FARMER))
                .map(User::getEmail)
                .filter(e -> e != null && e.contains("@"))
                .findFirst()
                .orElse("farmer@gmail.com");

        LocalDate today = LocalDate.now();
        DateTimeFormatter vnFormat = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        // 1. Chứng nhận còn hạn 6 tháng
        FarmerCertificate cert1 = FarmerCertificate.builder()
                .certNumber("VG-2025-089")
                .name("Chứng nhận VietGAP Trồng trọt")
                .farmCode("NT-DL-01")
                .farmName("Nông Trại Xanh Đà Lạt (Mã: NT-DL-01)")
                .issuedBy("Trung tâm Khảo kiểm nghiệm Phân bón & Cây trồng Quốc gia")
                .issueDate(today.minusMonths(6).format(vnFormat))
                .expiryDate(today.plusMonths(6).format(vnFormat))
                .status("VALID")
                .ownerId("farmer_hung")
                .alertEmail(primaryFarmerEmail)
                .build();

        // 2. Chứng nhận sắp hết hạn (còn đúng 4 ngày - để kích hoạt cảnh báo tự động)
        FarmerCertificate cert2 = FarmerCertificate.builder()
                .certNumber("GG-VN-9942")
                .name("Chứng nhận GlobalG.A.P Quả tươi")
                .farmCode("NT-DL-01")
                .farmName("Nông Trại Xanh Đà Lạt (Mã: NT-DL-01)")
                .issuedBy("Tổ chức Chứng nhận Quốc tế Control Union")
                .issueDate(today.minusYears(1).format(vnFormat))
                .expiryDate(today.plusDays(4).format(vnFormat))
                .status("EXPIRING_SOON")
                .approvalStatus("PENDING")
                .pendingNewCertNumber("GG-VN-9942-R2")
                .pendingRequestedExpiryDate(today.plusYears(1).format(vnFormat))
                .pendingProofImage("https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600")
                .pendingNote("Nông trại đã hoàn tất đánh giá kiểm định lại, kính gửi Admin thẩm định gia hạn thêm 1 năm.")
                .submittedAt(today.minusDays(1).format(vnFormat))
                .ownerId("farmer_hung")
                .alertEmail(primaryFarmerEmail)
                .build();

        // 3. Chứng nhận Nông Nghiệp Hữu Cơ của Nông dân Nguyễn Thiệu (Mộc Châu)
        FarmerCertificate cert3 = FarmerCertificate.builder()
                .certNumber("MC-ORG-2026-001")
                .name("Chứng nhận Nông Nghiệp Hữu Cơ Mộc Châu (TCVN 11041)")
                .farmCode("NT-MC-03")
                .farmName("Vườn Sinh Thái Mộc Châu (Mã: NT-MC-03)")
                .issuedBy("Viện Khoa học Nông nghiệp Việt Nam")
                .issueDate(today.minusMonths(3).format(vnFormat))
                .expiryDate(today.plusMonths(9).format(vnFormat))
                .status("VALID")
                .ownerId("farmer_thieu")
                .alertEmail("nguyenthieuu052@gmail.com")
                .build();

        repository.saveAll(List.of(cert1, cert2, cert3));
        log.info("Bootstrapped initial farmer quality certificates linked to registered farmers");
    }

    /**
     * Tự động quét kiểm tra chứng nhận ngầm trên Server:
     * Chạy định kỳ lúc 08:00 sáng mỗi ngày qua cron,
     * và chạy lần đầu 15 giây sau khi ứng dụng khởi động.
     * Gửi email cảnh báo trực tiếp về hòm thư nông dân dùng khi đăng ký tài khoản!
     */
    @Scheduled(cron = "${farmer.certificates.scan-cron:0 0 8 * * ?}")
    @Scheduled(initialDelay = 15000, fixedDelay = 86400000)
    @Transactional
    public Map<String, Object> scheduledDailyScan() {
        return scanAndAlertExpiringCertificates(false);
    }

    public Map<String, Object> scanAndAlertExpiringCertificates() {
        return scanAndAlertExpiringCertificates(false);
    }

    @Transactional
    public Map<String, Object> scanAndAlertExpiringCertificates(boolean force) {
        log.info("Bắt đầu tiến trình tự động quét chứng nhận sắp hết hạn (Cron Job 24/7, force={})...", force);
        List<FarmerCertificate> certs = repository.findAll();
        LocalDate today = LocalDate.now();

        // Lấy danh sách tài khoản Nông dân (FARMER) đang hoạt động trong hệ thống
        List<User> registeredFarmers = userRepository.findAll().stream()
                .filter(u -> u.isActive() && u.getRoles() != null && u.getRoles().stream().anyMatch(r -> r.getName() == RoleName.FARMER))
                .toList();

        String defaultFarmerEmail = registeredFarmers.stream()
                .map(User::getEmail)
                .filter(e -> e != null && e.contains("@"))
                .findFirst()
                .orElse("farmer@gmail.com");

        int scannedCount = certs.size();
        int alertSentCount = 0;
        List<Map<String, Object>> alertedCertificates = new ArrayList<>();

        for (FarmerCertificate cert : certs) {
            Integer daysLeft = cert.calculateDaysLeft();
            if (daysLeft == null) {
                continue;
            }

            // Cập nhật trạng thái chứng nhận
            if (daysLeft < 0) {
                cert.setStatus("EXPIRED");
            } else if (daysLeft <= 5) {
                cert.setStatus("EXPIRING_SOON");
            } else {
                cert.setStatus("VALID");
            }

            // Điều kiện gửi mail tự động: Còn <= 5 ngày
            boolean isCritical = daysLeft <= 5 && daysLeft >= 0;
            boolean alreadySentToday = cert.getLastAlertSentDate() != null && cert.getLastAlertSentDate().isEqual(today);
            boolean shouldSend = force ? isCritical : (isCritical && !alreadySentToday);

            if (shouldSend) {
                // Thu thập danh sách email của Nông dân đăng ký tài khoản
                Set<String> recipientEmails = new LinkedHashSet<>();

                // 1. Email của tất cả tài khoản nông dân đã đăng ký tài khoản trong Database
                for (User farmer : registeredFarmers) {
                    if (farmer.getEmail() != null && farmer.getEmail().contains("@")) {
                        recipientEmails.add(farmer.getEmail().trim().toLowerCase(Locale.ROOT));
                    }
                }

                // 2. Email gán trong chứng chỉ (nếu nông dân đã nhập hoặc lưu)
                if (cert.getAlertEmail() != null && !cert.getAlertEmail().isBlank() && cert.getAlertEmail().contains("@")) {
                    recipientEmails.add(cert.getAlertEmail().trim().toLowerCase(Locale.ROOT));
                }

                // 3. Fallback dự phòng
                if (recipientEmails.isEmpty()) {
                    recipientEmails.add(defaultFarmerEmail);
                }

                // Đồng bộ lại email cảnh báo trong chứng chỉ về email nông dân chính thức nếu cần
                if (cert.getAlertEmail() == null || cert.getAlertEmail().isBlank() || "farmer@gmail.com".equalsIgnoreCase(cert.getAlertEmail())) {
                    cert.setAlertEmail(defaultFarmerEmail);
                }

                for (String recipient : recipientEmails) {
                    try {
                        emailService.sendCertificateExpiryWarningEmail(
                                recipient,
                                cert.getName(),
                                cert.getCertNumber(),
                                cert.getFarmName() != null ? cert.getFarmName() : cert.getFarmCode(),
                                daysLeft,
                                cert.getExpiryDate()
                        );

                        cert.setLastAlertSentDate(today);
                        repository.save(cert);
                        alertSentCount++;

                        Map<String, Object> detail = new LinkedHashMap<>();
                        detail.put("certNumber", cert.getCertNumber());
                        detail.put("certName", cert.getName());
                        detail.put("daysLeft", daysLeft);
                        detail.put("expiryDate", cert.getExpiryDate());
                        detail.put("recipient", recipient);
                        detail.put("status", "SENT");
                        alertedCertificates.add(detail);

                        log.info("ĐÃ TỰ ĐỘNG GỬI MAIL CẢNH BÁO TỚI NÔNG DÂN ĐĂNG KÝ: Chứng nhận {} ({}) còn {} ngày tới email {}",
                                cert.getName(), cert.getCertNumber(), daysLeft, recipient);
                    } catch (Exception ex) {
                        log.warn("Lỗi gửi email cảnh báo tới nông dân {}: {}", recipient, ex.getMessage());
                    }
                }
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("timestamp", today.toString());
        summary.put("scannedCount", scannedCount);
        summary.put("alertSentCount", alertSentCount);
        summary.put("alertedCertificates", alertedCertificates);
        return summary;
    }
}
