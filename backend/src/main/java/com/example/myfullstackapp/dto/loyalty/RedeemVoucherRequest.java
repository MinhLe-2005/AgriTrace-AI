package com.example.myfullstackapp.dto.loyalty;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RedeemVoucherRequest {

    @Min(value = 10, message = "Số điểm đổi tối thiểu là 10 điểm")
    private int pointsCost;

    @NotBlank(message = "Loại voucher không được để trống")
    private String voucherType; // DISCOUNT10, FREESHIP, DISCOUNT30, DISCOUNT50

    @NotBlank(message = "Tiêu đề voucher không được để trống")
    private String title;

    private String userEmail;
}
