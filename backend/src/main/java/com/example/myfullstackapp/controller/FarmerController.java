package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.entity.HarvestLot;
import com.example.myfullstackapp.entity.TraceabilityRecord;
import com.example.myfullstackapp.repository.HarvestLotRepository;
import com.example.myfullstackapp.repository.TraceabilityRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/farmer")
@RequiredArgsConstructor
public class FarmerController {

    private final HarvestLotRepository harvestLotRepository;
    private final TraceabilityRecordRepository traceabilityRecordRepository;

    @GetMapping("/batches")
    public ResponseEntity<List<HarvestLot>> getAllBatches() {
        List<HarvestLot> lots = harvestLotRepository.findAllByOrderByCreatedAtDesc();
        if (lots.isEmpty()) {
            initSampleLots();
            lots = harvestLotRepository.findAllByOrderByCreatedAtDesc();
        }
        return ResponseEntity.ok(lots);
    }

    @GetMapping("/batches/{code}")
    public ResponseEntity<HarvestLot> getBatchByCode(@PathVariable String code) {
        return harvestLotRepository.findByCodeIgnoreCase(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/batches")
    @Transactional
    public ResponseEntity<ApiResponse<HarvestLot>> createBatch(@RequestBody HarvestLot req) {
        if (req.getCode() == null || req.getCode().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.ok("Mã lô không được để trống", null));
        }

        String codeUpper = req.getCode().trim().toUpperCase();
        if (harvestLotRepository.existsByCodeIgnoreCase(codeUpper)) {
            return ResponseEntity.badRequest().body(ApiResponse.ok("Mã lô " + codeUpper + " đã tồn tại!", null));
        }

        req.setCode(codeUpper);
        if (req.getCreatedAt() == null) {
            req.setCreatedAt(LocalDateTime.now());
        }

        // 1. Lưu lô vào bảng agri_harvest_lots
        HarvestLot saved = harvestLotRepository.save(req);

        // 2. Tự động đồng bộ sang bảng truy xuất nguồn gốc QR (agri_traceability)
        try {
            if (traceabilityRecordRepository.findByBatchCodeIgnoreCase(codeUpper).isEmpty()) {
                String timeline = String.format(
                    "[{\"stage\":\"Gieo trồng\",\"time\":\"%s\",\"note\":\"Phương pháp: %s\"}," +
                     "{\"stage\":\"Thu hoạch\",\"time\":\"%s\",\"note\":\"Sản lượng: %s %s - Tiêu chuẩn %s\"}]",
                    req.getPlantingDate() != null ? req.getPlantingDate() : "Chưa cập nhật",
                    req.getCultivation() != null ? req.getCultivation() : "Theo quy trình an toàn",
                    req.getHarvestDate(),
                    req.getQty(),
                    req.getUnit() != null ? req.getUnit() : "kg",
                    req.getCert() != null ? req.getCert() : "VietGAP"
                );

                TraceabilityRecord traceRecord = TraceabilityRecord.builder()
                        .batchCode(codeUpper)
                        .productName(req.getProduct())
                        .farmName(req.getFarmName() != null ? req.getFarmName() : "Nông Trại Xanh Đà Lạt (Mã: NT-DL-01)")
                        .location("Xã Xuân Thọ, TP. Đà Lạt, Tỉnh Lâm Đồng")
                        .harvestDate(req.getHarvestDate())
                        .certType(req.getCert() != null ? req.getCert() : "VietGAP")
                        .labResult("Đạt chuẩn an toàn dư lượng thực phẩm (ISO/IEC 17025)")
                        .tempAvg("4.5°C")
                        .inspector("Chi cục Quản lý Chất lượng Nông Lâm & Thủy sản")
                        .timelineJson(timeline)
                        .build();

                traceabilityRecordRepository.save(traceRecord);
            }
        } catch (Exception ignored) {
            // Đồng bộ QR không ảnh hưởng tới việc lưu lô chính
        }

        return ResponseEntity.ok(ApiResponse.ok("Tạo lô thu hoạch thành công!", saved));
    }

    @DeleteMapping("/batches/{code}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteBatch(@PathVariable String code) {
        harvestLotRepository.deleteByCodeIgnoreCase(code);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa lô thành công", null));
    }

    private void initSampleLots() {
        HarvestLot b1 = HarvestLot.builder()
                .code("XL-2026-08")
                .product("Xà Lách Thủy Canh Lô Lô")
                .plantingDate("15/09/2026")
                .harvestDate("14/10/2026")
                .expiryDate("28/10/2026")
                .qty("500")
                .unit("kg")
                .status("Đã duyệt xuất kho")
                .statusColor("#10b981")
                .cert("GlobalGAP")
                .cultivation("Thủy canh hồi lưu khép kín")
                .farmName("Nông Trại Xanh Đà Lạt (Mã: NT-DL-01)")
                .createdAt(LocalDateTime.now().minusDays(5))
                .build();

        HarvestLot b2 = HarvestLot.builder()
                .code("KL-2026-05")
                .product("Cải Kale Xoăn")
                .plantingDate("01/09/2026")
                .harvestDate("14/10/2026")
                .expiryDate("28/10/2026")
                .qty("300")
                .unit("kg")
                .status("Đang lưu kho lạnh")
                .statusColor("#3b82f6")
                .cert("VietGAP")
                .cultivation("Nhà màng công nghệ cao")
                .farmName("Nông Trại Xanh Đà Lạt (Mã: NT-DL-01)")
                .createdAt(LocalDateTime.now().minusDays(3))
                .build();

        HarvestLot b3 = HarvestLot.builder()
                .code("DT-2026-02")
                .product("Dâu Tây Giống Nhật")
                .plantingDate("10/08/2026")
                .harvestDate("16/10/2026")
                .expiryDate("23/10/2026")
                .qty("150")
                .unit("kg")
                .status("Đang chăm sóc")
                .statusColor("#f59e0b")
                .cert("VietGAP")
                .cultivation("Giá thể xơ dừa hữu cơ")
                .farmName("Nông Trại Xanh Đà Lạt (Mã: NT-DL-01)")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        harvestLotRepository.saveAll(List.of(b1, b2, b3));
    }
}
