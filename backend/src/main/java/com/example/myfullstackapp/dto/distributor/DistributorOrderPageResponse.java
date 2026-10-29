package com.example.myfullstackapp.dto.distributor;

import com.example.myfullstackapp.entity.Order;

import java.util.List;

public record DistributorOrderPageResponse(
        List<Order> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) { }
