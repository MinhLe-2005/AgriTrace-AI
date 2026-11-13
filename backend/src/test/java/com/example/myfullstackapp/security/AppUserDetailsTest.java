package com.example.myfullstackapp.security;

import com.example.myfullstackapp.entity.User;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AppUserDetailsTest {

    @Test
    void treatsSelfAdministratorAndTemporaryLocksAsNonUnlocked() {
        User user = user();
        user.setSelfLocked(true);
        assertFalse(new AppUserDetails(user).isAccountNonLocked());

        user.setSelfLocked(false);
        user.setAdminLocked(true);
        assertFalse(new AppUserDetails(user).isAccountNonLocked());

        user.setAdminLocked(false);
        user.setLockedUntil(Instant.now().plusSeconds(60));
        assertFalse(new AppUserDetails(user).isAccountNonLocked());
    }

    @Test
    void permitsAnAccountAfterItsTemporaryLockHasExpired() {
        User user = user();
        user.setLockedUntil(Instant.now().minusSeconds(1));

        assertTrue(new AppUserDetails(user).isAccountNonLocked());
    }

    private User user() {
        return User.builder()
                .email("distributor@example.com")
                .fullName("Distributor")
                .passwordHash("hash")
                .build();
    }
}
