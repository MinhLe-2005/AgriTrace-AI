package com.example.myfullstackapp.exception;

import com.example.myfullstackapp.dto.ApiError;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ApiError> notFound(ResourceNotFoundException ex) { return error(HttpStatus.NOT_FOUND, ex.getMessage(), "NOT_FOUND", List.of()); }

    @ExceptionHandler({ConflictException.class, DataIntegrityViolationException.class})
    ResponseEntity<ApiError> conflict(RuntimeException ex) {
        String msg = ex instanceof ConflictException ? ex.getMessage() : "Dữ liệu bị trùng lặp trong hệ thống";
        return error(HttpStatus.CONFLICT, msg, "CONFLICT", List.of());
    }

    @ExceptionHandler({InvalidTokenException.class, AuthenticationException.class})
    ResponseEntity<ApiError> unauthorized(RuntimeException ex) {
        return error(HttpStatus.UNAUTHORIZED, "Tài khoản hoặc mật khẩu không chính xác", "UNAUTHORIZED", List.of());
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiError> forbidden(AccessDeniedException ex) { return error(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này", "FORBIDDEN", List.of()); }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex) {
        List<String> details = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : error.getField() + ": không hợp lệ").toList();
        String mainMsg = !details.isEmpty() ? details.get(0) : "Dữ liệu không hợp lệ";
        return error(HttpStatus.BAD_REQUEST, mainMsg, "VALIDATION_ERROR", details);
    }

    @ExceptionHandler({ConstraintViolationException.class, MethodArgumentTypeMismatchException.class, IllegalArgumentException.class})
    ResponseEntity<ApiError> badRequest(Exception ex) {
        String msg = ex.getMessage() != null && !ex.getMessage().isBlank() ? ex.getMessage() : "Yêu cầu không hợp lệ";
        return error(HttpStatus.BAD_REQUEST, msg, "BAD_REQUEST", List.of(msg));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> unexpected(Exception ex) {
        log.error("Unhandled error", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra từ máy chủ", "INTERNAL_ERROR", List.of());
    }

    private ResponseEntity<ApiError> error(HttpStatus status, String message, String code, List<String> details) {
        return ResponseEntity.status(status).body(ApiError.of(message, code, details));
    }
}
