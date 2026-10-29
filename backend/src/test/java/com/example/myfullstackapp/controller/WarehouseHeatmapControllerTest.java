package com.example.myfullstackapp.controller;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.myfullstackapp.config.SecurityConfig;
import com.example.myfullstackapp.security.*;
import com.example.myfullstackapp.service.WarehouseHeatmapService;

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

@WebMvcTest(WarehouseHeatmapController.class)
@ActiveProfiles("warehouse-test")
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class WarehouseHeatmapControllerTest {
    @Autowired
    private MockMvc mvc;
    @MockitoBean
    private WarehouseHeatmapService heatmap;
    @MockitoBean
    private JwtTokenService jwtTokenService;
    @MockitoBean
    private CustomUserDetailsService userDetailsService;
    private final String base = "/api/v1/warehouses/" + UUID.randomUUID() + "/heatmap";

    @Test
    void anonymousCannotReadMap() throws Exception {
        mvc.perform(get(base)).andExpect(status().isUnauthorized());
        verifyNoInteractions(heatmap);
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "FARMER", "DISTRIBUTOR"})
    void otherRolesCannotReadOrModifyLayout(String role) throws Exception {
        mvc.perform(get(base).with(user("other").roles(role))).andExpect(status().isForbidden());
        mvc.perform(delete(base + "/layout/" + UUID.randomUUID()).with(user("other").roles(role)))
                .andExpect(status().isForbidden());
        verifyNoInteractions(heatmap);
    }

    @Test
    void coordinatesAreValidatedBeforeSaving() throws Exception {
        mvc.perform(
                        put(base + "/layout/" + UUID.randomUUID())
                                .with(user("staff").roles("WAREHOUSE"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"row\":0,\"column\":31,\"level\":11}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(heatmap);
    }

    @ParameterizedTest
    @ValueSource(strings = {"WAREHOUSE", "ADMIN"})
    void warehouseRolesCanReadMap(String role) throws Exception {
        mvc.perform(get(base).with(user("staff").roles(role))).andExpect(status().isOk());
    }
}
