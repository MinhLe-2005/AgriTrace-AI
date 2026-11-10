package com.example.myfullstackapp.service;

import com.example.myfullstackapp.config.WarehouseMonitoringProperties;

import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;

@Service
public class WarehouseTelegramClient {
    private final WarehouseMonitoringProperties properties;
    private final RestClient client;

    public WarehouseTelegramClient(WarehouseMonitoringProperties properties) {
        this.properties = properties;
        var http =
                HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(3))
                        .followRedirects(HttpClient.Redirect.NEVER)
                        .build();
        var factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(5));
        client =
                RestClient.builder()
                        .baseUrl("https://api.telegram.org")
                        .requestFactory(factory)
                        .build();
    }

    public boolean send(String chatId, String message) {
        if (properties.getTelegramBotToken().isBlank()) return false;
        try {
            var result =
                    client.post()
                            .uri("/bot{token}/sendMessage", properties.getTelegramBotToken())
                            .body(Map.of("chat_id", chatId, "text", message))
                            .retrieve()
                            .body(Map.class);
            return result != null && Boolean.TRUE.equals(result.get("ok"));
        } catch (Exception transportFailure) {
            // HTTP exceptions can include a URI containing the bot token. Never log them.
            return false;
        }
    }
}
