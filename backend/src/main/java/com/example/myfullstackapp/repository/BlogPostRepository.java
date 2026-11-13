package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.BlogPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BlogPostRepository extends JpaRepository<BlogPost, String> {
    List<BlogPost> findAllByOrderByCreatedAtDesc();

    List<BlogPost> findByActiveTrueOrderByCreatedAtDesc();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, String id);
}
