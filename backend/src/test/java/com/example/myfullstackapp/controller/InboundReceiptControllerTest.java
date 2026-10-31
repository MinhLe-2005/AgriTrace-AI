package com.example.myfullstackapp.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.myfullstackapp.config.SecurityConfig;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.exception.WarehouseIntegrationException;
import com.example.myfullstackapp.repository.WarehouseLotQuery;
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

@WebMvcTest({
    InboundReceiptController.class,
    InventoryController.class,
    StockMovementController.class,
    OutboundReceiptController.class,
    StockReservationController.class
})
@ActiveProfiles("warehouse-test")
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class InboundReceiptControllerTest {
    private final String base = "/api/v1/warehouses/" + UUID.randomUUID() + "/inbound-receipts";
    @Autowired
    private MockMvc mvc;
    @MockitoBean
    private WarehouseDocumentService receipts;
    @MockitoBean
    private InventoryService inventory;
    @MockitoBean
    private WarehouseLotQuery lots;
    @MockitoBean
    private StockMovementService stockMovements;
    @MockitoBean
    private StockReservationService reservations;
    @MockitoBean
    private WarehouseWeightService weights;
    @MockitoBean
    private JwtTokenService jwtTokenService;
    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @Test
    void anonymousCannotReadReceipts() throws Exception {
        mvc.perform(get(base)).andExpect(status().isUnauthorized());
        verifyNoInteractions(receipts);
    }

    @Test
    void customerCannotReserveOrConfigureWeight() throws Exception {
        String warehouseBase = base.substring(0, base.lastIndexOf('/'));
        mvc.perform(
                        post(warehouseBase + "/reservations")
                                .with(user("customer").roles("CUSTOMER"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"orderId\":1,\"productId\":\"Rau\",\"quantityKg\":1,\"ttlMinutes\":30}"))
                .andExpect(status().isForbidden());
        mvc.perform(
                        get(warehouseBase + "/unit-conversions")
                                .with(user("customer").roles("CUSTOMER")))
                .andExpect(status().isForbidden());
        verifyNoInteractions(reservations, weights);
    }

    @Test
    void handoverActorComesFromAuthenticatedPrincipal() throws Exception {
        String warehouseBase = base.substring(0, base.lastIndexOf('/'));
        UUID documentId = UUID.randomUUID();
        mvc.perform(
                        put(warehouseBase + "/documents/" + documentId + "/handover")
                                .with(user("handover-staff").roles("WAREHOUSE"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"reference\":\"REF-001\"}"))
                .andExpect(status().isOk());
        verify(receipts).handover(any(), eq(documentId), any(), eq("handover-staff"));
    }

    @Test
    void inventoryAndLedgerUseWarehouseAuthorization() throws Exception {
        String warehouseBase = base.substring(0, base.lastIndexOf('/'));
        mvc.perform(get(warehouseBase + "/inventory").with(user("customer").roles("CUSTOMER")))
                .andExpect(status().isForbidden());
        mvc.perform(
                        get(warehouseBase + "/movements")
                                .param("from", "2026-10-01")
                                .param("to", "2026-10-29")
                                .with(user("customer").roles("CUSTOMER")))
                .andExpect(status().isForbidden());
        verifyNoInteractions(inventory, stockMovements);
    }

    @Test
    void inventoryRejectsInvalidPagination() throws Exception {
        String warehouseBase = base.substring(0, base.lastIndexOf('/'));
        mvc.perform(
                        get(warehouseBase + "/inventory")
                                .param("page", "-1")
                                .with(user("staff").roles("WAREHOUSE")))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(inventory);
    }

    @ParameterizedTest
    @ValueSource(strings = {"FARMER", "CUSTOMER", "DISTRIBUTOR"})
    void otherRolesCannotConfirm(String role) throws Exception {
        mvc.perform(
                        put(base + "/" + UUID.randomUUID() + "/confirm")
                                .with(user("other").roles(role)))
                .andExpect(status().isForbidden());
        verifyNoInteractions(receipts);
    }

    @Test
    void emptyLinesAndNegativeQuantitiesAreRejected() throws Exception {
        var staff = user("staff").roles("WAREHOUSE");
        mvc.perform(
                        post(base)
                                .with(staff)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"lines\":[]}"))
                .andExpect(status().isBadRequest());
        mvc.perform(
                        post(base)
                                .with(staff)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"lines\":[{\"lotId\":\"1\",\"locationId\":\""
                                                + UUID.randomUUID()
                                                + "\",\"quantityKg\":-1}]}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(receipts);
    }

    @Test
    void actorComesFromAuthenticatedPrincipal() throws Exception {
        mvc.perform(
                        post(base)
                                .with(user("verified-staff").roles("WAREHOUSE"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"lines\":[{\"lotId\":\"1\",\"locationId\":\""
                                                + UUID.randomUUID()
                                                + "\",\"quantityKg\":1}]}"))
                .andExpect(status().isCreated());
        verify(receipts).create(any(), any(), any(), eq("verified-staff"));
    }

    @Test
    void farmerContractFailureReturns503() throws Exception {
        when(lots.approved())
                .thenThrow(new WarehouseIntegrationException("Farmer integration unavailable"));
        mvc.perform(get(base + "/eligible-lots").with(user("admin").roles("ADMIN")))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.errorCode").value("WAREHOUSE_INTEGRATION_UNAVAILABLE"));
    }

    @Test
    void malformedBodyReturns400() throws Exception {
        mvc.perform(
                        post(base)
                                .with(user("staff").roles("WAREHOUSE"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{"))
                .andExpect(status().isBadRequest());
    }
}
