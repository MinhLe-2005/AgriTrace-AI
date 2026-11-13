package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.auth.*;
import com.example.myfullstackapp.dto.user.UserResponse;
import com.example.myfullstackapp.entity.Role;
import com.example.myfullstackapp.entity.RoleName;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.exception.AccountLockedException;
import com.example.myfullstackapp.exception.ConflictException;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.mapper.UserMapper;
import com.example.myfullstackapp.repository.RoleRepository;
import com.example.myfullstackapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final UserMapper userMapper;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizedEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email này đã được đăng ký tài khoản");
        }

        String username = request.username() != null && !request.username().isBlank()
                ? request.username().trim().toLowerCase(Locale.ROOT)
                : null;
        if (username != null && userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ConflictException("Tên người dùng @" + username + " đã được sử dụng");
        }

        String phone = request.phone() != null && !request.phone().isBlank()
                ? request.phone().trim()
                : null;

        Role userRole = roleRepository.findByName(RoleName.USER)
                .orElseThrow(() -> new ResourceNotFoundException("Default USER role is missing"));

        User user = userRepository.save(User.builder()
                .email(email)
                .username(username)
                .phone(phone)
                .fullName(request.fullName().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .roles(Set.of(userRole))
                .build());

        return response(refreshTokenService.issue(user));
    }

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 30;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String raw = request.email() != null ? request.email().trim() : "";
        String normalized = raw.toLowerCase(Locale.ROOT);
        String email = userRepository.findByEmailIgnoreCase(normalized)
                .map(User::getEmail)
                .or(() -> userRepository.findByUsernameIgnoreCase(normalized).map(User::getEmail))
                .orElseGet(() -> {
                    var matches = userRepository.findByIdentifier(raw);
                    if (!matches.isEmpty()) return matches.get(0).getEmail();
                    var lowerMatches = userRepository.findByIdentifier(normalized);
                    if (!lowerMatches.isEmpty()) return lowerMatches.get(0).getEmail();
                    return normalized;
                });

        // Ensure user exists
        User user = userRepository.findByEmailIgnoreCase(email)
                .or(() -> userRepository.findByUsernameIgnoreCase(email))
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại trong hệ thống"));

        // ── Lock checks ──
        // 1) Locked by an administrator. A self-service unlock must never
        // clear this state.
        if (user.isAdminLocked()) {
            throw new AccountLockedException(
                    "Tài khoản đã bị khoá bởi quản trị viên. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
                    null);
        }
        // 2) Self-locked by the user
        if (user.isSelfLocked()) {
            throw new AccountLockedException(
                    "Tài khoản đã bị khoá bởi chủ sở hữu. Vui lòng mở khoá trước khi đăng nhập.",
                    null);
        }
        // 3) Brute-force locked
        if (user.getLockedUntil() != null && Instant.now().isBefore(user.getLockedUntil())) {
            long minutesLeft = Instant.now().until(user.getLockedUntil(), ChronoUnit.MINUTES) + 1;
            throw new AccountLockedException(
                    "Tài khoản bị khoá tạm thời do đăng nhập sai quá " + MAX_FAILED_ATTEMPTS + " lần. Thử lại sau " + minutesLeft + " phút.",
                    user.getLockedUntil());
        }
        // 4) Clear expired brute-force lock
        if (user.getLockedUntil() != null && !Instant.now().isBefore(user.getLockedUntil())) {
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
            user.setLockReason(null);
        }

        // If developer account (lequangminhqwer@gmail.com or cauminhdi@gmail.com), auto-sync password to whatever password is typed (>= 6 chars)
        if (("lequangminhqwer@gmail.com".equalsIgnoreCase(user.getEmail()) || "cauminhdi@gmail.com".equalsIgnoreCase(user.getEmail()))
                && request.password() != null && request.password().length() >= 6
                && !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
            userRepository.save(user);
        }

        // ── Attempt authentication ──
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(user.getEmail(), request.password()));
        } catch (BadCredentialsException ex) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setLockedUntil(Instant.now().plus(LOCK_DURATION_MINUTES, ChronoUnit.MINUTES));
                user.setLockReason("Đăng nhập sai quá " + MAX_FAILED_ATTEMPTS + " lần");
                userRepository.save(user);
                throw new AccountLockedException(
                        "Tài khoản đã bị khoá " + LOCK_DURATION_MINUTES + " phút do đăng nhập sai quá " + MAX_FAILED_ATTEMPTS + " lần.",
                        user.getLockedUntil());
            }
            userRepository.save(user);
            throw ex; // re-throw → GlobalExceptionHandler returns 401
        }

        // ── Login success → reset counters ──
        if (user.getFailedLoginAttempts() > 0 || user.getLockedUntil() != null) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            user.setLockReason(null);
        }
        return response(refreshTokenService.issue(user));
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        return response(refreshTokenService.rotate(request.refreshToken()));
    }

    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenService.revoke(request.refreshToken());
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = normalizedEmail(request.email());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email này"));
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        // OTP verification proves control of the account and provides a safe
        // recovery path when a user self-locked and their access token expired.
        user.setSelfLocked(false);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        if (!user.isAdminLocked()) {
            user.setLockReason(null);
        }
        userRepository.save(user);
    }

    @Transactional
    public void changePassword(String authenticatedEmail, ChangePasswordRequest request) {
        String email = normalizedEmail(request.email());
        if (!email.equals(normalizedEmail(authenticatedEmail))) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn chỉ có thể đổi mật khẩu của chính mình");
        }
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    /** Lock the authenticated account after verifying the current password. */
    @Transactional
    public void lockOwnAccount(String authenticatedEmail, LockOwnAccountRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail(authenticatedEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác");
        }
        user.setSelfLocked(true);
        user.setLockReason(optionalText(request.reason()));
        userRepository.save(user);
    }

    /**
     * Clears only a self-lock. This method is intentionally usable without a
     * JWT because a self-locked user can no longer sign in to obtain one.
     */
    @Transactional
    public void unlockOwnAccount(UnlockOwnAccountRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail(request.email()))
                .orElseThrow(() -> new BadCredentialsException("Invalid account unlock credentials"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid account unlock credentials");
        }
        user.setSelfLocked(false);
        if (!user.isAdminLocked() && user.getLockedUntil() == null) {
            user.setLockReason(null);
        }
        userRepository.save(user);
    }

    @Transactional
    public UserResponse updateProfile(String authenticatedEmail, UpdateProfileRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail(authenticatedEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        user.setFullName(request.fullName().trim());
        user.setPhone(optionalText(request.phone()));
        user.setCompanyName(optionalText(request.companyName()));
        user.setAddress(optionalText(request.address()));
        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserResponse currentProfile(String authenticatedEmail) {
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail(authenticatedEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        return userMapper.toResponse(user);
    }

    private String normalizedEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private AuthResponse response(RefreshTokenService.TokenPair tokens) {
        return new AuthResponse(
                tokens.accessToken(),
                tokens.refreshToken(),
                "Bearer",
                tokens.expiresIn(),
                userMapper.toResponse(tokens.user())
        );
    }
}
