package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.entity.HarvestLot;
import com.example.myfullstackapp.entity.TraceabilityRecord;
import com.example.myfullstackapp.repository.HarvestLotRepository;
import com.example.myfullstackapp.repository.TraceabilityRecordRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/farmer")
@RequiredArgsConstructor
public class FarmerController {

    private static final DateTimeFormatter VN_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String DEFAULT_FARM_NAME = "Nông Trại Xanh Đà Lạt (Mã: NT-DL-01)";

    private final HarvestLotRepository harvestLotRepository;
    private final TraceabilityRecordRepository traceabilityRecordRepository;
    private final ObjectMapper objectMapper;

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
            return ResponseEntity.badRequest().body(ApiResponse.error("Mã lô không được để trống"));
        }
        if (req.getProduct() == null || req.getProduct().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tên nông sản không được để trống"));
        }
        if (req.getHarvestDate() == null || req.getHarvestDate().isBlank()
                || req.getExpiryDate() == null || req.getExpiryDate().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Ngày thu hoạch và hạn sử dụng không được để trống"));
        }
        if (!isPositiveNumber(req.getQty())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Sản lượng phải là số dương lớn hơn 0"));
        }

        String codeUpper = req.getCode().trim().toUpperCase();
        if (harvestLotRepository.existsByCodeIgnoreCase(codeUpper)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Mã lô " + codeUpper + " đã tồn tại!"));
        }

        req.setCode(codeUpper);
        req.setProduct(req.getProduct().trim());
        req.setQty(req.getQty().trim());
        if (req.getUnit() == null || req.getUnit().isBlank()) {
            req.setUnit("kg");
        }
        if (req.getStatus() == null || req.getStatus().isBlank()) {
            req.setStatus("Chờ duyệt xuất kho");
        }
        if (req.getStatusColor() == null || req.getStatusColor().isBlank()) {
            req.setStatusColor(resolveStatusColor(req.getStatus()));
        }
        if (req.getCert() == null || req.getCert().isBlank()) {
            req.setCert("VietGAP");
        }
        if (req.getFarmName() == null || req.getFarmName().isBlank()) {
            req.setFarmName(DEFAULT_FARM_NAME);
        }
        if (req.getTransportStatus() == null || req.getTransportStatus().isBlank()) {
            req.setTransportStatus("Chưa vận chuyển");
        }
        if (req.getTransportDestination() != null) {
            req.setTransportDestination(req.getTransportDestination().trim());
        }
        if (req.getCreatedAt() == null) {
            req.setCreatedAt(LocalDateTime.now());
        }

        // 1. Lưu lô vào bảng agri_harvest_lots
        HarvestLot saved = harvestLotRepository.save(req);

        // 2. Tự động đồng bộ sang bảng truy xuất nguồn gốc QR (agri_traceability)
        try {
            if (traceabilityRecordRepository.findByBatchCodeIgnoreCase(codeUpper).isEmpty()) {
                TraceabilityRecord traceRecord = buildTraceabilityRecord(saved);
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
        if (!harvestLotRepository.existsByCodeIgnoreCase(code.trim())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Không tìm thấy lô " + code));
        }
        String normalizedCode = code.trim();
        harvestLotRepository.deleteByCodeIgnoreCase(normalizedCode);
        traceabilityRecordRepository.findByBatchCodeIgnoreCase(normalizedCode)
                .ifPresent(traceabilityRecordRepository::delete);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa lô thành công", null));
    }

    private TraceabilityRecord buildTraceabilityRecord(HarvestLot lot) {
        List<Map<String, String>> initialSteps = new ArrayList<>();

        Map<String, String> planting = new LinkedHashMap<>();
        planting.put("stage", "Gieo trồng");
        planting.put("time", lot.getPlantingDate() != null && !lot.getPlantingDate().isBlank()
                ? lot.getPlantingDate()
                : "Chưa cập nhật");
        planting.put("note", "Phương pháp: " + (lot.getCultivation() != null && !lot.getCultivation().isBlank()
                ? lot.getCultivation()
                : "Theo quy trình an toàn"));
        initialSteps.add(planting);

        Map<String, String> harvest = new LinkedHashMap<>();
        harvest.put("stage", "Thu hoạch");
        harvest.put("time", lot.getHarvestDate());
        harvest.put("note", String.format("Sản lượng: %s %s - Tiêu chuẩn %s",
                lot.getQty(),
                lot.getUnit() != null ? lot.getUnit() : "kg",
                lot.getCert() != null ? lot.getCert() : "VietGAP"));
        initialSteps.add(harvest);

        String timelineJson = "[]";
        try {
            timelineJson = objectMapper.writeValueAsString(initialSteps);
        } catch (Exception ignored) {
        }

        return TraceabilityRecord.builder()
                .batchCode(lot.getCode())
                .productName(lot.getProduct())
                .farmName(lot.getFarmName() != null ? lot.getFarmName() : DEFAULT_FARM_NAME)
                .location(resolveFarmLocation(lot.getFarmName()))
                .harvestDate(lot.getHarvestDate())
                .certType(lot.getCert() != null ? lot.getCert() : "VietGAP")
                .labResult("Đạt chuẩn an toàn dư lượng thực phẩm (ISO/IEC 17025)")
                .tempAvg("4.5°C")
                .inspector("Chi cục Quản lý Chất lượng Nông Lâm & Thủy sản")
                .timelineJson(timelineJson)
                .build();
    }

    private String resolveFarmLocation(String farmName) {
        if (farmName == null || farmName.isBlank()) {
            return "Xã Xuân Thọ, TP. Đà Lạt, Tỉnh Lâm Đồng";
        }
        String lower = farmName.toLowerCase();
        if (lower.contains("cao lãnh") || lower.contains("đồng tháp") || lower.contains("nt-dt")) {
            return "Hợp tác xã Cao Lãnh, Đồng Tháp";
        }
        if (lower.contains("đà lạt") || lower.contains("nt-dl")) {
            return "Xã Xuân Thọ, TP. Đà Lạt, Tỉnh Lâm Đồng";
        }
        return farmName;
    }

    private String resolveStatusColor(String status) {
        if ("Đã duyệt xuất kho".equals(status)) return "#10b981";
        if ("Đang lưu kho lạnh".equals(status)) return "#3b82f6";
        return "#f59e0b";
    }

    private boolean isPositiveNumber(String qty) {
        if (qty == null || qty.isBlank()) {
            return false;
        }
        try {
            return Double.parseDouble(qty.trim()) > 0;
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    private void initSampleLots() {
        LocalDate today = LocalDate.now();
        HarvestLot b1 = HarvestLot.builder()
                .code("XL-2026-08")
                .product("Xà Lách Thủy Canh Lô Lô")
                .plantingDate(today.minusDays(32).format(VN_DATE_FMT))
                .harvestDate(today.minusDays(2).format(VN_DATE_FMT))
                .expiryDate(today.plusDays(12).format(VN_DATE_FMT))
                .qty("500")
                .unit("kg")
                .status("Đã duyệt xuất kho")
                .statusColor("#10b981")
                .cert("GlobalGAP")
                .cultivation("Thủy canh hồi lưu khép kín")
                .farmName(DEFAULT_FARM_NAME)
                .transportDestination("Kho Tổng Logistics TP.HCM")
                .transportStatus("Đang vận chuyển")
                .createdAt(LocalDateTime.now().minusDays(5))
                .build();

        HarvestLot b2 = HarvestLot.builder()
                .code("KL-2026-05")
                .product("Cải Kale Xoăn")
                .plantingDate(today.minusDays(35).format(VN_DATE_FMT))
                .harvestDate(today.minusDays(2).format(VN_DATE_FMT))
                .expiryDate(today.plusDays(15).format(VN_DATE_FMT))
                .qty("300")
                .unit("kg")
                .status("Đang lưu kho lạnh")
                .statusColor("#3b82f6")
                .cert("VietGAP")
                .cultivation("Nhà màng công nghệ cao")
                .farmName(DEFAULT_FARM_NAME)
                .transportDestination("Kho Lạnh Đà Lạt")
                .transportStatus("Chưa vận chuyển")
                .createdAt(LocalDateTime.now().minusDays(3))
                .build();

        HarvestLot b3 = HarvestLot.builder()
                .code("DT-2026-02")
                .product("Dâu Tây Giống Nhật")
                .plantingDate(today.minusDays(45).format(VN_DATE_FMT))
                .harvestDate(today.minusDays(1).format(VN_DATE_FMT))
                .expiryDate(today.plusDays(7).format(VN_DATE_FMT))
                .qty("150")
                .unit("kg")
                .status("Đang chăm sóc")
                .statusColor("#f59e0b")
                .cert("VietGAP")
                .cultivation("Giá thể xơ dừa hữu cơ")
                .farmName(DEFAULT_FARM_NAME)
                .transportDestination("Lưu tại vườn")
                .transportStatus("Chưa vận chuyển")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        harvestLotRepository.saveAll(List.of(b1, b2, b3));
    }
}
