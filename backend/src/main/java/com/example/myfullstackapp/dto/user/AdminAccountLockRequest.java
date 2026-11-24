package com.example.myfullstackapp.dto.user;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Idempotent administrative account lock or unlock command. */
public record AdminAccountLockRequest(
        @NotNull(message = "Trạng thái khoá là bắt buộc") Boolean locked,
        @Size(max = 500, message = "Lý do khoá không được vượt quá 500 ký tự") String reason
) { }
