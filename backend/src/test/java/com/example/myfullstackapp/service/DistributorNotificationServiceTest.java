package com.example.myfullstackapp.service;

import com.example.myfullstackapp.entity.DistributorNotification;
import com.example.myfullstackapp.entity.DistributorNotificationType;
import com.example.myfullstackapp.event.DistributorNotificationCreated;
import com.example.myfullstackapp.repository.DistributorNotificationRepository;
import com.example.myfullstackapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DistributorNotificationServiceTest {
    @Test
    void persistsDistributorNotificationAndQueuesRealtimeEvent() {
        DistributorNotificationRepository notifications = mock(DistributorNotificationRepository.class);
        ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
        DistributorNotificationService service = new DistributorNotificationService(notifications, mock(UserRepository.class), events);
        when(notifications.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.notifyDistributor("  Driver@Example.com ", DistributorNotificationType.SHIPMENT_ASSIGNED,
                "Có chuyến hàng mới", "Bạn được phân công.", "SHIP-123");

        verify(notifications).save(any(DistributorNotification.class));
        verify(events).publishEvent(any(DistributorNotificationCreated.class));
    }

    @Test
    void onlyEmitsRealtimeEventWhenAtomicOverdueInsertSucceeds() {
        DistributorNotificationRepository notifications = mock(DistributorNotificationRepository.class);
        ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
        DistributorNotificationService service = new DistributorNotificationService(notifications, mock(UserRepository.class), events);
        when(notifications.insertOverdueOnce(any(), any(), any(), any(), any(), any())).thenReturn(0, 1);

        service.notifyDistributorOverdueOnce("driver@example.com", "Chuyến hàng quá hạn", "Đã quá thời gian giao.", "SHIP-123", "SHIP-123:eta:100");
        service.notifyDistributorOverdueOnce("driver@example.com", "Chuyến hàng quá hạn", "Đã quá thời gian giao.", "SHIP-123", "SHIP-123:eta:200");

        verify(notifications, org.mockito.Mockito.times(2)).insertOverdueOnce(any(), any(), any(), any(), any(), any());
        verify(events).publishEvent(any(DistributorNotificationCreated.class));
    }
}
