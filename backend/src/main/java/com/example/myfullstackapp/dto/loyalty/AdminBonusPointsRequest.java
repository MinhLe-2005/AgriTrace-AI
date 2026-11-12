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

    @NotNull(message = "Số điểm không được để trống")
    @jakarta.validation.constraints.Min(value = -100000, message = "Không được trừ quá 100.000 điểm mỗi lần")
    @jakarta.validation.constraints.Max(value = 100000, message = "Không được cộng quá 100.000 điểm mỗi lần")
    private Integer points;

    private String reason;
}
