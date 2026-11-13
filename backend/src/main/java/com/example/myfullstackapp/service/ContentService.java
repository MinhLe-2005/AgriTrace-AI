package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.content.BlogPostRequest;
import com.example.myfullstackapp.dto.content.CampaignRequest;
import com.example.myfullstackapp.entity.BlogPost;
import com.example.myfullstackapp.entity.Campaign;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.BlogPostRepository;
import com.example.myfullstackapp.repository.CampaignRepository;
import com.example.myfullstackapp.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/** CRUD cho sự kiện (campaign) và bài viết blog. */
@Service
@RequiredArgsConstructor
public class ContentService {
    private final CampaignRepository campaignRepository;
    private final BlogPostRepository blogPostRepository;

    // ───────────── Campaigns ─────────────

    @Transactional(readOnly = true)
    public List<Campaign> listCampaigns() {
        return campaignRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Campaign createCampaign(CampaignRequest req) {
        validateDates(req);
        Campaign c = new Campaign();
        c.setId("camp-" + shortId());
        c.setSlug(SlugUtil.uniqueSlug(req.getSlug(), req.getTitle(), campaignRepository::existsBySlug));
        applyCampaign(c, req);
        return campaignRepository.save(c);
    }

    @Transactional
    public Campaign updateCampaign(String id, CampaignRequest req) {
        validateDates(req);
        Campaign c = findCampaign(id);
        c.setSlug(SlugUtil.uniqueSlug(req.getSlug(), req.getTitle(), s -> campaignRepository.existsBySlugAndIdNot(s, id)));
        applyCampaign(c, req);
        return campaignRepository.save(c);
    }

    @Transactional
    public Campaign toggleCampaign(String id) {
        Campaign c = findCampaign(id);
        c.setActive(!Boolean.TRUE.equals(c.getActive()));
        return campaignRepository.save(c);
    }

    @Transactional
    public void deleteCampaign(String id) {
        campaignRepository.delete(findCampaign(id));
    }

    private Campaign findCampaign(String id) {
        return campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện: " + id));
    }

    private static void validateDates(CampaignRequest req) {
        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
        }
    }

    private static void applyCampaign(Campaign c, CampaignRequest req) {
        String targetType = req.getTargetType();
        c.setTitle(req.getTitle().trim());
        c.setType(req.getType());
        c.setTypeLabel(req.getTypeLabel());
        c.setTypeColor(req.getTypeColor());
        c.setStartDate(req.getStartDate());
        c.setEndDate(req.getEndDate());
        c.setDiscountPercent(req.getDiscountPercent());
        c.setDiscountAmount(req.getDiscountAmount());
        c.setTargetType(targetType);
        // Chỉ giữ danh sách đích khớp với phạm vi áp dụng, tránh điều kiện ẩn còn sót lại
        c.setTargetCategoryCodes("category".equals(targetType) ? clean(req.getTargetCategoryCodes()) : new ArrayList<>());
        c.setTargetProductIds("product".equals(targetType) ? clean(req.getTargetProductIds()) : new ArrayList<>());
        c.setTargetProductNames("product".equals(targetType) ? clean(req.getTargetProductNames()) : new ArrayList<>());
        c.setVoucherCode(blankToNull(req.getVoucherCode()));
        c.setBannerIcon(req.getBannerIcon());
        c.setBadgeText(req.getBadgeText());
        c.setDescription(req.getDescription());
        c.setFullContent(req.getFullContent());
        c.setActive(req.getActive() == null || req.getActive());
    }

    // ───────────── Blog posts ─────────────

    @Transactional(readOnly = true)
    public List<BlogPost> listBlogPosts(boolean includeInactive) {
        return includeInactive
                ? blogPostRepository.findAllByOrderByCreatedAtDesc()
                : blogPostRepository.findByActiveTrueOrderByCreatedAtDesc();
    }

    @Transactional
    public BlogPost createBlogPost(BlogPostRequest req) {
        BlogPost p = new BlogPost();
        p.setId("blog-" + shortId());
        p.setSlug(SlugUtil.uniqueSlug(req.getSlug(), req.getTitle(), blogPostRepository::existsBySlug));
        applyBlogPost(p, req);
        return blogPostRepository.save(p);
    }

    @Transactional
    public BlogPost updateBlogPost(String id, BlogPostRequest req) {
        BlogPost p = findBlogPost(id);
        p.setSlug(SlugUtil.uniqueSlug(req.getSlug(), req.getTitle(), s -> blogPostRepository.existsBySlugAndIdNot(s, id)));
        applyBlogPost(p, req);
        return blogPostRepository.save(p);
    }

    @Transactional
    public BlogPost toggleBlogPost(String id) {
        BlogPost p = findBlogPost(id);
        p.setActive(!Boolean.TRUE.equals(p.getActive()));
        return blogPostRepository.save(p);
    }

    @Transactional
    public void deleteBlogPost(String id) {
        blogPostRepository.delete(findBlogPost(id));
    }

    private BlogPost findBlogPost(String id) {
        return blogPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết: " + id));
    }

    private static void applyBlogPost(BlogPost p, BlogPostRequest req) {
        p.setTitle(req.getTitle().trim());
        p.setCategory(req.getCategory());
        p.setCategoryLabel(req.getCategoryLabel());
        p.setAuthor(req.getAuthor());
        p.setAuthorRole(req.getAuthorRole());
        p.setDate(req.getDate());
        p.setReadTime(req.getReadTime());
        p.setExcerpt(req.getExcerpt());
        p.setContent(req.getContent());
        p.setCoverImage(blankToNull(req.getCoverImage()));
        p.setFeatured(Boolean.TRUE.equals(req.getFeatured()));
        p.setRelatedProductName(blankToNull(req.getRelatedProductName()));
        p.setActive(req.getActive() == null || req.getActive());
    }

    // ───────────── helpers ─────────────

    private static String shortId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private static List<String> clean(List<String> values) {
        if (values == null) return new ArrayList<>();
        return new ArrayList<>(values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
