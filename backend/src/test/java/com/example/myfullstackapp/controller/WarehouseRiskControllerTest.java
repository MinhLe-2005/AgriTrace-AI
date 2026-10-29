package com.example.myfullstackapp.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.myfullstackapp.config.SecurityConfig;
import com.example.myfullstackapp.security.*;
import com.example.myfullstackapp.service.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

@WebMvcTest({WarehouseRiskController.class, WarehouseQualityController.class})
@ActiveProfiles("warehouse-test")
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class WarehouseRiskControllerTest {
    private final String base = "/api/v1/warehouses/" + UUID.randomUUID();
    @Autowired
    private MockMvc mvc;
    @MockitoBean
    private WarehouseRiskService risk;
    @MockitoBean
    private WarehouseQualityService quality;
    @MockitoBean
    private JwtTokenService jwtTokenService;
    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @Test
    void anonymousCannotReadForecast() throws Exception {
        mvc.perform(get(base + "/forecast")).andExpect(status().isUnauthorized());
        verifyNoInteractions(risk);
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "FARMER", "DISTRIBUTOR"})
    void unrelatedRolesCannotRefreshAlerts(String role) throws Exception {
        mvc.perform(post(base + "/alerts/refresh").with(user("other").roles(role)))
                .andExpect(status().isForbidden());
        verifyNoInteractions(risk);
    }

    @Test
    void rulesRejectInvalidThresholds() throws Exception {
        mvc.perform(
                        put(base + "/risk-rules")
                                .with(user("staff").roles("WAREHOUSE"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"expiryWarningDays\":-1,\"staleDays\":0,\"lowStockKg\":-1}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(risk);
    }

    @Test
    void actionUsesAuthenticatedActorAndRequiresNote() throws Exception {
        UUID alert = UUID.randomUUID();
        mvc.perform(
                        put(base + "/alerts/" + alert)
                                .with(user("inspector").roles("WAREHOUSE"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"status\":\"ACKNOWLEDGED\",\"note\":\"Checked\"}"))
                .andExpect(status().isOk());
        verify(risk).act(any(), eq(alert), any(), eq("inspector"));
        mvc.perform(
                        put(base + "/alerts/" + alert)
                                .with(user("inspector").roles("WAREHOUSE"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"status\":\"RESOLVED\",\"note\":\" \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void qualityRequiresExplicitHeldDecision() throws Exception {
        mvc.perform(
                        post(base + "/inspections")
                                .with(user("staff").roles("WAREHOUSE"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"balanceId\":\""
                                                + UUID.randomUUID()
                                                + "\",\"note\":\"Checked\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(quality);
    }
}
