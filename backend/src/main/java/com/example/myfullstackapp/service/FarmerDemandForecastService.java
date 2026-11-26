package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.farmer.FarmerDemandForecastResponse;
import com.example.myfullstackapp.dto.farmer.FarmerDemandForecastResponse.ForecastProductItem;
import com.example.myfullstackapp.dto.farmer.FarmerDemandForecastResponse.ForecastTimelinePoint;
import com.example.myfullstackapp.entity.Campaign;
import com.example.myfullstackapp.entity.Farm;
import com.example.myfullstackapp.entity.HarvestLot;
import com.example.myfullstackapp.entity.Order;
import com.example.myfullstackapp.entity.OrderItem;
import com.example.myfullstackapp.entity.Product;
import com.example.myfullstackapp.repository.CampaignRepository;
import com.example.myfullstackapp.repository.FarmRepository;
import com.example.myfullstackapp.repository.HarvestLotRepository;
import com.example.myfullstackapp.repository.OrderRepository;
import com.example.myfullstackapp.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Analyzes real sales orders, harvest inventory, active seasonal campaigns, and crop calendars
 * to forecast 7-to-30-day demand and suggest planting/harvest targets for each farmer.
 */
@Service
@RequiredArgsConstructor
public class FarmerDemandForecastService {

    private static final Pattern LEADING_NUMBER_PATTERN = Pattern.compile("(\\d+(?:[.,]\\d+)?)");
    private static final Set<String> EXCLUDED_ORDER_STATUSES = Set.of("CANCELLED", "REFUNDED");
    private static final Set<String> EXPORTED_LOT_TRANSPORT_STATUSES = Set.of("Đã nhập kho đích", "Đang vận chuyển");
    private static final DateTimeFormatter LABEL_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM");

    private final ProductRepository productRepository;
    private final HarvestLotRepository harvestLotRepository;
    private final OrderRepository orderRepository;
    private final FarmRepository farmRepository;
    private final CampaignRepository campaignRepository;
    private final FarmerOwnershipResolver ownershipResolver;

    public FarmerDemandForecastResponse buildForecast(String requestedOwnerId, String farmCode, int horizonDays) {
        return buildForecastAtDate(requestedOwnerId, farmCode, horizonDays, LocalDate.now());
    }

    public FarmerDemandForecastResponse buildForecastAtDate(
            String requestedOwnerId,
            String farmCode,
            int horizonDays,
            LocalDate referenceDate
    ) {
        int clampedHorizon = clampHorizon(horizonDays);
        LocalDate today = referenceDate != null ? referenceDate : LocalDate.now();
        String effectiveOwner = ownershipResolver.resolveEffectiveOwnerId(requestedOwnerId, farmCode);
        String cleanFarmFilter = farmCode != null && !farmCode.isBlank() && !"ALL".equalsIgnoreCase(farmCode.trim())
                ? farmCode.trim().toUpperCase(Locale.ROOT)
                : null;

        Map<String, Farm> farmsByCode = loadFarmsByCode(effectiveOwner);
        List<Product> products = filterProducts(
                productRepository.findByOwnerIdIgnoreCaseAndActiveTrue(effectiveOwner),
                cleanFarmFilter
        );
        List<HarvestLot> lots = filterLots(
                harvestLotRepository.findByOwnerIdIgnoreCaseOrderByCreatedAtDesc(effectiveOwner),
                cleanFarmFilter
        );
        List<Order> validOrders = orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(o -> !EXCLUDED_ORDER_STATUSES.contains(normalizeUpper(o.getStatus())))
                .toList();
        List<Campaign> activeCampaigns = loadRelevantCampaigns(today, clampedHorizon);

        List<CatalogCandidate> candidates = buildCandidates(products, lots, farmsByCode, effectiveOwner, cleanFarmFilter);
        List<ForecastProductItem> items = new ArrayList<>();
        for (CatalogCandidate candidate : candidates) {
            items.add(analyzeCandidate(candidate, lots, validOrders, activeCampaigns, clampedHorizon, today));
        }
        items.sort(Comparator.comparingInt(FarmerDemandForecastService::riskSortOrder)
                .thenComparing(Comparator.comparingDouble(ForecastProductItem::predictedDemand).reversed()));

        double totalDemand = roundOneDecimal(items.stream().mapToDouble(ForecastProductItem::predictedDemand).sum());
        double totalSupply = roundOneDecimal(items.stream().mapToDouble(ForecastProductItem::currentSupply).sum());
        int deficitCount = (int) items.stream().filter(i -> "DEFICIT".equals(i.riskStatus())).count();
        int surplusCount = (int) items.stream().filter(i -> "SURPLUS".equals(i.riskStatus())).count();
        int balancedCount = items.size() - deficitCount - surplusCount;

        List<ForecastTimelinePoint> timeline = buildTimeline(clampedHorizon, today, totalDemand, totalSupply);
        String seasonLabel = describeSeasonPeriod(today.getMonthValue());
        String summary = buildExecutiveSummary(items, clampedHorizon, seasonLabel, deficitCount, surplusCount);

        return new FarmerDemandForecastResponse(
                effectiveOwner,
                cleanFarmFilter != null ? cleanFarmFilter : "ALL",
                clampedHorizon,
                seasonLabel,
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                "AgriTrace Demand & Seasonal AI Engine",
                validOrders.size(),
                totalDemand,
                totalSupply,
                deficitCount,
                surplusCount,
                balancedCount,
                summary,
                items,
                timeline
        );
    }

    SeasonEvaluation evaluateSeason(String productName, String categoryCode, int month) {
        String norm = normalizeSearchText(productName + " " + categoryCode);

        if (containsAny(norm, "dau tay", "dau", "strawberry")) {
            if (isMonthInRange(month, 11, 3)) {
                return new SeasonEvaluation(1.36, "Đang vào mùa (Đông - Xuân)");
            }
            if (month == 10 || month == 4) {
                return new SeasonEvaluation(1.12, "Sắp vào mùa / Giao mùa");
            }
            return new SeasonEvaluation(0.76, "Nghịch vụ (Sản lượng thấp)");
        }

        if (containsAny(norm, "cam", "buoi", "quyt")) {
            if (isMonthInRange(month, 10, 2)) {
                return new SeasonEvaluation(1.30, "Đang vào mùa (Thu - Đông)");
            }
            if (month == 9 || month == 3) {
                return new SeasonEvaluation(1.10, "Chuyển mùa");
            }
            return new SeasonEvaluation(0.82, "Cuối mùa / Ngoài vụ rộ");
        }

        if (containsAny(norm, "xoai", "sau rieng", "bo ", "bo sap", "vai", "nhan")) {
            if (isMonthInRange(month, 4, 8)) {
                return new SeasonEvaluation(1.32, "Chính vụ Hè - Thu");
            }
            if (month == 3 || month == 9) {
                return new SeasonEvaluation(1.08, "Đầu / Cuối vụ");
            }
            return new SeasonEvaluation(0.84, "Cuối mùa / Nghịch vụ");
        }

        if (containsAny(norm, "xa lach", "kale", "cai", "rau", "ca chua", "cu ", "nam")) {
            if (isMonthInRange(month, 10, 2)) {
                return new SeasonEvaluation(1.18, "Cao điểm rau sạch Đông - Xuân");
            }
            return new SeasonEvaluation(1.04, "Đang vào mùa (Quanh năm)");
        }

        return new SeasonEvaluation(1.05, "Ổn định theo mùa vụ");
    }

    static boolean isMonthInRange(int month, int startMonth, int endMonth) {
        if (startMonth <= endMonth) {
            return month >= startMonth && month <= endMonth;
        }
        return month >= startMonth || month <= endMonth;
    }

    private ForecastProductItem analyzeCandidate(
            CatalogCandidate candidate,
            List<HarvestLot> ownerLots,
            List<Order> validOrders,
            List<Campaign> activeCampaigns,
            int horizonDays,
            LocalDate today
    ) {
        SalesStats sales = collectSalesStats(candidate.name, validOrders, today);
        double lotSupply = ownerLots.stream()
                .filter(l -> matchesProduct(l.getProduct(), candidate.name))
                .filter(l -> candidate.farmCode == null || l.getFarmCode() == null || l.getFarmCode().equalsIgnoreCase(candidate.farmCode))
                .filter(l -> l.getTransportStatus() == null || !EXPORTED_LOT_TRANSPORT_STATUSES.contains(l.getTransportStatus().trim()))
                .filter(l -> !"Từ chối xuất kho".equalsIgnoreCase(l.getStatus()))
                .mapToDouble(l -> parseNumericQty(l.getQty(), 0.0))
                .sum();

        double currentSupply = roundOneDecimal(Math.max(0.0, candidate.stockLeft + lotSupply));

        SeasonEvaluation season = evaluateSeason(candidate.name, candidate.categoryCode, today.getMonthValue());
        CampaignMatch campaignMatch = matchCampaign(candidate, activeCampaigns);

        boolean hasOrderData = sales.sold90d > 0.0 || sales.soldAllTime > 0.0;
        double observedDailyRate = hasOrderData
                ? computeWeightedDailyRate(sales)
                : estimateBaselineDailyRate(candidate.categoryCode, candidate.stockLeft);

        double prev30DailyRate = sales.sold90d > sales.sold30d
                ? (sales.sold90d - sales.sold30d) / 60.0
                : observedDailyRate;
        double rawGrowth = prev30DailyRate > 0.01
                ? ((observedDailyRate - prev30DailyRate) / prev30DailyRate) * 100.0 + (season.multiplier - 1.0) * 60.0
                : (season.multiplier - 1.0) * 80.0;
        if (campaignMatch.multiplier > 1.0) {
            rawGrowth += (campaignMatch.multiplier - 1.0) * 75.0;
        }
        double growthPercent = roundOneDecimal(Math.max(-45.0, Math.min(95.0, rawGrowth)));

        double predictedDemand = roundOneDecimal(
                Math.max(5.0, observedDailyRate * horizonDays * season.multiplier * campaignMatch.multiplier)
        );
        double supplyGap = roundOneDecimal(currentSupply - predictedDemand);

        String riskStatus;
        double recommendedPrepQty;
        if (supplyGap < -Math.max(8.0, predictedDemand * 0.15)) {
            riskStatus = "DEFICIT";
            recommendedPrepQty = Math.ceil(predictedDemand * 1.15 - currentSupply);
        } else if (currentSupply > Math.max(predictedDemand * 1.45, predictedDemand + 25.0)) {
            riskStatus = "SURPLUS";
            recommendedPrepQty = 0.0;
        } else {
            riskStatus = "BALANCED";
            recommendedPrepQty = Math.max(0.0, Math.ceil(predictedDemand * 1.05 - currentSupply));
        }

        String recommendation = buildProductRecommendation(
                riskStatus,
                candidate.unit,
                Math.abs(supplyGap),
                recommendedPrepQty,
                season.phaseLabel,
                campaignMatch.title,
                horizonDays
        );
        String dataBasis = sales.sold30d > 0
                ? "Lịch sử đơn hàng thực tế (" + Math.round(sales.sold30d) + " " + candidate.unit + "/30 ngày)"
                : hasOrderData
                ? "Lịch sử đơn hàng 90 ngày & Mùa vụ"
                : "Định mức danh mục & Mùa vụ (chưa phát sinh đơn mới)";
        int confidence = sales.sold30d >= 20 ? 92 : hasOrderData ? 84 : 74;

        return new ForecastProductItem(
                candidate.id,
                candidate.name,
                candidate.categoryCode,
                candidate.unit,
                candidate.farmCode != null ? candidate.farmCode : "",
                candidate.farmName != null ? candidate.farmName : "Trang trại sở hữu",
                roundOneDecimal(sales.sold7d),
                roundOneDecimal(sales.sold30d),
                roundOneDecimal(observedDailyRate),
                roundTwoDecimals(season.multiplier),
                season.phaseLabel,
                roundTwoDecimals(campaignMatch.multiplier),
                campaignMatch.title,
                currentSupply,
                predictedDemand,
                supplyGap,
                recommendedPrepQty,
                growthPercent,
                riskStatus,
                recommendation,
                dataBasis,
                confidence
        );
    }

    private SalesStats collectSalesStats(String productName, List<Order> validOrders, LocalDate today) {
        LocalDate d7 = today.minusDays(7);
        LocalDate d30 = today.minusDays(30);
        LocalDate d90 = today.minusDays(90);

        double sold7d = 0.0;
        double sold30d = 0.0;
        double sold90d = 0.0;
        double soldAll = 0.0;

        for (Order order : validOrders) {
            if (order.getItems() == null) continue;
            LocalDate orderDate = order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate() : today;
            for (OrderItem item : order.getItems()) {
                if (!matchesProduct(item.getName(), productName)) continue;
                double qty = parseNumericQty(item.getQty(), 1.0);
                soldAll += qty;
                if (!orderDate.isBefore(d90)) sold90d += qty;
                if (!orderDate.isBefore(d30)) sold30d += qty;
                if (!orderDate.isBefore(d7)) sold7d += qty;
            }
        }
        return new SalesStats(sold7d, sold30d, sold90d, soldAll);
    }

    private double computeWeightedDailyRate(SalesStats stats) {
        double rate7 = stats.sold7d / 7.0;
        double rate30 = stats.sold30d / 30.0;
        double rate90 = stats.sold90d / 90.0;
        double rateAll = stats.soldAllTime / 90.0;
        double weighted = rate7 * 0.50 + rate30 * 0.30 + rate90 * 0.15 + rateAll * 0.05;
        return Math.max(0.5, weighted);
    }

    private double estimateBaselineDailyRate(String categoryCode, double currentStock) {
        String cat = categoryCode != null ? categoryCode.toLowerCase(Locale.ROOT) : "";
        double base = switch (cat) {
            case "rau_la" -> 9.0;
            case "cu_qua" -> 8.0;
            case "trai_cay" -> 10.5;
            case "nam_dac_san" -> 5.5;
            default -> 7.0;
        };
        if (currentStock > 0) {
            return Math.max(2.5, Math.min(24.0, base * 0.7 + (currentStock / 15.0) * 0.3));
        }
        return base;
    }

    private CampaignMatch matchCampaign(CatalogCandidate candidate, List<Campaign> campaigns) {
        for (Campaign campaign : campaigns) {
            boolean appliesAll = "ALL".equalsIgnoreCase(campaign.getTargetType());
            boolean appliesCategory = campaign.getTargetCategoryCodes() != null
                    && candidate.categoryCode != null
                    && campaign.getTargetCategoryCodes().stream().anyMatch(c -> c.equalsIgnoreCase(candidate.categoryCode));
            boolean appliesProduct = (campaign.getTargetProductIds() != null && campaign.getTargetProductIds().contains(candidate.id))
                    || (campaign.getTargetProductNames() != null && campaign.getTargetProductNames().stream()
                    .anyMatch(n -> matchesProduct(n, candidate.name)));
            if (appliesAll || appliesCategory || appliesProduct) {
                int discount = campaign.getDiscountPercent() != null ? campaign.getDiscountPercent() : 10;
                double mult = Math.min(1.30, Math.max(1.10, 1.0 + (discount / 100.0) * 0.85));
                return new CampaignMatch(mult, campaign.getTitle());
            }
        }
        return new CampaignMatch(1.0, null);
    }

    private List<Campaign> loadRelevantCampaigns(LocalDate today, int horizonDays) {
        LocalDate horizonEnd = today.plusDays(horizonDays);
        return campaignRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(c -> Boolean.TRUE.equals(c.getActive()))
                .filter(c -> c.getStartDate() != null && c.getEndDate() != null)
                .filter(c -> !c.getEndDate().isBefore(today) && !c.getStartDate().isAfter(horizonEnd))
                .toList();
    }

    private List<CatalogCandidate> buildCandidates(
            List<Product> products,
            List<HarvestLot> lots,
            Map<String, Farm> farmsByCode,
            String effectiveOwner,
            String farmFilter
    ) {
        Map<String, CatalogCandidate> map = new LinkedHashMap<>();
        for (Product product : products) {
            String key = normalizeSearchText(product.getName());
            Farm farm = product.getFarmCode() != null ? farmsByCode.get(product.getFarmCode().toUpperCase(Locale.ROOT)) : null;
            String farmCode = product.getFarmCode() != null && !product.getFarmCode().isBlank()
                    ? product.getFarmCode().toUpperCase(Locale.ROOT)
                    : (farm != null ? farm.getCode() : defaultFarmCodeForOwner(effectiveOwner));
            String farmName = farm != null ? farm.getName() : (product.getFarm() != null ? product.getFarm() : "Trang trại của tôi");
            map.putIfAbsent(key, new CatalogCandidate(
                    product.getId(),
                    product.getName(),
                    product.getCategoryCode() != null ? product.getCategoryCode() : "trai_cay",
                    normalizeUnitLabel(product.getUnit()),
                    farmCode,
                    farmName,
                    product.getStockLeft() != null ? product.getStockLeft().doubleValue() : 0.0
            ));
        }

        for (HarvestLot lot : lots) {
            String key = normalizeSearchText(lot.getProduct());
            if (key.isEmpty() || map.containsKey(key)) continue;
            if (farmFilter != null && lot.getFarmCode() != null && !lot.getFarmCode().equalsIgnoreCase(farmFilter)) continue;
            String farmCode = lot.getFarmCode() != null ? lot.getFarmCode().toUpperCase(Locale.ROOT) : defaultFarmCodeForOwner(effectiveOwner);
            Farm farm = farmsByCode.get(farmCode);
            map.put(key, new CatalogCandidate(
                    "lot-" + lot.getCode(),
                    lot.getProduct(),
                    inferCategoryFromName(lot.getProduct()),
                    normalizeUnitLabel(lot.getUnit()),
                    farmCode,
                    farm != null ? farm.getName() : lot.getFarmName(),
                    0.0
            ));
        }
        return new ArrayList<>(map.values());
    }

    private List<ForecastTimelinePoint> buildTimeline(int horizonDays, LocalDate today, double totalDemand, double totalSupply) {
        List<ForecastTimelinePoint> points = new ArrayList<>();
        int buckets = horizonDays <= 7 ? 7 : horizonDays <= 14 ? 7 : 6;
        int stepDays = Math.max(1, horizonDays / buckets);
        double supplyPerBucket = roundOneDecimal(totalSupply / buckets);

        double[] rawWeights = new double[buckets];
        double weightSum = 0.0;
        for (int i = 0; i < buckets; i++) {
            LocalDate bucketDate = today.plusDays((long) i * stepDays + 1);
            DayOfWeek dow = bucketDate.getDayOfWeek();
            double weekendLift = (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) ? 1.16 : 1.0;
            double ramp = 1.0 + (i * 0.025);
            rawWeights[i] = weekendLift * ramp;
            weightSum += rawWeights[i];
        }

        for (int i = 0; i < buckets; i++) {
            LocalDate bucketStart = today.plusDays((long) i * stepDays + 1);
            String label = stepDays == 1
                    ? bucketStart.format(LABEL_DATE_FMT)
                    : bucketStart.format(LABEL_DATE_FMT) + "-" + bucketStart.plusDays(stepDays - 1L).format(LABEL_DATE_FMT);
            double bucketDemand = weightSum > 0 ? roundOneDecimal(totalDemand * (rawWeights[i] / weightSum)) : 0.0;
            points.add(new ForecastTimelinePoint(label, bucketDemand, supplyPerBucket));
        }
        return points;
    }

    private String buildProductRecommendation(
            String riskStatus,
            String unit,
            double absGap,
            double prepQty,
            String seasonPhase,
            String campaignTitle,
            int horizonDays
    ) {
        String campaignSuffix = campaignTitle != null ? " (cộng hưởng chiến dịch \"" + campaignTitle + "\")" : "";
        return switch (riskStatus) {
            case "DEFICIT" -> String.format(
                    "Thiếu khoảng %.0f %s trong %d ngày tới (%s)%s. Nên chuẩn bị thu hoạch bổ sung ~%.0f %s hoặc gieo gối vụ sớm.",
                    absGap, unit, horizonDays, seasonPhase, campaignSuffix, prepQty, unit
            );
            case "SURPLUS" -> String.format(
                    "Dự kiến dư ~%.0f %s so với sức mua %d ngày (%s). Nên giãn lịch thu hoạch mới, ưu tiên xuất lô sớm hoặc chạy ưu đãi đẩy hàng.",
                    absGap, unit, horizonDays, seasonPhase
            );
            default -> String.format(
                    "Nguồn cung cân đối với sức mua %d ngày (%s)%s. Duy trì nhịp thu hoạch và chăm sóc theo đúng kế hoạch hiện tại.",
                    horizonDays, seasonPhase, campaignSuffix
            );
        };
    }

    private String buildExecutiveSummary(
            List<ForecastProductItem> items,
            int horizonDays,
            String seasonLabel,
            int deficitCount,
            int surplusCount
    ) {
        if (items.isEmpty()) {
            return "Chưa có sản phẩm hoặc lô thu hoạch thuộc nông trại này để AI dự báo. Hãy khai báo thêm sản phẩm hoặc lô thu hoạch mới.";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("Trong ").append(horizonDays).append(" ngày tới (").append(seasonLabel).append("), ");
        if (deficitCount > 0) {
            String topDeficit = items.stream()
                    .filter(i -> "DEFICIT".equals(i.riskStatus()))
                    .map(ForecastProductItem::productName)
                    .limit(2)
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("");
            sb.append("có ").append(deficitCount).append(" nông sản nguy cơ thiếu cung (").append(topDeficit)
                    .append(") cần ưu tiên thu hoạch sớm hoặc mở rộng gieo trồng. ");
        }
        if (surplusCount > 0) {
            String topSurplus = items.stream()
                    .filter(i -> "SURPLUS".equals(i.riskStatus()))
                    .map(ForecastProductItem::productName)
                    .limit(2)
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("");
            sb.append("Có ").append(surplusCount).append(" nông sản dự kiến dư thừa (").append(topSurplus)
                    .append(") cần kiểm soát tốc độ thu hái hoặc áp voucher kích cầu.");
        }
        if (deficitCount == 0 && surplusCount == 0) {
            sb.append("sản lượng chuẩn bị tại vườn đang cân bằng tốt với tốc độ tiêu thụ thị trường.");
        }
        return sb.toString().trim();
    }

    private Map<String, Farm> loadFarmsByCode(String effectiveOwner) {
        Map<String, Farm> result = new LinkedHashMap<>();
        for (Farm farm : farmRepository.findByOwnerIdIgnoreCaseOrderByIdAsc(effectiveOwner)) {
            if (farm.getCode() != null) {
                result.put(farm.getCode().toUpperCase(Locale.ROOT), farm);
            }
        }
        return result;
    }

    private List<Product> filterProducts(List<Product> products, String cleanFarmFilter) {
        if (cleanFarmFilter == null) return products;
        return products.stream()
                .filter(p -> (p.getFarmCode() != null && p.getFarmCode().equalsIgnoreCase(cleanFarmFilter))
                        || (p.getFarm() != null && p.getFarm().toUpperCase(Locale.ROOT).contains(cleanFarmFilter)))
                .toList();
    }

    private List<HarvestLot> filterLots(List<HarvestLot> lots, String cleanFarmFilter) {
        if (cleanFarmFilter == null) return lots;
        return lots.stream()
                .filter(l -> (l.getFarmCode() != null && l.getFarmCode().equalsIgnoreCase(cleanFarmFilter))
                        || (l.getFarmName() != null && l.getFarmName().toUpperCase(Locale.ROOT).contains(cleanFarmFilter)))
                .toList();
    }

    private static int clampHorizon(int days) {
        if (days <= 7) return 7;
        if (days <= 14) return 14;
        return 30;
    }

    private static int riskSortOrder(ForecastProductItem item) {
        return switch (item.riskStatus()) {
            case "DEFICIT" -> 0;
            case "SURPLUS" -> 1;
            default -> 2;
        };
    }

    private static boolean matchesProduct(String orderOrLotName, String productName) {
        String a = normalizeSearchText(orderOrLotName);
        String b = normalizeSearchText(productName);
        if (a.isEmpty() || b.isEmpty()) return false;
        if (a.equals(b) || a.contains(b) || b.contains(a)) return true;
        String[] bTokens = b.split(" ");
        if (bTokens.length >= 2) {
            String coreTwoWords = bTokens[0] + " " + bTokens[1];
            return a.contains(coreTwoWords);
        }
        return false;
    }

    static double parseNumericQty(String raw, double fallback) {
        if (raw == null || raw.isBlank()) return fallback;
        Matcher m = LEADING_NUMBER_PATTERN.matcher(raw.trim());
        if (m.find()) {
            try {
                return Double.parseDouble(m.group(1).replace(',', '.'));
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        return fallback;
    }

    private static String normalizeUnitLabel(String unit) {
        if (unit == null || unit.isBlank()) return "kg";
        String cleaned = unit.trim().replaceFirst("^\\d+\\s*", "").trim();
        return cleaned.isEmpty() ? unit.trim() : cleaned;
    }

    private static String inferCategoryFromName(String name) {
        String n = normalizeSearchText(name);
        if (containsAny(n, "xa lach", "cai", "kale", "rau")) return "rau_la";
        if (containsAny(n, "ca chua", "cu ", "dua ")) return "cu_qua";
        if (containsAny(n, "nam ")) return "nam_dac_san";
        return "trai_cay";
    }

    private static String defaultFarmCodeForOwner(String ownerId) {
        return "farmer_thieu".equalsIgnoreCase(ownerId) ? "NT-MC-03" : "NT-DL-01";
    }

    private static String describeSeasonPeriod(int month) {
        if (month == 11 || month == 12 || month <= 2) return "Mùa Đông - Xuân (Tháng " + month + ")";
        if (month <= 5) return "Mùa Xuân - Hè (Tháng " + month + ")";
        if (month <= 8) return "Mùa Hè - Thu (Tháng " + month + ")";
        return "Mùa Thu - Đông (Tháng " + month + ")";
    }

    private static String normalizeSearchText(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return normalized;
    }

    private static boolean containsAny(String haystack, String... needles) {
        for (String needle : needles) {
            if (haystack.contains(needle)) return true;
        }
        return false;
    }

    private static String normalizeUpper(String s) {
        return s == null ? "" : s.trim().toUpperCase(Locale.ROOT);
    }

    private static double roundOneDecimal(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private static double roundTwoDecimals(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    record SeasonEvaluation(double multiplier, String phaseLabel) {
    }

    private record SalesStats(double sold7d, double sold30d, double sold90d, double soldAllTime) {
    }

    private record CampaignMatch(double multiplier, String title) {
    }

    private record CatalogCandidate(
            String id,
            String name,
            String categoryCode,
            String unit,
            String farmCode,
            String farmName,
            double stockLeft
    ) {
    }
}
