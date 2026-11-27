package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.entity.Farm;
import com.example.myfullstackapp.entity.FarmerCertificate;
import com.example.myfullstackapp.entity.FarmerUploadedMedia;
import com.example.myfullstackapp.entity.FarmingLog;
import com.example.myfullstackapp.entity.HarvestLot;
import com.example.myfullstackapp.entity.RoleName;
import com.example.myfullstackapp.entity.TraceabilityRecord;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.repository.FarmRepository;
import com.example.myfullstackapp.repository.FarmerCertificateRepository;
import com.example.myfullstackapp.repository.FarmingLogRepository;
import com.example.myfullstackapp.repository.HarvestLotRepository;
import com.example.myfullstackapp.repository.TraceabilityRecordRepository;
import com.example.myfullstackapp.repository.UserRepository;
import com.example.myfullstackapp.service.EmailService;
import com.example.myfullstackapp.service.FarmerBatchEventStream;
import com.example.myfullstackapp.service.FarmerCertificateScheduler;
import com.example.myfullstackapp.service.FarmerMediaStorageService;
import com.example.myfullstackapp.service.FarmerOwnershipResolver;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@RestController
@RequestMapping("/api/v1/farmer")
@RequiredArgsConstructor
public class FarmerController {

    private static final DateTimeFormatter VN_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String DEFAULT_FARM_NAME = "Nông Trại Xanh Đà Lạt (Mã: NT-DL-01)";

    private final HarvestLotRepository harvestLotRepository;
    private final TraceabilityRecordRepository traceabilityRecordRepository;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;
    private final FarmerCertificateRepository certificateRepository;
    private final FarmerCertificateScheduler certificateScheduler;
    private final UserRepository userRepository;
    private final FarmingLogRepository farmingLogRepository;
    private final FarmerBatchEventStream batchEventStream;
    private final FarmRepository farmRepository;
    private final FarmerMediaStorageService mediaStorageService;
    private final FarmerOwnershipResolver ownershipResolver;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.example.myfullstackapp.service.FarmerDemandForecastService demandForecastService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.example.myfullstackapp.repository.CropSeasonRepository cropSeasonRepository;

    @PostMapping(value = "/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FarmerMediaStorageService.StoredMediaResult>> uploadProofImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String ownerId,
            @RequestParam(required = false, defaultValue = "farming-log") String category
    ) {
        try {
            String effectiveOwner = ownershipResolver.resolveEffectiveOwnerId(ownerId, null);
            FarmerMediaStorageService.StoredMediaResult result =
                    mediaStorageService.storeImage(file, effectiveOwner, category);
            return ResponseEntity.ok(ApiResponse.ok("Tải ảnh minh chứng lên hệ thống thành công!", result));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        } catch (Exception ex) {
            log.warn("Lỗi lưu tệp ảnh minh chứng: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Không thể lưu ảnh minh chứng: " + ex.getMessage()));
        }
    }

    @GetMapping("/uploads/{id}")
    public ResponseEntity<byte[]> getUploadedMedia(@PathVariable UUID id) {
        return mediaStorageService.getMedia(id)
                .map(media -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, media.getContentType())
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + media.getFileName() + "\"")
                        .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                        .body(media.getData()))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/farms")
    public ResponseEntity<List<Farm>> getAllFarms(@RequestParam(required = false) String ownerId) {
        List<Farm> farms = farmRepository.findAllByOrderByIdAsc();
        if (farms.isEmpty()) {
            initSampleFarms();
            farms = farmRepository.findAllByOrderByIdAsc();
        }
        farms.forEach(f -> {
            if (f.getVerificationStatus() == null || f.getVerificationStatus().isBlank()) {
                f.setVerificationStatus("APPROVED");
            }
        });
        Authentication auth = ownershipResolver.currentAuthentication();
        if (ownershipResolver.isStrictFarmerSession(auth) || (ownerId != null && !ownerId.isBlank())) {
            String effectiveOwner = ownershipResolver.resolveEffectiveOwnerId(ownerId, null);
            farms = farms.stream()
                    .filter(f -> f.getOwnerId() != null && f.getOwnerId().equalsIgnoreCase(effectiveOwner))
                    .toList();
        }
        return ResponseEntity.ok(farms);
    }

    @PostMapping("/farms")
    @Transactional
    public ResponseEntity<ApiResponse<Farm>> createFarm(@RequestBody Farm req) {
        if (req.getCode() == null || req.getCode().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Mã nông trại không được để trống"));
        }
        if (req.getName() == null || req.getName().isBlank() || req.getAddress() == null || req.getAddress().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tên và địa chỉ nông trại không được để trống"));
        }
        if (req.getAreaHectares() == null || req.getAreaHectares() <= 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Quy mô diện tích phải lớn hơn 0 ha"));
        }
        String codeUpper = req.getCode().trim().toUpperCase(Locale.ROOT);
        if (farmRepository.existsByCodeIgnoreCase(codeUpper)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Mã nông trại " + codeUpper + " đã tồn tại!"));
        }
        String effectiveOwner = ownershipResolver.resolveEffectiveOwnerId(req.getOwnerId(), codeUpper);
        req.setId(null);
        req.setCode(codeUpper);
        req.setName(req.getName().trim());
        req.setOwner(req.getOwner() != null && !req.getOwner().isBlank() ? req.getOwner().trim() : "Chủ trang trại");
        req.setOwnerId(effectiveOwner);
        req.setAddress(req.getAddress().trim());
        if (req.getProvince() != null) req.setProvince(req.getProvince().trim());
        if (req.getPhone() != null) req.setPhone(req.getPhone().trim());
        if (req.getCertStandard() == null || req.getCertStandard().isBlank()) {
            req.setCertStandard("VietGAP Trồng trọt");
        }
        if (req.getRating() == null) req.setRating(5.0);
        if (req.getIsDefault() == null) req.setIsDefault(false);

        boolean hasLandDoc = req.getVerificationDocUrl() != null && !req.getVerificationDocUrl().isBlank();
        if (hasLandDoc) {
            req.setVerificationStatus("PENDING");
            req.setVerificationDocType(
                    req.getVerificationDocType() != null && !req.getVerificationDocType().isBlank()
                            ? req.getVerificationDocType().trim()
                            : "Giấy chứng nhận QSDĐ (Sổ đỏ) / Hợp đồng thuê đất canh tác"
            );
            req.setVerificationDocUrl(req.getVerificationDocUrl().trim());
            req.setVerificationNote(
                    req.getVerificationNote() != null && !req.getVerificationNote().isBlank()
                            ? req.getVerificationNote().trim()
                            : null
            );
        } else {
            req.setVerificationStatus("NOT_SUBMITTED");
            req.setVerificationDocType(null);
            req.setVerificationDocUrl(null);
            req.setVerificationNote(null);
        }
        req.setVerificationDecisionReason(null);
        req.setVerificationRequestId(null);

        Farm saved = farmRepository.save(req);
        String msg = hasLandDoc
                ? "Đã thêm nông trại và gửi hồ sơ giấy tờ đất canh tác chờ Admin duyệt!"
                : "Đã thêm nông trại mới! Vui lòng đính kèm hồ sơ giấy tờ đất canh tác.";
        return ResponseEntity.ok(ApiResponse.ok(msg, saved));
    }

    @PutMapping("/farms/{idOrCode}")
    @Transactional
    public ResponseEntity<ApiResponse<Farm>> updateFarm(
            @PathVariable String idOrCode,
            @RequestBody Farm req
    ) {
        Farm existing = findFarmByIdOrCode(idOrCode);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Không tìm thấy nông trại " + idOrCode));
        }
        if (!ownershipResolver.canModifyOwnedResource(existing.getOwnerId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Bạn không có quyền chỉnh sửa nông trại của chủ vườn khác!"));
        }
        if (req.getName() != null && !req.getName().isBlank()) existing.setName(req.getName().trim());
        if (req.getOwner() != null && !req.getOwner().isBlank()) existing.setOwner(req.getOwner().trim());
        if (req.getPhone() != null) existing.setPhone(req.getPhone().trim());
        if (req.getAddress() != null && !req.getAddress().isBlank()) existing.setAddress(req.getAddress().trim());
        if (req.getProvince() != null) existing.setProvince(req.getProvince().trim());
        if (req.getAreaHectares() != null && req.getAreaHectares() > 0) existing.setAreaHectares(req.getAreaHectares());
        if (req.getCertStandard() != null && !req.getCertStandard().isBlank()) existing.setCertStandard(req.getCertStandard().trim());

        Farm saved = farmRepository.save(existing);
        return ResponseEntity.ok(ApiResponse.ok("Đã cập nhật thông tin nông trại!", saved));
    }

    @DeleteMapping("/farms/{idOrCode}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteFarm(@PathVariable String idOrCode) {
        Farm existing = findFarmByIdOrCode(idOrCode);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Không tìm thấy nông trại " + idOrCode));
        }
        if (!ownershipResolver.canModifyOwnedResource(existing.getOwnerId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Bạn không có quyền xóa nông trại của chủ vườn khác!"));
        }
        farmRepository.delete(existing);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa nông trại thành công", null));
    }

    @PostMapping({"/farms/{idOrCode}/land-docs", "/farms/{idOrCode}/resubmit-verification"})
    @Transactional
    public ResponseEntity<ApiResponse<Farm>> resubmitFarmVerification(
            @PathVariable String idOrCode,
            @RequestBody Map<String, String> payload
    ) {
        Farm existing = findFarmByIdOrCode(idOrCode);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Không tìm thấy nông trại " + idOrCode));
        }
        if (!ownershipResolver.canModifyOwnedResource(existing.getOwnerId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Bạn không có quyền nộp hồ sơ đất canh tác cho nông trại khác!"));
        }
        String docUrl = payload != null
                ? firstNonBlank(payload.get("verificationDocUrl"), payload.get("documentUrl"))
                : null;
        if (docUrl == null || docUrl.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Vui lòng đính kèm ảnh hoặc tài liệu giấy tờ đất canh tác!"));
        }
        String docType = payload != null
                ? firstNonBlank(payload.get("verificationDocType"), payload.get("documentType"))
                : null;
        String note = payload != null
                ? firstNonBlank(payload.get("verificationNote"), payload.get("note"))
                : null;

        existing.setVerificationDocType(
                docType != null ? docType : (existing.getVerificationDocType() != null
                        ? existing.getVerificationDocType()
                        : "Giấy chứng nhận QSDĐ (Sổ đỏ) / Hợp đồng thuê đất canh tác")
        );
        existing.setVerificationDocUrl(docUrl);
        existing.setVerificationNote(note);
        existing.setVerificationStatus("PENDING");
        existing.setVerificationDecisionReason(null);

        Farm saved = farmRepository.save(existing);
        return ResponseEntity.ok(ApiResponse.ok("Đã đính kèm hồ sơ giấy tờ đất canh tác! Đang chờ Admin duyệt.", saved));
    }

    @PatchMapping("/farms/{idOrCode}/verification-decision")
    @Transactional
    public ResponseEntity<ApiResponse<Farm>> decideFarmVerification(
            @PathVariable String idOrCode,
            @RequestBody Map<String, String> payload
    ) {
        Authentication auth = ownershipResolver.currentAuthentication();
        boolean isAdmin = auth != null && auth.isAuthenticated() && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Chỉ Quản trị viên (ADMIN) mới có quyền duyệt hồ sơ đất nông trại!"));
        }

        Farm existing = findFarmByIdOrCode(idOrCode);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Không tìm thấy nông trại " + idOrCode));
        }

        String action = payload != null && payload.get("action") != null
                ? payload.get("action").trim().toLowerCase(Locale.ROOT)
                : "";
        String reason = payload != null && payload.get("reason") != null
                ? payload.get("reason").trim()
                : "";

        switch (action) {
            case "approve" -> {
                existing.setVerificationStatus("APPROVED");
                existing.setVerificationDecisionReason(
                        reason.isBlank() ? "Hồ sơ giấy tờ đất canh tác hợp lệ, đã xác minh vùng trồng." : reason
                );
            }
            case "changes" -> {
                if (reason.isBlank()) {
                    return ResponseEntity.badRequest().body(ApiResponse.error("Vui lòng nhập nội dung cần nông dân bổ sung!"));
                }
                existing.setVerificationStatus("CHANGES_REQUESTED");
                existing.setVerificationDecisionReason(reason);
            }
            case "reject" -> {
                if (reason.isBlank()) {
                    return ResponseEntity.badRequest().body(ApiResponse.error("Vui lòng nhập lý do từ chối hồ sơ!"));
                }
                existing.setVerificationStatus("REJECTED");
                existing.setVerificationDecisionReason(reason);
            }
            default -> {
                return ResponseEntity.badRequest().body(ApiResponse.error("Hành động duyệt hồ sơ không hợp lệ: " + action));
            }
        }

        Farm saved = farmRepository.save(existing);
        String msg = switch (action) {
            case "approve" -> "Đã xác minh hồ sơ đất nông trại " + saved.getName() + "!";
            case "changes" -> "Đã gửi yêu cầu bổ sung giấy tờ đất cho nông trại " + saved.getName() + ".";
            default -> "Đã từ chối hồ sơ nông trại " + saved.getName() + ".";
        };
        return ResponseEntity.ok(ApiResponse.ok(msg, saved));
    }

    private static String firstNonBlank(String primary, String secondary) {
        if (primary != null && !primary.isBlank()) return primary.trim();
        if (secondary != null && !secondary.isBlank()) return secondary.trim();
        return null;
    }

    private Farm findFarmByIdOrCode(String idOrCode) {
        if (idOrCode == null || idOrCode.isBlank()) return null;
        String clean = idOrCode.trim();
        Farm byCode = farmRepository.findByCodeIgnoreCase(clean).orElse(null);
        if (byCode != null) return byCode;
        try {
            return farmRepository.findById(Long.parseLong(clean)).orElse(null);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private void initSampleFarms() {
        Farm f1 = Farm.builder()
                .code("NT-DL-01")
                .name("Nông Trại Xanh Đà Lạt")
                .owner("Bác Nguyễn Văn Hùng")
                .ownerId("farmer_hung")
                .phone("0912 345 678")
                .address("Xã Xuân Thọ, TP. Đà Lạt")
                .province("Lâm Đồng")
                .areaHectares(4.5)
                .certStandard("VietGAP & GlobalGAP")
                .rating(4.9)
                .isDefault(true)
                .verificationStatus("APPROVED")
                .build();
        Farm f2 = Farm.builder()
                .code("NT-DT-02")
                .name("Vườn Cây Ăn Trái Cao Lãnh")
                .owner("Bác Nguyễn Văn Hùng")
                .ownerId("farmer_hung")
                .phone("0912 345 678")
                .address("Xã Mỹ Xương, Huyện Cao Lãnh")
                .province("Đồng Tháp")
                .areaHectares(3.2)
                .certStandard("VietGAP Trồng trọt")
                .rating(4.8)
                .isDefault(false)
                .verificationStatus("APPROVED")
                .build();
        Farm f3 = Farm.builder()
                .code("NT-MC-03")
                .name("Vườn Sinh Thái Mộc Châu")
                .owner("Nguyễn Thiệu")
                .ownerId("farmer_thieu")
                .phone("0988 776 655")
                .address("Tiểu khu Chè Đen, Thị trấn Nông trường Mộc Châu")
                .province("Sơn La")
                .areaHectares(5.0)
                .certStandard("Hữu cơ TCVN & VietGAP")
                .rating(5.0)
                .isDefault(false)
                .verificationStatus("APPROVED")
                .build();
        farmRepository.saveAll(List.of(f1, f2, f3));
    }

    @GetMapping(value = "/batches/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> streamBatchEvents() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("X-Accel-Buffering", "no")
                .body(batchEventStream.subscribe());
    }

    @GetMapping("/batches")
    public ResponseEntity<List<HarvestLot>> getAllBatches(
            @RequestParam(required = false) String ownerId,
            @RequestParam(required = false) String farmCode
    ) {
        List<HarvestLot> lots = harvestLotRepository.findAllByOrderByCreatedAtDesc();
        if (lots.isEmpty()) {
            initSampleLots();
            lots = harvestLotRepository.findAllByOrderByCreatedAtDesc();
        }

        Authentication auth = ownershipResolver.currentAuthentication();
        if (ownershipResolver.isStrictFarmerSession(auth) || (ownerId != null && !ownerId.isBlank())) {
            String effectiveOwner = ownershipResolver.resolveEffectiveOwnerId(ownerId, farmCode);
            lots = lots.stream()
                    .filter(l -> l.getOwnerId() != null && l.getOwnerId().equalsIgnoreCase(effectiveOwner))
                    .toList();
        }
        if (farmCode != null && !farmCode.isBlank()) {
            String cleanFarm = farmCode.trim().toLowerCase(Locale.ROOT);
            lots = lots.stream()
                    .filter(l -> (l.getFarmCode() != null && l.getFarmCode().equalsIgnoreCase(cleanFarm))
                            || (l.getFarmName() != null && l.getFarmName().toLowerCase(Locale.ROOT).contains(cleanFarm)))
                    .toList();
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
        if (req.getFarmCode() == null || req.getFarmCode().isBlank()) {
            req.setFarmCode(resolveFarmCode(req.getFarmName()));
        }
        req.setOwnerId(ownershipResolver.resolveEffectiveOwnerId(req.getOwnerId(), req.getFarmCode()));
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

    @PostMapping("/batches/{code}/logs")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, String>>> addBatchLog(
            @PathVariable String code,
            @RequestBody Map<String, String> req
    ) {
        HarvestLot lot = harvestLotRepository.findByCodeIgnoreCase(code.trim()).orElse(null);
        if (lot == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Không tìm thấy lô thu hoạch " + code));
        }
        if (!ownershipResolver.canModifyOwnedResource(lot.getOwnerId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Bạn không có quyền ghi nhật ký cho lô hàng của chủ vườn khác!"));
        }

        String stage = req.getOrDefault("stage", req.getOrDefault("action", "")).trim();
        if (stage.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Hoạt động canh tác không được để trống"));
        }

        String time = req.getOrDefault("time", "").trim();
        if (time.isBlank()) {
            time = LocalDate.now().format(VN_DATE_FMT);
        }
        String materials = req.getOrDefault("materials", "").trim();
        String rawNote = req.getOrDefault("note", "").trim();
        String combinedNote;
        if (!materials.isBlank() && !rawNote.isBlank()) {
            combinedNote = "Vật tư: " + materials + " - " + rawNote;
        } else if (!materials.isBlank()) {
            combinedNote = "Vật tư: " + materials;
        } else if (!rawNote.isBlank()) {
            combinedNote = rawNote;
        } else {
            combinedNote = "Cập nhật từ Sổ Nhật Ký Canh Tác";
        }

        String proofImage = req.getOrDefault("proofImage", req.getOrDefault("image", "")).trim();

        Map<String, String> entry = new LinkedHashMap<>();
        entry.put("stage", stage);
        entry.put("time", time);
        entry.put("note", combinedNote);
        if (!proofImage.isBlank()) {
            entry.put("proofImage", proofImage);
        }

        TraceabilityRecord record = traceabilityRecordRepository
                .findByBatchCodeIgnoreCase(lot.getCode())
                .orElseGet(() -> buildTraceabilityRecord(lot));

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
        timeline.add(entry);

        try {
            record.setTimelineJson(objectMapper.writeValueAsString(timeline));
            traceabilityRecordRepository.save(record);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Không thể cập nhật nhật ký QR: " + ex.getMessage()));
        }

        // Lưu vào bảng agri_farming_logs để duy trì dữ liệu nhật ký canh tác chuẩn (kèm ownerId & farmCode)
        try {
            String logFarmCode = lot.getFarmCode() != null && !lot.getFarmCode().isBlank()
                    ? lot.getFarmCode()
                    : resolveFarmCode(lot.getFarmName());
            String logOwnerId = lot.getOwnerId() != null && !lot.getOwnerId().isBlank()
                    ? lot.getOwnerId()
                    : ownershipResolver.inferOwnerIdFromFarm(logFarmCode);
            FarmingLog logRecord = FarmingLog.builder()
                    .farmCode(logFarmCode)
                    .ownerId(logOwnerId)
                    .batchCode(lot.getCode())
                    .date(time)
                    .stage(stage)
                    .action(rawNote.isBlank() ? stage : rawNote)
                    .materialsUsed(materials)
                    .notes(combinedNote)
                    .proofImage(proofImage.isBlank() ? null : proofImage)
                    .build();
            farmingLogRepository.save(logRecord);
        } catch (Exception ex) {
            log.warn("Không thể lưu log vào agri_farming_logs: {}", ex.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.ok("Đã đồng bộ nhật ký canh tác lên mã QR!", entry));
    }

    @DeleteMapping("/batches/{code}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteBatch(@PathVariable String code) {
        HarvestLot existing = harvestLotRepository.findByCodeIgnoreCase(code.trim()).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Không tìm thấy lô " + code));
        }
        if (!ownershipResolver.canModifyOwnedResource(existing.getOwnerId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Bạn không có quyền xóa lô thu hoạch của chủ vườn khác!"));
        }
        String normalizedCode = code.trim();
        harvestLotRepository.deleteByCodeIgnoreCase(normalizedCode);
        traceabilityRecordRepository.findByBatchCodeIgnoreCase(normalizedCode)
                .ifPresent(traceabilityRecordRepository::delete);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa lô thành công", null));
    }

    private boolean isPreHarvestStage(String stage) {
        if (stage == null) return false;
        String s = stage.trim().toLowerCase();
        return s.contains("bón phân") || s.contains("tưới") || s.contains("làm đất")
                || s.contains("phun thuốc") || s.contains("chăm sóc") || s.contains("cắt tỉa")
                || s.contains("tỉa cành") || s.contains("làm cỏ") || s.contains("gieo trồng")
                || s.contains("gieo hạt") || s.contains("xử lý đất") || s.contains("ủ phân");
    }

    @GetMapping("/batches/{code}/timeline")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getBatchTimeline(@PathVariable String code) {
        HarvestLot lot = harvestLotRepository.findByCodeIgnoreCase(code.trim()).orElse(null);
        if (lot == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Không tìm thấy lô " + code));
        }

        TraceabilityRecord record = traceabilityRecordRepository
                .findByBatchCodeIgnoreCase(lot.getCode())
                .orElseGet(() -> {
                    TraceabilityRecord fresh = buildTraceabilityRecord(lot);
                    return traceabilityRecordRepository.save(fresh);
                });

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

        // Vòng đời lô thu hoạch bắt đầu từ thời điểm thu hoạch trở đi, loại bỏ các hoạt động canh tác đồng ruộng trước thu hoạch (bón phân, tưới nước)
        List<Map<String, String>> postHarvestTimeline = new ArrayList<>(timeline.stream()
                .filter(item -> !isPreHarvestStage(item.get("stage")))
                .toList());

        if (postHarvestTimeline.isEmpty()) {
            TraceabilityRecord fresh = buildTraceabilityRecord(lot);
            try {
                fresh.setId(record.getId());
                traceabilityRecordRepository.save(fresh);
                postHarvestTimeline = objectMapper.readValue(
                        fresh.getTimelineJson(),
                        new TypeReference<List<Map<String, String>>>() {}
                );
            } catch (Exception ignored) {}
        } else if (postHarvestTimeline.size() < timeline.size()) {
            // Tự động dọn dẹp các sự kiện canh tác đồng ruộng khỏi timelineJson của lô
            try {
                record.setTimelineJson(objectMapper.writeValueAsString(postHarvestTimeline));
                traceabilityRecordRepository.save(record);
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(ApiResponse.ok("Tải nhật ký vòng đời lô thành công", postHarvestTimeline));
    }

    @PatchMapping("/batches/{code}/status")
    @Transactional
    public ResponseEntity<ApiResponse<HarvestLot>> updateBatchStatus(
            @PathVariable String code,
            @RequestBody BatchStatusUpdateRequest req
    ) {
        HarvestLot lot = harvestLotRepository.findByCodeIgnoreCase(code.trim()).orElse(null);
        if (lot == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Không tìm thấy lô thu hoạch " + code));
        }

        String oldStatus = lot.getStatus();
        String oldTransport = lot.getTransportStatus();

        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            lot.setStatus(req.getStatus().trim());
            lot.setStatusColor(req.getStatusColor() != null && !req.getStatusColor().isBlank()
                    ? req.getStatusColor().trim()
                    : resolveStatusColor(lot.getStatus()));
        }
        if (req.getTransportStatus() != null && !req.getTransportStatus().isBlank()) {
            lot.setTransportStatus(req.getTransportStatus().trim());
        }
        if (req.getTransportDestination() != null) {
            lot.setTransportDestination(req.getTransportDestination().trim());
        }

        HarvestLot saved = harvestLotRepository.save(lot);

        // Đồng bộ sự kiện vào agri_traceability (QR timeline)
        try {
            TraceabilityRecord record = traceabilityRecordRepository
                    .findByBatchCodeIgnoreCase(lot.getCode())
                    .orElseGet(() -> buildTraceabilityRecord(saved));

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

            String nowStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
            String noteText = req.getAdminNote() != null && !req.getAdminNote().isBlank()
                    ? req.getAdminNote().trim()
                    : "";

            // Nếu trạng thái duyệt thay đổi
            if (req.getStatus() != null && !req.getStatus().equalsIgnoreCase(oldStatus)) {
                Map<String, String> statusEvent = new LinkedHashMap<>();
                statusEvent.put("stage", "Xét duyệt xuất kho");
                statusEvent.put("time", nowStr);
                statusEvent.put("badge", saved.getStatus());
                if (!noteText.isBlank()) {
                    statusEvent.put("note", "Trạng thái mới: " + saved.getStatus() + " - Ghi chú: " + noteText);
                } else if ("Đã duyệt xuất kho".equalsIgnoreCase(saved.getStatus())) {
                    statusEvent.put("note", "Admin đã thẩm định hồ sơ lô và phê duyệt đủ điều kiện xuất kho.");
                } else {
                    statusEvent.put("note", "Cập nhật trạng thái duyệt: " + saved.getStatus());
                }
                timeline.add(statusEvent);
            }

            // Nếu trạng thái vận chuyển / xuất kho thay đổi
            if (req.getTransportStatus() != null && !req.getTransportStatus().equalsIgnoreCase(oldTransport)) {
                Map<String, String> transportEvent = new LinkedHashMap<>();
                transportEvent.put("stage", "Xuất kho & Vận chuyển");
                transportEvent.put("time", nowStr);
                transportEvent.put("badge", saved.getTransportStatus());
                String dest = saved.getTransportDestination() != null && !saved.getTransportDestination().isBlank()
                        ? saved.getTransportDestination()
                        : "Kho phân phối";
                if (!noteText.isBlank()) {
                    transportEvent.put("note", "Trạng thái xuất kho / vận chuyển: " + saved.getTransportStatus() + " đến " + dest + " (" + noteText + ")");
                } else {
                    transportEvent.put("note", "Điều phối chuỗi lạnh: " + saved.getTransportStatus() + " đến " + dest);
                }
                timeline.add(transportEvent);
            }

            record.setTimelineJson(objectMapper.writeValueAsString(timeline));
            traceabilityRecordRepository.save(record);
        } catch (Exception ex) {
            log.warn("Không thể đồng bộ trạng thái lên agri_traceability: {}", ex.getMessage());
        }

        // Xác định loại hành động và vai trò thực hiện để phát SSE Realtime
        String actionType = "STATUS_UPDATED";
        String actorRole = req.getActorRole() != null && !req.getActorRole().isBlank() ? req.getActorRole() : "ADMIN";
        String broadcastNote = req.getAdminNote() != null ? req.getAdminNote().trim() : "";

        if (req.getStatus() != null && !req.getStatus().equalsIgnoreCase(oldStatus)) {
            if ("Đã duyệt xuất kho".equalsIgnoreCase(saved.getStatus())) {
                actionType = "ADMIN_APPROVED";
            } else if ("Từ chối xuất kho".equalsIgnoreCase(saved.getStatus())) {
                actionType = "ADMIN_REJECTED";
            }
        } else if (req.getTransportStatus() != null && !req.getTransportStatus().equalsIgnoreCase(oldTransport)) {
            if ("Đang vận chuyển".equalsIgnoreCase(saved.getTransportStatus())) {
                actionType = "DRIVER_PICKUP";
                actorRole = "DISTRIBUTOR";
            } else if ("Đã nhập kho đích".equalsIgnoreCase(saved.getTransportStatus())) {
                actionType = "WAREHOUSE_INBOUND";
                actorRole = "WAREHOUSE";
            }
        }

        try {
            batchEventStream.broadcastBatchChanged(saved, actionType, broadcastNote, actorRole);
        } catch (Exception ex) {
            log.warn("Lỗi phát SSE batch-changed: {}", ex.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái lô thu hoạch thành công!", saved));
    }

    @PostMapping("/batches/{code}/driver-pickup")
    @Transactional
    public ResponseEntity<ApiResponse<HarvestLot>> driverPickup(
            @PathVariable String code,
            @RequestBody(required = false) Map<String, String> body
    ) {
        HarvestLot lot = harvestLotRepository.findByCodeIgnoreCase(code.trim()).orElse(null);
        if (lot == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Không tìm thấy lô thu hoạch " + code));
        }

        lot.setTransportStatus("Đang vận chuyển");
        String driverName = body != null && body.get("driverName") != null && !body.get("driverName").isBlank()
                ? body.get("driverName").trim()
                : "Tài xế Nguyễn Văn Vận (Đội xe lạnh AgriTrace)";
        String vehiclePlate = body != null && body.get("vehiclePlate") != null && !body.get("vehiclePlate").isBlank()
                ? body.get("vehiclePlate").trim()
                : "29C-882.15 (Xe chuyên dụng 2.5T)";
        String destination = body != null && body.get("destination") != null && !body.get("destination").isBlank()
                ? body.get("destination").trim()
                : (lot.getTransportDestination() != null && !lot.getTransportDestination().isBlank()
                    ? lot.getTransportDestination()
                    : "Kho Lạnh Phân Phối Hà Nội");
        lot.setTransportDestination(destination);

        HarvestLot saved = harvestLotRepository.save(lot);

        String nowStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        String note = String.format("Tài xế %s (%s) đã quét mã QR tại vườn, tiếp nhận %s %s và kích hoạt hành trình chuỗi lạnh đến %s",
                driverName, vehiclePlate, saved.getQty(), saved.getUnit() != null ? saved.getUnit() : "kg", destination);

        appendTimelineEvent(saved, "Xuất kho & Vận chuyển", nowStr, "Đang vận chuyển", note);

        try {
            batchEventStream.broadcastBatchChanged(saved, "DRIVER_PICKUP", "Tài xế " + driverName + " đã quét QR nhận hàng lên xe lạnh", "DISTRIBUTOR");
        } catch (Exception ex) {
            log.warn("Lỗi broadcast SSE driver-pickup: {}", ex.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.ok("Tài xế đã quét mã QR và tiếp nhận lô hàng thành công!", saved));
    }

    @PostMapping("/batches/{code}/warehouse-inbound")
    @Transactional
    public ResponseEntity<ApiResponse<HarvestLot>> warehouseInbound(
            @PathVariable String code,
            @RequestBody(required = false) Map<String, String> body
    ) {
        HarvestLot lot = harvestLotRepository.findByCodeIgnoreCase(code.trim()).orElse(null);
        if (lot == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Không tìm thấy lô thu hoạch " + code));
        }

        lot.setTransportStatus("Đã nhập kho đích");
        String warehouseStaff = body != null && body.get("warehouseStaff") != null && !body.get("warehouseStaff").isBlank()
                ? body.get("warehouseStaff").trim()
                : "Thủ kho KCS Trần Quang Vinh";
        String warehouseName = body != null && body.get("warehouseName") != null && !body.get("warehouseName").isBlank()
                ? body.get("warehouseName").trim()
                : (lot.getTransportDestination() != null && !lot.getTransportDestination().isBlank()
                    ? lot.getTransportDestination()
                    : "Kho Lạnh Phân Phối Hà Nội");
        String temperature = body != null && body.get("temperature") != null && !body.get("temperature").isBlank()
                ? body.get("temperature").trim()
                : "3.8°C (Độ ẩm 86%)";

        HarvestLot saved = harvestLotRepository.save(lot);

        String nowStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        String note = String.format("Thủ kho %s đã quét mã QR tiếp nhận lô hàng tại %s. Nhiệt độ kiểm định: %s. Hàng đạt chuẩn lưu kho.",
                warehouseStaff, warehouseName, temperature);

        appendTimelineEvent(saved, "Nhập kho đích", nowStr, "Đã nhập kho đích", note);

        try {
            batchEventStream.broadcastBatchChanged(saved, "WAREHOUSE_INBOUND", "Thủ kho " + warehouseStaff + " đã quét QR nhập kho", "WAREHOUSE");
        } catch (Exception ex) {
            log.warn("Lỗi broadcast SSE warehouse-inbound: {}", ex.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.ok("Thủ kho đã quét mã QR và nhập kho đích thành công!", saved));
    }

    private void appendTimelineEvent(HarvestLot lot, String stage, String time, String badge, String note) {
        try {
            TraceabilityRecord record = traceabilityRecordRepository
                    .findByBatchCodeIgnoreCase(lot.getCode())
                    .orElseGet(() -> buildTraceabilityRecord(lot));

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

            Map<String, String> event = new LinkedHashMap<>();
            event.put("stage", stage);
            event.put("time", time != null && !time.isBlank() ? time : LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            if (badge != null && !badge.isBlank()) event.put("badge", badge);
            if (note != null && !note.isBlank()) event.put("note", note);

            timeline.add(event);
            record.setTimelineJson(objectMapper.writeValueAsString(timeline));
            traceabilityRecordRepository.save(record);
        } catch (Exception ex) {
            log.warn("Không thể ghi nhận sự kiện vòng đời cho lô {}: {}", lot.getCode(), ex.getMessage());
        }
    }

    @PostMapping("/batches/{code}/timeline-events")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, String>>> addBatchTimelineEvent(
            @PathVariable String code,
            @RequestBody BatchLifecycleEventRequest req
    ) {
        HarvestLot lot = harvestLotRepository.findByCodeIgnoreCase(code.trim()).orElse(null);
        if (lot == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Không tìm thấy lô " + code));
        }

        if (req.getStage() == null || req.getStage().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tên giai đoạn sự kiện không được để trống"));
        }

        TraceabilityRecord record = traceabilityRecordRepository
                .findByBatchCodeIgnoreCase(lot.getCode())
                .orElseGet(() -> buildTraceabilityRecord(lot));

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

        String time = req.getTime() != null && !req.getTime().isBlank()
                ? req.getTime().trim()
                : LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

        Map<String, String> entry = new LinkedHashMap<>();
        entry.put("stage", req.getStage().trim());
        entry.put("time", time);
        entry.put("note", req.getNote() != null ? req.getNote().trim() : "");
        if (req.getBadge() != null && !req.getBadge().isBlank()) {
            entry.put("badge", req.getBadge().trim());
        }
        if (req.getOperator() != null && !req.getOperator().isBlank()) {
            entry.put("operator", req.getOperator().trim());
        }

        timeline.add(entry);

        try {
            record.setTimelineJson(objectMapper.writeValueAsString(timeline));
            traceabilityRecordRepository.save(record);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Không thể ghi nhận sự kiện vòng đời: " + ex.getMessage()));
        }

        return ResponseEntity.ok(ApiResponse.ok("Đã ghi nhận sự kiện vòng đời thành công!", entry));
    }

    private TraceabilityRecord buildTraceabilityRecord(HarvestLot lot) {
        List<Map<String, String>> initialSteps = new ArrayList<>();

        // Mốc 1: Khai báo thu hoạch
        Map<String, String> harvest = new LinkedHashMap<>();
        harvest.put("stage", "Thu hoạch & Khai báo lô");
        harvest.put("time", lot.getHarvestDate() != null ? lot.getHarvestDate() : LocalDate.now().format(VN_DATE_FMT));
        harvest.put("badge", "Đã thu hoạch");
        harvest.put("note", String.format("Khai báo thu hoạch: %s %s - Nông trại: %s - Tiêu chuẩn %s (%s)",
                lot.getQty(),
                lot.getUnit() != null ? lot.getUnit() : "kg",
                lot.getFarmName() != null ? lot.getFarmName() : DEFAULT_FARM_NAME,
                lot.getCert() != null ? lot.getCert() : "VietGAP",
                lot.getCultivation() != null && !lot.getCultivation().isBlank() ? lot.getCultivation() : "Theo quy trình an toàn"));
        initialSteps.add(harvest);

        // Mốc 2: Kiểm định KCS & An toàn vệ sinh thực phẩm
        Map<String, String> kcs = new LinkedHashMap<>();
        kcs.put("stage", "Kiểm định chất lượng KCS");
        kcs.put("time", lot.getHarvestDate() != null ? lot.getHarvestDate() : LocalDate.now().format(VN_DATE_FMT));
        kcs.put("badge", "Đạt chuẩn KCS");
        kcs.put("note", "Kiểm nghiệm an toàn thực phẩm, dư lượng nitrat & BVTV đạt chuẩn ISO/IEC 17025");
        initialSteps.add(kcs);

        // Mốc 3: Admin thẩm định & Phê duyệt xuất kho
        Map<String, String> approval = new LinkedHashMap<>();
        approval.put("stage", "Thẩm định & Phê duyệt xuất kho");
        approval.put("time", lot.getHarvestDate() != null ? lot.getHarvestDate() : LocalDate.now().format(VN_DATE_FMT));
        boolean isApproved = "Đã duyệt xuất kho".equalsIgnoreCase(lot.getStatus());
        approval.put("badge", isApproved ? "Đã duyệt xuất kho" : "Chờ duyệt");
        approval.put("note", isApproved
                ? "Admin hệ thống đã thẩm định hồ sơ lô và phê duyệt đủ điều kiện xuất kho lưu thông"
                : "Hồ sơ lô đang trong trạng thái chờ Ban Quản trị / Admin kiểm duyệt xuất kho");
        initialSteps.add(approval);

        // Mốc 4: Lưu kho & Vận chuyển chuỗi lạnh
        Map<String, String> transport = new LinkedHashMap<>();
        transport.put("stage", "Lưu kho & Vận chuyển chuỗi lạnh");
        transport.put("time", lot.getHarvestDate() != null ? lot.getHarvestDate() : LocalDate.now().format(VN_DATE_FMT));
        String trans = lot.getTransportStatus() != null ? lot.getTransportStatus() : "Chưa vận chuyển";
        String dest = lot.getTransportDestination() != null && !lot.getTransportDestination().isBlank()
                ? lot.getTransportDestination()
                : "Kho bảo quản nông trại";
        transport.put("badge", trans);
        transport.put("note", String.format("Trạng thái: %s - Điểm đến: %s", trans, dest));
        initialSteps.add(transport);

        String timelineJson = "[]";
        try {
            timelineJson = objectMapper.writeValueAsString(initialSteps);
        } catch (Exception ignored) {
        }

        return TraceabilityRecord.builder()
                .batchCode(lot.getCode())
                .productName(lot.getProduct())
                .farmName(lot.getFarmName() != null ? lot.getFarmName() : DEFAULT_FARM_NAME)
                .location(resolveFarmLocation(lot.getFarmCode(), lot.getFarmName()))
                .harvestDate(lot.getHarvestDate())
                .certType(lot.getCert() != null ? lot.getCert() : "VietGAP")
                .labResult("Đạt chuẩn an toàn dư lượng thực phẩm (ISO/IEC 17025)")
                .tempAvg("4.5°C")
                .inspector("Chi cục Quản lý Chất lượng Nông Lâm & Thủy sản")
                .timelineJson(timelineJson)
                .build();
    }

    private String resolveFarmLocation(String farmCode, String farmName) {
        if (farmCode != null && !farmCode.isBlank()) {
            Farm farm = farmRepository.findByCodeIgnoreCase(farmCode.trim()).orElse(null);
            if (farm != null && farm.getAddress() != null && !farm.getAddress().isBlank()) {
                return farm.getProvince() != null && !farm.getProvince().isBlank()
                        ? farm.getAddress() + ", " + farm.getProvince()
                        : farm.getAddress();
            }
        }
        if (farmName == null || farmName.isBlank()) {
            return "Xã Xuân Thọ, TP. Đà Lạt, Tỉnh Lâm Đồng";
        }
        String lower = farmName.toLowerCase(Locale.ROOT);
        if (lower.contains("cao lãnh") || lower.contains("đồng tháp") || lower.contains("nt-dt")) {
            return "Xã Mỹ Xương, Huyện Cao Lãnh, Đồng Tháp";
        }
        if (lower.contains("mộc châu") || lower.contains("sơn la") || lower.contains("nt-mc")) {
            return "Thị trấn Nông trường Mộc Châu, Sơn La";
        }
        if (lower.contains("đà lạt") || lower.contains("nt-dl")) {
            return "Xã Xuân Thọ, TP. Đà Lạt, Tỉnh Lâm Đồng";
        }
        return farmName;
    }

    private String resolveStatusColor(String status) {
        if ("Đã duyệt xuất kho".equals(status)) return "#10b981";
        if ("Đang lưu kho lạnh".equals(status)) return "#3b82f6";
        if ("Từ chối xuất kho".equals(status)) return "#ef4444";
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
                .farmCode("NT-DL-01")
                .ownerId("farmer_hung")
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
                .farmCode("NT-DL-01")
                .ownerId("farmer_hung")
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
                .farmCode("NT-DL-01")
                .ownerId("farmer_hung")
                .transportDestination("Lưu tại vườn")
                .transportStatus("Chưa vận chuyển")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        // Lô thuộc chủ vườn Nguyễn Thiệu (Vườn Sinh Thái Mộc Châu NT-MC-03)
        HarvestLot b4 = HarvestLot.builder()
                .code("MC-2026-01")
                .product("Mận Hậu Mộc Châu Hữu Cơ")
                .plantingDate(today.minusDays(60).format(VN_DATE_FMT))
                .harvestDate(today.minusDays(2).format(VN_DATE_FMT))
                .expiryDate(today.plusDays(10).format(VN_DATE_FMT))
                .qty("800")
                .unit("kg")
                .status("Đã duyệt xuất kho")
                .statusColor("#10b981")
                .cert("VietGAP Trồng trọt & Hữu cơ")
                .cultivation("Bao trái hữu cơ vùng cao Mộc Châu")
                .farmName("Vườn Sinh Thái Mộc Châu (Mã: NT-MC-03)")
                .farmCode("NT-MC-03")
                .ownerId("farmer_thieu")
                .transportDestination("Kho Lạnh Trung Chuyển Hà Nội")
                .transportStatus("Đang vận chuyển")
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();

        HarvestLot b5 = HarvestLot.builder()
                .code("TC-2026-02")
                .product("Chè Shan Tuyết Cổ Thụ Mộc Châu")
                .plantingDate(today.minusDays(90).format(VN_DATE_FMT))
                .harvestDate(today.minusDays(3).format(VN_DATE_FMT))
                .expiryDate(today.plusDays(90).format(VN_DATE_FMT))
                .qty("350")
                .unit("kg")
                .status("Chờ duyệt xuất kho")
                .statusColor("#f97316")
                .cert("Chứng nhận Hữu cơ Quốc Gia")
                .cultivation("Búp chè 1 tôm 2 lá sấy lạnh")
                .farmName("Vườn Sinh Thái Mộc Châu (Mã: NT-MC-03)")
                .farmCode("NT-MC-03")
                .ownerId("farmer_thieu")
                .transportDestination("Lưu tại kho bảo quản nông trại")
                .transportStatus("Chưa vận chuyển")
                .createdAt(LocalDateTime.now().minusDays(3))
                .build();

        harvestLotRepository.saveAll(List.of(b1, b2, b3, b4, b5));
        for (HarvestLot b : List.of(b1, b2, b3, b4, b5)) {
            try {
                if (traceabilityRecordRepository.findByBatchCodeIgnoreCase(b.getCode()).isEmpty()) {
                    traceabilityRecordRepository.save(buildTraceabilityRecord(b));
                }
            } catch (Exception ignored) {}
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchStatusUpdateRequest {
        private String status;
        private String statusColor;
        private String transportStatus;
        private String transportDestination;
        private String adminNote;
        private String actorRole;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchLifecycleEventRequest {
        private String stage;
        private String time;
        private String note;
        private String badge;
        private String operator;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CertificateExpiryAlertRequest {
        private String certName;
        private String certNumber;
        private String farmName;
        private Integer daysLeft;
        private String expiryDate;
        private String toEmail;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CertificateRenewalRequest {
        private String certNumber;
        private String newCertNumber;
        private String requestedExpiryDate;
        private String proofImage;
        private String note;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CertificateDecisionRequest {
        private String action; // "approve" or "reject"
        private String adminNote;
        private String newCertNumber;
        private String approvedExpiryDate;
    }

    @PostMapping("/certificates/notify-expiry")
    public ResponseEntity<ApiResponse<Map<String, Object>>> notifyCertificateExpiry(
            @RequestBody CertificateExpiryAlertRequest req
    ) {
        if (req.getCertNumber() == null || req.getCertNumber().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Số hiệu chứng nhận không được để trống"));
        }
        int days = req.getDaysLeft() != null ? req.getDaysLeft() : 5;
        String certName = req.getCertName() != null && !req.getCertName().isBlank()
                ? req.getCertName()
                : "Chứng nhận VietGAP / GlobalGAP";
        String farmName = req.getFarmName() != null && !req.getFarmName().isBlank()
                ? req.getFarmName()
                : DEFAULT_FARM_NAME;
        String expiryDate = req.getExpiryDate() != null ? req.getExpiryDate() : "Chưa xác định";

        String recipient = req.getToEmail();
        if (recipient == null || recipient.isBlank()) {
            recipient = userRepository.findAll().stream()
                    .filter(u -> u.isActive() && u.getRoles() != null && u.getRoles().stream().anyMatch(r -> r.getName() == RoleName.FARMER))
                    .map(User::getEmail)
                    .filter(e -> e != null && e.contains("@"))
                    .findFirst()
                    .orElse("farmer@gmail.com");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("certName", certName);
        result.put("certNumber", req.getCertNumber());
        result.put("daysLeft", days);
        result.put("expiryDate", expiryDate);
        result.put("recipient", recipient);

        try {
            emailService.sendCertificateExpiryWarningEmail(
                    recipient,
                    certName,
                    req.getCertNumber(),
                    farmName,
                    days,
                    expiryDate
            );
            result.put("status", "SENT");
            return ResponseEntity.ok(ApiResponse.ok(
                    String.format("Đã gửi email cảnh báo chứng chỉ %s (còn %d ngày) tới %s thành công!",
                            req.getCertNumber(), days, recipient),
                    result
            ));
        } catch (Exception ex) {
            result.put("status", "SIMULATED");
            result.put("note", "SMTP ghi nhận hoặc chưa kích hoạt: " + ex.getMessage());
            return ResponseEntity.ok(ApiResponse.ok(
                    String.format("Hệ thống đã kích hoạt cảnh báo chứng chỉ %s (còn %d ngày) cho %s",
                            req.getCertNumber(), days, recipient),
                    result
            ));
        }
    }

    @GetMapping("/certificates")
    public ResponseEntity<List<FarmerCertificate>> getCertificates(
            @RequestParam(required = false) String ownerId,
            @RequestParam(required = false) String farmCode
    ) {
        List<FarmerCertificate> certs = certificateRepository.findAllByOrderByCreatedAtDesc();
        if (certs.isEmpty()) {
            certificateScheduler.bootstrapDefaultCertificates();
            certs = certificateRepository.findAllByOrderByCreatedAtDesc();
        }
        for (FarmerCertificate cert : certs) {
            cert.setStatus(cert.evaluateValidityStatus());
        }
        Authentication auth = ownershipResolver.currentAuthentication();
        if (ownershipResolver.isStrictFarmerSession(auth) || (ownerId != null && !ownerId.isBlank())) {
            String effectiveOwner = ownershipResolver.resolveEffectiveOwnerId(ownerId, farmCode);
            certs = certs.stream()
                    .filter(c -> c.getOwnerId() != null && c.getOwnerId().equalsIgnoreCase(effectiveOwner))
                    .toList();
        }
        if (farmCode != null && !farmCode.isBlank()) {
            String cleanFarm = farmCode.trim().toLowerCase(Locale.ROOT);
            certs = certs.stream()
                    .filter(c -> c.getFarmCode() != null && c.getFarmCode().equalsIgnoreCase(cleanFarm))
                    .toList();
        }
        return ResponseEntity.ok(certs);
    }

    @PostMapping("/certificates")
    @Transactional
    public ResponseEntity<ApiResponse<FarmerCertificate>> saveCertificate(@RequestBody FarmerCertificate req) {
        if (req.getCertNumber() == null || req.getCertNumber().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Số hiệu chứng nhận không được để trống"));
        }
        String certNum = req.getCertNumber().trim().toUpperCase();
        FarmerCertificate cert = certificateRepository.findByCertNumberIgnoreCase(certNum)
                .orElse(FarmerCertificate.builder().certNumber(certNum).build());
        if (cert.getId() != null && !ownershipResolver.canModifyOwnedResource(cert.getOwnerId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Bạn không có quyền chỉnh sửa chứng nhận của chủ vườn khác!"));
        }

        if (req.getName() != null && !req.getName().isBlank()) cert.setName(req.getName().trim());
        if (req.getFarmCode() != null && !req.getFarmCode().isBlank()) cert.setFarmCode(req.getFarmCode().trim());
        cert.setOwnerId(ownershipResolver.resolveEffectiveOwnerId(req.getOwnerId(), cert.getFarmCode()));
        if (req.getFarmName() != null && !req.getFarmName().isBlank()) cert.setFarmName(req.getFarmName().trim());
        if (req.getIssuedBy() != null && !req.getIssuedBy().isBlank()) cert.setIssuedBy(req.getIssuedBy().trim());
        if (req.getIssueDate() != null && !req.getIssueDate().isBlank()) cert.setIssueDate(req.getIssueDate().trim());
        if (req.getExpiryDate() != null && !req.getExpiryDate().isBlank()) cert.setExpiryDate(req.getExpiryDate().trim());
        cert.setStatus(cert.evaluateValidityStatus());
        if (req.getAlertEmail() != null && !req.getAlertEmail().isBlank()) cert.setAlertEmail(req.getAlertEmail().trim());
        if (req.getApprovalStatus() != null && !req.getApprovalStatus().isBlank()) cert.setApprovalStatus(req.getApprovalStatus().trim());
        if (req.getPendingNewCertNumber() != null) cert.setPendingNewCertNumber(req.getPendingNewCertNumber().trim());
        if (req.getPendingRequestedExpiryDate() != null) cert.setPendingRequestedExpiryDate(req.getPendingRequestedExpiryDate().trim());
        if (req.getPendingProofImage() != null) cert.setPendingProofImage(req.getPendingProofImage().trim());
        if (req.getPendingNote() != null) cert.setPendingNote(req.getPendingNote().trim());
        if (req.getSubmittedAt() != null) cert.setSubmittedAt(req.getSubmittedAt().trim());

        FarmerCertificate saved = certificateRepository.save(cert);
        return ResponseEntity.ok(ApiResponse.ok("Đã lưu chứng nhận thành công", saved));
    }

    @PostMapping("/certificates/renew")
    @Transactional
    public ResponseEntity<ApiResponse<FarmerCertificate>> submitCertificateRenewal(@RequestBody CertificateRenewalRequest req) {
        if (req.getCertNumber() == null || req.getCertNumber().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Số hiệu chứng chỉ không được để trống"));
        }
        FarmerCertificate cert = certificateRepository.findByCertNumberIgnoreCase(req.getCertNumber().trim()).orElse(null);
        if (cert == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Không tìm thấy chứng chỉ " + req.getCertNumber()));
        }
        if (!ownershipResolver.canModifyOwnedResource(cert.getOwnerId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Bạn không có quyền gửi gia hạn chứng chỉ của chủ vườn khác!"));
        }

        String finalNewNum = req.getNewCertNumber() != null && !req.getNewCertNumber().isBlank()
                ? req.getNewCertNumber().trim().toUpperCase()
                : cert.getCertNumber();
        String requestedExp = req.getRequestedExpiryDate() != null && !req.getRequestedExpiryDate().isBlank()
                ? req.getRequestedExpiryDate().trim()
                : LocalDate.now().plusYears(1).format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        cert.setApprovalStatus("PENDING");
        cert.setPendingNewCertNumber(finalNewNum);
        cert.setPendingRequestedExpiryDate(requestedExp);
        if (req.getProofImage() != null) cert.setPendingProofImage(req.getProofImage());
        if (req.getNote() != null) cert.setPendingNote(req.getNote().trim());
        cert.setSubmittedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

        FarmerCertificate saved = certificateRepository.save(cert);
        return ResponseEntity.ok(ApiResponse.ok("Đã nộp hồ sơ xin gia hạn chứng chỉ thành công! Đang chờ Admin xét duyệt.", saved));
    }

    @PatchMapping("/certificates/{certNumber}/decision")
    @Transactional
    public ResponseEntity<ApiResponse<FarmerCertificate>> decideCertificate(
            @PathVariable String certNumber,
            @RequestBody CertificateDecisionRequest req
    ) {
        Authentication auth = ownershipResolver.currentAuthentication();
        boolean isAdmin = auth != null && auth.isAuthenticated() && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Chỉ Quản trị viên (ADMIN) mới có quyền duyệt chứng nhận nông trại!"));
        }

        FarmerCertificate cert = certificateRepository.findByCertNumberIgnoreCase(certNumber.trim()).orElse(null);
        if (cert == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Không tìm thấy chứng chỉ " + certNumber));
        }

        boolean isApprove = "approve".equalsIgnoreCase(req.getAction());
        if (isApprove) {
            if (req.getApprovedExpiryDate() != null && !req.getApprovedExpiryDate().isBlank()) {
                cert.setExpiryDate(req.getApprovedExpiryDate().trim());
            } else if (cert.getPendingRequestedExpiryDate() != null && !cert.getPendingRequestedExpiryDate().isBlank()) {
                cert.setExpiryDate(cert.getPendingRequestedExpiryDate().trim());
            }
            if (req.getNewCertNumber() != null && !req.getNewCertNumber().isBlank()) {
                cert.setCertNumber(req.getNewCertNumber().trim().toUpperCase());
            } else if (cert.getPendingNewCertNumber() != null && !cert.getPendingNewCertNumber().isBlank()) {
                cert.setCertNumber(cert.getPendingNewCertNumber().trim().toUpperCase());
            }
            cert.setPendingRequestedExpiryDate(null);
            cert.setPendingNewCertNumber(null);
            cert.setStatus(cert.evaluateValidityStatus());
            cert.setApprovalStatus("APPROVED");
            cert.setLastAlertSentDate(null); // Reset để lịch quét ngầm hiểu chứng chỉ đã mới
            String note = req.getAdminNote() != null && !req.getAdminNote().isBlank()
                    ? req.getAdminNote().trim()
                    : "Admin đã thẩm định đạt chuẩn và phê duyệt gia hạn hiệu lực mới thành công.";
            cert.setPendingNote("✅ Đã duyệt: " + note);
        } else {
            cert.setApprovalStatus("REJECTED");
            String reason = req.getAdminNote() != null && !req.getAdminNote().isBlank()
                    ? req.getAdminNote().trim()
                    : "Hồ sơ chưa đạt tiêu chuẩn kiểm nghiệm an toàn thực phẩm hoặc thiếu ảnh chứng từ.";
            cert.setPendingNote("❌ Từ chối: " + reason);
        }

        FarmerCertificate saved = certificateRepository.save(cert);
        String msg = isApprove
                ? "Đã phê duyệt gia hạn chứng chỉ thành công!"
                : "Đã từ chối cấp lệnh gia hạn chứng chỉ!";
        return ResponseEntity.ok(ApiResponse.ok(msg, saved));
    }

    @PostMapping("/certificates/trigger-auto-scan")
    public ResponseEntity<ApiResponse<Map<String, Object>>> triggerAutoScan(
            @RequestParam(name = "force", defaultValue = "true") boolean force
    ) {
        Map<String, Object> result = certificateScheduler.scanAndAlertExpiringCertificates(force);
        return ResponseEntity.ok(ApiResponse.ok("Đã kích hoạt quét tự động chứng nhận thành công", result));
    }

    @DeleteMapping("/certificates/{certNumber}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteCertificate(@PathVariable String certNumber) {
        String normalized = certNumber.trim();
        FarmerCertificate cert = certificateRepository.findByCertNumberIgnoreCase(normalized).orElse(null);
        if (cert == null) {
            try {
                Long id = Long.parseLong(normalized);
                cert = certificateRepository.findById(id).orElse(null);
            } catch (NumberFormatException ignored) {}
        }
        if (cert == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Không tìm thấy chứng nhận " + certNumber));
        }
        if (!ownershipResolver.canModifyOwnedResource(cert.getOwnerId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Bạn không có quyền xóa chứng nhận của chủ vườn khác!"));
        }
        certificateRepository.delete(cert);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa chứng nhận thành công", null));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<FarmingLog>> getAllLogs(
            @RequestParam(required = false) String ownerId,
            @RequestParam(required = false) String farmCode,
            @RequestParam(required = false) String batchCode
    ) {
        List<FarmingLog> logs = farmingLogRepository.findAllByOrderByCreatedAtDesc();
        if (logs.isEmpty()) {
            initSampleLogs();
            logs = farmingLogRepository.findAllByOrderByCreatedAtDesc();
        }
        Authentication auth = ownershipResolver.currentAuthentication();
        if (ownershipResolver.isStrictFarmerSession(auth) || (ownerId != null && !ownerId.isBlank())) {
            String effectiveOwner = ownershipResolver.resolveEffectiveOwnerId(ownerId, farmCode);
            logs = logs.stream()
                    .filter(l -> l.getOwnerId() != null && l.getOwnerId().equalsIgnoreCase(effectiveOwner))
                    .toList();
        }
        if (farmCode != null && !farmCode.isBlank()) {
            String cleanFarm = farmCode.trim().toLowerCase(Locale.ROOT);
            logs = logs.stream()
                    .filter(l -> l.getFarmCode() != null && l.getFarmCode().equalsIgnoreCase(cleanFarm))
                    .toList();
        }
        if (batchCode != null && !batchCode.isBlank()) {
            String cleanBatch = batchCode.trim().toLowerCase(Locale.ROOT);
            logs = logs.stream()
                    .filter(l -> l.getBatchCode() != null && l.getBatchCode().equalsIgnoreCase(cleanBatch))
                    .toList();
        }
        return ResponseEntity.ok(logs);
    }

    @PostMapping("/logs")
    @Transactional
    public ResponseEntity<ApiResponse<FarmingLog>> createLog(@RequestBody FarmingLog req) {
        if (req.getAction() == null || req.getAction().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Hoạt động canh tác không được để trống"));
        }
        if (req.getBatchCode() == null || req.getBatchCode().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Mã lô không được để trống"));
        }
        if (req.getDate() == null || req.getDate().isBlank()) {
            req.setDate(LocalDate.now().format(VN_DATE_FMT));
        }
        if (req.getStage() == null || req.getStage().isBlank()) {
            req.setStage("Chăm sóc");
        }
        if (req.getFarmCode() == null || req.getFarmCode().isBlank()) {
            req.setFarmCode(resolveFarmCode(null));
        }
        req.setOwnerId(ownershipResolver.resolveEffectiveOwnerId(req.getOwnerId(), req.getFarmCode()));
        FarmingLog saved = farmingLogRepository.save(req);

        // Chỉ đồng bộ lên timeline vòng đời lô nếu là sự kiện sau thu hoạch (không phải bón phân, tưới nước đồng ruộng)
        try {
            HarvestLot lot = harvestLotRepository.findByCodeIgnoreCase(req.getBatchCode().trim()).orElse(null);
            if (lot != null && !isPreHarvestStage(req.getStage())) {
                TraceabilityRecord record = traceabilityRecordRepository
                        .findByBatchCodeIgnoreCase(lot.getCode())
                        .orElseGet(() -> buildTraceabilityRecord(lot));

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
                entry.put("stage", req.getStage());
                entry.put("time", req.getDate());
                String note = req.getNotes() != null && !req.getNotes().isBlank()
                        ? req.getAction() + " - " + req.getNotes()
                        : req.getAction();
                if (req.getMaterialsUsed() != null && !req.getMaterialsUsed().isBlank()) {
                    note = "Vật tư: " + req.getMaterialsUsed() + " | " + note;
                }
                entry.put("note", note);
                if (req.getProofImage() != null && !req.getProofImage().isBlank()) {
                    entry.put("proofImage", req.getProofImage());
                }
                timeline.add(entry);
                record.setTimelineJson(objectMapper.writeValueAsString(timeline));
                traceabilityRecordRepository.save(record);
            }
        } catch (Exception ex) {
            log.warn("Lỗi đồng bộ log lên QR: {}", ex.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.ok("Đã lưu nhật ký canh tác thành công", saved));
    }

    @DeleteMapping("/logs/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteLog(@PathVariable Long id) {
        FarmingLog existing = farmingLogRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Không tìm thấy nhật ký ID " + id));
        }
        if (!ownershipResolver.canModifyOwnedResource(existing.getOwnerId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Bạn không có quyền xóa nhật ký canh tác của chủ vườn khác!"));
        }
        farmingLogRepository.delete(existing);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa nhật ký thành công", null));
    }

    private void initSampleLogs() {
        FarmingLog l1 = FarmingLog.builder()
                .farmCode("NT-DL-01")
                .ownerId("farmer_hung")
                .batchCode("XL-2026-08")
                .date(LocalDate.now().minusDays(5).format(VN_DATE_FMT))
                .stage("Bón phân")
                .action("Bón phân hữu cơ sinh học trùn quế và chế phẩm vi sinh Trichoderma")
                .materialsUsed("Phân trùn quế 50kg, Chế phẩm Trichoderma 2L")
                .notes("Độ ẩm đạt chuẩn 75%, cây phát triển đồng đều, không sâu bệnh")
                .proofImage("/images/categories/cat-rau.jpg")
                .build();

        FarmingLog l2 = FarmingLog.builder()
                .farmCode("NT-DL-01")
                .ownerId("farmer_hung")
                .batchCode("KL-2026-05")
                .date(LocalDate.now().minusDays(3).format(VN_DATE_FMT))
                .stage("Tưới nước")
                .action("Tưới phun sương tự động theo lịch hẹn giờ IoT công nghệ cao")
                .materialsUsed("Nước giếng khoan qua hệ thống lọc RO khử khuẩn")
                .notes("Thời gian tưới 30 phút buổi sáng sớm, nhiệt độ nhà màng ổn định 22°C")
                .proofImage("/images/products/cai-kale.jpg")
                .build();

        FarmingLog l3 = FarmingLog.builder()
                .farmCode("NT-DT-02")
                .ownerId("farmer_hung")
                .batchCode("DT-2026-02")
                .date(LocalDate.now().minusDays(1).format(VN_DATE_FMT))
                .stage("Thu hoạch")
                .action("Thu hái chọn lọc thủ công từng quả dâu tây chín đỏ đạt tiêu chuẩn VietGAP")
                .materialsUsed("Kéo cắt chuyên dụng khử trùng cồn 70 độ, khay nhựa lót đệm xốp")
                .notes("Thu hoạch lúc sáng sớm tránh dập nát, chuyển ngay vào kho lạnh tiền đông bảo quản")
                .proofImage("/images/products/dau-tay.jpg")
                .build();

        FarmingLog l4 = FarmingLog.builder()
                .farmCode("NT-MC-03")
                .ownerId("farmer_thieu")
                .batchCode("MC-2026-01")
                .date(LocalDate.now().minusDays(4).format(VN_DATE_FMT))
                .stage("Tưới nước")
                .action("Tưới phun sương tự động theo lịch hẹn giờ IoT cho vườn Mận Hậu")
                .materialsUsed("Nguồn nước tự nhiên đầu nguồn lọc sinh học")
                .notes("Độ ẩm đất ổn định 75%, cây sinh trưởng tốt trong khí hậu cao nguyên Mộc Châu")
                .proofImage("/images/products/cam-sanh.jpg")
                .build();

        FarmingLog l5 = FarmingLog.builder()
                .farmCode("NT-MC-03")
                .ownerId("farmer_thieu")
                .batchCode("MC-2026-01")
                .date(LocalDate.now().minusDays(1).format(VN_DATE_FMT))
                .stage("Thu hoạch")
                .action("Thu hái mận hậu chọn lọc từng quả chín giòn ráo sương sáng")
                .materialsUsed("Giỏ tre lót lá thông thoáng khí, bao bì carton màng thở")
                .notes("Sản lượng 800 kg đạt chuẩn xuất khẩu sang các chuỗi siêu thị sạch")
                .proofImage("/images/products/bo-sap.jpg")
                .build();

        farmingLogRepository.saveAll(List.of(l1, l2, l3, l4, l5));
    }

    @GetMapping("/ai/demand-forecast")
    public ResponseEntity<ApiResponse<com.example.myfullstackapp.dto.farmer.FarmerDemandForecastResponse>> getDemandForecast(
            @RequestParam(required = false) String ownerId,
            @RequestParam(required = false) String farmCode,
            @RequestParam(defaultValue = "7") int horizonDays
    ) {
        if (demandForecastService == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error("Dịch vụ dự báo nhu cầu AI chưa sẵn sàng."));
        }
        return ResponseEntity.ok(ApiResponse.ok(
                "Phân tích dự báo nhu cầu AI thành công",
                demandForecastService.buildForecast(ownerId, farmCode, horizonDays)
        ));
    }

    @GetMapping("/seasons")
    public ResponseEntity<List<com.example.myfullstackapp.entity.CropSeason>> getCropSeasons(
            @RequestParam(required = false) String ownerId,
            @RequestParam(required = false) String farmCode,
            @RequestParam(required = false) Integer month
    ) {
        if (cropSeasonRepository == null) {
            return ResponseEntity.ok(List.of());
        }
        List<com.example.myfullstackapp.entity.CropSeason> seasons = cropSeasonRepository.findAllByOrderByIdAsc();
        if (seasons.isEmpty()) {
            initSampleCropSeasons();
            seasons = cropSeasonRepository.findAllByOrderByIdAsc();
        }
        Authentication auth = ownershipResolver.currentAuthentication();
        if (ownershipResolver.isStrictFarmerSession(auth) || (ownerId != null && !ownerId.isBlank())) {
            String effectiveOwner = ownershipResolver.resolveEffectiveOwnerId(ownerId, farmCode);
            seasons = seasons.stream()
                    .filter(s -> s.getOwnerId() != null && s.getOwnerId().equalsIgnoreCase(effectiveOwner))
                    .toList();
        }
        if (farmCode != null && !farmCode.isBlank() && !"ALL".equalsIgnoreCase(farmCode.trim())) {
            String cleanFarm = farmCode.trim();
            seasons = seasons.stream()
                    .filter(s -> s.getFarmCode() != null && s.getFarmCode().equalsIgnoreCase(cleanFarm))
                    .toList();
        }
        if (month != null && month >= 1 && month <= 12) {
            seasons.forEach(s -> s.setPreviewMonth(month));
        }
        return ResponseEntity.ok(seasons);
    }

    @PostMapping("/seasons")
    @Transactional
    public ResponseEntity<ApiResponse<com.example.myfullstackapp.entity.CropSeason>> createCropSeason(
            @RequestBody com.example.myfullstackapp.entity.CropSeason req
    ) {
        if (cropSeasonRepository == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error("Kho cấu hình mùa vụ chưa sẵn sàng."));
        }
        if (req.getProductName() == null || req.getProductName().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tên nông sản mùa vụ không được để trống"));
        }
        if (req.getStartMonth() == null || req.getStartMonth() < 1 || req.getStartMonth() > 12
                || req.getEndMonth() == null || req.getEndMonth() < 1 || req.getEndMonth() > 12) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tháng bắt đầu và kết thúc phải từ 1 đến 12"));
        }
        String effectiveOwner = ownershipResolver.resolveEffectiveOwnerId(req.getOwnerId(), req.getFarmCode());
        req.setId(null);
        req.setOwnerId(effectiveOwner);
        req.setProductName(req.getProductName().trim());
        if (req.getFarmCode() != null && !req.getFarmCode().isBlank()) {
            req.setFarmCode(req.getFarmCode().trim().toUpperCase(Locale.ROOT));
        }
        if (req.getCategoryCode() == null || req.getCategoryCode().isBlank()) {
            req.setCategoryCode("trai_cay");
        }
        if (req.getPeakMultiplier() == null || req.getPeakMultiplier() <= 0) {
            req.setPeakMultiplier(1.30);
        }
        if (req.getActive() == null) {
            req.setActive(true);
        }
        var saved = cropSeasonRepository.save(req);
        return ResponseEntity.ok(ApiResponse.ok("Đã lưu cấu hình mùa vụ mới!", saved));
    }

    @PutMapping("/seasons/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<com.example.myfullstackapp.entity.CropSeason>> updateCropSeason(
            @PathVariable Long id,
            @RequestBody com.example.myfullstackapp.entity.CropSeason req
    ) {
        if (cropSeasonRepository == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error("Kho cấu hình mùa vụ chưa sẵn sàng."));
        }
        var existing = cropSeasonRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Không tìm thấy mùa vụ #" + id));
        }
        if (!ownershipResolver.canModifyOwnedResource(existing.getOwnerId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Bạn không có quyền chỉnh sửa mùa vụ của chủ vườn khác!"));
        }
        if (req.getProductName() != null && !req.getProductName().isBlank()) existing.setProductName(req.getProductName().trim());
        if (req.getFarmCode() != null) existing.setFarmCode(req.getFarmCode().trim().toUpperCase(Locale.ROOT));
        if (req.getCategoryCode() != null && !req.getCategoryCode().isBlank()) existing.setCategoryCode(req.getCategoryCode().trim());
        if (req.getStartMonth() != null && req.getStartMonth() >= 1 && req.getStartMonth() <= 12) existing.setStartMonth(req.getStartMonth());
        if (req.getEndMonth() != null && req.getEndMonth() >= 1 && req.getEndMonth() <= 12) existing.setEndMonth(req.getEndMonth());
        if (req.getPeakMultiplier() != null && req.getPeakMultiplier() > 0) existing.setPeakMultiplier(req.getPeakMultiplier());
        if (req.getNotes() != null) existing.setNotes(req.getNotes().trim());
        if (req.getActive() != null) existing.setActive(req.getActive());

        var saved = cropSeasonRepository.save(existing);
        return ResponseEntity.ok(ApiResponse.ok("Đã cập nhật cấu hình mùa vụ!", saved));
    }

    @DeleteMapping("/seasons/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteCropSeason(@PathVariable Long id) {
        if (cropSeasonRepository == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error("Kho cấu hình mùa vụ chưa sẵn sàng."));
        }
        var existing = cropSeasonRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Không tìm thấy mùa vụ #" + id));
        }
        if (!ownershipResolver.canModifyOwnedResource(existing.getOwnerId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Bạn không có quyền xóa mùa vụ của chủ vườn khác!"));
        }
        cropSeasonRepository.delete(existing);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa cấu hình mùa vụ!", null));
    }

    private void initSampleCropSeasons() {
        var s1 = com.example.myfullstackapp.entity.CropSeason.builder()
                .ownerId("farmer_hung")
                .farmCode("NT-DL-01")
                .productName("Xà Lách Lô Lô Xanh Thủy Canh")
                .categoryCode("rau_la")
                .startMonth(10)
                .endMonth(2)
                .peakMultiplier(1.25)
                .notes("Vụ Đông - Xuân vắt qua năm mới, hái sáng 05:30 mỗi ngày.")
                .build();
        var s2 = com.example.myfullstackapp.entity.CropSeason.builder()
                .ownerId("farmer_hung")
                .farmCode("NT-DL-01")
                .productName("Cà Chua Bi Cherry Đỏ Ngọt")
                .categoryCode("cu_qua")
                .startMonth(12)
                .endMonth(4)
                .peakMultiplier(1.30)
                .notes("Mùa nắng ấm Đà Lạt vắt qua Tết, chuẩn bị giàn tưới nhỏ giọt.")
                .build();
        var s3 = com.example.myfullstackapp.entity.CropSeason.builder()
                .ownerId("farmer_hung")
                .farmCode("NT-DL-01")
                .productName("Cải Xoăn Kale Hữu Cơ Dinh Dưỡng")
                .categoryCode("rau_la")
                .startMonth(9)
                .endMonth(11)
                .peakMultiplier(1.22)
                .notes("Giai đoạn cuối vụ Thu, theo dõi sâu tơ và chuẩn bị luống gối vụ mới.")
                .build();
        var s4 = com.example.myfullstackapp.entity.CropSeason.builder()
                .ownerId("farmer_hung")
                .farmCode("NT-DL-01")
                .productName("Bơ Sáp 034 Đặc Sản Cao Nguyên")
                .categoryCode("trai_cay")
                .startMonth(4)
                .endMonth(8)
                .peakMultiplier(1.35)
                .notes("Chính vụ Hè - Thu cao nguyên Lâm Đồng, hiện giai đoạn dưỡng cây.")
                .build();
        var s5 = com.example.myfullstackapp.entity.CropSeason.builder()
                .ownerId("farmer_thieu")
                .farmCode("NT-MC-03")
                .productName("Dâu Tây New Zealand Mộc Châu")
                .categoryCode("trai_cay")
                .startMonth(11)
                .endMonth(3)
                .peakMultiplier(1.38)
                .notes("Chính vụ Đông - Xuân vắt qua năm mới trên cao nguyên Mộc Châu.")
                .build();
        var s6 = com.example.myfullstackapp.entity.CropSeason.builder()
                .ownerId("farmer_thieu")
                .farmCode("NT-MC-03")
                .productName("Mận Hậu Mộc Châu")
                .categoryCode("trai_cay")
                .startMonth(5)
                .endMonth(7)
                .peakMultiplier(1.32)
                .notes("Thu hoạch tập trung đầu Hè từ tháng 5 đến tháng 7.")
                .build();
        cropSeasonRepository.saveAll(List.of(s1, s2, s3, s4, s5, s6));
    }

    private String resolveFarmCode(String farmName) {
        if (farmName == null || farmName.isBlank()) return "NT-DL-01";
        String lower = farmName.toLowerCase();
        if (lower.contains("cao lãnh") || lower.contains("đồng tháp") || lower.contains("nt-dt")) {
            return "NT-DT-02";
        }
        if (lower.contains("mộc châu") || lower.contains("hữu cơ") || lower.contains("nt-mc") || lower.contains("sơn la")) {
            return "NT-MC-03";
        }
        return "NT-DL-01";
    }

    private String resolveOwnerId(String farmCodeOrName) {
        if (farmCodeOrName == null) return "farmer_hung";
        String lower = farmCodeOrName.toLowerCase();
        if (lower.contains("mc") || lower.contains("mộc châu") || lower.contains("thieu") || lower.contains("thiệu")) {
            return "farmer_thieu";
        }
        return "farmer_hung";
    }

}
