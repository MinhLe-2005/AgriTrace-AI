package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.entity.Product;
import com.example.myfullstackapp.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<List<Product>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean featured
    ) {
        if (category != null && !category.equalsIgnoreCase("all")) {
            return ResponseEntity.ok(productRepository.findByCategoryCodeAndActiveTrue(category.toLowerCase()));
        }
        if (Boolean.TRUE.equals(featured)) {
            return ResponseEntity.ok(productRepository.findByFeaturedTrueAndActiveTrue());
        }
        return ResponseEntity.ok(productRepository.findByActiveTrue());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable String id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/batch/{batchCode}")
    public ResponseEntity<Product> getProductByBatchCode(@PathVariable String batchCode) {
        return productRepository.findByBatchCode(batchCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Product req) {
        if (req.getName() == null || req.getName().isBlank()) {
            return ResponseEntity.badRequest().body("Tên sản phẩm không được để trống");
        }
        if (req.getPrice() == null || req.getPrice() <= 0) {
            return ResponseEntity.badRequest().body("Giá sản phẩm phải lớn hơn 0");
        }
        if (req.getId() == null || req.getId().isBlank()) {
            req.setId("p_" + System.currentTimeMillis());
        }
        req.setName(req.getName().trim());
        if (req.getOldPrice() == null) {
            req.setOldPrice(req.getPrice());
        }
        if (req.getUnit() == null || req.getUnit().isBlank()) {
            req.setUnit("1 kg");
        }
        if (req.getActive() == null) {
            req.setActive(true);
        }
        Product saved = productRepository.save(req);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
        }
        return ResponseEntity.noContent().build();
    }
}
