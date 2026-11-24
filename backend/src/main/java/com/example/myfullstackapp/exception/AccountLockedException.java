package com.example.myfullstackapp.exception;

import java.time.Instant;

/**
 * Thrown when a user account is locked (either by brute-force protection or self-lock).
 */
public class AccountLockedException extends RuntimeException {
    private final Instant lockedUntil;

    public AccountLockedException(String message, Instant lockedUntil) {
        super(message);
        this.lockedUntil = lockedUntil;
    }

    public Instant getLockedUntil() {
        return lockedUntil;
    }
}

