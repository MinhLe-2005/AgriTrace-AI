package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.distributor.*;
import com.example.myfullstackapp.entity.DistributorQrCode;
import com.example.myfullstackapp.entity.HarvestLot;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.DistributorQrCodeRepository;
import com.example.myfullstackapp.repository.HarvestLotRepository;
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
    private final HarvestLotRepository harvestLotRepository;
    private final DistributorShipmentService distributorShipmentService;

    @Transactional
    public QrCodeResponse generate(GenerateQrCodeRequest request, String actorEmail, boolean isAdmin) {
        String batchCode = request.batchCode().trim().toUpperCase(Locale.ROOT);
        if (!harvestLotRepository.existsByCodeIgnoreCase(batchCode)) {
            throw new ResourceNotFoundException("Không tìm thấy lô hàng để tạo mã QR");
        }
        String shipmentCode = optionalText(request.shipmentCode());
        if (shipmentCode != null) {
            // Verifies the actor owns the shipment (or is an administrator).
            ShipmentResponse shipment = distributorShipmentService.get(shipmentCode, actorEmail, isAdmin);
            if (optionalText(shipment.lotCode()) != null && !batchCode.equalsIgnoreCase(shipment.lotCode())) {
                throw new IllegalArgumentException("Mã lô QR phải trùng với mã lô của chuyến vận chuyển");
            }
            shipmentCode = shipmentCode.toUpperCase(Locale.ROOT);
        }
        DistributorQrCode qrCode = DistributorQrCode.builder()
                .code(nextCode(batchCode))
                .batchCode(batchCode)
                .shipmentCode(shipmentCode)
                .productId(optionalText(request.productId()))
                .generatedBy(actorEmail)
                .build();
        return toResponse(qrCodeRepository.save(qrCode));
    }

    @Transactional
    public QrCodeResponse lookup(String code, String actorEmail, boolean isAdmin) {
        DistributorQrCode qrCode = find(code);
        verifyOwner(qrCode, actorEmail, isAdmin);
        qrCode.setScanCount(qrCode.getScanCount() == null ? 1L : qrCode.getScanCount() + 1L);
        return toResponse(qrCode);
    }

    @Transactional
    public ShipmentResponse receive(ReceiveGoodsRequest request, String actorEmail, boolean isAdmin) {
        String shipmentCode = optionalText(request.shipmentCode());
        String qrValue = optionalText(request.qrCode());
        if (qrValue != null) {
            DistributorQrCode qrCode = find(qrValue);
            verifyOwner(qrCode, actorEmail, isAdmin);
            String qrShipmentCode = optionalText(qrCode.getShipmentCode());
            if (shipmentCode != null && qrShipmentCode != null && !shipmentCode.equalsIgnoreCase(qrShipmentCode)) {
                throw new IllegalArgumentException("Mã QR không thuộc chuyến vận chuyển được chọn");
            }
            if (shipmentCode == null) shipmentCode = qrShipmentCode;
            qrCode.setScanCount(qrCode.getScanCount() == null ? 1L : qrCode.getScanCount() + 1L);
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
        HarvestLot lot = harvestLotRepository.findByCodeIgnoreCase(qrCode.getBatchCode()).orElse(null);
        return new QrCodeResponse(
                qrCode.getCode(), qrCode.getBatchCode(), qrCode.getShipmentCode(), qrCode.getProductId(),
                qrCode.getGeneratedBy(), qrCode.getScanCount(), qrCode.getCreatedAt(),
                lot == null ? null : lot.getFarmName(),
                lot == null ? null : lot.getHarvestDate(),
                lot == null ? null : lot.getCert()
        );
    }

    private String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
