package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.Changed;

import jakarta.annotation.PreDestroy;

import org.springframework.stereotype.Service;
import org.springframework.transaction.event.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;
import java.util.concurrent.*;

@Service
public class WarehouseMonitoringStream {
    private final ConcurrentHashMap<UUID, Set<SseEmitter>> clients = new ConcurrentHashMap<>();
    private final ThreadPoolExecutor broadcasts =
            new ThreadPoolExecutor(
                    1,
                    2,
                    30,
                    TimeUnit.SECONDS,
                    new ArrayBlockingQueue<>(200),
                    r -> {
                        var thread = new Thread(r, "warehouse-sse");
                        thread.setDaemon(true);
                        return thread;
                    },
                    new ThreadPoolExecutor.DiscardPolicy());

    public SseEmitter subscribe(UUID warehouseId) {
        var set = clients.computeIfAbsent(warehouseId, id -> ConcurrentHashMap.newKeySet());
        synchronized (set) {
            if (set.size() >= 25)
                throw new com.example.myfullstackapp.exception.ConflictException(
                        "Too many live connections for this warehouse");
            var emitter = new SseEmitter(300_000L);
            set.add(emitter);
            Runnable remove = () -> set.remove(emitter);
            emitter.onCompletion(remove);
            emitter.onTimeout(
                    () -> {
                        remove.run();
                        emitter.complete();
                    });
            emitter.onError(error -> remove.run());
            send(set, emitter, "connected", new Changed(warehouseId, "CONNECTED"));
            return emitter;
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void changed(Changed event) {
        var set = clients.get(event.warehouseId());
        if (set == null) return;
        broadcasts.execute(
                () -> {
                    for (var emitter : set) send(set, emitter, "warehouse-change", event);
                });
    }

    public void heartbeat() {
        clients.forEach(
                (id, set) -> {
                    for (var emitter : set) send(set, emitter, "ping", Map.of("warehouseId", id));
                });
    }

    private void send(Set<SseEmitter> set, SseEmitter emitter, String name, Object value) {
        try {
            emitter.send(SseEmitter.event().name(name).data(value));
        } catch (Exception disconnected) {
            set.remove(emitter);
            emitter.complete();
        }
    }

    @PreDestroy
    public void close() {
        broadcasts.shutdownNow();
        clients.values().forEach(set -> set.forEach(SseEmitter::complete));
    }
}
