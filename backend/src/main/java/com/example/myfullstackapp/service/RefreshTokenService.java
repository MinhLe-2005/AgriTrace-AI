package com.example.myfullstackapp.service;

import com.example.myfullstackapp.config.AppProperties;
import com.example.myfullstackapp.entity.RefreshToken;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.exception.AccountLockedException;
import com.example.myfullstackapp.exception.InvalidTokenException;
import com.example.myfullstackapp.repository.RefreshTokenRepository;
import com.example.myfullstackapp.security.JwtTokenService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenService jwtTokenService;
    private final AppProperties properties;

    @Transactional
    public TokenPair issue(User user) {
        UUID tokenId = UUID.randomUUID();
        Instant expiresAt = Instant.now().plusSeconds(properties.getJwt().getRefreshTokenExpirationSeconds());
        refreshTokenRepository.save(RefreshToken.builder().tokenId(tokenId).user(user).expiresAt(expiresAt).build());
        return new TokenPair(jwtTokenService.generateAccessToken(user), jwtTokenService.generateRefreshToken(user, tokenId),
                properties.getJwt().getAccessTokenExpirationSeconds(), user);
    }

    @Transactional
    public TokenPair rotate(String value) {
        RefreshToken token = getActiveToken(value);
        token.setRevoked(true);
        return issue(token.getUser());
    }

    @Transactional
    public void revoke(String value) {
        Claims claims = jwtTokenService.parseRefreshToken(value);
        UUID tokenId = tokenId(claims);
        refreshTokenRepository.findByTokenId(tokenId).ifPresent(token -> token.setRevoked(true));
    }

    private RefreshToken getActiveToken(String value) {
        Claims claims = jwtTokenService.parseRefreshToken(value);
        RefreshToken token = refreshTokenRepository.findByTokenIdAndRevokedFalse(tokenId(claims))
                .orElseThrow(() -> new InvalidTokenException("Refresh token is no longer active"));
        User user = token.getUser();
        if (!user.isActive()) {
            token.setRevoked(true);
            throw new InvalidTokenException("Account is disabled");
        }
        if (user.isAdminLocked()) {
            token.setRevoked(true);
            throw new AccountLockedException("Tài khoản đã bị khoá bởi quản trị viên", null);
        }
        if (user.isSelfLocked()) {
            token.setRevoked(true);
            throw new AccountLockedException("Tài khoản đã bị khoá bởi chủ sở hữu", null);
        }
        if (user.getLockedUntil() != null) {
            if (Instant.now().isBefore(user.getLockedUntil())) {
                token.setRevoked(true);
                throw new AccountLockedException("Tài khoản đang bị khoá tạm thời do đăng nhập sai nhiều lần", user.getLockedUntil());
            }
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
            user.setLockReason(null);
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            token.setRevoked(true);
            throw new InvalidTokenException("Refresh token has expired");
        }
        return token;
    }

    private UUID tokenId(Claims claims) {
        try {
            return UUID.fromString(claims.getId());
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new InvalidTokenException("Refresh token identifier is invalid");
        }
    }

    public record TokenPair(String accessToken, String refreshToken, long expiresIn, User user) { }
}
