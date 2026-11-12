package com.example.myfullstackapp.dto.content;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Dữ liệu tạo / cập nhật bài viết từ trang admin. id do server sinh. */
@Data
public class BlogPostRequest {
    @NotBlank(message = "Tiêu đề bài viết không được để trống")
    @Size(max = 255)
    private String title;

    /** Để trống thì server tự sinh từ tiêu đề. */
    @Size(max = 160)
    private String slug;

    @NotBlank
    @Pattern(regexp = "all|ai|season|standard|guide", message = "Chuyên mục không hợp lệ")
    private String category;

    @Size(max = 100)
    private String categoryLabel;

    @Size(max = 160)
    private String author;

    @Size(max = 160)
    private String authorRole;

    @Size(max = 32)
    private String date;

    @Size(max = 32)
    private String readTime;

    @Size(max = 2000)
    private String excerpt;

    @Size(max = 100000)
    private String content;

    @Size(max = 500)
    private String coverImage;

    private Boolean featured;

    @Size(max = 255)
    private String relatedProductName;

    private Boolean active;
}
