package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.farmer.FarmerDemandForecastResponse;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FarmerDemandForecastServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private HarvestLotRepository harvestLotRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private FarmRepository farmRepository;

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private FarmerOwnershipResolver ownershipResolver;

    private FarmerDemandForecastService buildService() {
        return new FarmerDemandForecastService(
                productRepository,
                harvestLotRepository,
                orderRepository,
                farmRepository,
                campaignRepository,
                ownershipResolver
        );
    }

    @Test
    void detectsCrossYearPeakSeasonAndDeficitWithRealOrdersAndCampaign() {
        LocalDate nov26 = LocalDate.of(2026, 11, 26);

        Farm farm = Farm.builder().code("NT-MC-03").name("Vườn Mộc Châu").ownerId("farmer_thieu").build();
        Product strawberry = Product.builder()
                .id("p-strawberry")
                .name("Dâu Tây New Zealand Mộc Châu")
                .categoryCode("trai_cay")
                .unit("Hộp 500g")
                .price(180000L)
                .oldPrice(210000L)
                .stockLeft(20)
                .farmCode("NT-MC-03")
                .ownerId("farmer_thieu")
                .active(true)
                .build();
        HarvestLot lot = HarvestLot.builder()
                .code("DT-2026-11")
                .product("Dâu Tây New Zealand Mộc Châu")
                .qty("30")
                .unit("Hộp 500g")
                .status("Chờ duyệt xuất kho")
                .transportStatus("Chưa vận chuyển")
                .farmCode("NT-MC-03")
                .ownerId("farmer_thieu")
                .build();

        Order recentOrder = Order.builder()
                .orderCode("ORD-1")
                .status("CONFIRMED")
                .createdAt(LocalDateTime.of(2026, 11, 24, 9, 0))
                .items(List.of(OrderItem.builder().name("Dâu Tây New Zealand Mộc Châu").qty("70").price(180000L).build()))
                .build();

        Order cancelledOrder = Order.builder()
                .orderCode("ORD-CANCELLED")
                .status("CANCELLED")
                .createdAt(LocalDateTime.of(2026, 11, 25, 10, 0))
                .items(List.of(OrderItem.builder().name("Dâu Tây New Zealand Mộc Châu").qty("500").price(180000L).build()))
                .build();

        Campaign winterPromo = Campaign.builder()
                .id("camp-1")
                .title("Lễ Hội Mùa Đông Mộc Châu")
                .type("SEASONAL")
                .startDate(nov26.minusDays(2))
                .endDate(nov26.plusDays(15))
                .discountPercent(20)
                .targetType("CATEGORY")
                .targetCategoryCodes(List.of("trai_cay"))
                .active(true)
                .build();

        when(ownershipResolver.resolveEffectiveOwnerId("farmer_thieu", null)).thenReturn("farmer_thieu");
        when(farmRepository.findByOwnerIdIgnoreCaseOrderByIdAsc("farmer_thieu")).thenReturn(List.of(farm));
        when(productRepository.findByOwnerIdIgnoreCaseAndActiveTrue("farmer_thieu")).thenReturn(List.of(strawberry));
        when(harvestLotRepository.findByOwnerIdIgnoreCaseOrderByCreatedAtDesc("farmer_thieu")).thenReturn(List.of(lot));
        when(orderRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(recentOrder, cancelledOrder));
        when(campaignRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(winterPromo));

        FarmerDemandForecastResponse res = buildService().buildForecastAtDate("farmer_thieu", null, 30, nov26);

        assertEquals(30, res.horizonDays());
        assertEquals(1, res.items().size());
        assertEquals(1, res.deficitCount());
        var item = res.items().get(0);
        assertEquals(70.0, item.soldLast7Days());
        assertEquals(50.0, item.currentSupply());
        assertEquals("DEFICIT", item.riskStatus());
        assertEquals("Lễ Hội Mùa Đông Mộc Châu", item.activeCampaignTitle());
        assertTrue(item.seasonalMultiplier() > 1.2, "Winter month should activate peak strawberry multiplier");
        assertTrue(item.predictedDemand() > item.currentSupply());
        assertTrue(item.recommendedPrepQty() > 0);
        assertEquals(6, res.timeline().size());
    }

    @Test
    void detectsSurplusWhenCurrentSupplyExceedsOffSeasonDemand() {
        LocalDate dec10 = LocalDate.of(2026, 12, 10);

        Farm farm = Farm.builder().code("NT-DT-02").name("Vườn Cao Lãnh").ownerId("farmer_hung").build();
        Product mango = Product.builder()
                .id("p-mango")
                .name("Xoài Cát Chu Cao Lãnh")
                .categoryCode("trai_cay")
                .unit("kg")
                .price(65000L)
                .oldPrice(75000L)
                .stockLeft(450)
                .farmCode("NT-DT-02")
                .ownerId("farmer_hung")
                .active(true)
                .build();

        Order smallOrder = Order.builder()
                .orderCode("ORD-M1")
                .status("DELIVERED")
                .createdAt(LocalDateTime.of(2026, 12, 7, 14, 0))
                .items(List.of(OrderItem.builder().name("Xoài Cát Chu Cao Lãnh").qty("14 kg").price(65000L).build()))
                .build();

        when(ownershipResolver.resolveEffectiveOwnerId("farmer_hung", "NT-DT-02")).thenReturn("farmer_hung");
        when(farmRepository.findByOwnerIdIgnoreCaseOrderByIdAsc("farmer_hung")).thenReturn(List.of(farm));
        when(productRepository.findByOwnerIdIgnoreCaseAndActiveTrue("farmer_hung")).thenReturn(List.of(mango));
        when(harvestLotRepository.findByOwnerIdIgnoreCaseOrderByCreatedAtDesc("farmer_hung")).thenReturn(List.of());
        when(orderRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(smallOrder));
        when(campaignRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());

        FarmerDemandForecastResponse res = buildService().buildForecastAtDate("farmer_hung", "NT-DT-02", 7, dec10);

        assertEquals(7, res.horizonDays());
        assertEquals("NT-DT-02", res.farmCode());
        assertEquals(1, res.surplusCount());
        var item = res.items().get(0);
        assertEquals("SURPLUS", item.riskStatus());
        assertEquals(0.0, item.recommendedPrepQty());
        assertEquals(7, res.timeline().size());
    }
}
