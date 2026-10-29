package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.distributor.*;
import com.example.myfullstackapp.entity.Shipment;
import com.example.myfullstackapp.entity.ShipmentReceipt;
import com.example.myfullstackapp.entity.ShipmentTrackingEvent;
import com.example.myfullstackapp.exception.ConflictException;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.ShipmentReceiptRepository;
import com.example.myfullstackapp.repository.ShipmentRepository;
import com.example.myfullstackapp.repository.ShipmentTrackingEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DistributorShipmentService {
    private static final Set<String> VALID_STATUSES = Set.of("PREPARING", "IN_TRANSIT", "DELIVERED", "RECEIVED", "CANCELLED");
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Bangkok");

    private final ShipmentRepository shipmentRepository;
    private final ShipmentTrackingEventRepository trackingEventRepository;
    private final ShipmentReceiptRepository shipmentReceiptRepository;

    @Transactional(readOnly = true)
    public DistributorDashboardResponse dashboard(String actorEmail, boolean isAdmin) {
        List<Shipment> shipments = visibleShipments(actorEmail, isAdmin, null);
        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        long deliveredToday = shipments.stream()
                .filter(shipment -> shipment.getActualArrival() != null)
                .filter(shipment -> shipment.getActualArrival().atZone(BUSINESS_ZONE).toLocalDate().equals(today))
                .filter(shipment -> "DELIVERED".equals(shipment.getStatus()) || "RECEIVED".equals(shipment.getStatus()))
                .count();
        OptionalDouble calculatedAverageTemperature = shipments.stream()
                .map(Shipment::getTemperatureC)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average();
        Double averageTemperature = calculatedAverageTemperature.isPresent() ? calculatedAverageTemperature.getAsDouble() : null;
        return new DistributorDashboardResponse(
                shipments.stream().filter(shipment -> "IN_TRANSIT".equals(shipment.getStatus())).count(),
                shipments.stream().filter(shipment -> "PREPARING".equals(shipment.getStatus())).count(),
                deliveredToday,
                shipments.stream().filter(shipment -> "DELIVERED".equals(shipment.getStatus())).count(),
                averageTemperature
        );
    }

    @Transactional(readOnly = true)
    public List<ShipmentResponse> list(String actorEmail, boolean isAdmin, String status) {
        return visibleShipments(actorEmail, isAdmin, status).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ShipmentResponse> history(String actorEmail, boolean isAdmin) {
        return visibleShipments(actorEmail, isAdmin, null).stream()
                .filter(shipment -> "DELIVERED".equals(shipment.getStatus()) || "RECEIVED".equals(shipment.getStatus()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ShipmentResponse get(String shipmentCode, String actorEmail, boolean isAdmin) {
        return toResponse(findVisibleShipment(shipmentCode, actorEmail, isAdmin));
    }

    @Transactional(readOnly = true)
    public List<TrackingEventResponse> tracking(String shipmentCode, String actorEmail, boolean isAdmin) {
        Shipment shipment = findVisibleShipment(shipmentCode, actorEmail, isAdmin);
        return trackingEventRepository.findByShipmentIdOrderByEventTimeAsc(shipment.getId()).stream()
                .map(event -> new TrackingEventResponse(event.getId(), event.getLocation(), event.getTemperatureC(), event.getHumidityPercent(),
                        event.getStatus(), event.getNote(), event.getEventTime()))
                .toList();
    }

    @Transactional
    public ShipmentResponse create(CreateShipmentRequest request, String actorEmail) {
        String shipmentCode = optionalText(request.shipmentCode());
        if (shipmentCode == null) shipmentCode = generatedShipmentCode();
        shipmentCode = shipmentCode.toUpperCase(Locale.ROOT);
        if (shipmentRepository.findByShipmentCodeIgnoreCase(shipmentCode).isPresent()) {
            throw new ConflictException("Mã chuyến vận chuyển đã tồn tại");
        }

        Shipment shipment = Shipment.builder()
                .shipmentCode(shipmentCode)
                .distributorEmail(actorEmail)
                .orderCodes(joinCodes(request.orderCodes()))
                .driverName(request.driverName().trim())
                .driverPhone(optionalText(request.driverPhone()))
                .vehicleNumber(request.vehicleNumber().trim())
                .origin(request.origin().trim())
                .destination(request.destination().trim())
                .productSummary(request.productSummary().trim())
                .lotCode(optionalText(request.lotCode()))
                .temperatureC(request.temperatureC() == null ? 4.5 : request.temperatureC())
                .status("PREPARING")
                .dispatchTime(parseInstant(request.dispatchTime()))
                .estimatedArrival(parseInstant(request.estimatedArrival()))
                .build();
        Shipment saved = shipmentRepository.save(shipment);
        recordEvent(saved, saved.getOrigin(), saved.getTemperatureC(), null, "PREPARING", "Đã tạo phiếu vận chuyển, chờ xuất phát.", Instant.now());
        return toResponse(saved);
    }

    @Transactional
    public ShipmentResponse update(String shipmentCode, UpdateShipmentRequest request, String actorEmail, boolean isAdmin) {
        Shipment shipment = findVisibleShipment(shipmentCode, actorEmail, isAdmin);
        if (request.orderCodes() != null) shipment.setOrderCodes(joinCodes(request.orderCodes()));
        if (optionalText(request.driverName()) != null) shipment.setDriverName(request.driverName().trim());
        if (request.driverPhone() != null) shipment.setDriverPhone(optionalText(request.driverPhone()));
        if (optionalText(request.vehicleNumber()) != null) shipment.setVehicleNumber(request.vehicleNumber().trim());
        if (optionalText(request.origin()) != null) shipment.setOrigin(request.origin().trim());
        if (optionalText(request.destination()) != null) shipment.setDestination(request.destination().trim());
        if (optionalText(request.productSummary()) != null) shipment.setProductSummary(request.productSummary().trim());
        if (request.lotCode() != null) shipment.setLotCode(optionalText(request.lotCode()));
        if (request.temperatureC() != null) shipment.setTemperatureC(request.temperatureC());
        if (request.dispatchTime() != null) shipment.setDispatchTime(parseInstant(request.dispatchTime()));
        if (request.estimatedArrival() != null) shipment.setEstimatedArrival(parseInstant(request.estimatedArrival()));
        return toResponse(shipment);
    }

    @Transactional
    public ShipmentResponse updateStatus(String shipmentCode, UpdateShipmentStatusRequest request, String actorEmail, boolean isAdmin) {
        Shipment shipment = findVisibleShipment(shipmentCode, actorEmail, isAdmin);
        String status = normalizeStatus(request.status());
        assertStatusTransition(shipment.getStatus(), status);
        Instant now = Instant.now();
        shipment.setStatus(status);
        if (request.temperatureC() != null) shipment.setTemperatureC(request.temperatureC());
        if (("DELIVERED".equals(status) || "RECEIVED".equals(status)) && shipment.getActualArrival() == null) shipment.setActualArrival(now);
        recordEvent(shipment, request.location().trim(), request.temperatureC(), request.humidityPercent(), status, optionalText(request.note()), now);
        return toResponse(shipment);
    }

    @Transactional
    public ShipmentResponse addTrackingEvent(String shipmentCode, CreateTrackingEventRequest request, String actorEmail, boolean isAdmin) {
        Shipment shipment = findVisibleShipment(shipmentCode, actorEmail, isAdmin);
        String eventStatus = optionalText(request.status()) == null ? shipment.getStatus() : normalizeStatus(request.status());
        Instant now = Instant.now();
        if (optionalText(request.status()) != null) {
            assertStatusTransition(shipment.getStatus(), eventStatus);
            shipment.setStatus(eventStatus);
        }
        if (request.temperatureC() != null) shipment.setTemperatureC(request.temperatureC());
        if (("DELIVERED".equals(eventStatus) || "RECEIVED".equals(eventStatus)) && shipment.getActualArrival() == null) shipment.setActualArrival(now);
        recordEvent(shipment, request.location().trim(), request.temperatureC(), request.humidityPercent(), eventStatus, optionalText(request.note()), now);
        return toResponse(shipment);
    }

    @Transactional
    public ShipmentResponse receive(String shipmentCode, ReceiveShipmentRequest request, String actorEmail, boolean isAdmin) {
        Shipment shipment = findVisibleShipment(shipmentCode, actorEmail, isAdmin);
        Instant receivedAt = parseInstant(request.receivedAt());
        if (receivedAt == null) receivedAt = Instant.now();
        ShipmentReceipt receipt = shipmentReceiptRepository.findByShipmentId(shipment.getId())
                .orElseGet(() -> ShipmentReceipt.builder().shipment(shipment).build());
        receipt.setReceiverName(request.receiverName().trim());
        receipt.setReceiverPhone(optionalText(request.receiverPhone()));
        receipt.setNote(optionalText(request.note()));
        receipt.setQrValue(optionalText(request.qrValue()));
        receipt.setReceivedAt(receivedAt);
        shipmentReceiptRepository.save(receipt);

        shipment.setStatus("RECEIVED");
        if (shipment.getActualArrival() == null) shipment.setActualArrival(receivedAt);
        recordEvent(shipment, shipment.getDestination(), shipment.getTemperatureC(), null, "RECEIVED",
                "Tiếp nhận QR bởi " + receipt.getReceiverName() + (receipt.getNote() == null ? "" : ": " + receipt.getNote()), receivedAt);
        return toResponse(shipment);
    }

    private List<Shipment> visibleShipments(String actorEmail, boolean isAdmin, String status) {
        String normalizedStatus = optionalText(status) == null ? null : normalizeStatus(status);
        if (isAdmin) {
            return normalizedStatus == null
                    ? shipmentRepository.findAllByOrderByCreatedAtDesc()
                    : shipmentRepository.findByStatusOrderByCreatedAtDesc(normalizedStatus);
        }
        return normalizedStatus == null
                ? shipmentRepository.findByDistributorEmailIgnoreCaseOrderByCreatedAtDesc(actorEmail)
                : shipmentRepository.findByDistributorEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(actorEmail, normalizedStatus);
    }

    private Shipment findVisibleShipment(String shipmentCode, String actorEmail, boolean isAdmin) {
        Shipment shipment = shipmentRepository.findByShipmentCodeIgnoreCase(shipmentCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến vận chuyển"));
        if (!isAdmin && !actorEmail.equalsIgnoreCase(shipment.getDistributorEmail())) {
            throw new AccessDeniedException("Bạn không có quyền truy cập chuyến vận chuyển này");
        }
        return shipment;
    }

    private ShipmentTrackingEvent recordEvent(Shipment shipment, String location, Double temperatureC, Double humidityPercent,
                                               String status, String note, Instant eventTime) {
        return trackingEventRepository.save(ShipmentTrackingEvent.builder()
                .shipment(shipment)
                .location(location)
                .temperatureC(temperatureC)
                .humidityPercent(humidityPercent)
                .status(status)
                .note(note)
                .eventTime(eventTime)
                .build());
    }

    private ShipmentResponse toResponse(Shipment shipment) {
        List<TrackingEventResponse> trackingEvents = trackingEventRepository.findByShipmentIdOrderByEventTimeAsc(shipment.getId()).stream()
                .map(event -> new TrackingEventResponse(event.getId(), event.getLocation(), event.getTemperatureC(), event.getHumidityPercent(),
                        event.getStatus(), event.getNote(), event.getEventTime()))
                .toList();
        ShipmentReceiptResponse receipt = shipmentReceiptRepository.findByShipmentId(shipment.getId())
                .map(item -> new ShipmentReceiptResponse(item.getReceiverName(), item.getReceiverPhone(), item.getNote(), item.getQrValue(), item.getReceivedAt()))
                .orElse(null);
        return new ShipmentResponse(
                shipment.getId(), shipment.getShipmentCode(), splitCodes(shipment.getOrderCodes()), shipment.getDriverName(), shipment.getDriverPhone(),
                shipment.getVehicleNumber(), shipment.getOrigin(), shipment.getDestination(), shipment.getProductSummary(), shipment.getLotCode(),
                shipment.getTemperatureC(), shipment.getStatus(), shipment.getDispatchTime(), shipment.getEstimatedArrival(), shipment.getActualArrival(),
                shipment.getCreatedAt(), trackingEvents, receipt
        );
    }

    private String normalizeStatus(String status) {
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (!VALID_STATUSES.contains(normalized)) throw new IllegalArgumentException("Trạng thái chuyến hàng không hợp lệ");
        return normalized;
    }

    private void assertStatusTransition(String currentStatus, String nextStatus) {
        if (Objects.equals(currentStatus, nextStatus)) return;
        Map<String, Set<String>> allowedTransitions = Map.of(
                "PREPARING", Set.of("IN_TRANSIT", "CANCELLED"),
                "IN_TRANSIT", Set.of("DELIVERED", "CANCELLED"),
                "DELIVERED", Set.of("RECEIVED"),
                "RECEIVED", Set.of(),
                "CANCELLED", Set.of()
        );
        if (!allowedTransitions.getOrDefault(currentStatus, Set.of()).contains(nextStatus)) {
            throw new IllegalArgumentException("Không thể chuyển trạng thái từ " + currentStatus + " sang " + nextStatus);
        }
    }

    private String generatedShipmentCode() {
        return "SHIP-" + DateTimeFormatter.ofPattern("yyMMddHHmmss").withZone(BUSINESS_ZONE).format(Instant.now())
                + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase(Locale.ROOT);
    }

    private Instant parseInstant(String value) {
        String text = optionalText(value);
        if (text == null) return null;
        try {
            return Instant.parse(text);
        } catch (DateTimeParseException ignored) {
            try {
                return OffsetDateTime.parse(text).toInstant();
            } catch (DateTimeParseException ignoredOffset) {
                try {
                    return LocalDateTime.parse(text).atZone(BUSINESS_ZONE).toInstant();
                } catch (DateTimeParseException exception) {
                    throw new IllegalArgumentException("Định dạng thời gian không hợp lệ");
                }
            }
        }
    }

    private String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String joinCodes(List<String> codes) {
        if (codes == null) return "";
        return codes.stream().map(this::optionalText).filter(Objects::nonNull).distinct().collect(Collectors.joining(","));
    }

    private List<String> splitCodes(String codes) {
        if (codes == null || codes.isBlank()) return List.of();
        return Arrays.stream(codes.split(",")).map(String::trim).filter(value -> !value.isBlank()).toList();
    }
}
