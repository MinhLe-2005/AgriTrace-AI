package com.example.myfullstackapp.config;

import com.example.myfullstackapp.entity.Role;
import com.example.myfullstackapp.entity.RoleName;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.repository.RoleRepository;
import com.example.myfullstackapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DevDemoAccountBootstrapTest {
    @Test
    void restoresAllAdvertisedDemoAccountsWithUsableCredentials() {
        UserRepository users = mock(UserRepository.class);
        RoleRepository roles = mock(RoleRepository.class);
        PasswordEncoder passwords = mock(PasswordEncoder.class);
        when(users.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(users.findByUsernameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(roles.findByName(any(RoleName.class))).thenAnswer(invocation -> Optional.of(
                Role.builder().id(1L).name(invocation.getArgument(0)).build()));
        when(passwords.encode("123456")).thenReturn("demo-password-hash");

        new DevDemoAccountBootstrap(users, roles, passwords).run(new DefaultApplicationArguments());

        org.mockito.Mockito.verify(users, org.mockito.Mockito.times(5)).save(org.mockito.ArgumentMatchers.argThat(user ->
                "demo-password-hash".equals(user.getPasswordHash())
                        && user.isActive()
                        && user.getFailedLoginAttempts() == 0
                        && !user.isSelfLocked()
                        && !user.isAdminLocked()));
    }

    @Test
    void updatesAnExistingAdminAccountUsedByTheLegacyLoginForm() {
        UserRepository users = mock(UserRepository.class);
        RoleRepository roles = mock(RoleRepository.class);
        PasswordEncoder passwords = mock(PasswordEncoder.class);
        User admin = User.builder().email("admin@sportvenue.com").fullName("Old name")
                .passwordHash("old-hash").active(false).failedLoginAttempts(5).selfLocked(true).adminLocked(true).build();
        when(users.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(users.findByEmailIgnoreCase("admin@sportvenue.com")).thenReturn(Optional.of(admin));
        when(users.findByUsernameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(roles.findByName(any(RoleName.class))).thenAnswer(invocation -> Optional.of(
                Role.builder().id(1L).name(invocation.getArgument(0)).build()));
        when(passwords.encode("123456")).thenReturn("demo-password-hash");

        new DevDemoAccountBootstrap(users, roles, passwords).run(new DefaultApplicationArguments());

        assertEquals("admin", admin.getUsername());
        assertEquals("demo-password-hash", admin.getPasswordHash());
        assertFalse(admin.isAdminLocked());
    }
}
