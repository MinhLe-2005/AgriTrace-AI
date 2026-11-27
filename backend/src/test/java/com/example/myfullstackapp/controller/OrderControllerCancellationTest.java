package com.example.myfullstackapp.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.example.myfullstackapp.dto.order.CancelOrderRequest;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.entity.StockReservation;
import com.example.myfullstackapp.repository.OrderRepository;
import com.example.myfullstackapp.repository.ProductRepository;
import com.example.myfullstackapp.repository.StockReservationRepository;
import com.example.myfullstackapp.service.LoyaltyService;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

class OrderControllerCancellationTest {
    @Test
    void cancellingOrderReleasesActiveWarehouseReservations() {
        OrderRepository orders = mock(OrderRepository.class);
        ProductRepository products = mock(ProductRepository.class);
        LoyaltyService loyalty = mock(LoyaltyService.class);
        StockReservationRepository reservations = mock(StockReservationRepository.class);

        OrderController controller = new OrderController(orders, products, loyalty);
        ReflectionTestUtils.setField(controller, "stockReservationRepository", reservations);

        Order order =
                Order.builder()
                        .id(42L)
                        .orderCode("AGRI-TEST42")
                        .userEmail("khach@agri.vn")
                        .status("CONFIRMED")
                        .total(100_000L)
                        .build();

        StockReservation active = new StockReservation();
        active.setWarehouseId(UUID.randomUUID());
        active.setOrderId(42L);
        active.setExpiresAt(Instant.now().plusSeconds(600));
        active.setCreatedBy("staff");
        active.setStatus(StockReservation.Status.ACTIVE);

        StockReservation consumed = new StockReservation();
        consumed.setWarehouseId(UUID.randomUUID());
        consumed.setOrderId(42L);
        consumed.setExpiresAt(Instant.now().plusSeconds(600));
        consumed.setCreatedBy("staff");
        consumed.setStatus(StockReservation.Status.CONSUMED);

        when(orders.findByOrderCode("AGRI-TEST42")).thenReturn(Optional.of(order));
        when(orders.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reservations.findByOrderId(42L)).thenReturn(List.of(active, consumed));

        CancelOrderRequest cancelReq = new CancelOrderRequest();
        cancelReq.setReason("Đổi ý");
        var response = controller.cancelOrder("AGRI-TEST42", cancelReq, null);

        assertEquals("CANCELLED", response.data().getStatus());
        assertEquals(StockReservation.Status.RELEASED, active.getStatus());
        assertEquals(StockReservation.Status.CONSUMED, consumed.getStatus());
        verify(reservations).saveAll(List.of(active));
    }
}
