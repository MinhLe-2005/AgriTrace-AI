package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.auth.LockOwnAccountRequest;
import com.example.myfullstackapp.dto.auth.LoginRequest;
import com.example.myfullstackapp.dto.auth.UnlockOwnAccountRequest;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.exception.AccountLockedException;
import com.example.myfullstackapp.mapper.UserMapper;
import com.example.myfullstackapp.repository.RoleRepository;
import com.example.myfullstackapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceAccountLockTest {
    private final UserRepository users = mock(UserRepository.class);
    private final PasswordEncoder passwords = mock(PasswordEncoder.class);
    private final AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
    private final AuthService service = new AuthService(
            users,
            mock(RoleRepository.class),
            passwords,
            authenticationManager,
            mock(RefreshTokenService.class),
            mock(UserMapper.class));

    @Test
    void locksAccountAfterFifthInvalidPassword() {
        User user = user();
        user.setFailedLoginAttempts(4);
        when(users.findByEmailIgnoreCase("distributor@example.com")).thenReturn(Optional.of(user));
        doThrow(new BadCredentialsException("bad credentials"))
                .when(authenticationManager).authenticate(any());

        AccountLockedException exception = assertThrows(AccountLockedException.class,
                () -> service.login(new LoginRequest("distributor@example.com", "wrong-password")));

        assertEquals(5, user.getFailedLoginAttempts());
        assertNotNull(user.getLockedUntil());
        assertNotNull(exception.getLockedUntil());
        verify(users).save(user);
    }

    @Test
    void selfUnlockCannotClearAdministratorLock() {
        User user = user();
        user.setSelfLocked(true);
        user.setAdminLocked(true);
        when(users.findByEmailIgnoreCase("distributor@example.com")).thenReturn(Optional.of(user));
        when(passwords.matches("current-password", "hash")).thenReturn(true);

        service.unlockOwnAccount(new UnlockOwnAccountRequest("distributor@example.com", "current-password"));

        assertFalse(user.isSelfLocked());
        assertTrue(user.isAdminLocked());
        verify(users).save(user);
    }

    @Test
    void selfLockRequiresTheCurrentPassword() {
        User user = user();
        when(users.findByEmailIgnoreCase("distributor@example.com")).thenReturn(Optional.of(user));
        when(passwords.matches("incorrect", "hash")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> service.lockOwnAccount(
                "distributor@example.com", new LockOwnAccountRequest("incorrect", "lost phone")));

        assertFalse(user.isSelfLocked());
        verify(users, never()).save(any());
    }

    private User user() {
        return User.builder()
                .email("distributor@example.com")
                .fullName("Distributor")
                .passwordHash("hash")
                .build();
    }
}
