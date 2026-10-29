package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.auth.*;
import com.example.myfullstackapp.dto.user.UserResponse;
import com.example.myfullstackapp.entity.Role;
import com.example.myfullstackapp.entity.RoleName;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.exception.ConflictException;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.mapper.UserMapper;
import com.example.myfullstackapp.repository.RoleRepository;
import com.example.myfullstackapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        if (userRepository.existsByEmailIgnoreCase(email)) throw new ConflictException("An account with this email already exists");
        Role userRole = roleRepository.findByName(RoleName.USER)
                .orElseThrow(() -> new ResourceNotFoundException("Default USER role is missing"));
        User user = userRepository.save(User.builder().email(email).fullName(request.fullName().trim())
                .passwordHash(passwordEncoder.encode(request.password())).roles(Set.of(userRole)).build());
        return response(refreshTokenService.issue(user));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = normalizedEmail(request.email());
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
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
            throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác!");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
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

    private AuthResponse response(RefreshTokenService.TokenPair tokens) {
        return new AuthResponse(tokens.accessToken(), tokens.refreshToken(), "Bearer", tokens.expiresIn(), userMapper.toResponse(tokens.user()));
    }

    private String normalizedEmail(String email) { return email.trim().toLowerCase(Locale.ROOT); }

    private String optionalText(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
