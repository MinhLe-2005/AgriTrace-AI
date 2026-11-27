package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.OrderMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface OrderMessageRepository extends JpaRepository<OrderMessage, Long> {
    List<OrderMessage> findByOrderCodeOrderByCreatedAtAsc(String orderCode);
    List<OrderMessage> findByOrderCodeInOrderByCreatedAtAsc(Collection<String> orderCodes);
    List<OrderMessage> findByFarmNameOrderByCreatedAtDesc(String farmName);
    List<OrderMessage> findAllByOrderByCreatedAtDesc();
}
