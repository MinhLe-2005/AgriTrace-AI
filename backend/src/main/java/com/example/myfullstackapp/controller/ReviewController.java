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
    private final com.example.myfullstackapp.service.LoyaltyService loyaltyService;

    @GetMapping("/product/{productName}")
    public ApiResponse<List<Review>> getProductReviews(@PathVariable String productName) {
        return ApiResponse.ok("Lấy danh sách đánh giá thành công", reviewRepository.findByProductNameOrderByCreatedAtDesc(productName));
    }

    @GetMapping("/all")
    public ApiResponse<List<Review>> getAllReviews() {
        return ApiResponse.ok("Lấy toàn bộ đánh giá thành công", reviewRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")));
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

        // Award +20 points for photo freshness co-inspection & review
        try {
            loyaltyService.awardReviewPoints(email, request.getOrderCode(), 20);
        } catch (Exception ex) {
            // non-blocking
        }

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

    @PostMapping("/{id}/like")
    @Transactional
    public ApiResponse<Review> likeReview(@PathVariable Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đánh giá #" + id));
        int current = review.getLikesCount() != null ? review.getLikesCount() : 0;
        review.setLikesCount(current + 1);
        Review saved = reviewRepository.save(review);
        return ApiResponse.ok("Đã thích đánh giá!", saved);
    }

    @PostMapping("/{id}/unlike")
    @Transactional
    public ApiResponse<Review> unlikeReview(@PathVariable Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đánh giá #" + id));
        int current = review.getLikesCount() != null ? review.getLikesCount() : 0;
        review.setLikesCount(Math.max(0, current - 1));
        Review saved = reviewRepository.save(review);
        return ApiResponse.ok("Đã hủy thích đánh giá!", saved);
    }

    @lombok.Data
    public static class ReplyReviewRequest {
        private String reply;
        private String replyAuthor;
    }

    @PostMapping("/{id}/reply")
    @Transactional
    public ApiResponse<Review> replyReview(
            @PathVariable Long id,
            @RequestBody ReplyReviewRequest request,
            Authentication authentication
    ) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đánh giá #" + id));
        String author = request.getReplyAuthor();
        if (author == null || author.isBlank()) {
            if (authentication != null && authentication.isAuthenticated()) {
                author = authentication.getName();
            } else {
                author = "Đại diện Nhà Vườn";
            }
        }
        review.setReply(request.getReply());
        review.setReplyAuthor(author);
        review.setRepliedAt(LocalDateTime.now());
        Review saved = reviewRepository.save(review);
        return ApiResponse.ok("Đã đăng phản hồi từ nhà vườn!", saved);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ApiResponse<Void> deleteReview(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đánh giá #" + id));
        String prodName = review.getProductName();
        reviewRepository.delete(review);

        // Recalculate product rating & reviews
        List<Product> products = productRepository.findAll();
        for (Product product : products) {
            if (product.getName() != null && product.getName().equalsIgnoreCase(prodName)) {
                List<Review> remaining = reviewRepository.findByProductNameOrderByCreatedAtDesc(prodName);
                double avg = remaining.stream().mapToInt(Review::getRating).average().orElse(5.0);
                product.setRating(Math.round(avg * 10.0) / 10.0);
                product.setReviews(remaining.size());
                productRepository.save(product);
                break;
            }
        }

        return ApiResponse.ok("Đã xóa đánh giá thành công", null);
    }
}
