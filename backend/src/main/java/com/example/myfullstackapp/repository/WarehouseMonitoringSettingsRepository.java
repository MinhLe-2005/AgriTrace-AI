package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.WarehouseMonitoringSettings;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface WarehouseMonitoringSettingsRepository
        extends JpaRepository<WarehouseMonitoringSettings, UUID> {}
