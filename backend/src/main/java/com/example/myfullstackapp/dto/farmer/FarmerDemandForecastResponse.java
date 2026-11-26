package com.example.myfullstackapp.dto.farmer;

import java.util.List;

/**
 * Response payload for Farmer AI Demand Forecast (7-30 days horizon).
 */
public record FarmerDemandForecastResponse(
        String ownerId,
        String farmCode,
        int horizonDays,
        String currentSeasonName,
        String generatedAt,
        String modelEngine,
        int analyzedOrdersCount,
        double totalPredictedDemand,
        double totalAvailableSupply,
        int deficitCount,
        int surplusCount,
        int balancedCount,
        String executiveSummary,
        List<ForecastProductItem> items,
        List<ForecastTimelinePoint> timeline
) {
    public record ForecastProductItem(
            String productId,
            String productName,
            String categoryCode,
            String unit,
            String farmCode,
            String farmName,
            double soldLast7Days,
            double soldLast30Days,
            double avgDailyDemand,
            double seasonalMultiplier,
            String seasonPhase,
            double campaignBoostMultiplier,
            String activeCampaignTitle,
            double currentSupply,
            double predictedDemand,
            double supplyGap,
            double recommendedPrepQty,
            double growthPercent,
            String riskStatus,
            String recommendation,
            String dataBasis,
            int confidencePercent
    ) {
    }

    public record ForecastTimelinePoint(
            String label,
            double predictedDemand,
            double supplyBaseline
    ) {
    }
}
