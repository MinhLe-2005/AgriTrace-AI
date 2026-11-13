package com.example.myfullstackapp.dto.loyalty;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminBonusPointsRequest {

    @NotNull(message = "User ID không được để trống")
    private UUID userId;

    private int points;

    private String reason;
}
