package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.distributor.*;
import com.example.myfullstackapp.entity.DistributorQrCode;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.DistributorQrCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DistributorQrService {
    private final DistributorQrCodeRepository qrCodeRepository;
    private final DistributorShipmentService distributorShipmentService;

    @Transactional
    public QrCodeResponse generate(GenerateQrCodeRequest request, String actorEmail, boolean isAdmin) {
        String shipmentCode = optionalText(request.shipmentCode());
        if (shipmentCode != null) {
            // Verifies the actor owns the shipment (or is an administrator).
            distributorShipmentService.get(shipmentCode, actorEmail, isAdmin);
            shipmentCode = shipmentCode.toUpperCase(Locale.ROOT);
        }
        DistributorQrCode qrCode = DistributorQrCode.builder()
                .code(nextCode(request.batchCode()))
                .batchCode(request.batchCode().trim().toUpperCase(Locale.ROOT))
                .shipmentCode(shipmentCode)
                .productId(optionalText(request.productId()))
                .generatedBy(actorEmail)
                .build();
        return toResponse(qrCodeRepository.save(qrCode));
    }

    @Transactional(readOnly = true)
    public QrCodeResponse lookup(String code, String actorEmail, boolean isAdmin) {
        DistributorQrCode qrCode = find(code);
        verifyOwner(qrCode, actorEmail, isAdmin);
        return toResponse(qrCode);
    }

    @Transactional
    public ShipmentResponse receive(ReceiveGoodsRequest request, String actorEmail, boolean isAdmin) {
        String shipmentCode = optionalText(request.shipmentCode());
        String qrValue = optionalText(request.qrCode());
        if (shipmentCode == null && qrValue != null) {
            DistributorQrCode qrCode = find(qrValue);
            verifyOwner(qrCode, actorEmail, isAdmin);
            shipmentCode = optionalText(qrCode.getShipmentCode());
        }
        if (shipmentCode == null) {
            throw new IllegalArgumentException("QR chưa được gắn với chuyến vận chuyển hoặc thiếu shipmentCode");
        }
        return distributorShipmentService.receive(shipmentCode, new ReceiveShipmentRequest(
                request.receiverName(), request.receiverPhone(), request.note(), qrValue, request.receivedAt()
        ), actorEmail, isAdmin);
    }

    private DistributorQrCode find(String code) {
        return qrCodeRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã QR"));
    }

    private void verifyOwner(DistributorQrCode qrCode, String actorEmail, boolean isAdmin) {
        if (!isAdmin && !actorEmail.equalsIgnoreCase(qrCode.getGeneratedBy())) {
            throw new AccessDeniedException("Bạn không có quyền sử dụng mã QR này");
        }
    }

    private String nextCode(String batchCode) {
        return "AGRITRACE-" + batchCode.trim().toUpperCase(Locale.ROOT) + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private QrCodeResponse toResponse(DistributorQrCode qrCode) {
        return new QrCodeResponse(qrCode.getCode(), qrCode.getBatchCode(), qrCode.getShipmentCode(), qrCode.getProductId(), qrCode.getGeneratedBy(), qrCode.getCreatedAt());
    }

    private String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
