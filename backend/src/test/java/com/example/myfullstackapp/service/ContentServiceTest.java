package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.content.CampaignRequest;
import com.example.myfullstackapp.entity.Campaign;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.BlogPostRepository;
import com.example.myfullstackapp.repository.CampaignRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class ContentServiceTest {
    private final CampaignRepository campaigns = mock(CampaignRepository.class);
    private final ContentService service = new ContentService(campaigns, mock(BlogPostRepository.class));

    ContentServiceTest() {
        when(campaigns.save(any(Campaign.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static CampaignRequest request(String targetType) {
        CampaignRequest r = new CampaignRequest();
        r.setTitle("Mùa Dâu Tây Mộc Châu");
        r.setType("harvest");
        r.setStartDate(LocalDate.of(2026, 11, 1));
        r.setEndDate(LocalDate.of(2026, 11, 30));
        r.setDiscountPercent(15);
        r.setTargetType(targetType);
        r.setTargetCategoryCodes(List.of("trai_cay"));
        r.setTargetProductIds(List.of("dddd2222"));
        r.setTargetProductNames(List.of(" Dâu Tây ", "", "Dâu Tây"));
        return r;
    }

    @Test
    void createGeneratesIdAndUniqueVietnameseSlug() {
        when(campaigns.existsBySlug("mua-dau-tay-moc-chau")).thenReturn(true);

        Campaign c = service.createCampaign(request("product"));

        assertTrue(c.getId().startsWith("camp-"));
        assertEquals("mua-dau-tay-moc-chau-2", c.getSlug());
    }

    @Test
    void keepsOnlyTargetsMatchingTargetType() {
        Campaign product = service.createCampaign(request("product"));
        assertEquals(List.of("Dâu Tây"), product.getTargetProductNames(), "trim + bỏ rỗng + bỏ trùng");
        assertEquals(List.of("dddd2222"), product.getTargetProductIds());
        assertTrue(product.getTargetCategoryCodes().isEmpty());

        Campaign category = service.createCampaign(request("category"));
        assertEquals(List.of("trai_cay"), category.getTargetCategoryCodes());
        assertTrue(category.getTargetProductIds().isEmpty());
        assertTrue(category.getTargetProductNames().isEmpty());
    }

    @Test
    void rejectsEndDateBeforeStartDate() {
        CampaignRequest r = request("all");
        r.setEndDate(LocalDate.of(2026, 10, 1));
        assertThrows(IllegalArgumentException.class, () -> service.createCampaign(r));
        verify(campaigns, never()).save(any());
    }

    @Test
    void updateExcludesOwnSlugFromUniquenessCheck() {
        Campaign existing = Campaign.builder().id("camp-1").slug("mua-dau-tay-moc-chau").build();
        when(campaigns.findById("camp-1")).thenReturn(Optional.of(existing));
        when(campaigns.existsBySlugAndIdNot(anyString(), eq("camp-1"))).thenReturn(false);

        Campaign saved = service.updateCampaign("camp-1", request("all"));

        assertEquals("mua-dau-tay-moc-chau", saved.getSlug());
    }

    @Test
    void updateMissingCampaignThrowsNotFound() {
        when(campaigns.findById("nope")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.updateCampaign("nope", request("all")));
    }
}
