package com.example.myfullstackapp.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OrderStatusRulesTest {

    @Test
    void allowsNormalLifecycle() {
        assertTrue(OrderStatusRules.canTransition("PENDING_PAYMENT", "PAID"));
        assertTrue(OrderStatusRules.canTransition("PAID", "SHIPPING"));
        assertTrue(OrderStatusRules.canTransition("CONFIRMED", "SHIPPING"));
        assertTrue(OrderStatusRules.canTransition("SHIPPING", "DELIVERED"));
        assertTrue(OrderStatusRules.canTransition("DELIVERED", "REFUNDED"));
    }

    @Test
    void terminalStatusesCannotMove() {
        assertTrue(OrderStatusRules.nextStatuses("CANCELLED").isEmpty());
        assertTrue(OrderStatusRules.nextStatuses("REFUNDED").isEmpty());
        assertFalse(OrderStatusRules.canTransition("CANCELLED", "SHIPPING"));
    }

    @Test
    void rejectsSkippingOrGoingBack() {
        assertFalse(OrderStatusRules.canTransition("SHIPPING", "CANCELLED"));
        assertFalse(OrderStatusRules.canTransition("DELIVERED", "SHIPPING"));
        assertFalse(OrderStatusRules.canTransition("PENDING_PAYMENT", "DELIVERED"));
    }

    @Test
    void isCaseInsensitive() {
        assertTrue(OrderStatusRules.canTransition("paid", "shipping"));
    }

    @Test
    void legacyStatusCanStillBeConfirmedOrCancelled() {
        assertEquals(java.util.List.of("CONFIRMED", "CANCELLED"), OrderStatusRules.nextStatuses("PENDING"));
        assertEquals(java.util.List.of("CONFIRMED", "CANCELLED"), OrderStatusRules.nextStatuses(null));
    }
}
