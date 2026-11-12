package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.entity.Voucher;
import com.example.myfullstackapp.repository.OrderRepository;
import com.example.myfullstackapp.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherRepository voucherRepository;
    private final OrderRepository orderRepository;

    @GetMapping
    public ResponseEntity<List<Voucher>> getActiveVouchers() {
        return ResponseEntity.ok(voucherRepository.findByActiveTrue());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public ResponseEntity<List<Voucher>> getAllVouchers() {
        return ResponseEntity.ok(voucherRepository.findAll());
    }

    @GetMapping("/{code}")
    public ResponseEntity<Voucher> getVoucherByCode(@PathVariable String code) {
        return voucherRepository.findByCodeIgnoreCaseAndActiveTrue(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Voucher> createVoucher(@RequestBody Voucher req) {
        if (req.getCode() == null || req.getCode().isBlank()) {
            throw new IllegalArgumentException("Mã voucher không được để trống");
        }
        req.setCode(req.getCode().trim().toUpperCase());
        if (req.getActive() == null) req.setActive(true);
        if (req.getBadgeColor() == null || req.getBadgeColor().isBlank()) {
            req.setBadgeColor("bg-emerald-100 text-emerald-800");
        }
        return ResponseEntity.ok(voucherRepository.save(req));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Voucher> toggleVoucher(@PathVariable Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy voucher ID: " + id));
        voucher.setActive(!Boolean.TRUE.equals(voucher.getActive()));
        return ResponseEntity.ok(voucherRepository.save(voucher));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteVoucher(@PathVariable Long id) {
        voucherRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa voucher thành công"));
    }

    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateVoucher(
            @RequestParam String code,
            @RequestParam(required = false, defaultValue = "0") long subtotal,
            @RequestParam(required = false) String email
    ) {
        String cleanCode = code.trim().toUpperCase();
        var opt = voucherRepository.findByCodeIgnoreCaseAndActiveTrue(cleanCode);

        // Fallback for standard codes
        if (opt.isEmpty() && !List.of("AGRI30", "FREESHIP", "FREESHIP25", "VIPGOLD", "VIETGAP10").contains(cleanCode)) {
            return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "code", cleanCode,
                    "message", "Mã ưu đãi [" + cleanCode + "] không tồn tại hoặc đã hết hiệu lực."
            ));
        }

        // Check if user already used this voucher (1 use per account)
        if (email != null && !email.isBlank()) {
            boolean used = orderRepository.hasUserUsedVoucher(email, cleanCode);
            if (used) {
                return ResponseEntity.ok(Map.of(
                        "valid", false,
                        "code", cleanCode,
                        "message", "Mỗi tài khoản chỉ được sử dụng mã [" + cleanCode + "] 1 lần. Bạn đã áp dụng mã này trong đơn hàng trước."
                ));
            }
        }

        // Min order check
        long minOrder = 0L;
        if (opt.isPresent() && opt.get().getMinOrder() != null && !opt.get().getMinOrder().isBlank()) {
            try {
                minOrder = Long.parseLong(opt.get().getMinOrder().replaceAll("[^0-9]", ""));
            } catch (Exception ignored) {
                minOrder = 0L;
            }
        } else {
            minOrder = switch (cleanCode) {
                case "VIPGOLD" -> 300000L;
                case "FREESHIP", "FREESHIP25" -> 150000L;
                case "AGRI30" -> 100000L;
                case "VIETGAP10" -> 120000L;
                default -> 0L;
            };
        }

        if (subtotal > 0 && subtotal < minOrder) {
            return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "code", cleanCode,
                    "message", String.format("Đơn hàng tối thiểu phải từ %,d đ để áp dụng mã [%s].", minOrder, cleanCode)
            ));
        }

        // Discount computation
        long discountAmount = 20000L;
        if (opt.isPresent() && opt.get().getDiscount() != null && !opt.get().getDiscount().isBlank()) {
            String d = opt.get().getDiscount().trim();
            if (d.endsWith("%")) {
                try {
                    double pct = Double.parseDouble(d.replace("%", "").trim()) / 100.0;
                    discountAmount = (long)(subtotal * pct);
                } catch (Exception ignored) {
                    discountAmount = 20000L;
                }
            } else {
                try {
                    discountAmount = Long.parseLong(d.replaceAll("[^0-9]", ""));
                } catch (Exception ignored) {
                    discountAmount = 20000L;
                }
            }
        } else {
            discountAmount = switch (cleanCode) {
                case "VIPGOLD" -> 50000L;
                case "FREESHIP", "FREESHIP25" -> 25000L;
                case "AGRI30" -> Math.min(50000L, Math.max(30000L, (long)(subtotal * 0.3)));
                case "VIETGAP10" -> 15000L;
                default -> 20000L;
            };
        }

        String type = (cleanCode.contains("FREESHIP")) ? "freeship" : "discount";

        return ResponseEntity.ok(Map.of(
                "valid", true,
                "code", cleanCode,
                "type", type,
                "discount", discountAmount,
                "message", "Áp dụng mã giảm giá thành công!"
        ));
    }
}
