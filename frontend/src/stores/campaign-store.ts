import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
  hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;

  // Campaign Actions (Admin CRUD)
  addCampaign: (campaign: Omit<CampaignItem, "id" | "createdAt">) => void;
  updateCampaign: (id: string, updates: Partial<CampaignItem>) => void;
  deleteCampaign: (id: string) => void;
  toggleCampaign: (id: string) => void;

  // Blog Actions (Admin CRUD)
  addBlogPost: (post: Omit<AdminBlogPost, "id">) => void;
  updateBlogPost: (id: string, updates: Partial<AdminBlogPost>) => void;
  deleteBlogPost: (id: string) => void;

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

const memoryStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

// Initial Seasonal Campaigns
const initialCampaigns: CampaignItem[] = [
  {
    id: "camp-dau-tay",
    title: "Mùa Thu Hoạch Dâu Tây New Zealand Mộc Châu",
    slug: "mua-thu-hoach-dau-tay-moc-chau",
    type: "harvest",
    typeLabel: "Chính Vụ Thu Hoạch",
    typeColor: "bg-rose-100 text-rose-900 border-rose-300",
    startDate: "2026-10-01",
    endDate: "2026-12-31", // ACTIVE
    discountPercent: 14,
    discountAmount: 25000,
    targetType: "product",
    targetProductIds: ["dddd2222-dddd-2222-dddd-222222222222", "LOT-DT-2026-11"],
    targetProductNames: ["Dâu Tây", "Dâu Tây New Zealand", "Mộc Châu"],
    targetCategoryCodes: ["trai_cay"],
    voucherCode: "DAUTAY25",
    bannerIcon: "🍓",
    badgeText: "Vụ mùa -14%",
    description: "Dâu tây New Zealand trồng nhà kính công nghệ cao tại cao nguyên Mộc Châu bước vào chính vụ quả chín đỏ mọng. Trợ giá trực tiếp 14% tại vườn (giảm 25.000đ/Hộp 500g).",
    fullContent: "Được canh tác theo tiêu chuẩn GlobalGAP trong nhà màng tự động tại cao nguyên Mộc Châu ở độ cao 1.050m. Quả chín tự nhiên, không chất bảo quản, vận chuyển xe lạnh 2°C - 5°C trong 24H.",
    active: true,
    createdAt: "2026-10-01T08:00:00Z",
  },
  {
    id: "camp-rau-da-lat",
    title: "Chiến Dịch Trợ Giá Rau Ăn Lá Thủy Canh Đà Lạt",
    slug: "tro-gia-rau-an-la-thuy-canh-da-lat",
    type: "harvest",
    typeLabel: "Trợ Giá Nông Dân",
    typeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    startDate: "2026-10-01",
    endDate: "2026-12-31", // ACTIVE
    discountPercent: 17,
    discountAmount: 15000,
    targetType: "category",
    targetCategoryCodes: ["rau_la"],
    targetProductIds: ["dddd5555-dddd-5555-dddd-555555555555", "dddd1111-dddd-1111-dddd-111111111111", "SP-KL-05", "LOT-XL-2026-08"],
    targetProductNames: ["Cải Xoăn", "Kale", "Xà Lách", "Lô Lô"],
    voucherCode: "AGRI30",
    bannerIcon: "🥗",
    badgeText: "Vụ mùa -17%",
    description: "Năng suất cải xoăn kale và xà lách lô lô xanh thủy canh NFT tại Đà Lạt đạt đỉnh vụ Thu Đông. Trợ giá trực tiếp 13% - 17% (tiết kiệm 10k - 15k/KG) và cam kết giao lạnh trong 24H.",
    fullContent: "Hợp tác xã Thủy canh Nông Trại Xanh Đà Lạt thu hoạch rộ 85 tấn rau xanh mỗi tuần. Áp dụng mức trợ giá xuất xưởng trực tiếp cho toàn bộ khách hàng tiêu dùng.",
    active: true,
    createdAt: "2026-10-01T08:00:00Z",
  },
  {
    id: "camp-cam-sanh",
    title: "Đại Tiệc Cam Sành Hàm Yên & Bố Hạ Chính Vụ",
    slug: "dai-tiec-cam-sanh-ham-yen",
    type: "harvest",
    typeLabel: "Chính Vụ Thu Hoạch",
    typeColor: "bg-amber-100 text-amber-900 border-amber-300",
    startDate: "2026-09-01",
    endDate: "2026-12-15", // ACTIVE
    discountPercent: 18,
    discountAmount: 10000,
    targetType: "product",
    targetProductIds: ["dddd3333-dddd-3333-dddd-333333333333", "SP-CS-03"],
    targetProductNames: ["Cam Sành", "Cam Sành Hàm Yên"],
    targetCategoryCodes: ["trai_cay"],
    voucherCode: "CAMXANH",
    bannerIcon: "🍊",
    badgeText: "Vụ mùa -18%",
    description: "Vườn cam sành VietGAP Hàm Yên chín vàng mọng nước, giàu Vitamin C tăng sức đề kháng. Trợ giá 18% trực tiếp tại vườn (tiết kiệm 10.000đ/KG).",
    fullContent: "Cam sành chính vụ vỏ mỏng, tép vàng giòn, hàm lượng đường tự nhiên cao. Được hái mới lúc sáng sớm tại Tuyên Quang và chuyển về kho lạnh trung tâm trong ngày.",
    active: true,
    createdAt: "2026-09-01T08:00:00Z",
  },
  {
    id: "camp-bo-sap",
    title: "Tuần Lễ Xả Kho Tươi Cuối Vụ Bơ Sáp 034 Tây Nguyên",
    slug: "tuan-le-xa-kho-bo-sap-034",
    type: "flash_sale",
    typeLabel: "Xả Kho Tươi Cuối Vụ",
    typeColor: "bg-gray-100 text-gray-800 border-gray-300",
    startDate: "2026-10-01",
    endDate: "2026-10-31", // EXPIRED (Chứng minh khi hết hạn ngày kết thúc thì tự động dừng giảm giá!)
    discountPercent: 17,
    discountAmount: 15000,
    targetType: "product",
    targetProductIds: ["dddd6666-dddd-6666-dddd-666666666666", "SP-BO-06"],
    targetProductNames: ["Bơ Sáp 034", "Bơ"],
    targetCategoryCodes: ["trai_cay"],
    voucherCode: "BOSAP15",
    bannerIcon: "🥑",
    badgeText: "Đã kết thúc",
    description: "Đợt bơ sáp 034 cuối cùng của niên vụ 2026. Ưu tiên xuất kho nhanh theo nguyên tắc FEFO bảo quản lạnh.",
    fullContent: "Chiến dịch đã kết thúc ngày 31/10/2026. Sản phẩm bơ sáp hiện đã trở về biểu giá niêm yết thông thường.",
    active: true,
    createdAt: "2026-10-01T08:00:00Z",
  },
];

// Initial Admin Blog Posts
const initialBlogPosts: AdminBlogPost[] = [
  {
    id: "blog-1",
    title: "Thông Báo Quyết Định Trợ Giá Nông Sản Theo Mùa Vụ Thu Đông 2026: Biểu Giá Trực Tiếp Tại Vườn & Lịch Thu Hoạch Chi Tiết (QĐ #88/2026/QĐ-AGRI)",
    slug: "quyet-dinh-tro-gia-nong-san-mua-vu-thu-dong-2026",
    category: "season",
    categoryLabel: "Quyết định & Mùa vụ",
    author: "Ban Điều Phối Mùa Vụ & Liên Minh HTX",
    authorRole: "Hội Đồng Quản Trị Chuỗi Cung Ứng AgriTrace AI",
    date: "11/11/2026",
    readTime: "5 phút đọc",
    excerpt: "Công bố Quyết định số 88/2026/QĐ-AGRI về chính sách trợ giá trực tiếp 13% – 18% cho nông sản chính vụ tại Đà Lạt, Mộc Châu và Hàm Yên. Bảng tổng hợp lịch biểu tháng nào giảm món gì, cơ chế cộng dồn voucher và hướng dẫn nhận thông báo sale.",
    featured: true,
    relatedProductName: "Dâu Tây New Zealand Mộc Châu",
    active: true,
  },
  {
    id: "blog-2",
    title: "Ứng Dụng Trí Tuệ Nhân Tạo (AI) Trong Dự Báo Nhu Cầu & Quản Trị Chuỗi Nông Sản 2026",
    slug: "ung-dung-ai-du-bao-nhu-cau-nong-san-2026",
    category: "ai",
    categoryLabel: "Công nghệ AI",
    author: "TS. Trần Văn Minh",
    authorRole: "Viện Nghiên cứu Nông nghiệp Số",
    date: "14/10/2026",
    readTime: "6 phút đọc",
    excerpt: "Làm thế nào để các hợp tác xã và chuỗi siêu thị dự đoán chính xác lượng rau củ tiêu thụ trong 7 ngày tới? Mô hình AI Demand Forecasting kết hợp lịch sử đơn hàng và dữ liệu mùa vụ giúp giảm tới 35% hao hụt tồn kho.",
    relatedProductName: "Cải Xoăn Kale Hữu Cơ",
    active: true,
  },
  {
    id: "blog-3",
    title: "Cẩm Nang Quét Mã QR Truy Xuất Nguồn Gốc: Hiểu Đúng Từng Thông Số Kiểm Định",
    slug: "cam-nang-quet-ma-qr-truy-xuat-nguon-goc",
    category: "guide",
    categoryLabel: "Cẩm nang tiêu dùng",
    author: "Ban Biên Tập AgriTrace",
    authorRole: "Bộ phận QA/QC",
    date: "12/10/2026",
    readTime: "4 phút đọc",
    excerpt: "Khi quét mã QR trên quả cam hay bó rau thủy canh, những thông số nào quan trọng nhất bạn cần đối soát? Hướng dẫn đọc ngày thu hoạch, mã nông trại và chứng chỉ VietGAP trực tuyến.",
    relatedProductName: "Xà Lách Lô Lô Xanh Thủy Canh",
    active: true,
  },
];

function getCurrentISODate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0]; // YYYY-MM-DD
}

export const useCampaignStore = create<CampaignStore>()(
  persist(
    (set, get) => ({
      campaigns: initialCampaigns,
      blogPosts: initialBlogPosts,
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      // ── Admin Campaign Actions ──
      addCampaign: (campaignData) => {
        const id = `camp-${Date.now()}`;
        const newCamp: CampaignItem = {
          ...campaignData,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ campaigns: [newCamp, ...state.campaigns] }));
      },

      updateCampaign: (id, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      deleteCampaign: (id) => {
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
        }));
      },

      toggleCampaign: (id) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, active: !c.active } : c)),
        }));
      },

      // ── Admin Blog Actions ──
      addBlogPost: (postData) => {
        const id = `blog-${Date.now()}`;
        const newPost: AdminBlogPost = {
          ...postData,
          id,
        };
        set((state) => ({ blogPosts: [newPost, ...state.blogPosts] }));
      },

      updateBlogPost: (id, updates) => {
        set((state) => ({
          blogPosts: state.blogPosts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      deleteBlogPost: (id) => {
        set((state) => ({
          blogPosts: state.blogPosts.filter((p) => p.id !== id),
        }));
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

          // 1. By exact ID
          if (productId && camp.targetProductIds?.some((id) => id.toLowerCase() === productId.toLowerCase())) {
            matched = true;
          }

          // 2. By category
          if (!matched && cleanCat && camp.targetCategoryCodes) {
            matched = camp.targetCategoryCodes.some((code) => {
              const c = code.toLowerCase().replace(/[_-]/g, "");
              return c === cleanCat || cleanCat.includes(c) || c.includes(cleanCat);
            });
          }

          // 3. By name keywords
          if (!matched && cleanName && camp.targetProductNames) {
            matched = camp.targetProductNames.some((keyword) =>
              cleanName.includes(keyword.toLowerCase())
            );
          }

          // 4. Target type === "all"
          if (!matched && camp.targetType === "all") {
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
    }),
    {
      name: "agritrace-campaign-storage",
      storage: createJSONStorage(() => (typeof window === "undefined" ? memoryStorage : localStorage)),
      partialize: (state) => ({ campaigns: state.campaigns, blogPosts: state.blogPosts }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);
