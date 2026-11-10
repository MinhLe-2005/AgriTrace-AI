package com.example.myfullstackapp.dto.loyalty;

import com.example.myfullstackapp.entity.LoyaltyTransaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyProfileResponse {
    private UUID membershipId;
    private UUID userId;
    private String userEmail;
    private String fullName;
    private String phone;
    private Integer currentPoints;
    private Integer lifetimePoints;
    private String tier;
    private BigDecimal totalSpent;
    private String nextTier;
    private BigDecimal nextTierThreshold;
    private Integer progressPercent;
    private Double pointsMultiplier;
    private List<LoyaltyTransaction> recentTransactions;
}
