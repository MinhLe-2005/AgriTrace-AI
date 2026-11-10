package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.AlertAction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface AlertActionRepository extends JpaRepository<AlertAction, UUID> {
    List<AlertAction> findByAlertIdOrderByCreatedAtAsc(UUID alertId);
}
