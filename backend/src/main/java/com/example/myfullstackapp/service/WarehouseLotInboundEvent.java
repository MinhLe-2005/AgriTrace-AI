package com.example.myfullstackapp.service;

import java.util.List;

/**
 * Published after a warehouse confirms an INBOUND receipt so Farmer lots and SSE subscribers update automatically.
 */
public record WarehouseLotInboundEvent(
        String warehouseName,
        String actor,
        List<String> lotCodes
) {
}
