package com.example.myfullstackapp.dto.order;

import lombok.Data;

@Data
public class CancelOrderRequest {
    private String reason = "Khách hàng yêu cầu hủy đơn";

    /** Khách vãng lai xác minh quyền hủy bằng SĐT người nhận. */
    private String phone;
}
