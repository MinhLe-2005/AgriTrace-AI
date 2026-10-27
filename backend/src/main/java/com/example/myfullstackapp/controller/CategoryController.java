package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.entity.Category;
import com.example.myfullstackapp.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAllByOrderByDisplayOrderAsc());
    }

    @GetMapping("/{code}")
    public ResponseEntity<Category> getCategoryByCode(@PathVariable String code) {
        return categoryRepository.findByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
