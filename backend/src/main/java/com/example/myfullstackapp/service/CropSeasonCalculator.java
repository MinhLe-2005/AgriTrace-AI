package com.example.myfullstackapp.service;

import java.time.LocalDate;

/**
 * Pure algorithm computing Vietnamese agricultural crop season status across standard
 * and cross-year ranges (e.g., November -> February of next year).
 */
public final class CropSeasonCalculator {

    public enum SeasonCode {
        UPCOMING("Sắp vào mùa"),
        IN_SEASON("Đang vào mùa"),
        LATE_SEASON("Cuối mùa"),
        OFF_SEASON("Hết mùa");

        private final String label;

        SeasonCode(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }

    public record SeasonEvaluation(
            SeasonCode code,
            String label,
            boolean crossYear,
            int durationMonths,
            boolean inSeasonWindow
    ) {
    }

    private CropSeasonCalculator() {
    }

    public static SeasonEvaluation evaluate(int startMonth, int endMonth, LocalDate date) {
        LocalDate effectiveDate = date != null ? date : LocalDate.now();
        return evaluate(startMonth, endMonth, effectiveDate.getMonthValue());
    }

    public static SeasonEvaluation evaluate(int startMonth, int endMonth, int currentMonth) {
        validateMonth(startMonth, "Tháng bắt đầu");
        validateMonth(endMonth, "Tháng kết thúc");
        validateMonth(currentMonth, "Tháng hiện tại");

        boolean crossYear = startMonth > endMonth;
        int durationMonths = ((endMonth - startMonth + 12) % 12) + 1;
        int distanceFromStart = (currentMonth - startMonth + 12) % 12;

        if (durationMonths == 12) {
            return new SeasonEvaluation(SeasonCode.IN_SEASON, SeasonCode.IN_SEASON.getLabel(), crossYear, durationMonths, true);
        }

        if (distanceFromStart < durationMonths) {
            boolean isFinalMonth = durationMonths >= 2 && distanceFromStart == durationMonths - 1;
            SeasonCode code = isFinalMonth ? SeasonCode.LATE_SEASON : SeasonCode.IN_SEASON;
            return new SeasonEvaluation(code, code.getLabel(), crossYear, durationMonths, true);
        }

        int upcomingMonth = ((startMonth - 2 + 12) % 12) + 1;
        if (currentMonth == upcomingMonth) {
            return new SeasonEvaluation(SeasonCode.UPCOMING, SeasonCode.UPCOMING.getLabel(), crossYear, durationMonths, false);
        }

        return new SeasonEvaluation(SeasonCode.OFF_SEASON, SeasonCode.OFF_SEASON.getLabel(), crossYear, durationMonths, false);
    }

    public static double computeDemandMultiplier(SeasonCode code, Double configuredPeakMultiplier) {
        double peak = configuredPeakMultiplier != null && configuredPeakMultiplier > 0
                ? Math.max(1.0, Math.min(2.0, configuredPeakMultiplier))
                : 1.30;
        return switch (code) {
            case IN_SEASON -> peak;
            case UPCOMING -> Math.max(1.08, Math.round(((1.0 + peak) / 2.0) * 100.0) / 100.0);
            case LATE_SEASON -> 0.86;
            case OFF_SEASON -> 0.72;
        };
    }

    private static void validateMonth(int month, String fieldLabel) {
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException(fieldLabel + " phải nằm trong khoảng từ 1 đến 12 (nhận được: " + month + ")");
        }
    }
}
