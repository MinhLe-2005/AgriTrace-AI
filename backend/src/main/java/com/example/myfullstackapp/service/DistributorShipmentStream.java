package com.example.myfullstackapp.service;

import com.example.myfullstackapp.event.DistributorShipmentChanged;
import com.example.myfullstackapp.event.DistributorNotificationCreated;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Locale;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DistributorShipmentStream {
    private static final String ADMIN_SCOPE = "admin";
    private final ConcurrentHashMap<String, Set<SseEmitter>> clients = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String email, boolean isAdmin) {
        List<String> scopes = isAdmin
                ? List.of(ADMIN_SCOPE, adminScope(email))
                : List.of(distributorScope(email));
        for (String scope : scopes) {
            Set<SseEmitter> scopedClients = clients.computeIfAbsent(scope, ignored -> ConcurrentHashMap.newKeySet());
            if (scopedClients.size() >= 25) throw new IllegalStateException("Quá nhiều kết nối theo dõi trực tiếp");
        }

        SseEmitter emitter = new SseEmitter(120_000L);
        scopes.forEach(scope -> clients.get(scope).add(emitter));
        Runnable remove = () -> scopes.forEach(scope -> {
            Set<SseEmitter> scopedClients = clients.get(scope);
            if (scopedClients != null) scopedClients.remove(emitter);
        });
        emitter.onCompletion(remove);
        emitter.onTimeout(() -> { remove.run(); emitter.complete(); });
        emitter.onError(error -> remove.run());
        send(scopes.stream().map(clients::get).filter(java.util.Objects::nonNull).findFirst().orElseThrow(), emitter,
                "connected", "{\"connected\":true}");
        return emitter;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void shipmentChanged(DistributorShipmentChanged event) {
        sendToScope(ADMIN_SCOPE, event);
        if (event.distributorEmail() != null) sendToScope(distributorScope(event.distributorEmail()), event);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void notificationCreated(DistributorNotificationCreated event) {
        String scope = event.adminRecipient() ? adminScope(event.recipientEmail()) : distributorScope(event.recipientEmail());
        sendToScope(scope, "notification", event);
    }

    private void sendToScope(String scope, DistributorShipmentChanged event) {
        Set<SseEmitter> scopedClients = clients.get(scope);
        if (scopedClients == null) return;
        for (SseEmitter emitter : scopedClients) send(scopedClients, emitter, "shipment-change", event);
    }

    private void sendToScope(String scope, String name, Object event) {
        Set<SseEmitter> scopedClients = clients.get(scope);
        if (scopedClients == null) return;
        for (SseEmitter emitter : scopedClients) send(scopedClients, emitter, name, event);
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

    private String adminScope(String email) { return "admin:" + email.toLowerCase(Locale.ROOT); }

    @PreDestroy
    public void close() { clients.values().forEach(set -> set.forEach(SseEmitter::complete)); }
}
