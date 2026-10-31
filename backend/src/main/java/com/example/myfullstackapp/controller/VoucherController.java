package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.entity.Voucher;
import com.example.myfullstackapp.repository.OrderRepository;
import com.example.myfullstackapp.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/{code}")
    public ResponseEntity<Voucher> getVoucherByCode(@PathVariable String code) {
        return voucherRepository.findByCodeIgnoreCaseAndActiveTrue(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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
        long minOrder = switch (cleanCode) {
            case "VIPGOLD" -> 300000L;
            case "FREESHIP", "FREESHIP25" -> 150000L;
            case "AGRI30" -> 100000L;
            case "VIETGAP10" -> 120000L;
            default -> 0L;
        };

        if (subtotal > 0 && subtotal < minOrder) {
            return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "code", cleanCode,
                    "message", String.format("Đơn hàng tối thiểu phải từ %,d đ để áp dụng mã [%s].", minOrder, cleanCode)
            ));
        }

        // Discount computation
        long discountAmount = switch (cleanCode) {
            case "VIPGOLD" -> 50000L;
            case "FREESHIP", "FREESHIP25" -> 25000L;
            case "AGRI30" -> Math.min(50000L, Math.max(30000L, (long)(subtotal * 0.3)));
            case "VIETGAP10" -> 15000L;
            default -> 20000L;
        };

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
