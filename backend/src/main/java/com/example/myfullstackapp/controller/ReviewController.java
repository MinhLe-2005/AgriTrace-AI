package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.review.CreateReviewRequest;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.entity.Product;
import com.example.myfullstackapp.entity.Review;
import com.example.myfullstackapp.repository.OrderRepository;
import com.example.myfullstackapp.repository.ProductRepository;
import com.example.myfullstackapp.repository.ReviewRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @GetMapping("/product/{productName}")
    public ApiResponse<List<Review>> getProductReviews(@PathVariable String productName) {
        return ApiResponse.ok("Lấy danh sách đánh giá thành công", reviewRepository.findByProductNameOrderByCreatedAtDesc(productName));
    }

    @GetMapping("/order/{orderCode}")
    public ApiResponse<List<Review>> getOrderReviews(@PathVariable String orderCode) {
        return ApiResponse.ok("Lấy đánh giá đơn hàng thành công", reviewRepository.findByOrderCodeOrderByCreatedAtDesc(orderCode));
    }

    @PostMapping
    @Transactional
    public ApiResponse<Review> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            Authentication authentication
    ) {
        String email = "customer@gmail.com";
        String name = "Khách hàng";
        if (authentication != null && authentication.isAuthenticated()) {
            email = authentication.getName();
            name = authentication.getName();
        }

        // Check if order exists
        Order order = orderRepository.findByOrderCode(request.getOrderCode())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + request.getOrderCode()));

        if (order.getUserEmail() != null && !order.getUserEmail().equalsIgnoreCase(email)) {
            // If user logged in has specific email, set name from order
            name = order.getReceiverName() != null ? order.getReceiverName() : name;
        } else if (order.getReceiverName() != null) {
            name = order.getReceiverName();
        }

        Review review = Review.builder()
                .orderCode(request.getOrderCode())
                .productName(request.getProductName())
                .userEmail(email)
                .userName(name)
                .rating(request.getRating())
                .comment(request.getComment())
                .createdAt(LocalDateTime.now())
                .build();

        Review saved = reviewRepository.save(review);

        // Update product rating and reviews count if matching product found
        List<Product> products = productRepository.findAll();
        for (Product product : products) {
            if (product.getName() != null && product.getName().equalsIgnoreCase(request.getProductName())) {
                List<Review> allReviews = reviewRepository.findByProductNameOrderByCreatedAtDesc(product.getName());
                double avg = allReviews.stream().mapToInt(Review::getRating).average().orElse(5.0);
                product.setRating(Math.round(avg * 10.0) / 10.0);
                product.setReviews(allReviews.size());
                productRepository.save(product);
                break;
            }
        }

        return ApiResponse.ok("Cảm ơn bạn đã đánh giá sản phẩm!", saved);
    }
}
