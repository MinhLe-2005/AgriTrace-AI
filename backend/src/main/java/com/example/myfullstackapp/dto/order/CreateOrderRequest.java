package com.example.myfullstackapp.dto.order;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderRequest {
    private String userEmail;

    @NotBlank(message = "Họ tên người nhận không được để trống")
    private String receiverName;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String receiverPhone;

    @NotBlank(message = "Địa chỉ nhận hàng không được để trống")
    private String receiverAddress;

    private String deliverySlot;
    private String deliveryNote;
    private String paymentMethod;
    private String voucherUsed;
    private Long subtotal;
    private Long shippingFee;
    private Long discount;
    private Long total;
    private Integer pointsAwarded;
    private String lotCode;
    private List<OrderItemDto> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemDto {
        private String name;
        private String origin;
        private String cert;
        private String qty;
        private Long price;
        private String image;
    }
}
