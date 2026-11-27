package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.content.BlogPostRequest;
import com.example.myfullstackapp.dto.content.CampaignRequest;
import com.example.myfullstackapp.entity.BlogPost;
import com.example.myfullstackapp.entity.Campaign;
import com.example.myfullstackapp.service.ContentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Sự kiện mùa vụ và bài viết blog.
 * GET công khai (blog chỉ trả bài đang bật, trừ khi admin gọi /all); mọi thao tác ghi yêu cầu ADMIN.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ContentController {
    private final ContentService contentService;

    // ───────────── Campaigns ─────────────

    /** Trả cả sự kiện đã tắt/hết hạn: trang /events hiển thị chúng ở mục "Đã kết thúc". */
    @GetMapping("/campaigns")
    public List<Campaign> listCampaigns() {
        return contentService.listCampaigns();
    }

    @PostMapping("/campaigns")
    @PreAuthorize("hasRole('ADMIN')")
    public Campaign createCampaign(@Valid @RequestBody CampaignRequest req) {
        return contentService.createCampaign(req);
    }

    @PutMapping("/campaigns/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Campaign updateCampaign(@PathVariable String id, @Valid @RequestBody CampaignRequest req) {
        return contentService.updateCampaign(id, req);
    }

    @PatchMapping("/campaigns/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public Campaign toggleCampaign(@PathVariable String id) {
        return contentService.toggleCampaign(id);
    }

    @DeleteMapping("/campaigns/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCampaign(@PathVariable String id) {
        contentService.deleteCampaign(id);
        return ResponseEntity.noContent().build();
    }

    // ───────────── Blog posts ─────────────

    @GetMapping("/blog-posts")
    public List<BlogPost> listBlogPosts() {
        return contentService.listBlogPosts(false);
    }

    @GetMapping("/blog-posts/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BlogPost> listAllBlogPosts() {
        return contentService.listBlogPosts(true);
    }

    @PostMapping("/blog-posts")
    @PreAuthorize("hasRole('ADMIN')")
    public BlogPost createBlogPost(@Valid @RequestBody BlogPostRequest req) {
        return contentService.createBlogPost(req);
    }

    @PutMapping("/blog-posts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BlogPost updateBlogPost(@PathVariable String id, @Valid @RequestBody BlogPostRequest req) {
        return contentService.updateBlogPost(id, req);
    }

    @PatchMapping("/blog-posts/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public BlogPost toggleBlogPost(@PathVariable String id) {
        return contentService.toggleBlogPost(id);
    }

    @DeleteMapping("/blog-posts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBlogPost(@PathVariable String id) {
        contentService.deleteBlogPost(id);
        return ResponseEntity.noContent().build();
    }
}
