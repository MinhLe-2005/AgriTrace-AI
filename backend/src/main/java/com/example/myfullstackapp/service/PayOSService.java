package com.example.myfullstackapp.service;

import com.example.myfullstackapp.config.AppProperties;
import com.example.myfullstackapp.dto.payment.PaymentLinkResponse;
import com.example.myfullstackapp.dto.payment.PayOSWebhookRequest;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.repository.OrderRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayOSService {

    private final AppProperties appProperties;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Transactional
    public PaymentLinkResponse createPaymentLink(String orderCode, String returnUrl, String cancelUrl) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + orderCode));

        String clientId = appProperties.getPayos().getClientId();
        String apiKey = appProperties.getPayos().getApiKey();
        String checksumKey = appProperties.getPayos().getChecksumKey();

        // Safe integer orderCode for payOS (numeric value required)
        long numericOrderCode = Math.abs(orderCode.hashCode()) % 1_000_000_000L;
        if (order.getId() != null) {
            numericOrderCode = order.getId() * 10000L + (long)(Math.random() * 9000 + 1000);
        }

        long amount = order.getTotal() > 0 ? order.getTotal() : 50000L;
        String cleanOrderCode = orderCode.replaceAll("[^a-zA-Z0-9]", "");
        String description = "AGRI " + cleanOrderCode;
        if (description.length() > 25) {
            description = description.substring(0, 25);
        }

        String effectiveReturnUrl = (returnUrl != null && !returnUrl.isBlank()) 
                ? returnUrl 
                : "http://localhost:3000/checkout/success?orderCode=" + orderCode;
        String effectiveCancelUrl = (cancelUrl != null && !cancelUrl.isBlank()) 
                ? cancelUrl 
                : "http://localhost:3000/checkout/cancel?orderCode=" + orderCode;

        if (clientId != null && !clientId.isBlank() && apiKey != null && !apiKey.isBlank() && checksumKey != null && !checksumKey.isBlank()) {
            try {
                // Calculate signature according to payOS specification
                // data = "amount=" + amount + "&cancelUrl=" + cancelUrl + "&description=" + description + "&orderCode=" + orderCode + "&returnUrl=" + returnUrl;
                String signData = String.format("amount=%d&cancelUrl=%s&description=%s&orderCode=%d&returnUrl=%s",
                        amount, effectiveCancelUrl, description, numericOrderCode, effectiveReturnUrl);
                String signature = hmacSha256(signData, checksumKey);

                Map<String, Object> reqBody = new HashMap<>();
                reqBody.put("orderCode", numericOrderCode);
                reqBody.put("amount", amount);
                reqBody.put("description", description);
                reqBody.put("buyerName", order.getReceiverName());
                reqBody.put("buyerPhone", order.getReceiverPhone());
                reqBody.put("buyerAddress", order.getReceiverAddress());
                reqBody.put("returnUrl", effectiveReturnUrl);
                reqBody.put("cancelUrl", effectiveCancelUrl);
                reqBody.put("signature", signature);

                String jsonPayload = objectMapper.writeValueAsString(reqBody);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api-merchant.payos.vn/v2/payment-requests"))
                        .header("Content-Type", "application/json")
                        .header("x-client-id", clientId)
                        .header("x-api-key", apiKey)
                        .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    if ("00".equals(root.path("code").asText())) {
                        JsonNode data = root.path("data");
                        String paymentLinkId = data.path("paymentLinkId").asText();
                        String rawQr = data.path("qrCode").asText();
                        String bin = data.path("bin").asText();
                        String accNo = data.path("accountNumber").asText();
                        String accName = data.path("accountName").asText();

                        String qrImageUrl = rawQr;
                        if (rawQr != null && !rawQr.startsWith("http")) {
                            qrImageUrl = String.format("https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
                                    bin, accNo, amount,
                                    java.net.URLEncoder.encode(description, StandardCharsets.UTF_8),
                                    java.net.URLEncoder.encode(accName, StandardCharsets.UTF_8));
                        }

                        String bankName = "970422".equals(bin) ? "MB Bank (Ngân Hàng Quân Đội)" : "Napas 247";

                        order.setPayosOrderCode(numericOrderCode);
                        order.setPaymentLinkId(paymentLinkId);
                        orderRepository.save(order);

                        return PaymentLinkResponse.builder()
                                .orderCode(orderCode)
                                .amount(amount)
                                .checkoutUrl(data.path("checkoutUrl").asText())
                                .qrCode(qrImageUrl)
                                .paymentLinkId(paymentLinkId)
                                .status(data.path("status").asText("PENDING"))
                                .accountNumber(accNo)
                                .accountName(accName)
                                .bankName(bankName)
                                .bin(bin)
                                .description(description)
                                .build();
                    }
                }
                log.warn("payOS API call returned non-zero code: {}. Falling back to Napas VietQR simulation.", response.body());
            } catch (Exception e) {
                log.warn("Error calling payOS API directly (will use Napas VietQR simulation): {}", e.getMessage());
            }
        }

        // Sandbox / VietQR fallback simulation
        String fallbackQr = String.format(
                "https://img.vietqr.io/image/970436-1025588999-compact2.png?amount=%d&addInfo=AGRI%%20%s&accountName=NONG%%20SAN%%20AGRITRACE",
                amount, orderCode
        );

        return PaymentLinkResponse.builder()
                .orderCode(orderCode)
                .amount(amount)
                .checkoutUrl("http://localhost:3000/checkout/success?orderCode=" + orderCode)
                .qrCode(fallbackQr)
                .paymentLinkId("PAYOS-LINK-" + numericOrderCode)
                .status("PENDING")
                .accountNumber("1025588999")
                .accountName("NÔNG SẢN AGRITRACE")
                .bankName("Vietcombank (VCB)")
                .bin("970436")
                .description(description)
                .build();
    }

    @Transactional
    public boolean processWebhook(PayOSWebhookRequest request) {
        if (request == null || request.getData() == null) {
            return false;
        }

        PayOSWebhookRequest.PayOSWebhookData data = request.getData();
        log.info("Received payOS webhook for orderCode: {}, amount: {}", data.getOrderCode(), data.getAmount());

        // Verify checksum signature if configured
        String checksumKey = appProperties.getPayos().getChecksumKey();
        if (checksumKey != null && !checksumKey.isBlank() && request.getSignature() != null) {
            // Verify signature on data
            String computedSig = computeWebhookSignature(data, checksumKey);
            if (!computedSig.equalsIgnoreCase(request.getSignature())) {
                log.error("Invalid payOS webhook signature! Received: {}, Computed: {}", request.getSignature(), computedSig);
                throw new SecurityException("Invalid webhook signature");
            }
        }

        // Update matching order
        String desc = data.getDescription() != null ? data.getDescription() : "";
        List<Order> orders = orderRepository.findAll();
        for (Order order : orders) {
            if (desc.contains(order.getOrderCode()) || (order.getId() != null && data.getOrderCode() != null && desc.contains(String.valueOf(data.getOrderCode())))) {
                order.setStatus("PAID");
                order.setPaidAt(LocalDateTime.now());
                order.setPaymentRef(data.getReference() != null ? data.getReference() : "PAYOS-" + data.getOrderCode());
                orderRepository.save(order);
                log.info("Order #{} marked as PAID via payOS webhook", order.getOrderCode());
                return true;
            }
        }

        return false;
    }

    @Transactional
    public Order simulatePaymentSuccess(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + orderCode));

        order.setStatus("PAID");
        order.setPaidAt(LocalDateTime.now());
        order.setPaymentRef("PAYOS-DEMO-" + System.currentTimeMillis());
        return orderRepository.save(order);
    }

    @Transactional
    public String checkStatus(String orderCode) {
        Optional<Order> orderOpt = orderRepository.findByOrderCode(orderCode);
        if (orderOpt.isEmpty()) {
            return "NOT_FOUND";
        }
        Order order = orderOpt.get();
        if ("PAID".equalsIgnoreCase(order.getStatus())) {
            return "PAID";
        }

        String clientId = appProperties.getPayos().getClientId();
        String apiKey = appProperties.getPayos().getApiKey();

        if (clientId != null && !clientId.isBlank() && apiKey != null && !apiKey.isBlank()) {
            String queryId = order.getPayosOrderCode() != null ? String.valueOf(order.getPayosOrderCode()) : order.getPaymentLinkId();
            if (queryId != null && !queryId.isBlank()) {
                try {
                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create("https://api-merchant.payos.vn/v2/payment-requests/" + queryId))
                            .header("x-client-id", clientId)
                            .header("x-api-key", apiKey)
                            .GET()
                            .build();

                    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                    if (response.statusCode() == 200) {
                        JsonNode root = objectMapper.readTree(response.body());
                        if ("00".equals(root.path("code").asText())) {
                            String payosStatus = root.path("data").path("status").asText();
                            if ("PAID".equalsIgnoreCase(payosStatus)) {
                                order.setStatus("PAID");
                                order.setPaidAt(LocalDateTime.now());
                                order.setPaymentRef("PAYOS-" + queryId);
                                orderRepository.save(order);
                                log.info("Order #{} confirmed PAID via live payOS status check!", orderCode);
                                return "PAID";
                            }
                        }
                    }
                } catch (Exception e) {
                    log.debug("Live payOS status check error for #{}: {}", orderCode, e.getMessage());
                }
            }
        }

        return order.getStatus();
    }

    private String computeWebhookSignature(PayOSWebhookRequest.PayOSWebhookData data, String checksumKey) {
        // Sorted keys according to payOS webhook format
        Map<String, Object> map = new TreeMap<>();
        if (data.getAmount() != null) map.put("amount", data.getAmount());
        if (data.getCode() != null) map.put("code", data.getCode());
        if (data.getCounterAccountBankId() != null) map.put("counterAccountBankId", data.getCounterAccountBankId());
        if (data.getCounterAccountBankName() != null) map.put("counterAccountBankName", data.getCounterAccountBankName());
        if (data.getCounterAccountName() != null) map.put("counterAccountName", data.getCounterAccountName());
        if (data.getCounterAccountNumber() != null) map.put("counterAccountNumber", data.getCounterAccountNumber());
        if (data.getCurrency() != null) map.put("currency", data.getCurrency());
        if (data.getDescription() != null) map.put("description", data.getDescription());
        if (data.getOrderCode() != null) map.put("orderCode", data.getOrderCode());
        if (data.getPaymentLinkId() != null) map.put("paymentLinkId", data.getPaymentLinkId());
        if (data.getReference() != null) map.put("reference", data.getReference());
        if (data.getTransactionDateTime() != null) map.put("transactionDateTime", data.getTransactionDateTime());

        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (sb.length() > 0) sb.append("&");
            sb.append(entry.getKey()).append("=").append(entry.getValue());
        }
        return hmacSha256(sb.toString(), checksumKey);
    }

    private String hmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error computing HMAC-SHA256", e);
        }
    }
}
