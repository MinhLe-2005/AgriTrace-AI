import { create } from "zustand";

import { contentService } from "@/services/content.service";

export type CampaignType = "harvest" | "seasonal" | "flash_sale" | "holiday" | "farmer_aid";

export interface CampaignItem {
  id: string;
  title: string;
  slug: string;
  type: CampaignType;
  typeLabel: string;
  typeColor: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  discountPercent: number; // e.g. 15 for 15%
  discountAmount?: number; // e.g. 15000
  targetType: "all" | "category" | "product";
  targetCategoryCodes?: string[]; // e.g. ["rau_la", "trai_cay"]
  targetProductIds?: string[]; // e.g. ["dddd2222-dddd-2222-dddd-222222222222", "LOT-DT-2026-11"]
  targetProductNames?: string[]; // e.g. ["Dâu Tây", "Kale"]
  voucherCode?: string; // e.g. "DAUTAY25"
  bannerIcon?: string; // e.g. "🍓"
  badgeText?: string; // e.g. "Vụ mùa -14%"
  description: string;
  fullContent?: string;
  active: boolean;
  createdAt: string;
}

export interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  category: "all" | "ai" | "season" | "standard" | "guide";
  categoryLabel: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  excerpt: string;
  content?: string;
  coverImage?: string;
  featured?: boolean;
  relatedProductName?: string;
  active: boolean;
}

interface CampaignStore {
  campaigns: CampaignItem[];
  blogPosts: AdminBlogPost[];
  campaignsLoaded: boolean;
  blogPostsLoaded: boolean;

  /** Tải sự kiện từ backend (bỏ qua nếu đã tải, trừ khi force). */
  loadCampaigns: (force?: boolean) => Promise<void>;
  /** Tải bài viết; includeInactive=true dành cho admin. */
  loadBlogPosts: (includeInactive?: boolean) => Promise<void>;

  // Campaign Actions (Admin CRUD) – gọi API, ném lỗi nếu thất bại
  addCampaign: (campaign: Omit<CampaignItem, "id" | "createdAt">) => Promise<CampaignItem>;
  updateCampaign: (id: string, updates: Partial<CampaignItem>) => Promise<CampaignItem>;
  deleteCampaign: (id: string) => Promise<void>;
  toggleCampaign: (id: string) => Promise<void>;

  // Blog Actions (Admin CRUD)
  addBlogPost: (post: Omit<AdminBlogPost, "id">) => Promise<AdminBlogPost>;
  updateBlogPost: (id: string, updates: Partial<AdminBlogPost>) => Promise<AdminBlogPost>;
  toggleBlogPost: (id: string) => Promise<void>;
  deleteBlogPost: (id: string) => Promise<void>;

  // Query helpers
  getActiveCampaigns: () => CampaignItem[];
  getCampaignStatus: (camp: CampaignItem) => "active" | "upcoming" | "expired";
  getProductDiscount: (
    productId?: string,
    categoryCode?: string,
    productName?: string,
    originalPrice?: number
  ) => {
    hasDiscount: boolean;
    discountPercent: number;
    discountedPrice: number;
    campaignTitle: string;
    campaignSlug: string;
    endDate: string;
    voucherCode?: string;
  } | null;
}

function stripMeta<T extends { id?: string; createdAt?: string }>(item: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, ...rest } = item;
  return rest;
}

// Lần tải sự kiện đang chạy, dùng chung để nhiều trang mount cùng lúc không gọi API trùng.
// campaignsRequestSeq đảm bảo chỉ phản hồi của lần gọi mới nhất được ghi vào store.
let campaignsInFlight: Promise<void> | null = null;
let campaignsRequestSeq = 0;

function getCurrentISODate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0]; // YYYY-MM-DD
}

export const useCampaignStore = create<CampaignStore>()((set, get) => ({
      campaigns: [],
      blogPosts: [],
      campaignsLoaded: false,
      blogPostsLoaded: false,

      loadCampaigns: async (force = false) => {
        if (get().campaignsLoaded && !force) return;
        if (campaignsInFlight && !force) return campaignsInFlight;
        const seq = ++campaignsRequestSeq;
        const request = contentService
          .listCampaigns()
          .then((campaigns) => {
            if (seq === campaignsRequestSeq) set({ campaigns, campaignsLoaded: true });
          })
          .catch((err) => {
            console.error("Failed to load campaigns:", err);
          })
          .finally(() => {
            if (campaignsInFlight === request) campaignsInFlight = null;
          });
        campaignsInFlight = request;
        return request;
      },

      loadBlogPosts: async (includeInactive = false) => {
        try {
          const blogPosts = await contentService.listBlogPosts(includeInactive);
          set({ blogPosts, blogPostsLoaded: true });
        } catch (err) {
          console.error("Failed to load blog posts:", err);
        }
      },

      // ── Admin Campaign Actions ──
      addCampaign: async (campaignData) => {
        const created = await contentService.createCampaign(campaignData);
        set((state) => ({ campaigns: [created, ...state.campaigns] }));
        return created;
      },

      updateCampaign: async (id, updates) => {
        const current = get().campaigns.find((c) => c.id === id);
        if (!current) throw new Error("Không tìm thấy sự kiện cần cập nhật");
        const saved = await contentService.updateCampaign(id, stripMeta({ ...current, ...updates }));
        set((state) => ({ campaigns: state.campaigns.map((c) => (c.id === id ? saved : c)) }));
        return saved;
      },

      deleteCampaign: async (id) => {
        await contentService.deleteCampaign(id);
        set((state) => ({ campaigns: state.campaigns.filter((c) => c.id !== id) }));
      },

      toggleCampaign: async (id) => {
        const saved = await contentService.toggleCampaign(id);
        set((state) => ({ campaigns: state.campaigns.map((c) => (c.id === id ? saved : c)) }));
      },

      // ── Admin Blog Actions ──
      addBlogPost: async (postData) => {
        const created = await contentService.createBlogPost(postData);
        set((state) => ({ blogPosts: [created, ...state.blogPosts] }));
        return created;
      },

      updateBlogPost: async (id, updates) => {
        const current = get().blogPosts.find((p) => p.id === id);
        if (!current) throw new Error("Không tìm thấy bài viết cần cập nhật");
        const saved = await contentService.updateBlogPost(id, stripMeta({ ...current, ...updates }));
        set((state) => ({ blogPosts: state.blogPosts.map((p) => (p.id === id ? saved : p)) }));
        return saved;
      },

      toggleBlogPost: async (id) => {
        const saved = await contentService.toggleBlogPost(id);
        set((state) => ({ blogPosts: state.blogPosts.map((p) => (p.id === id ? saved : p)) }));
      },

      deleteBlogPost: async (id) => {
        await contentService.deleteBlogPost(id);
        set((state) => ({ blogPosts: state.blogPosts.filter((p) => p.id !== id) }));
      },

      // ── Query Helpers ──
      getCampaignStatus: (camp: CampaignItem) => {
        if (!camp.active) return "expired";
        const today = getCurrentISODate();
        if (today < camp.startDate) return "upcoming";
        if (today > camp.endDate) return "expired";
        return "active";
      },

      getActiveCampaigns: () => {
        const today = getCurrentISODate();
        return get().campaigns.filter(
          (c) => c.active && today >= c.startDate && today <= c.endDate
        );
      },

      getProductDiscount: (productId, categoryCode, productName, originalPrice = 0) => {
        const today = getCurrentISODate();
        const activeCampaigns = get().campaigns.filter(
          (c) => c.active && today >= c.startDate && today <= c.endDate
        );

        if (activeCampaigns.length === 0) return null;

        const cleanCat = (categoryCode || "").toLowerCase().replace(/[_-]/g, "");
        const cleanName = (productName || "").toLowerCase();

        // Find matching campaign with highest discount
        let bestMatch: CampaignItem | null = null;

        for (const camp of activeCampaigns) {
          let matched = false;

          if (camp.targetType === "product") {
            // 1. By exact ID
            if (productId && camp.targetProductIds?.some((id) => id.toLowerCase() === productId.toLowerCase())) {
              matched = true;
            }
            // 2. By name keywords
            if (!matched && cleanName && camp.targetProductNames) {
              matched = camp.targetProductNames.some((keyword) =>
                cleanName.includes(keyword.toLowerCase())
              );
            }
          } else if (camp.targetType === "category") {
            // Match by category
            if (cleanCat && camp.targetCategoryCodes) {
              matched = camp.targetCategoryCodes.some((code) => {
                const c = code.toLowerCase().replace(/[_-]/g, "");
                return c === cleanCat || cleanCat.includes(c) || c.includes(cleanCat);
              });
            }
          } else if (camp.targetType === "all") {
            matched = true;
          }

          if (matched) {
            if (!bestMatch || camp.discountPercent > bestMatch.discountPercent) {
              bestMatch = camp;
            }
          }
        }

        if (!bestMatch) return null;

        const percent = bestMatch.discountPercent;
        const discountedPrice = Math.round((originalPrice * (100 - percent)) / 100);

        return {
          hasDiscount: true,
          discountPercent: percent,
          discountedPrice,
          campaignTitle: bestMatch.title,
          campaignSlug: bestMatch.slug,
          endDate: bestMatch.endDate,
          voucherCode: bestMatch.voucherCode,
        };
      },
}));

// Dọn dữ liệu cũ lưu cục bộ từ phiên bản trước (nay dữ liệu nằm ở backend)
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("agritrace-campaign-storage-v3");
  } catch {
    /* ignore */
  }
}
