package com.example.myfullstackapp.service;

import com.example.myfullstackapp.entity.HarvestLot;
import com.example.myfullstackapp.entity.TraceabilityRecord;
import com.example.myfullstackapp.repository.HarvestLotRepository;
import com.example.myfullstackapp.repository.TraceabilityRecordRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Syncs confirmed warehouse inbound receipts back to Farmer harvest lots,
 * QR traceability timelines, and live SSE subscribers.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FarmerWarehouseInboundListener {

    private static final DateTimeFormatter TS_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final HarvestLotRepository harvestLotRepository;
    private final TraceabilityRecordRepository traceabilityRecordRepository;
    private final FarmerBatchEventStream batchEventStream;
    private final ObjectMapper objectMapper;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onWarehouseInboundConfirmed(WarehouseLotInboundEvent event) {
        if (event == null || event.lotCodes() == null || event.lotCodes().isEmpty()) {
            return;
        }
        String warehouseName = event.warehouseName() != null && !event.warehouseName().isBlank()
                ? event.warehouseName().trim()
                : "Kho Lạnh Trung Tâm AgriTrace";
        String staffName = event.actor() != null && !event.actor().isBlank()
                ? event.actor().trim()
                : "Thủ kho hệ thống";

        for (String code : event.lotCodes()) {
            try {
                Optional<HarvestLot> lotOpt = harvestLotRepository.findByCodeIgnoreCase(code.trim());
                if (lotOpt.isEmpty()) {
                    continue;
                }
                HarvestLot lot = lotOpt.get();
                lot.setTransportStatus("Đã nhập kho đích");
                lot.setTransportDestination(warehouseName);
                HarvestLot saved = harvestLotRepository.save(lot);

                appendInboundTimeline(saved, warehouseName, staffName);
                batchEventStream.broadcastBatchChanged(
                        saved,
                        "WAREHOUSE_INBOUND",
                        "Thủ kho " + staffName + " đã xác nhận nhập kho tại " + warehouseName,
                        "WAREHOUSE"
                );
            } catch (Exception ex) {
                log.warn("Không thể đồng bộ trạng thái nhập kho cho lô {}: {}", code, ex.getMessage());
            }
        }
    }

    private void appendInboundTimeline(HarvestLot lot, String warehouseName, String staffName) {
        TraceabilityRecord record = traceabilityRecordRepository
                .findByBatchCodeIgnoreCase(lot.getCode())
                .orElseGet(() -> TraceabilityRecord.builder()
                        .batchCode(lot.getCode())
                        .productName(lot.getProduct())
                        .farmName(lot.getFarmName())
                        .harvestDate(lot.getHarvestDate())
                        .certType(lot.getCert())
                        .timelineJson("[]")
                        .build());

        List<Map<String, String>> timeline = new ArrayList<>();
        if (record.getTimelineJson() != null && !record.getTimelineJson().isBlank()) {
            try {
                timeline = objectMapper.readValue(
                        record.getTimelineJson(),
                        new TypeReference<List<Map<String, String>>>() {}
                );
            } catch (Exception ignored) {
                timeline = new ArrayList<>();
            }
        }

        Map<String, String> entry = new LinkedHashMap<>();
        entry.put("stage", "Nhập kho đích");
        entry.put("time", LocalDateTime.now().format(TS_FMT));
        entry.put("badge", "Đã nhập kho đích");
        entry.put("note", String.format(
                "Thủ kho %s đã xác nhận nhập kho thực tế tại %s. Tồn kho sẵn sàng điều phối theo chuẩn FEFO.",
                staffName, warehouseName
        ));
        int existingIdx = -1;
        for (int i = 0; i < timeline.size(); i++) {
            Map<String, String> prev = timeline.get(i);
            if ("Nhập kho đích".equals(prev.get("stage"))
                    && prev.get("note") != null
                    && prev.get("note").contains(warehouseName)) {
                existingIdx = i;
                break;
            }
        }
        if (existingIdx >= 0) {
            timeline.set(existingIdx, entry);
        } else {
            timeline.add(entry);
        }

        try {
            record.setTimelineJson(objectMapper.writeValueAsString(timeline));
            traceabilityRecordRepository.save(record);
        } catch (Exception ex) {
            log.warn("Không thể ghi timeline nhập kho cho lô {}: {}", lot.getCode(), ex.getMessage());
        }
    }
}
