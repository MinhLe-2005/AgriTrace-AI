package com.example.myfullstackapp.dto.voucher;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Dữ liệu tạo voucher từ trang admin. Không có trường id để tránh ghi đè voucher sẵn có. */
@Data
public class CreateVoucherRequest {
    @NotBlank(message = "Mã voucher không được để trống")
    @Size(max = 64, message = "Mã voucher tối đa 64 ký tự")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Mã voucher chỉ gồm chữ, số, '-' hoặc '_'")
    private String code;

    @NotBlank(message = "Tiêu đề voucher không được để trống")
    @Size(max = 255)
    private String title;

    @Size(max = 255)
    private String description;

    @Size(max = 64)
    private String badge;

    @Size(max = 64)
    private String badgeColor;

    @NotBlank(message = "Mức giảm không được để trống")
    @Size(max = 32)
    private String discount;

    @Size(max = 64)
    private String minOrder;

    @Size(max = 64)
    private String exp;

    private Boolean active;
}
