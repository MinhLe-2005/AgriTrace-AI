package com.example.myfullstackapp.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.*;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
public class WarehouseTelemetrySecurityConfiguration {
    @Bean
    @Order(1)
    SecurityFilterChain warehouseTelemetryChain(
            HttpSecurity http, @Qualifier("corsConfigurationSource") CorsConfigurationSource cors)
            throws Exception {
        // Only this device-ingestion endpoint uses its own per-device key authentication.
        return http.securityMatcher("/api/v1/warehouse-telemetry")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(c -> c.configurationSource(cors))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a.anyRequest().permitAll())
                .build();
    }
}
