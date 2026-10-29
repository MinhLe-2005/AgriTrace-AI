package com.example.myfullstackapp.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.Clock;

@Configuration
@EnableScheduling
@EnableConfigurationProperties(WarehouseMonitoringProperties.class)
public class WarehouseMonitoringConfiguration {
    @Bean
    Clock warehouseMonitoringClock() {
        return Clock.systemUTC();
    }
}
