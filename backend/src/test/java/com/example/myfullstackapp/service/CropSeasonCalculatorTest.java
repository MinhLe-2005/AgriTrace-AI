package com.example.myfullstackapp.service;

import com.example.myfullstackapp.service.CropSeasonCalculator.SeasonCode;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CropSeasonCalculatorTest {

    @Test
    void handlesCrossYearSeasonNovemberToFebruaryAcrossAllTwelveMonths() {
        int start = 11;
        int end = 2;

        var oct = CropSeasonCalculator.evaluate(start, end, 10);
        assertEquals(SeasonCode.UPCOMING, oct.code());
        assertEquals("Sắp vào mùa", oct.label());
        assertTrue(oct.crossYear());
        assertEquals(4, oct.durationMonths());
        assertFalse(oct.inSeasonWindow());

        for (int inSeasonMonth : new int[]{11, 12, 1}) {
            var res = CropSeasonCalculator.evaluate(start, end, inSeasonMonth);
            assertEquals(SeasonCode.IN_SEASON, res.code(), "Month " + inSeasonMonth + " should be Đang vào mùa");
            assertEquals("Đang vào mùa", res.label());
            assertTrue(res.inSeasonWindow());
        }

        var feb = CropSeasonCalculator.evaluate(start, end, 2);
        assertEquals(SeasonCode.LATE_SEASON, feb.code());
        assertEquals("Cuối mùa", feb.label());
        assertTrue(feb.inSeasonWindow());

        for (int offMonth : new int[]{3, 4, 5, 6, 7, 8, 9}) {
            var res = CropSeasonCalculator.evaluate(start, end, offMonth);
            assertEquals(SeasonCode.OFF_SEASON, res.code(), "Month " + offMonth + " should be Hết mùa");
            assertEquals("Hết mùa", res.label());
            assertFalse(res.inSeasonWindow());
        }
    }

    @Test
    void handlesUpcomingWrapAroundWhenSeasonStartsInJanuary() {
        var decBeforeJanStart = CropSeasonCalculator.evaluate(1, 3, LocalDate.of(2026, 12, 15));
        assertEquals(SeasonCode.UPCOMING, decBeforeJanStart.code());
        assertEquals("Sắp vào mùa", decBeforeJanStart.label());
        assertFalse(decBeforeJanStart.crossYear());
        assertEquals(3, decBeforeJanStart.durationMonths());

        assertEquals(SeasonCode.IN_SEASON, CropSeasonCalculator.evaluate(1, 3, 1).code());
        assertEquals(SeasonCode.IN_SEASON, CropSeasonCalculator.evaluate(1, 3, 2).code());
        assertEquals(SeasonCode.LATE_SEASON, CropSeasonCalculator.evaluate(1, 3, 3).code());
        assertEquals(SeasonCode.OFF_SEASON, CropSeasonCalculator.evaluate(1, 3, 4).code());
    }

    @Test
    void handlesSameYearSingleMonthAndFullYearSeasons() {
        assertEquals(SeasonCode.UPCOMING, CropSeasonCalculator.evaluate(4, 8, 3).code());
        assertEquals(SeasonCode.IN_SEASON, CropSeasonCalculator.evaluate(4, 8, 5).code());
        assertEquals(SeasonCode.LATE_SEASON, CropSeasonCalculator.evaluate(4, 8, 8).code());
        assertEquals(SeasonCode.OFF_SEASON, CropSeasonCalculator.evaluate(4, 8, 11).code());

        var singleMonth = CropSeasonCalculator.evaluate(6, 6, 6);
        assertEquals(SeasonCode.IN_SEASON, singleMonth.code());
        assertEquals(1, singleMonth.durationMonths());
        assertEquals(SeasonCode.UPCOMING, CropSeasonCalculator.evaluate(6, 6, 5).code());
        assertEquals(SeasonCode.OFF_SEASON, CropSeasonCalculator.evaluate(6, 6, 7).code());

        for (int m = 1; m <= 12; m++) {
            assertEquals(SeasonCode.IN_SEASON, CropSeasonCalculator.evaluate(1, 12, m).code());
        }
    }

    @Test
    void validatesMonthBoundsAndComputesDemandMultipliers() {
        assertThrows(IllegalArgumentException.class, () -> CropSeasonCalculator.evaluate(0, 5, 3));
        assertThrows(IllegalArgumentException.class, () -> CropSeasonCalculator.evaluate(3, 13, 3));
        assertThrows(IllegalArgumentException.class, () -> CropSeasonCalculator.evaluate(3, 5, 0));

        assertEquals(1.36, CropSeasonCalculator.computeDemandMultiplier(SeasonCode.IN_SEASON, 1.36));
        assertEquals(1.18, CropSeasonCalculator.computeDemandMultiplier(SeasonCode.UPCOMING, 1.36));
        assertEquals(0.86, CropSeasonCalculator.computeDemandMultiplier(SeasonCode.LATE_SEASON, 1.36));
        assertEquals(0.72, CropSeasonCalculator.computeDemandMultiplier(SeasonCode.OFF_SEASON, 1.36));
    }
}
