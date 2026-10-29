package com.example.myfullstackapp.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentLinkResponse {
    private String orderCode;
    private Long amount;
    private String checkoutUrl;
    private String qrCode;
    private String paymentLinkId;
    private String status;
    private String accountNumber;
    private String accountName;
    private String bankName;
    private String bin;
    private String description;
}
