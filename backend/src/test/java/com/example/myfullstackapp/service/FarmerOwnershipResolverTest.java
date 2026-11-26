package com.example.myfullstackapp.service;

import com.example.myfullstackapp.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FarmerOwnershipResolverTest {

    @AfterEach
    void cleanupContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void mapsKnownAndNewlyRegisteredFarmersToDistinctOwnerIds() {
        UserRepository users = mock(UserRepository.class);
        FarmerOwnershipResolver resolver = new FarmerOwnershipResolver(users);

        assertEquals("farmer_hung", resolver.mapEmailOrIdToOwnerId("farmer@agritrace.vn", "u1"));
        assertEquals("farmer_hung", resolver.mapEmailOrIdToOwnerId("farmer@sportvenue.com", "u2"));
        assertEquals("farmer_thieu", resolver.mapEmailOrIdToOwnerId("nguyenthieuu052@gmail.com", "u3"));
        assertEquals("farmer_uuid-new-farmer", resolver.mapEmailOrIdToOwnerId("hoanganh.farm@gmail.com", "uuid-new-farmer"));
    }

    @Test
    void strictFarmerCannotModifyAnotherFarmersResourceWhileAdminCan() {
        UserRepository users = mock(UserRepository.class);
        when(users.findByEmailIgnoreCase("nguyenthieuu052@gmail.com")).thenReturn(Optional.empty());
        FarmerOwnershipResolver resolver = new FarmerOwnershipResolver(users);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "nguyenthieuu052@gmail.com",
                        "pass",
                        List.of(new SimpleGrantedAuthority("ROLE_FARMER"))
                )
        );

        assertTrue(resolver.canModifyOwnedResource("farmer_thieu"));
        assertFalse(resolver.canModifyOwnedResource("farmer_hung"));
        assertEquals("farmer_thieu", resolver.resolveEffectiveOwnerId("farmer_hung", "NT-DL-01"));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin@sportvenue.com",
                        "pass",
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );
        assertTrue(resolver.canModifyOwnedResource("farmer_hung"));
        assertTrue(resolver.canModifyOwnedResource("farmer_thieu"));
    }
}
