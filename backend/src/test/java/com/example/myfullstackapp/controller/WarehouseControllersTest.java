package com.example.myfullstackapp.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.myfullstackapp.config.SecurityConfig;
import com.example.myfullstackapp.dto.warehouse.*;
import com.example.myfullstackapp.exception.*;
import com.example.myfullstackapp.security.*;
import com.example.myfullstackapp.service.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@WebMvcTest({WarehouseController.class, StorageLocationController.class})
@ActiveProfiles("warehouse-test")
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class WarehouseControllersTest {
    private static final UUID WAREHOUSE_ID = UUID.randomUUID();
    private static final UUID LOCATION_ID = UUID.randomUUID();
    private static final String BASE = "/api/v1/warehouses";
    private static final String LOCATIONS = BASE + "/" + WAREHOUSE_ID + "/locations";
    private static final String WAREHOUSE_JSON =
            """
{"name":"Cold store","location":"HCM","capacityTons":10.00,"tempTargetC":4.0,"humidityTarget":85.0}
""";
    private static final String LOCATION_JSON =
            """
{"code":"A-01","name":"Rack","capacityTons":2.00,"tempTargetC":4.0,"humidityTarget":85.0}
""";

    @Autowired
    private MockMvc mvc;
    @MockitoBean
    private WarehouseService warehouses;
    @MockitoBean
    private StorageLocationService locations;
    @MockitoBean
    private JwtTokenService jwtTokenService;
    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @Test
    void anonymousRequestsUseExistingUnauthorizedResponse() throws Exception {
        mvc.perform(get(BASE)).andExpect(status().isUnauthorized());
        mvc.perform(post(LOCATIONS).contentType(MediaType.APPLICATION_JSON).content(LOCATION_JSON))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(warehouses, locations);
    }

    @ParameterizedTest
    @ValueSource(strings = {"FARMER", "CUSTOMER", "DISTRIBUTOR", "USER"})
    void unrelatedRolesCannotReadOrWrite(String role) throws Exception {
        var user =
                org.springframework.security.test.web.servlet.request
                        .SecurityMockMvcRequestPostProcessors.user("other")
                        .roles(role);
        mvc.perform(get(BASE).with(user)).andExpect(status().isForbidden());
        mvc.perform(
                        post(BASE)
                                .with(user)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(WAREHOUSE_JSON))
                .andExpect(status().isForbidden());
        mvc.perform(get(LOCATIONS).with(user)).andExpect(status().isForbidden());
        mvc.perform(delete(LOCATIONS + "/" + LOCATION_ID).with(user))
                .andExpect(status().isForbidden());
        verifyNoInteractions(warehouses, locations);
    }

    @Test
    @WithMockUser(roles = "WAREHOUSE")
    void warehouseStaffCanCreateAndRetrieveBothResources() throws Exception {
        when(warehouses.create(any())).thenReturn(warehouseResponse());
        when(warehouses.getById(WAREHOUSE_ID)).thenReturn(warehouseResponse());
        when(locations.create(eq(WAREHOUSE_ID), any())).thenReturn(locationResponse());
        when(locations.getById(WAREHOUSE_ID, LOCATION_ID)).thenReturn(locationResponse());
        mvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(WAREHOUSE_JSON))
                .andExpect(status().isCreated())
                .andExpect(
                        header().string("Location", "http://localhost" + BASE + "/" + WAREHOUSE_ID))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(WAREHOUSE_ID.toString()));
        mvc.perform(get(BASE + "/" + WAREHOUSE_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Cold store"));
        mvc.perform(post(LOCATIONS).contentType(MediaType.APPLICATION_JSON).content(LOCATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(
                        header().string(
                                        "Location",
                                        "http://localhost" + LOCATIONS + "/" + LOCATION_ID))
                .andExpect(jsonPath("$.data.warehouseId").value(WAREHOUSE_ID.toString()));
        mvc.perform(get(LOCATIONS + "/" + LOCATION_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code").value("A-01"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanListUpdateSetStatusAndSoftDelete() throws Exception {
        when(warehouses.getAll()).thenReturn(List.of(warehouseResponse()));
        when(locations.getAll(WAREHOUSE_ID)).thenReturn(List.of(locationResponse()));
        mvc.perform(get(BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(WAREHOUSE_ID.toString()));
        mvc.perform(get(LOCATIONS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].code").value("A-01"));
        mvc.perform(
                        put(BASE + "/" + WAREHOUSE_ID)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(WAREHOUSE_JSON))
                .andExpect(status().isOk());
        mvc.perform(
                        put(LOCATIONS + "/" + LOCATION_ID)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(LOCATION_JSON))
                .andExpect(status().isOk());
        mvc.perform(
                        put(BASE + "/" + WAREHOUSE_ID + "/status")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"active\":false}"))
                .andExpect(status().isOk());
        mvc.perform(
                        put(LOCATIONS + "/" + LOCATION_ID + "/status")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"active\":true}"))
                .andExpect(status().isOk());
        mvc.perform(delete(BASE + "/" + WAREHOUSE_ID)).andExpect(status().isNoContent());
        mvc.perform(delete(LOCATIONS + "/" + LOCATION_ID)).andExpect(status().isNoContent());
        verify(warehouses, times(2)).setActive(WAREHOUSE_ID, false);
        verify(locations).setActive(WAREHOUSE_ID, LOCATION_ID, false);
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-1", "1.001", "100000000"})
    @WithMockUser(roles = "WAREHOUSE")
    void invalidCapacityIsRejectedBeforeService(String capacity) throws Exception {
        mvc.perform(
                        post(BASE)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(WAREHOUSE_JSON.replace("10.00", capacity)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        mvc.perform(
                        post(LOCATIONS)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(LOCATION_JSON.replace("2.00", capacity)))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(warehouses, locations);
    }

    @ParameterizedTest
    @ValueSource(strings = {"101", "-0.1", "85.01"})
    @WithMockUser(roles = "WAREHOUSE")
    void invalidHumidityIsRejected(String humidity) throws Exception {
        mvc.perform(
                        post(BASE)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(WAREHOUSE_JSON.replace("85.0", humidity)))
                .andExpect(status().isBadRequest());
        mvc.perform(
                        post(LOCATIONS)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(LOCATION_JSON.replace("85.0", humidity)))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(warehouses, locations);
    }

    @Test
    @WithMockUser(roles = "WAREHOUSE")
    void missingFieldsBlankNamesInvalidCodesAndNullStatusAreRejected() throws Exception {
        mvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(
                        post(BASE)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(WAREHOUSE_JSON.replace("Cold store", " ")))
                .andExpect(status().isBadRequest());
        mvc.perform(
                        post(LOCATIONS)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(LOCATION_JSON.replace("A-01", "A 01")))
                .andExpect(status().isBadRequest());
        mvc.perform(
                        put(BASE + "/" + WAREHOUSE_ID + "/status")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(
                        put(LOCATIONS + "/" + LOCATION_ID + "/status")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get(BASE + "/not-a-uuid")).andExpect(status().isBadRequest());
        verifyNoInteractions(warehouses, locations);
    }

    @Test
    @WithMockUser(roles = "WAREHOUSE")
    void malformedJsonInvalidManagerIdAndMissingBodyReturnBadRequest() throws Exception {
        mvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));
        mvc.perform(
                        post(BASE)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        WAREHOUSE_JSON.replace(
                                                "\"location\":\"HCM\"",
                                                "\"location\":\"HCM\",\"managerId\":\"invalid\"")))
                .andExpect(status().isBadRequest());
        mvc.perform(post(LOCATIONS).contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
        mvc.perform(
                        put(LOCATIONS + "/" + LOCATION_ID + "/status")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"active\":\"invalid\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(warehouses, locations);
    }

    @Test
    @WithMockUser(roles = "WAREHOUSE")
    void serviceErrorsUseExistingNotFoundAndConflictEnvelope() throws Exception {
        when(warehouses.getById(WAREHOUSE_ID))
                .thenThrow(new ResourceNotFoundException("Warehouse not found"));
        when(locations.create(eq(WAREHOUSE_ID), any()))
                .thenThrow(new ConflictException("Capacity exceeded"));
        mvc.perform(get(BASE + "/" + WAREHOUSE_ID))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("NOT_FOUND"));
        mvc.perform(post(LOCATIONS).contentType(MediaType.APPLICATION_JSON).content(LOCATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("CONFLICT"));
    }

    @Test
    @WithMockUser(roles = "WAREHOUSE")
    void capacityEndpointReturnsAllocation() throws Exception {
        when(warehouses.getCapacity(WAREHOUSE_ID))
                .thenReturn(
                        new WarehouseCapacityResponse(
                                WAREHOUSE_ID,
                                BigDecimal.TEN,
                                new BigDecimal("8.00"),
                                new BigDecimal("2.00")));
        mvc.perform(get(BASE + "/" + WAREHOUSE_ID + "/capacity"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unallocatedCapacityTons").value(2.0));
    }

    private WarehouseResponse warehouseResponse() {
        return new WarehouseResponse(
                WAREHOUSE_ID,
                "Cold store",
                "HCM",
                null,
                BigDecimal.TEN,
                new BigDecimal("4.0"),
                new BigDecimal("85.0"),
                true,
                null);
    }

    private StorageLocationResponse locationResponse() {
        return new StorageLocationResponse(
                LOCATION_ID,
                WAREHOUSE_ID,
                "A-01",
                "Rack",
                new BigDecimal("2.00"),
                new BigDecimal("4.0"),
                new BigDecimal("85.0"),
                true,
                null,
                null);
    }
}
