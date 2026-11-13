package com.example.myfullstackapp.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

/** Sinh slug URL từ tiêu đề tiếng Việt: bỏ dấu, chuyển đ→d, nối bằng '-'. */
public final class SlugUtil {
    private static final int MAX_LENGTH = 120;

    private SlugUtil() {
    }

    public static String toSlug(String input) {
        if (input == null) return "";
        String s = input.replace('đ', 'd').replace('Đ', 'D');
        s = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        s = s.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (s.length() > MAX_LENGTH) {
            s = s.substring(0, MAX_LENGTH).replaceAll("-+$", "");
        }
        return s;
    }

    /**
     * Trả về slug duy nhất: dùng {@code requested} nếu có, ngược lại sinh từ {@code title};
     * nếu trùng thì thêm hậu tố -2, -3, ...
     */
    public static String uniqueSlug(String requested, String title, Predicate<String> taken) {
        String base = toSlug(requested != null && !requested.isBlank() ? requested : title);
        if (base.isEmpty()) base = "bai-viet";
        String candidate = base;
        int n = 2;
        while (taken.test(candidate)) {
            candidate = base + "-" + n++;
        }
        return candidate;
    }
}
