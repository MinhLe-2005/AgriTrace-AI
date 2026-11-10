package com.example.myfullstackapp.config;

import lombok.Data;

import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "warehouse.monitoring")
public class WarehouseMonitoringProperties {
    private String telegramBotToken = "";
}
