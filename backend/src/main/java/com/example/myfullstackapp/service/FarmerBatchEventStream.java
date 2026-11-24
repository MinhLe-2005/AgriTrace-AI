package com.example.myfullstackapp.service;

import com.example.myfullstackapp.entity.HarvestLot;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Server-Sent Events (SSE) Stream phát thông báo đồng bộ thời gian thực
 * trạng thái Lô Thu Hoạch cho Giao diện Nông Dân (Farmer Dashboard)
 * khi các bên (Admin duyệt, Tài xế nhận hàng, Thủ kho nhập kho) thao tác.
 */
@Service
@Slf4j
public class FarmerBatchEventStream {

    private final Set<SseEmitter> clients = ConcurrentHashMap.newKeySet();
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    public SseEmitter subscribe() {
        if (clients.size() >= 50) {
            log.warn("Đạt giới hạn 50 kết nối SSE Farmer realtime");
        }

        SseEmitter emitter = new SseEmitter(180_000L); // 3 phút timeout, frontend tự reconnect
        clients.add(emitter);

        Runnable cleanup = () -> clients.remove(emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(() -> {
            cleanup.run();
            try {
                emitter.complete();
            } catch (Exception ignored) {}
        });
        emitter.onError(error -> cleanup.run());

        // Gửi ngay event bắt tay kết nối
        Map<String, Object> welcome = new LinkedHashMap<>();
        welcome.put("connected", true);
        welcome.put("serverTime", LocalDateTime.now().format(TIME_FMT));
        welcome.put("message", "Đã kết nối luồng đồng bộ thời gian thực AgriTrace AI");
        send(emitter, "connected", welcome);

        return emitter;
    }

    /**
     * Phát broadcast cập nhật trạng thái lô hàng đến tất cả nông dân đang online
     */
    public void broadcastBatchChanged(HarvestLot lot, String actionType, String note, String actorRole) {
        if (lot == null) return;

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("code", lot.getCode());
        payload.put("product", lot.getProduct());
        payload.put("status", lot.getStatus());
        payload.put("statusColor", lot.getStatusColor());
        payload.put("transportStatus", lot.getTransportStatus());
        payload.put("transportDestination", lot.getTransportDestination());
        payload.put("actionType", actionType); // ADMIN_APPROVED, DRIVER_PICKUP, WAREHOUSE_INBOUND, STATUS_UPDATED
        payload.put("actorRole", actorRole);   // ADMIN, DISTRIBUTOR, WAREHOUSE, FARMER
        payload.put("note", note != null ? note : "");
        payload.put("timestamp", LocalDateTime.now().format(TIME_FMT));

        log.info("Broadcast SSE batch [{}] status: {} | transport: {} by {}",
                lot.getCode(), lot.getStatus(), lot.getTransportStatus(), actorRole);

        for (SseEmitter emitter : clients) {
            send(emitter, "batch-changed", payload);
        }
    }

    private void send(SseEmitter emitter, String eventName, Object data) {
        try {
            emitter.send(SseEmitter.event()
                    .name(eventName)
                    .data(data));
        } catch (Exception disconnected) {
            clients.remove(emitter);
            try {
                emitter.complete();
            } catch (Exception ignored) {}
        }
    }

    @PreDestroy
    public void closeAll() {
        for (SseEmitter emitter : clients) {
            try {
                emitter.complete();
            } catch (Exception ignored) {}
        }
        clients.clear();
    }
}
