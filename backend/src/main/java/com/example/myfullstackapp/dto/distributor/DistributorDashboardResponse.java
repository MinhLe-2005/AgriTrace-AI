package com.example.myfullstackapp.dto.distributor;

public record DistributorDashboardResponse(
        long activeShipments,
        long preparingShipments,
        long deliveredToday,
        long pendingReceipts,
        Double averageTemperatureC,
        long pendingDeliveryOrders,
        long deliveredThisMonth,
        long overdueShipments,
        long expiringLots
) { }
