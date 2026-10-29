package com.example.myfullstackapp.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.myfullstackapp.config.*;
import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.*;
import com.example.myfullstackapp.exception.WarehouseSensorAuthenticationException;
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
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.*;

@WebMvcTest({WarehouseMonitoringController.class, WarehouseTelemetryController.class})
@ActiveProfiles("warehouse-test")
@Import({
    SecurityConfig.class,
    WarehouseTelemetrySecurityConfiguration.class,
    RestAuthenticationEntryPoint.class,
    RestAccessDeniedHandler.class
})
class WarehouseMonitoringControllerTest {
    private final UUID warehouseId = UUID.randomUUID();
    private final String base = "/api/v1/warehouses/" + warehouseId + "/monitoring";
    @Autowired
    private MockMvc mvc;
    @MockitoBean
    private WarehouseMonitoringService monitoring;
    @MockitoBean
    private WarehouseMonitoringEvaluator evaluator;
    @MockitoBean
    private WarehouseMonitoringStream stream;
    @MockitoBean
    private WarehouseNotificationService notifications;
    @MockitoBean
    private WarehouseTelemetryService telemetry;
    @MockitoBean
    private JwtTokenService jwtTokenService;
    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    private String payload() {
        return "{\"deviceId\":\""
                + UUID.randomUUID()
                + "\",\"deviceKey\":\"invalid-key\",\"messageId\":\""
                + UUID.randomUUID()
                + "\",\"recordedAt\":\"2026-10-30T00:00:00Z\",\"temperature\":4,\"humidity\":85,\"simulated\":true}";
    }

    @Test
    void anonymousCannotReadMonitoringOrStream() throws Exception {
        mvc.perform(get(base + "/devices")).andExpect(status().isUnauthorized());
        mvc.perform(get(base + "/stream")).andExpect(status().isUnauthorized());
        verifyNoInteractions(monitoring, stream);
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "FARMER", "DISTRIBUTOR"})
    void otherRolesCannotCreateRulesOrReadSecrets(String role) throws Exception {
        mvc.perform(get(base + "/devices").with(user("other").roles(role)))
                .andExpect(status().isForbidden());
        mvc.perform(post(base + "/evaluate").with(user("other").roles(role)))
                .andExpect(status().isForbidden());
        verifyNoInteractions(monitoring, evaluator);
    }

    @Test
    void publicTelemetryStillRequiresValidDeviceCredentials() throws Exception {
        when(telemetry.ingest(any())).thenThrow(new WarehouseSensorAuthenticationException());
        mvc.perform(
                        post("/api/v1/warehouse-telemetry")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("INVALID_SENSOR_CREDENTIALS"));
        verify(telemetry).ingest(any());
    }

    @Test
    void invalidTelemetryIsRejectedBeforeService() throws Exception {
        mvc.perform(
                        post("/api/v1/warehouse-telemetry")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload().replace("\"humidity\":85", "\"humidity\":101")))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(telemetry);
    }

    @Test
    void sensorEndpointDoesNotMakeWarehouseAdminRoutesPublic() throws Exception {
        mvc.perform(
                        put(base + "/settings")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"maxGapSeconds\":120,\"telegramEnabled\":false}"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(monitoring);
    }

    @Test
    void onlyDeviceCreationReturnsItsOneTimeKeyAndActorIsAuthenticated() throws Exception {
        var device =
                new DeviceView(
                        UUID.randomUUID(),
                        warehouseId,
                        null,
                        "Sensor",
                        true,
                        true,
                        Instant.now(),
                        null,
                        null);
        when(monitoring.createDevice(eq(warehouseId), any(), eq("manager")))
                .thenReturn(new DeviceSecret(device, "one-time-test-key"));
        mvc.perform(
                        post(base + "/devices")
                                .with(user("manager").roles("WAREHOUSE"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"name\":\"Sensor\",\"simulated\":true}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.deviceKey").value("one-time-test-key"));
        when(monitoring.devices(warehouseId)).thenReturn(List.of(device));
        mvc.perform(get(base + "/devices").with(user("manager").roles("WAREHOUSE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].keyHash").doesNotExist())
                .andExpect(jsonPath("$.data[0].deviceKey").doesNotExist());
    }

    @Test
    void ruleAndSettingsBoundariesAreValidated() throws Exception {
        mvc.perform(
                        put(base + "/settings")
                                .with(user("staff").roles("WAREHOUSE"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"maxGapSeconds\":1,\"telegramEnabled\":false}"))
                .andExpect(status().isBadRequest());
        mvc.perform(
                        post(base + "/rules")
                                .with(user("staff").roles("WAREHOUSE"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"name\":\"Hot\",\"kind\":\"TEMPERATURE_HIGH\",\"threshold\":10,\"durationMinutes\":-1,\"recoveryMinutes\":5,\"severity\":\"CRITICAL\",\"enabled\":true}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(monitoring);
    }

    @Test
    void warehouseUserCanOpenSseStream() throws Exception {
        var emitter = new SseEmitter(1000L);
        when(stream.subscribe(warehouseId)).thenReturn(emitter);
        mvc.perform(
                        get(base + "/stream")
                                .with(user("staff").roles("WAREHOUSE"))
                                .accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted())
                .andExpect(
                        header().string(
                                        "Cache-Control",
                                        org.hamcrest.Matchers.containsString("no-store")));
        verify(stream).subscribe(warehouseId);
        emitter.complete();
    }
}
