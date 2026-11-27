package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.review.CreateReviewRequest;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.entity.Product;
import com.example.myfullstackapp.entity.Review;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.repository.OrderRepository;
import com.example.myfullstackapp.repository.ProductRepository;
import com.example.myfullstackapp.repository.ReviewRepository;
import com.example.myfullstackapp.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
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
        String cleanCode = orderCode.replace("#", "").trim().toUpperCase(Locale.ROOT);
        return ApiResponse.ok("Lấy đánh giá đơn hàng thành công", reviewRepository.findByOrderCodeOrderByCreatedAtDesc(cleanCode));
    }

    @PostMapping
    @Transactional
    public ApiResponse<Review> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            Authentication authentication
    ) {
        String cleanCode = request.getOrderCode().replace("#", "").trim().toUpperCase(Locale.ROOT);
        Order order = orderRepository.findByOrderCode(cleanCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + cleanCode));

        String email = (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equalsIgnoreCase(authentication.getName()))
                ? authentication.getName().trim()
                : (order.getUserEmail() != null && !order.getUserEmail().isBlank()
                    ? order.getUserEmail().trim()
                    : "customer@gmail.com");

        Optional<User> dbUser = userRepository.findByEmailIgnoreCase(email);
        String name = dbUser.map(User::getFullName).filter(n -> !n.isBlank())
                .orElse(order.getReceiverName() != null && !order.getReceiverName().isBlank()
                        ? order.getReceiverName()
                        : "Khách hàng");

        String cleanProductName = request.getProductName().trim();
        if (reviewRepository.existsByOrderCodeAndProductName(cleanCode, cleanProductName)) {
            throw new IllegalArgumentException("Bạn đã gửi đánh giá cho sản phẩm này ở đơn #" + cleanCode + " rồi.");
        }

        Review review = Review.builder()
                .orderCode(cleanCode)
                .productName(cleanProductName)
                .userEmail(email)
                .userName(name)
                .rating(request.getRating())
                .comment(request.getComment())
                .createdAt(LocalDateTime.now())
                .build();

        Review saved = reviewRepository.save(review);

        // Chỉ thưởng +20 điểm tối đa 1 lần cho mỗi đơn hàng (chống cộng đúp)
        boolean pointsAwardedNow = false;
        try {
            pointsAwardedNow = loyaltyService.awardReviewPoints(email, cleanCode, 20);
        } catch (Exception ignored) {
            // non-blocking
        }

        List<Product> products = productRepository.findAll();
        for (Product product : products) {
            if (product.getName() != null && product.getName().equalsIgnoreCase(cleanProductName)) {
                List<Review> allReviews = reviewRepository.findByProductNameOrderByCreatedAtDesc(product.getName());
                double avg = allReviews.stream().mapToInt(Review::getRating).average().orElse(5.0);
                product.setRating(Math.round(avg * 10.0) / 10.0);
                product.setReviews(allReviews.size());
                productRepository.save(product);
                break;
            }
        }

        String msg = pointsAwardedNow
                ? "Cảm ơn bạn đã đánh giá! Bạn vừa nhận +20 điểm AgriClub."
                : "Cảm ơn bạn đã đánh giá sản phẩm!";
        return ApiResponse.ok(msg, saved);
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
