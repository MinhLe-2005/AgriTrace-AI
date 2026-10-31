package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.entity.TraceabilityRecord;
import com.example.myfullstackapp.repository.TraceabilityRecordRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/traceability")
@RequiredArgsConstructor
public class TraceabilityController {

    private final TraceabilityRecordRepository traceabilityRecordRepository;

    @PostConstruct
    public void initSeedData() {
        if (traceabilityRecordRepository.count() == 0) {
            traceabilityRecordRepository.saveAll(List.of(
                TraceabilityRecord.builder()
                    .batchCode("XL-2026-08")
                    .productName("Xà Lách Thủy Canh Lô Lô Xanh")
                    .farmName("Nông Trại Xanh Đà Lạt (Farm ID: NT-DL-01)")
                    .location("Xã Xuân Thọ, TP. Đà Lạt, Tỉnh Lâm Đồng")
                    .harvestDate("14/10/2026 (05:30 Sáng)")
                    .certType("GlobalGAP #GG-VN-2024-910")
                    .labResult("Đạt tiêu chuẩn an toàn sinh học xuất khẩu 100%")
                    .tempAvg("5.2°C")
                    .inspector("Quatest 1")
                    .timelineJson("[]")
                    .build(),
                TraceabilityRecord.builder()
                    .batchCode("DT-MC-2026-11")
                    .productName("Dâu Tây Giống Nhật Mộc Châu")
                    .farmName("Hợp tác xã Nông nghiệp Mộc Châu Eco")
                    .location("Thị trấn Nông Trường, Huyện Mộc Châu, Sơn La")
                    .harvestDate("13/10/2026 (06:00 Sáng)")
                    .certType("VietGAP #VG-SL-2025-442")
                    .labResult("Đạt chuẩn an toàn VietGAP loại A")
                    .tempAvg("3.5°C")
                    .inspector("NIFC")
                    .timelineJson("[]")
                    .build(),
                TraceabilityRecord.builder()
                    .batchCode("CS-BG-2026-03")
                    .productName("Cam Sành Bố Hạ Mọng Nước")
                    .farmName("HTX Trái Cây Bố Hạ Bắc Giang")
                    .location("Xã Bố Hạ, Huyện Yên Thế, Tỉnh Bắc Giang")
                    .harvestDate("11/10/2026")
                    .certType("Hữu cơ (Organic BioCert #OB-2024)")
                    .labResult("Chứng nhận Nông sản Hữu cơ 100%")
                    .tempAvg("9.0°C")
                    .inspector("QUACERT")
                    .timelineJson("[]")
                    .build()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<TraceabilityRecord>> getAllRecords() {
        return ResponseEntity.ok(traceabilityRecordRepository.findAll());
    }

    @GetMapping("/{batchCode}")
    public ResponseEntity<TraceabilityRecord> getByBatchCode(@PathVariable String batchCode) {
        return traceabilityRecordRepository.findByBatchCodeIgnoreCase(batchCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
