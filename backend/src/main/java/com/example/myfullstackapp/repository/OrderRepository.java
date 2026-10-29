package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    List<Order> findAllByOrderByCreatedAtDesc();
    Optional<Order> findByOrderCode(String orderCode);
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Order> findByStatusInOrderByCreatedAtDesc(List<String> statuses, Pageable pageable);
}
