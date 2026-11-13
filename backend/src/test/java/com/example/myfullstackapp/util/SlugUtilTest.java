package com.example.myfullstackapp.util;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SlugUtilTest {

    @Test
    void stripsVietnameseDiacriticsAndPunctuation() {
        assertEquals("mua-thu-hoach-dau-tay-da-lat-giam-20",
                SlugUtil.toSlug("Mùa Thu Hoạch Dâu Tây Đà Lạt — Giảm 20%!"));
        assertEquals("uu-dai-dac-biet", SlugUtil.toSlug("  Ưu đãi   ĐẶC BIỆT  "));
    }

    @Test
    void appendsSuffixWhenTaken() {
        Set<String> taken = Set.of("uu-dai", "uu-dai-2");
        assertEquals("uu-dai-3", SlugUtil.uniqueSlug(null, "Ưu đãi", taken::contains));
    }

    @Test
    void prefersRequestedSlugButStillNormalizesIt() {
        assertEquals("my-custom-slug", SlugUtil.uniqueSlug("My Custom Slug", "Ignored title", s -> false));
    }

    @Test
    void fallsBackWhenTitleHasNoUsableCharacters() {
        assertEquals("bai-viet", SlugUtil.uniqueSlug("", "!!!", s -> false));
    }

    @Test
    void truncatesVeryLongSlugs() {
        String slug = SlugUtil.toSlug("a ".repeat(200));
        assertTrue(slug.length() <= 120);
        assertTrue(!slug.endsWith("-"));
    }
}
