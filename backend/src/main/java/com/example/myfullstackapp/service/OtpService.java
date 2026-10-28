package com.example.myfullstackapp.service;

import com.example.myfullstackapp.exception.ConflictException;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final EmailService emailService;
    private final UserRepository userRepository;

    private record OtpData(String code, Instant expiresAt) {}

    // In-memory cache for OTPs: key is normalized email
    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    /**
     * Generate 6-digit OTP for Registration and send to email.
     */
    public String generateAndSendOtp(String email) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        // Validate that email is not already registered
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException("Địa chỉ email này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc sử dụng email khác.");
        }

        // Generate a 6-digit random number
        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(1000000));
        Instant expiresAt = Instant.now().plus(5, ChronoUnit.MINUTES);

        otpStorage.put(normalizedEmail, new OtpData(code, expiresAt));
        log.info("Generated Register OTP for {}: {} (Expires in 5 mins)", normalizedEmail, code);

        emailService.sendOtpEmail(normalizedEmail, code);
        return code;
    }

    /**
     * Generate 6-digit OTP for Password Reset and send to email.
     */
    public String generateAndSendResetOtp(String email) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        // Validate that user exists in database
        if (!userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResourceNotFoundException("Không tìm thấy tài khoản nào liên kết với email: " + email);
        }

        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(1000000));
        Instant expiresAt = Instant.now().plus(5, ChronoUnit.MINUTES);

        otpStorage.put(normalizedEmail, new OtpData(code, expiresAt));
        log.info("Generated Password Reset OTP for {}: {} (Expires in 5 mins)", normalizedEmail, code);

        emailService.sendPasswordResetEmail(normalizedEmail, code);
        return code;
    }

    /**
     * Verify the OTP for a given email.
     */
    public boolean verifyOtp(String email, String inputCode) {
        if (inputCode == null || inputCode.isBlank()) {
            return false;
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        OtpData data = otpStorage.get(normalizedEmail);
        if (data == null) {
            log.warn("No OTP found for {}", normalizedEmail);
            return false;
        }

        if (Instant.now().isAfter(data.expiresAt())) {
            log.warn("OTP for {} has expired at {}", normalizedEmail, data.expiresAt());
            otpStorage.remove(normalizedEmail);
            return false;
        }

        if (data.code().equals(inputCode.trim())) {
            log.info("OTP successfully verified for {}", normalizedEmail);
            otpStorage.remove(normalizedEmail);
            return true;
        }

        log.warn("Invalid OTP entered for {}. Expected: {}, Provided: {}", normalizedEmail, data.code(), inputCode);
        return false;
    }
}
