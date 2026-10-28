package com.example.myfullstackapp.dto.warehouse;

import jakarta.validation.constraints.NotNull;

public record ActiveStatusRequest(@NotNull Boolean active) { }
