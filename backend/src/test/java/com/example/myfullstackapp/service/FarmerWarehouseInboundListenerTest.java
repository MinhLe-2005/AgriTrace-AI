package com.example.myfullstackapp.service;

import com.example.myfullstackapp.entity.HarvestLot;
import com.example.myfullstackapp.entity.TraceabilityRecord;
import com.example.myfullstackapp.repository.HarvestLotRepository;
import com.example.myfullstackapp.repository.TraceabilityRecordRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class FarmerWarehouseInboundListenerTest {

    @Test
    void updatesLotStatusRecordsTraceabilityAndBroadcastsSseOnWarehouseConfirm() throws Exception {
        HarvestLotRepository lots = mock(HarvestLotRepository.class);
        TraceabilityRecordRepository traces = mock(TraceabilityRecordRepository.class);
        FarmerBatchEventStream stream = mock(FarmerBatchEventStream.class);
        ObjectMapper mapper = new ObjectMapper();

        HarvestLot lot = HarvestLot.builder()
                .code("XL-2026-08")
                .product("Xà Lách Lô Lô")
                .harvestDate("20/11/2026")
                .expiryDate("30/11/2026")
                .qty("500")
                .unit("kg")
                .status("Đã duyệt xuất kho")
                .transportStatus("Đang vận chuyển")
                .build();

        TraceabilityRecord trace = TraceabilityRecord.builder()
                .batchCode("XL-2026-08")
                .timelineJson("[]")
                .build();

        when(lots.findByCodeIgnoreCase("XL-2026-08")).thenReturn(Optional.of(lot));
        when(lots.save(any(HarvestLot.class))).thenAnswer(inv -> inv.getArgument(0));
        when(traces.findByBatchCodeIgnoreCase("XL-2026-08")).thenReturn(Optional.of(trace));
        when(traces.save(any(TraceabilityRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        FarmerWarehouseInboundListener listener = new FarmerWarehouseInboundListener(lots, traces, stream, mapper);
        listener.onWarehouseInboundConfirmed(new WarehouseLotInboundEvent("Kho Lạnh Tân Bình", "Thủ kho An", List.of("XL-2026-08")));

        assertEquals("Đã nhập kho đích", lot.getTransportStatus());
        assertEquals("Kho Lạnh Tân Bình", lot.getTransportDestination());
        assertTrue(trace.getTimelineJson().contains("Đã nhập kho đích"));
        verify(stream).broadcastBatchChanged(eq(lot), eq("WAREHOUSE_INBOUND"), anyString(), eq("WAREHOUSE"));

        listener.onWarehouseInboundConfirmed(new WarehouseLotInboundEvent("Kho Lạnh Tân Bình", "Thủ kho Bình", List.of("XL-2026-08")));
        assertEquals(1, mapper.readTree(trace.getTimelineJson()).size());
    }
}
