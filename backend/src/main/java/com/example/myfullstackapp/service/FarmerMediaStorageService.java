package com.example.myfullstackapp.service;

import com.example.myfullstackapp.entity.FarmerUploadedMedia;
import com.example.myfullstackapp.repository.FarmerUploadedMediaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.util.*;

/**
 * Handles image uploads for farming logs and certificates.
 * Supports Supabase Storage when configured via env, and persists reliably in PostgreSQL agri_uploaded_media otherwise.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FarmerMediaStorageService {

    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
    );

    private final FarmerUploadedMediaRepository mediaRepository;

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.service-key:}")
    private String supabaseServiceKey;

    @Value("${supabase.storage-bucket:agritrace-media}")
    private String supabaseBucket;

    @Transactional
    public StoredMediaResult storeImage(MultipartFile file, String ownerId, String category) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn tệp ảnh hợp lệ để tải lên");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("Dung lượng ảnh tối đa là 5MB");
        }
        String contentType = file.getContentType() != null
                ? file.getContentType().toLowerCase(Locale.ROOT)
                : "application/octet-stream";
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Chỉ hỗ trợ định dạng ảnh JPG, PNG, WEBP hoặc GIF");
        }

        byte[] bytes = file.getBytes();
        String safeFileName = sanitizeFileName(file.getOriginalFilename(), contentType);
        String cleanCategory = category != null && !category.isBlank() ? category.trim() : "farming-log";

        Optional<String> externalUrl = tryUploadToSupabaseStorage(bytes, safeFileName, contentType, cleanCategory);
        if (externalUrl.isPresent()) {
            return new StoredMediaResult(
                    null,
                    externalUrl.get(),
                    safeFileName,
                    contentType,
                    bytes.length,
                    "SUPABASE_STORAGE"
            );
        }

        FarmerUploadedMedia saved = mediaRepository.save(
                FarmerUploadedMedia.builder()
                        .fileName(safeFileName)
                        .contentType(contentType)
                        .sizeBytes((long) bytes.length)
                        .ownerId(ownerId)
                        .category(cleanCategory)
                        .data(bytes)
                        .build()
        );

        String pathUrl = "/api/v1/farmer/uploads/" + saved.getId();
        return new StoredMediaResult(
                saved.getId(),
                pathUrl,
                saved.getFileName(),
                saved.getContentType(),
                saved.getSizeBytes(),
                "POSTGRES_STORAGE"
        );
    }

    @Transactional(readOnly = true)
    public Optional<FarmerUploadedMedia> getMedia(UUID id) {
        return mediaRepository.findById(id);
    }

    private Optional<String> tryUploadToSupabaseStorage(
            byte[] bytes,
            String fileName,
            String contentType,
            String category
    ) {
        if (supabaseUrl == null || supabaseUrl.isBlank()
                || supabaseServiceKey == null || supabaseServiceKey.isBlank()) {
            return Optional.empty();
        }
        try {
            String cleanBase = supabaseUrl.replaceAll("/+$", "");
            String objectPath = category + "/" + UUID.randomUUID() + "-" + fileName;
            String uploadEndpoint = String.format("%s/storage/v1/object/%s/%s", cleanBase, supabaseBucket, objectPath);

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(supabaseServiceKey.trim());
            headers.set("apikey", supabaseServiceKey.trim());
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.set("x-upsert", "true");

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.exchange(
                    URI.create(uploadEndpoint),
                    HttpMethod.POST,
                    new HttpEntity<>(bytes, headers),
                    String.class
            );
            if (response.getStatusCode().is2xxSuccessful()) {
                String publicUrl = String.format("%s/storage/v1/object/public/%s/%s", cleanBase, supabaseBucket, objectPath);
                return Optional.of(publicUrl);
            }
        } catch (Exception ex) {
            log.warn("Không thể tải lên Supabase Storage ({}), chuyển sang lưu PostgreSQL Storage", ex.getMessage());
        }
        return Optional.empty();
    }

    private String sanitizeFileName(String original, String contentType) {
        String ext = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };
        if (original == null || original.isBlank()) {
            return "evidence-" + System.currentTimeMillis() + ext;
        }
        String base = original.replaceAll("[^A-Za-z0-9._-]", "_");
        if (!base.contains(".")) {
            return base + ext;
        }
        return base;
    }

    public record StoredMediaResult(
            UUID id,
            String url,
            String fileName,
            String contentType,
            long sizeBytes,
            String provider
    ) {
    }
}
