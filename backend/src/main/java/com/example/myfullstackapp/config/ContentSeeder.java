package com.example.myfullstackapp.config;

import com.example.myfullstackapp.entity.BlogPost;
import com.example.myfullstackapp.entity.Campaign;
import com.example.myfullstackapp.repository.BlogPostRepository;
import com.example.myfullstackapp.repository.CampaignRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.List;

/** Nạp sự kiện và bài viết mẫu (seed/*.json) khi bảng còn trống. Không ghi đè dữ liệu admin đã sửa. */
@Slf4j
@Component
@RequiredArgsConstructor
public class ContentSeeder implements ApplicationRunner {
    private final CampaignRepository campaignRepository;
    private final BlogPostRepository blogPostRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        ObjectMapper mapper = objectMapper.copy().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        if (campaignRepository.count() == 0) {
            List<Campaign> campaigns = read(mapper, "seed/campaigns.json", new TypeReference<>() {
            });
            campaignRepository.saveAll(campaigns);
            log.info("Seeded {} campaigns", campaigns.size());
        }
        if (blogPostRepository.count() == 0) {
            List<BlogPost> posts = read(mapper, "seed/blog-posts.json", new TypeReference<>() {
            });
            posts.forEach(p -> {
                if (p.getFeatured() == null) p.setFeatured(false);
                if (p.getActive() == null) p.setActive(true);
            });
            blogPostRepository.saveAll(posts);
            log.info("Seeded {} blog posts", posts.size());
        }
    }

    private static <T> List<T> read(ObjectMapper mapper, String path, TypeReference<List<T>> type) {
        try (InputStream in = new ClassPathResource(path).getInputStream()) {
            return mapper.readValue(in, type);
        } catch (Exception e) {
            log.warn("Could not load seed file {}: {}", path, e.getMessage());
            return List.of();
        }
    }
}
