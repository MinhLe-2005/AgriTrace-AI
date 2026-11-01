package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.auth.ChangeOwnPasswordRequest;
import com.example.myfullstackapp.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AccountControllerTest {
    private final AuthService authService = mock(AuthService.class);
    private final AccountController controller = new AccountController(authService);

    @Test
    void acceptsLegacyPasswordRequestWithoutConfirmPassword() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("distributor@example.com");

        assertDoesNotThrow(() -> controller.changePassword(
                new ChangeOwnPasswordRequest("old-password", "new-password", null), authentication));
    }

    @Test
    void rejectsProvidedConfirmationWhenItDoesNotMatch() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("distributor@example.com");

        assertThrows(IllegalArgumentException.class, () -> controller.changePassword(
                new ChangeOwnPasswordRequest("old-password", "new-password", "different"), authentication));
    }
}
