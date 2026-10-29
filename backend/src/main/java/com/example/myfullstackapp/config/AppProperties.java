package com.example.myfullstackapp.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private Jwt jwt = new Jwt();
    private Cors cors = new Cors();
    private BootstrapAdmin bootstrapAdmin = new BootstrapAdmin();
    private Payos payos = new Payos();

    @Data
    public static class Jwt {
        private String secret;
        private long accessTokenExpirationSeconds = 3600;
        private long refreshTokenExpirationSeconds = 604800;
    }

    @Data
    public static class Cors {
        private String allowedOrigins = "http://localhost:3000";
    }

    @Data
    public static class BootstrapAdmin {
        private String email = "";
        private String password = "";
        private String fullName = "Administrator";
    }

    @Data
    public static class Payos {
        private String clientId = "";
        private String apiKey = "";
        private String checksumKey = "";
    }
}
