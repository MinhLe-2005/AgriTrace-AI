package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.entity.Voucher;
import com.example.myfullstackapp.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherRepository voucherRepository;

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
}
