package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.entity.Product;
import com.example.myfullstackapp.repository.ProductRepository;
import com.example.myfullstackapp.service.FarmerOwnershipResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;
    private final FarmerOwnershipResolver ownershipResolver;

    @GetMapping
    public ResponseEntity<List<Product>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) String ownerId,
            @RequestParam(required = false) String farmCode,
            @RequestParam(required = false) String scope
    ) {
        List<Product> list;
        if (category != null && !category.equalsIgnoreCase("all")) {
            list = productRepository.findByCategoryCodeAndActiveTrue(category.toLowerCase());
        } else if (Boolean.TRUE.equals(featured)) {
            list = productRepository.findByFeaturedTrueAndActiveTrue();
        } else {
            list = productRepository.findByActiveTrue();
        }

        Authentication auth = ownershipResolver.currentAuthentication();
        boolean isFarmerPortalQuery = "farmer".equalsIgnoreCase(scope) || (ownerId != null && !ownerId.isBlank());
        if (isFarmerPortalQuery) {
            String effectiveOwner = ownershipResolver.resolveEffectiveOwnerId(ownerId, farmCode);
            if (ownershipResolver.isStrictFarmerSession(auth) || (ownerId != null && !ownerId.isBlank())) {
                list = list.stream()
                        .filter(p -> p.getOwnerId() != null && p.getOwnerId().equalsIgnoreCase(effectiveOwner))
                        .toList();
            }
        }
        if (farmCode != null && !farmCode.isBlank()) {
            String cleanFarm = farmCode.trim().toLowerCase();
            list = list.stream()
                    .filter(p -> (p.getFarmCode() != null && p.getFarmCode().equalsIgnoreCase(cleanFarm))
                            || (p.getFarm() != null && p.getFarm().toLowerCase().contains(cleanFarm)))
                    .toList();
        }

        return ResponseEntity.ok(list);
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
        String farmHint = req.getFarmCode() != null && !req.getFarmCode().isBlank() ? req.getFarmCode() : req.getFarm();
        req.setOwnerId(ownershipResolver.resolveEffectiveOwnerId(req.getOwnerId(), farmHint));
        Product saved = productRepository.save(req);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        Product existing = productRepository.findById(id).orElse(null);
        if (existing != null) {
            if (!ownershipResolver.canModifyOwnedResource(existing.getOwnerId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            productRepository.deleteById(id);
        }
        return ResponseEntity.noContent().build();
    }
}
