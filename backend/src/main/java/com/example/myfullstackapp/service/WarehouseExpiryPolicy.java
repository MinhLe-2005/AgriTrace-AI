package com.example.myfullstackapp.service;

import java.time.LocalDate;

/** A date-only expiry remains usable through that date in the warehouse's local calendar. */
public final class WarehouseExpiryPolicy {
    private WarehouseExpiryPolicy() {}

    public static boolean usableOn(LocalDate expiryDate, LocalDate day) {
        return !expiryDate.isBefore(day);
    }

    public static boolean expired(LocalDate expiryDate, LocalDate day) {
        return !usableOn(expiryDate, day);
    }
}
