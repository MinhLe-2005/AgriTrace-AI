package com.example.myfullstackapp.dto.content;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/** Dữ liệu tạo / cập nhật sự kiện từ trang admin. id do server sinh. */
@Data
public class CampaignRequest {
    @NotBlank(message = "Tên sự kiện không được để trống")
    @Size(max = 255)
    private String title;

    /** Để trống thì server tự sinh từ tiêu đề. */
    @Size(max = 160)
    private String slug;

    @NotBlank
    @Pattern(regexp = "harvest|seasonal|flash_sale|holiday|farmer_aid", message = "Loại sự kiện không hợp lệ")
    private String type;

    @Size(max = 100)
    private String typeLabel;

    @Size(max = 160)
    private String typeColor;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate endDate;

    @NotNull
    @Min(value = 0, message = "Phần trăm giảm không được âm")
    @Max(value = 90, message = "Phần trăm giảm tối đa 90%")
    private Integer discountPercent;

    @PositiveOrZero
    private Long discountAmount;

    @NotBlank
    @Pattern(regexp = "all|category|product", message = "Phạm vi áp dụng không hợp lệ")
    private String targetType;

    private List<@Size(max = 100) String> targetCategoryCodes;
    private List<@Size(max = 100) String> targetProductIds;
    private List<@Size(max = 160) String> targetProductNames;

    @Size(max = 64)
    private String voucherCode;

    @Size(max = 32)
    private String bannerIcon;

    @Size(max = 100)
    private String badgeText;

    @Size(max = 2000)
    private String description;

    @Size(max = 50000)
    private String fullContent;

    private Boolean active;
}
