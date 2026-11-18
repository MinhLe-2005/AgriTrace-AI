package com.example.myfullstackapp.service;

import com.example.myfullstackapp.event.DistributorShipmentChanged;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DistributorShipmentStream {
    private static final String ADMIN_SCOPE = "admin";
    private final ConcurrentHashMap<String, Set<SseEmitter>> clients = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String email, boolean isAdmin) {
        String scope = isAdmin ? ADMIN_SCOPE : distributorScope(email);
        Set<SseEmitter> scopedClients = clients.computeIfAbsent(scope, ignored -> ConcurrentHashMap.newKeySet());
        if (scopedClients.size() >= 25) throw new IllegalStateException("Quá nhiều kết nối theo dõi trực tiếp");

        SseEmitter emitter = new SseEmitter(120_000L);
        scopedClients.add(emitter);
        Runnable remove = () -> scopedClients.remove(emitter);
        emitter.onCompletion(remove);
        emitter.onTimeout(() -> { remove.run(); emitter.complete(); });
        emitter.onError(error -> remove.run());
        send(scopedClients, emitter, "connected", "{\"connected\":true}");
        return emitter;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void shipmentChanged(DistributorShipmentChanged event) {
        sendToScope(ADMIN_SCOPE, event);
        if (event.distributorEmail() != null) sendToScope(distributorScope(event.distributorEmail()), event);
    }

    private void sendToScope(String scope, DistributorShipmentChanged event) {
        Set<SseEmitter> scopedClients = clients.get(scope);
        if (scopedClients == null) return;
        for (SseEmitter emitter : scopedClients) send(scopedClients, emitter, "shipment-change", event);
    }

    private void send(Set<SseEmitter> scopedClients, SseEmitter emitter, String name, Object data) {
        try {
            emitter.send(SseEmitter.event().name(name).data(data));
        } catch (Exception disconnected) {
            scopedClients.remove(emitter);
            emitter.complete();
        }
    }

    private String distributorScope(String email) { return "distributor:" + email.toLowerCase(Locale.ROOT); }

    @PreDestroy
    public void close() { clients.values().forEach(set -> set.forEach(SseEmitter::complete)); }
}
