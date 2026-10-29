package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.RiskRule;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RiskRuleRepository extends JpaRepository<RiskRule, UUID> {}
