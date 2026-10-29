package com.example.myfullstackapp.dto.payment;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreatePaymentLinkRequest {
    @NotBlank(message = "Mã đơn hàng không được để trống")
    private String orderCode;
    private String returnUrl;
    private String cancelUrl;
}
