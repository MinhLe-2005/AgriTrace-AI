package com.example.myfullstackapp.dto.order;

import lombok.Data;

@Data
public class CancelOrderRequest {
    private String reason = "Khách hàng yêu cầu hủy đơn";
}
