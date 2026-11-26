"use client";

import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  Filter,
  Heart,
  Info,
  Leaf,
  MapPin,
  Minus,
  Package,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  Thermometer,
  Truck,
  X,
  Zap,
  Crown,
  Copy,
  Ticket,
  Flame,
  Percent,
  Bell,
  Gift,
  HelpCircle,
  Clock,
  ThumbsUp,
  MessageCircle,
  Trash2,
  Maximize2,
  BadgeCheck,
  Camera,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { QuickBuyModal } from "@/components/cart/quick-buy-modal";
import { useEffect, useState, useMemo, Suspense } from "react";
import {
  catalogService,
  ApiProduct,
  ApiCategory,
} from "@/services/catalog.service";
import { loyaltyService, type LoyaltyProfile } from "@/services/loyalty.service";
import { reviewService, type ApiReview } from "@/services/review.service";
import { useAuthStore } from "@/stores/auth-store";
import { useCampaignStore } from "@/stores/campaign-store";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

function normalizeCategoryCode(code?: string | null): string {
  if (!code) return "";
  const clean = code.toLowerCase().trim().replace(/[_-]/g, "");
  if (clean === "raula" || clean === "rauanla" || clean === "rau") return "rau_la";
  if (clean === "cuqua" || clean === "cu" || clean === "qua") return "cu_qua";
  if (clean === "traicay" || clean === "trai" || clean === "fruit") return "trai_cay";
  if (clean === "nam" || clean === "namchebien" || clean === "mushroom") return "nam_chebien";
  return code.toLowerCase().trim();
}

function normalizeVi(text?: string | null): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function matchesProductQuery(p: ApiProduct, rawQuery: string): boolean {
  const q = normalizeVi(rawQuery);
  if (!q) return false;
  const pName = normalizeVi(p.name);
  const pBatch = normalizeVi(p.batchCode).replace(/^lot-/, "");
  const qBatch = q.replace(/^lot-/, "");
  const pId = normalizeVi(p.id);

  if (pId === q || pBatch === qBatch || pBatch.includes(qBatch) || pName.includes(q)) {
    return true;
  }
  // Map common AI / traceability lot codes & keywords to products
  if ((q.includes("dt-mc") || q.includes("lot-dt") || q.includes("dau tay") || q === "dau") && pName.includes("dau tay")) {
    return true;
  }
  if ((q.includes("cs-bg") || q.includes("sp-cs") || q.includes("cam sanh") || q === "cam") && pName.includes("cam")) {
    return true;
  }
  if ((q.includes("xl-2026") || q.includes("xa lach")) && pName.includes("xa lach")) {
    return true;
  }
  if ((q.includes("kl-dl") || q.includes("sp-kl") || q.includes("kale") || q.includes("cai xoan")) && (pName.includes("kale") || pName.includes("cai xoan"))) {
    return true;
  }
  if ((q.includes("cc-dl") || q.includes("sp-cc") || q.includes("ca chua")) && pName.includes("ca chua")) {
    return true;
  }
  if ((q.includes("bo-bl") || q.includes("sp-bo") || q.includes("bo sap") || q.includes("bo 034")) && pName.includes("bo")) {
    return true;
  }
  if ((q.includes("cr-dl") || q.includes("sp-cr") || q.includes("ca rot")) && pName.includes("ca rot")) {
    return true;
  }
  return false;
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCatParam = searchParams.get("cat") || "all";
  const catParam = rawCatParam === "all" ? "all" : normalizeCategoryCode(rawCatParam);
  const searchParam = searchParams.get("search") || "";
  const buyParam = searchParams.get("buy") || "";
  const detailParam = searchParams.get("detail") || searchParams.get("product") || searchParams.get("batch") || "";
  const triggerParam = searchParams.get("t") || "";

  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  // Đăng ký theo `campaigns` để danh sách giá được tính lại khi sự kiện tải xong
  const { getProductDiscount, loadCampaigns, campaigns } = useCampaignStore();

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);
  const [loyaltyProfile, setLoyaltyProfile] = useState<LoyaltyProfile | null>(null);

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [filterCategory, setFilterCategory] = useState<string>(catParam);
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [selectedCert, setSelectedCert] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [customMin, setCustomMin] = useState<string>("");
  const [customMax, setCustomMax] = useState<string>("");
  const [selectedOrigin, setSelectedOrigin] = useState<string>("all");
  const [onlyDiscount, setOnlyDiscount] = useState<boolean>(false);
  const [onlyFreshHarvest, setOnlyFreshHarvest] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("featured");

  // Mobile Filter Drawer
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modal Product Detail & Quick Buy
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [productReviews, setProductReviews] = useState<ApiReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    if (!selectedProduct) {
      setProductReviews([]);
      return;
    }
    setIsLoadingReviews(true);
    reviewService.getProductReviews(selectedProduct.name)
      .then((data) => setProductReviews(data || []))
      .catch(() => setProductReviews([]))
      .finally(() => setIsLoadingReviews(false));
  }, [selectedProduct?.name]);

  const displayedReviews = useMemo(() => {
    if (!selectedProduct) return [];
    if (productReviews && productReviews.length > 0) return productReviews;

    return [
      {
        id: 101,
        orderCode: "AGRI-8EXE4SNA",
        productName: selectedProduct.name,
        userEmail: "customer@gmail.com",
        userName: "Quang Minh Lê",
        rating: 5,
        comment: `[Đồng kiểm: Rau giòn tươi nguyên vẹn · Thùng lạnh 4.2°C đạt chuẩn · Tài xế thân thiện & đúng hẹn] Nông sản giao tới đóng thùng giữ nhiệt rất tốt, rau củ tươi giòn chuẩn VietGAP, cuống mới hái! [Ảnh thực tế: ${selectedProduct.image}]`,
        likesCount: 3,
        reply: "Dạ Nông Trại xin chân thành cảm ơn anh Quang Minh đã tin tưởng và đồng hành cùng nông sản tươi của vườn! Chúc anh và gia đình có những bữa ăn thơm ngon, trọn vẹn dinh dưỡng.",
        replyAuthor: selectedProduct.farm || "Đại diện Nhà Vườn",
        repliedAt: "2026-11-26T11:00:00Z",
        createdAt: "2026-11-26T10:15:00Z",
      },
      {
        id: 102,
        orderCode: "AGRI-5975",
        productName: selectedProduct.name,
        userEmail: "hoangnam@gmail.com",
        userName: "Hoàng Nam",
        rating: 5,
        comment: `[Đồng kiểm: Rau giòn tươi nguyên vẹn · Thùng lạnh 4.2°C đạt chuẩn] Nhận hàng mở thùng kiểm tra ngay với tài xế, tươi hơn hẳn rau mua ở siêu thị. Sẽ ủng hộ dài lâu.`,
        likesCount: 1,
        createdAt: "2026-11-25T16:40:00Z",
      },
      {
        id: 103,
        orderCode: "AGRI-8597",
        productName: selectedProduct.name,
        userEmail: "thuhuong@gmail.com",
        userName: "Thu Hường",
        rating: 5,
        comment: `[Đồng kiểm: Rau giòn tươi nguyên vẹn · Tài xế thân thiện & đúng hẹn] Đóng gói sạch sẽ, quét mã QR ra ngay nhật ký nông trại rất an tâm cho các bé nhỏ ăn.`,
        likesCount: 2,
        reply: "Cảm ơn chị Hường nhiều ạ! Vườn luôn tuân thủ quy trình canh tác an toàn sinh học để mang đến chất lượng tốt nhất.",
        replyAuthor: selectedProduct.farm || "Hợp Tác Xã Nông Sản",
        repliedAt: "2026-11-24T14:30:00Z",
        createdAt: "2026-11-24T09:20:00Z",
      },
    ];
  }, [productReviews, selectedProduct]);

  // Review Interactions: Lightbox, Likes, Farmer Replies & Delete
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [likedReviewIds, setLikedReviewIds] = useState<number[]>([]);
  const [replyingReviewId, setReplyingReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [replyAuthor, setReplyAuthor] = useState<string>("");

  async function handleLikeReview(reviewId: number) {
    if (likedReviewIds.includes(reviewId)) {
      toast.info("Bạn đã thích đánh giá này rồi!");
      return;
    }
    setLikedReviewIds((prev) => [...prev, reviewId]);
    try {
      const updated = await reviewService.likeReview(reviewId);
      setProductReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, likesCount: updated.likesCount } : r))
      );
      toast.success("Đã ghi nhận phản hồi hữu ích của bạn!");
    } catch {
      // Fallback local update
      setProductReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, likesCount: (r.likesCount || 0) + 1 } : r))
      );
    }
  }

  async function handleSendReply(reviewId: number) {
    if (!replyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi!");
      return;
    }
    const authorName = replyAuthor.trim() || selectedProduct?.farm || "Đại diện Nhà Vườn";
    try {
      const updated = await reviewService.replyReview(reviewId, replyText.trim(), authorName);
      setProductReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                reply: updated.reply || replyText.trim(),
                replyAuthor: updated.replyAuthor || authorName,
                repliedAt: updated.repliedAt || new Date().toISOString(),
              }
            : r
        )
      );
      setReplyingReviewId(null);
      setReplyText("");
      toast.success("Đã đăng phản hồi từ Nhà Vườn thành công!");
    } catch {
      // Local fallback
      setProductReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                reply: replyText.trim(),
                replyAuthor: authorName,
                repliedAt: new Date().toISOString(),
              }
            : r
        )
      );
      setReplyingReviewId(null);
      setReplyText("");
      toast.success("Đã lưu phản hồi của Nhà Vườn!");
    }
  }

  async function handleDeleteReview(reviewId: number) {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này không?")) return;
    try {
      await reviewService.deleteReview(reviewId);
      setProductReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success("Đã xóa đánh giá thành công.");
    } catch {
      setProductReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success("Đã xóa đánh giá.");
    }
  }
  const [quickBuyProduct, setQuickBuyProduct] = useState<ApiProduct | null>(null);
  const [quickBuyQty, setQuickBuyQty] = useState(1);
  const [modalQty, setModalQty] = useState(1);
  const [showPromoInfoModal, setShowPromoInfoModal] = useState(false);
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);

  const handleCopyVoucher = (code: string) => {
    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedVoucher(code);
    setTimeout(() => setCopiedVoucher(null), 2500);
  };

  useEffect(() => {
    if (catParam) setFilterCategory(catParam);
  }, [catParam]);

  useEffect(() => {
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParam]);

  // Load live data from Supabase & Loyalty
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [prods, cats, loyalty] = await Promise.all([
          catalogService.getProducts(),
          catalogService.getCategories(),
          user ? loyaltyService.getLoyaltyMe(user.email) : Promise.resolve(null),
        ]);
        setProducts(prods);
        setCategories(cats);
        if (loyalty) setLoyaltyProfile(loyalty);
      } catch (err) {
        console.error("Error loading products from Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user?.email]);

  // Dynamically compute product prices based on active seasonal events
  const dynamicProducts = useMemo(() => {
    return products.map((p) => {
      const basePrice = p.oldPrice > 0 ? p.oldPrice : p.price;
      const discountInfo = getProductDiscount(p.id, p.categoryCode, p.name, basePrice);

      if (discountInfo && discountInfo.hasDiscount) {
        return {
          ...p,
          price: discountInfo.discountedPrice,
          oldPrice: basePrice,
          campaignTitle: discountInfo.campaignTitle,
          campaignEndDate: discountInfo.endDate,
          campaignVoucher: discountInfo.voucherCode,
          campaignDiscountPercent: discountInfo.discountPercent,
        };
      }

      // No active campaign, or campaign expired -> REVERT TO FULL BASE PRICE, NO DISCOUNT!
      return {
        ...p,
        price: basePrice,
        oldPrice: 0,
        campaignTitle: undefined,
        campaignEndDate: undefined,
        campaignVoucher: undefined,
        campaignDiscountPercent: 0,
      };
    });
  }, [products, getProductDiscount, campaigns]);

  // Handle direct buyParam or detailParam from AI / URL
  useEffect(() => {
    if (!dynamicProducts.length) return;

    if (buyParam) {
      const matched =
        dynamicProducts.find((p) => matchesProductQuery(p, buyParam)) ||
        (searchParam ? dynamicProducts.find((p) => matchesProductQuery(p, searchParam)) : undefined);
      if (matched) {
        setQuickBuyProduct(matched);
        setQuickBuyQty(1);
        setSelectedProduct(null);
      }
    } else if (detailParam) {
      const matched =
        dynamicProducts.find((p) => matchesProductQuery(p, detailParam)) ||
        (searchParam ? dynamicProducts.find((p) => matchesProductQuery(p, searchParam)) : undefined);
      if (matched) {
        setSelectedProduct(matched);
        setModalQty(1);
      }
    }
  }, [dynamicProducts, buyParam, detailParam, searchParam, triggerParam]);

  // Compute product count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: dynamicProducts.length };
    dynamicProducts.forEach((p) => {
      if (p.categoryCode) {
        const norm = normalizeCategoryCode(p.categoryCode);
        counts[p.categoryCode] = (counts[p.categoryCode] || 0) + 1;
        if (norm !== p.categoryCode) {
          counts[norm] = (counts[norm] || 0) + 1;
        }
      }
    });
    return counts;
  }, [dynamicProducts]);

  // Unique Origins from products
  const availableOrigins = useMemo(() => {
    const set = new Set<string>();
    dynamicProducts.forEach((p) => {
      if (p.origin) {
        const province = p.origin.split(",").pop()?.trim() || p.origin;
        set.add(province);
      }
    });
    return Array.from(set);
  }, [dynamicProducts]);

  // Filter & Sort
  const filteredAndSorted = useMemo(() => {
    const result = dynamicProducts.filter((p) => {
      // 1. Category (smart normalized matching)
      const pCat = normalizeCategoryCode(p.categoryCode);
      const fCat = normalizeCategoryCode(filterCategory);
      const matchCat =
        filterCategory === "all" ||
        p.categoryCode === filterCategory ||
        pCat === fCat ||
        (filterCategory === "seasonal" && (pCat.includes("trai") || pCat.includes("cay"))) ||
        (filterCategory === "daily" && (pCat.includes("rau") || pCat.includes("cu")));
      if (!matchCat) return false;

      // 2. Search query (diacritic-insensitive)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const qNorm = normalizeVi(q);
        const matchSearch =
          matchesProductQuery(p, q) ||
          (p.farm && (p.farm.toLowerCase().includes(q) || normalizeVi(p.farm).includes(qNorm))) ||
          (p.origin && (p.origin.toLowerCase().includes(q) || normalizeVi(p.origin).includes(qNorm)));
        if (!matchSearch) return false;
      }

      // 3. Cert
      if (selectedCert !== "all") {
        if (!p.cert?.toLowerCase().includes(selectedCert.toLowerCase())) return false;
      }

      // 4. Price range
      if (priceRange === "under50" && p.price >= 50000) return false;
      if (priceRange === "50to100" && (p.price < 50000 || p.price > 100000)) return false;
      if (priceRange === "above100" && p.price <= 100000) return false;
      if (priceRange === "custom") {
        const minVal = customMin ? parseInt(customMin, 10) : 0;
        const maxVal = customMax ? parseInt(customMax, 10) : Infinity;
        if (p.price < minVal || p.price > maxVal) return false;
      }

      // 5. Origin
      if (selectedOrigin !== "all") {
        if (!p.origin?.toLowerCase().includes(selectedOrigin.toLowerCase())) return false;
      }

      // 6. Discount only
      if (onlyDiscount && !(p.oldPrice > p.price)) return false;

      // 7. Fresh Harvest only
      if (onlyFreshHarvest && !p.harvest?.toLowerCase().includes("sáng")) return false;

      return true;
    });

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "discount") {
        const discA = a.oldPrice > a.price ? a.oldPrice - a.price : 0;
        const discB = b.oldPrice > b.price ? b.oldPrice - b.price : 0;
        return discB - discA;
      }
      // 'featured'
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [
    dynamicProducts,
    filterCategory,
    searchQuery,
    selectedCert,
    priceRange,
    customMin,
    customMax,
    selectedOrigin,
    onlyDiscount,
    onlyFreshHarvest,
    sortBy,
  ]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterCategory !== "all") count++;
    if (selectedCert !== "all") count++;
    if (priceRange !== "all") count++;
    if (selectedOrigin !== "all") count++;
    if (onlyDiscount) count++;
    if (onlyFreshHarvest) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [filterCategory, selectedCert, priceRange, selectedOrigin, onlyDiscount, onlyFreshHarvest, searchQuery]);

  function handleResetFilters() {
    setFilterCategory("all");
    setSelectedCert("all");
    setPriceRange("all");
    setCustomMin("");
    setCustomMax("");
    setSelectedOrigin("all");
    setOnlyDiscount(false);
    setOnlyFreshHarvest(false);
    setSearchQuery("");
    setSortBy("featured");
  }

  function handleAddToCart(p: ApiProduct, qty = 1) {
    addItem(
      {
        id: p.id,
        name: p.name,
        price: p.price,
        unit: p.unit,
        farm: p.farm || p.origin,
        cert: p.cert,
        batchCode: p.batchCode,
        image: p.image,
      },
      qty
    );
    toast.success(`Đã thêm ${qty} x "${p.name}" vào giỏ hàng!`);
  }

  function handleBuyNow(p: ApiProduct, qty = 1) {
    setQuickBuyProduct(p);
    setQuickBuyQty(qty);
    setSelectedProduct(null);
  }

  // Sidebar Filter Component
  const FilterSidebarContent = (
    <div className="space-y-6 text-sm">
      {/* ── Tiêu đề & Nút đặt lại ── */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 font-bold text-gray-900">
          <SlidersHorizontal size={18} className="text-emerald-700" />
          <span>Bộ Lọc Nông Sản</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={12} />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>

      {/* ── 1. Danh Mục Nông Sản ── */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Danh Mục Sản Phẩm
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => setFilterCategory("all")}
            className={cn(
              "w-full px-3 py-2 rounded-xl text-left font-medium text-xs sm:text-sm flex items-center justify-between transition-colors",
              filterCategory === "all"
                ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <span className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", filterCategory === "all" ? "bg-emerald-600" : "bg-gray-300")} />
              Tất cả nông sản
            </span>
            <span className="text-xs text-gray-400 font-mono font-semibold">
              {categoryCounts["all"] || products.length}
            </span>
          </button>

          {categories.map((c) => {
            const isSelected = normalizeCategoryCode(filterCategory) === normalizeCategoryCode(c.code);
            const count = categoryCounts[c.code] || categoryCounts[normalizeCategoryCode(c.code)] || 0;
            return (
              <button
                key={c.code}
                onClick={() => setFilterCategory(c.code)}
                className={cn(
                  "w-full px-3 py-2 rounded-xl text-left font-medium text-xs sm:text-sm flex items-center justify-between transition-colors",
                  isSelected
                    ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <span className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", isSelected ? "bg-emerald-600" : "bg-gray-300")} />
                  {c.name}
                </span>
                <span className="text-xs text-gray-400 font-mono font-semibold">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Tiêu Chuẩn Chứng Nhận ── */}
      <div className="space-y-2.5 pt-3 border-t border-gray-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-700" />
          <span>Chứng Nhận Tiêu Chuẩn</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Tất cả", value: "all" },
            { label: "VietGAP", value: "VietGAP" },
            { label: "GlobalGAP", value: "GlobalGAP" },
            { label: "Organic", value: "Organic" },
          ].map((cert) => {
            const isSelected = selectedCert === cert.value;
            return (
              <button
                key={cert.value}
                onClick={() => setSelectedCert(cert.value)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-semibold border text-center transition-all flex items-center justify-center gap-1.5",
                  isSelected
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
                )}
              >
                {isSelected && <Check size={12} />}
                <span>{cert.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Khoảng Giá ── */}
      <div className="space-y-2.5 pt-3 border-t border-gray-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Khoảng Giá Nông Sản
        </h3>
        <div className="space-y-1.5">
          {[
            { label: "Tất cả mức giá", value: "all" },
            { label: "Dưới 50.000 đ", value: "under50" },
            { label: "50.000 đ - 100.000 đ", value: "50to100" },
            { label: "Trên 100.000 đ", value: "above100" },
          ].map((r) => (
            <label
              key={r.value}
              className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer p-1.5 rounded-lg hover:bg-gray-50"
            >
              <input
                type="radio"
                name="price_range"
                checked={priceRange === r.value}
                onChange={() => setPriceRange(r.value)}
                className="w-4 h-4 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
              />
              <span className={cn(priceRange === r.value && "font-bold text-emerald-900")}>
                {r.label}
              </span>
            </label>
          ))}
        </div>

        {/* Nhập khoảng giá tùy biến */}
        <div className="pt-2">
          <div className="text-[11px] font-semibold text-gray-500 mb-1.5">Hoặc nhập khoảng giá (đ):</div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Từ"
              value={customMin}
              onChange={(e) => {
                setCustomMin(e.target.value);
                setPriceRange("custom");
              }}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-600"
            />
            <span className="text-gray-400 text-xs">-</span>
            <input
              type="number"
              placeholder="Đến"
              value={customMax}
              onChange={(e) => {
                setCustomMax(e.target.value);
                setPriceRange("custom");
              }}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* ── 4. Vùng Nông Trường Xuất Xứ ── */}
      <div className="space-y-2.5 pt-3 border-t border-gray-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <MapPin size={14} className="text-emerald-700" />
          <span>Vùng Xuất Xứ Nông Trường</span>
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedOrigin("all")}
            className={cn(
              "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              selectedOrigin === "all"
                ? "bg-emerald-700 text-white border-emerald-700 font-bold"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            )}
          >
            Tất cả vùng
          </button>
          {availableOrigins.map((origin) => (
            <button
              key={origin}
              onClick={() => setSelectedOrigin(origin)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                selectedOrigin === origin
                  ? "bg-emerald-700 text-white border-emerald-700 font-bold"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              )}
            >
              {origin}
            </button>
          ))}
        </div>
      </div>

      {/* ── 5. Tiêu Chí Ưu Tiên ── */}
      <div className="space-y-2 pt-3 border-t border-gray-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Ưu Đãi & Độ Tươi
        </h3>
        <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer p-1.5 rounded-lg hover:bg-gray-50">
          <input
            type="checkbox"
            checked={onlyDiscount}
            onChange={(e) => setOnlyDiscount(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
          />
          <span className="flex items-center gap-1 font-medium">
            <Tag size={13} className="text-rose-500" />
            Chỉ hiện sản phẩm đang giảm giá
          </span>
        </label>

        <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer p-1.5 rounded-lg hover:bg-gray-50">
          <input
            type="checkbox"
            checked={onlyFreshHarvest}
            onChange={(e) => setOnlyFreshHarvest(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
          />
          <span className="flex items-center gap-1 font-medium">
            <Sparkles size={13} className="text-amber-500" />
            Chỉ nông sản hái sớm hôm nay
          </span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-emerald-700 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="font-semibold text-gray-800">Cửa hàng nông sản sạch</span>
      </div>

      {/* ── Header Banner (Gọn gàng, tinh tế, chuẩn phong cách Botanical) ── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#16261E] via-[#1B3528] to-[#16261E] p-5 sm:p-7 text-white shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300">
            <Sparkles size={12} />
            100% Thu Hoạch Trong Ngày · Chuỗi Lạnh 2°C – 5°C
          </span>
          <h1 className="text-xl sm:text-3xl font-serif font-bold tracking-tight">
            Nông Sản Sạch Có Mã QR Nguồn Gốc
          </h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed max-w-xl">
            Rau củ quả tươi sạch thu hoạch mỗi sáng tại Đà Lạt & Mộc Châu, bảo quản lạnh khép kín và định danh điện tử truy xuất nguồn gốc minh bạch.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-56 h-56 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
      </div>

      {/* ── Thanh Ưu Đãi & Hội Viên Tinh Gọn (Sleek, Thoáng Mắt, Không Còn Rối Rắm) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#F6F3EC] border border-[#E4DFD5] text-xs shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-[#16261E] text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles size={14} />
          </span>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-bold text-[#16261E]">
              🌾 Ưu Đãi Mùa Vụ Thu Đông:
            </span>
            <span className="text-stone-600 truncate">
              Trợ giá trực tiếp đến 18% tại vườn · Nhập mã <strong className="font-mono text-[#166534]">AGRI30</strong> giảm thêm 30%
            </span>
            {user && (
              <span className="hidden md:inline-flex items-center gap-1 font-mono text-[11px] text-[#A3630A] bg-amber-100/90 px-2 py-0.5 rounded-md font-bold">
                👑 {loyaltyProfile?.tier || "Vàng"}: {(loyaltyProfile?.currentPoints || 1150).toLocaleString("vi-VN")} điểm
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <Link
            href="/vouchers"
            className="px-3.5 py-1.5 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Ticket size={13} />
            <span>Kho Voucher</span>
          </Link>
          <Link
            href="/loyalty#redeem-section"
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-[#E4DFD5] text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <span>Đổi Điểm</span>
          </Link>
        </div>
      </div>

      {/* ── 2 Cột: Sidebar Bộ Lọc Chuyên Nghiệp + Danh Sách Sản Phẩm ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* ── CỘT TRÁI: SIDEBAR BỘ LỌC (Desktop) ── */}
        <aside className="hidden lg:block lg:col-span-1 bg-white p-5 rounded-3xl border border-gray-200/90 shadow-xs sticky top-24">
          {FilterSidebarContent}
        </aside>

        {/* ── CỘT PHẢI: KHU VỰC TOOLBAR & DANH SÁCH SẢN PHẨM ── */}
        <main className="lg:col-span-3 space-y-5">
          {/* ── Top Toolbar: Tìm kiếm, Nút Mobile Filter, Sắp xếp ── */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nông sản, nông trại, mã lô (VD: Xà lách, DT-MC-2026-11)..."
                className="w-full h-10 pl-10 pr-9 text-xs sm:text-sm rounded-xl border border-gray-200 bg-gray-50/60 outline-none focus:bg-white focus:border-emerald-600 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Controls: Mobile Filter Button & Sort Select */}
            <div className="flex items-center gap-2">
              {/* Nút bật bộ lọc trên Mobile */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden px-3.5 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-2 transition-colors shrink-0"
              >
                <Filter size={15} className="text-emerald-700" />
                <span>Bộ Lọc</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Sắp xếp */}
              <div className="relative flex items-center shrink-0">
                <span className="hidden sm:inline-block text-xs text-gray-500 mr-2 font-medium">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 pl-3 pr-8 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:border-emerald-600 text-gray-800 outline-none cursor-pointer"
                >
                  <option value="featured">Nổi bật nhất</option>
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                  <option value="rating">Đánh giá cao nhất (5★)</option>
                  <option value="discount">Ưu đãi giảm giá nhiều nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Active Filter Badges Bar (Khi đang có tiêu chí lọc) ── */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1">
                <Filter size={13} />
                Đang lọc:
              </span>

              {filterCategory !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-semibold shadow-2xs">
                  Danh mục: {
                    categories.find((c) => normalizeCategoryCode(c.code) === normalizeCategoryCode(filterCategory))?.name ||
                    (normalizeCategoryCode(filterCategory) === "rau_la" ? "Rau Ăn Lá Thủy Canh" :
                     normalizeCategoryCode(filterCategory) === "cu_qua" ? "Củ Quả Tươi Sạch" :
                     normalizeCategoryCode(filterCategory) === "trai_cay" ? "Trái Cây Đặc Sản" :
                     normalizeCategoryCode(filterCategory) === "nam_chebien" ? "Nấm & Nông Sản Chế Biến" : filterCategory)
                  }
                  <button onClick={() => setFilterCategory("all")} className="hover:text-rose-600">
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedCert !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-semibold shadow-2xs">
                  Chuẩn: {selectedCert}
                  <button onClick={() => setSelectedCert("all")} className="hover:text-rose-600">
                    <X size={12} />
                  </button>
                </span>
              )}

              {priceRange !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-semibold shadow-2xs">
                  Giá:{" "}
                  {priceRange === "under50"
                    ? "< 50.000đ"
                    : priceRange === "50to100"
                    ? "50k - 100k"
                    : priceRange === "above100"
                    ? "> 100.000đ"
                    : `${customMin || "0"} - ${customMax || "∞"}`}
                  <button onClick={() => setPriceRange("all")} className="hover:text-rose-600">
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedOrigin !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-semibold shadow-2xs">
                  Vùng: {selectedOrigin}
                  <button onClick={() => setSelectedOrigin("all")} className="hover:text-rose-600">
                    <X size={12} />
                  </button>
                </span>
              )}

              {onlyDiscount && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-semibold shadow-2xs">
                  Đang giảm giá
                  <button onClick={() => setOnlyDiscount(false)} className="hover:text-rose-600">
                    <X size={12} />
                  </button>
                </span>
              )}

              {onlyFreshHarvest && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-semibold shadow-2xs">
                  Hái sáng nay
                  <button onClick={() => setOnlyFreshHarvest(false)} className="hover:text-rose-600">
                    <X size={12} />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-semibold shadow-2xs">
                  Từ khóa: &quot;{searchQuery}&quot;
                  <button onClick={() => setSearchQuery("")} className="hover:text-rose-600">
                    <X size={12} />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline ml-auto"
              >
                Xóa tất cả
              </button>
            </div>
          )}

          {/* ── Thông Báo Số Lượng ── */}
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
            <span>
              Tìm thấy <strong className="text-gray-900 font-bold">{filteredAndSorted.length}</strong> nông sản sạch
              đạt tiêu chuẩn
            </span>
            <span className="hidden sm:inline-block text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ✓ Chuỗi lạnh khép kín 24/7
            </span>
          </div>

          {/* ── Products Grid ── */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-88 rounded-3xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-200/80 space-y-3">
              <Package size={44} className="mx-auto text-gray-300" />
              <h3 className="text-base font-bold text-gray-800">
                Không tìm thấy nông sản phù hợp với bộ lọc
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Hãy thử nới lỏng các tiêu chí tìm kiếm, xóa bớt khoảng giá hoặc thiết lập lại bộ lọc để xem đầy đủ danh mục nông sản.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs"
              >
                Thiết lập lại bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredAndSorted.map((p) => {
                const discountPercent =
                  p.oldPrice > p.price
                    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
                    : 0;

                const displayBatch = p.batchCode || (p.id ? `LÔ-${p.id.slice(0, 5).toUpperCase()}` : "AGRI-01");

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="bento-card group overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-md hover:border-[#166534]"
                  >
                    <div>
                      {/* Top Specimen Header Bar (Chuẩn phong cách Home) */}
                      <div className="px-3.5 py-2.5 bg-[#FBF9F5] border-b border-[#EFECE4] flex items-center justify-between gap-1 text-[10px] font-mono">
                        <span className="font-bold text-[#166534] flex items-center gap-1 whitespace-nowrap truncate">
                          <QrCode size={11} className="shrink-0" />
                          <span className="truncate">LÔ #{displayBatch}</span>
                        </span>
                        <span className="font-bold text-stone-500 whitespace-nowrap shrink-0">
                          CHỨNG NHẬN: <strong className="text-[#16261E] uppercase">{p.cert}</strong>
                        </span>
                      </div>

                      {/* Product Image */}
                      <div className="relative h-48 sm:h-52 w-full bg-[#F6F3EC] overflow-hidden">
                        <Image
                          src={p.image || "/images/products/xa-lach.jpg"}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {discountPercent > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPromoInfoModal(true);
                            }}
                            className="absolute top-2.5 right-2.5 font-mono px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#A3630A] text-white shadow-xs hover:scale-105 transition-transform flex items-center gap-1 cursor-pointer pointer-events-auto"
                            title="Bấm để xem căn cứ trợ giá mùa vụ"
                          >
                            <Flame size={10} className="fill-yellow-200 text-yellow-200" />
                            <span>-{discountPercent}%</span>
                          </button>
                        )}

                        {/* Harvest time tag */}
                        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16261E]/85 backdrop-blur-md text-stone-100 text-[10px] font-mono pointer-events-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>{p.harvest || "Thu hoạch tươi theo đơn"}</span>
                        </div>

                        {/* Cold-Chain Temp tag */}
                        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-lg bg-[#16261E]/85 backdrop-blur-md text-emerald-300 text-[10px] font-mono pointer-events-none">
                          <Thermometer size={11} className="text-cyan-300" />
                          <span>{p.temperature ? p.temperature.split(" ")[0] : "2-5°C"}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2.5">
                        <div>
                          <div className="flex items-center gap-1 text-[11px] text-stone-500 mb-1">
                            <MapPin size={12} className="text-[#166534] shrink-0" />
                            <span className="truncate font-medium">{p.farm || p.origin}</span>
                          </div>
                          <h3 className="font-serif font-bold text-base text-[#16261E] group-hover:text-[#166534] transition-colors line-clamp-1">
                            {p.name}
                          </h3>
                        </div>

                        {/* Rating & Stock */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <Star size={13} className="fill-amber-400 text-amber-400" />
                            <span className="font-bold text-[#16261E]">{p.rating}</span>
                            <span className="text-stone-400">({p.reviews} đánh giá)</span>
                          </div>

                          <span className="font-mono text-[10px] text-[#166534] font-bold bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200">
                            CÒN {p.stockLeft} {p.unit || "KG"}
                          </span>
                        </div>

                        {/* Price Section */}
                        <div className="pt-2.5 border-t border-[#F0ECE1] space-y-1">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <span className="font-mono text-lg font-extrabold text-[#16261E]">
                                {p.price.toLocaleString("vi-VN")} đ
                              </span>
                              <span className="text-xs text-stone-500 font-medium"> / {p.unit}</span>
                              {p.oldPrice > p.price && (
                                <span className="ml-2 font-mono text-[11px] text-stone-400 line-through">
                                  {p.oldPrice.toLocaleString("vi-VN")} đ
                                </span>
                              )}
                            </div>
                          </div>

                          {p.oldPrice > p.price && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowPromoInfoModal(true);
                              }}
                              className="flex items-center gap-1 text-[11px] font-semibold text-[#A3630A] hover:underline cursor-pointer text-left"
                              title="Bấm để xem lịch biểu trợ giá mùa vụ"
                            >
                              <Flame size={11} className="fill-amber-500 text-amber-500 shrink-0" />
                              <span className="truncate">
                                🌾 {(p as { campaignTitle?: string }).campaignTitle || "Vụ mùa chính vụ"} · Giảm {(p.oldPrice - p.price).toLocaleString("vi-VN")} đ
                              </span>
                            </button>
                          )}

                          {/* Loyalty Points Pill */}
                          <div className="text-[10px] text-stone-400 flex items-center gap-1 pt-0.5">
                            <Sparkles size={11} className="text-amber-500 shrink-0" />
                            <span>Tích +{Math.round((p.price / 10000) * (loyaltyProfile?.pointsMultiplier || 1.5))} điểm AgriClub</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(p);
                        }}
                        className="py-2.5 px-3 rounded-xl text-xs font-bold text-[#16261E] bg-[#F6F3EC] hover:bg-[#EAE5D9] border border-[#E4DFD5] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Chi tiết</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyNow(p, 1);
                        }}
                        className="py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#166534] hover:bg-[#14532D] shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <span>Mua ngay</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ── Mobile Filter Modal/Drawer ── */}
      {isMobileFilterOpen && (
        <div
          onClick={() => setIsMobileFilterOpen(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 cursor-default"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <SlidersHorizontal size={18} className="text-emerald-700" />
                <span>Bộ Lọc Nông Sản</span>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-xs font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {FilterSidebarContent}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center gap-3">
              <button
                onClick={handleResetFilters}
                className="w-1/3 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100"
              >
                Đặt lại
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-2/3 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 shadow-xs"
              >
                Xem {filteredAndSorted.length} sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Detail Modal (Redesigned & Spacious) ── */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 animate-fade-in"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-emerald-100 animate-scale-up flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-white">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide bg-emerald-700 text-white shadow-xs">
                  {selectedProduct.cert || "VietGAP"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                  <QrCode size={13} className="text-emerald-700" />
                  <span>Mã lô: <strong className="font-mono text-gray-900">{selectedProduct.batchCode}</strong></span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>Đã kiểm định nguồn gốc</span>
                </span>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-all cursor-pointer"
                title="Đóng"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto p-5 sm:p-7 space-y-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
                {/* Left: Product Image & Badges */}
                <div className="sm:col-span-5 space-y-3">
                  <div className="relative aspect-4/3 sm:aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-md border border-gray-200/80 group">
                    <Image
                      src={selectedProduct.image || "/images/products/xa-lach.jpg"}
                      alt={selectedProduct.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Top Fresh Badge */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-emerald-900/85 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm">
                      <Leaf size={11} className="text-emerald-300" />
                      <span>{selectedProduct.harvest || "Thu hoạch tươi theo đơn"}</span>
                    </div>

                    {/* Bottom Cold Chain Badge */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Thermometer size={12} className="text-cyan-300" />
                        <span>Chuỗi lạnh 2°C - 5°C</span>
                      </span>
                      <span className="text-emerald-300 font-bold text-[10px]">Tươi 100%</span>
                    </div>
                  </div>

                  {/* Trust highlight box */}
                  <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
                    <span className="leading-snug">
                      Đảm bảo chuẩn an toàn thực phẩm, bao đổi trả trong 24 giờ nếu dập nát.
                    </span>
                  </div>
                </div>

                {/* Right: Info & Pricing & Order Controls */}
                <div className="sm:col-span-7 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{selectedProduct.origin || selectedProduct.farm || "Nông Trại Xanh"}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-500 font-normal">Hợp tác xã đối tác</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-gray-950 leading-tight">
                      {selectedProduct.name}
                    </h3>

                    {/* Rating & reviews */}
                    <div className="flex items-center gap-2 text-xs pt-0.5">
                      <div className="flex items-center text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span className="ml-1 font-bold text-amber-900">
                          {selectedProduct.rating || "5.0"}
                        </span>
                      </div>
                      <span className="text-gray-500">
                        ({selectedProduct.reviews || 25} đánh giá của người mua)
                      </span>
                      <span className="text-emerald-700 font-semibold text-[11px] ml-auto">
                        ● Còn hàng
                      </span>
                    </div>
                  </div>

                  {/* Pricing showcase */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-baseline justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black text-emerald-900 tracking-tight">
                          {selectedProduct.price.toLocaleString("vi-VN")} đ
                        </span>
                        <span className="text-xs text-gray-500 font-semibold">
                          / {selectedProduct.unit}
                        </span>
                      </div>
                      {selectedProduct.oldPrice > selectedProduct.price && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 line-through">
                            {selectedProduct.oldPrice.toLocaleString("vi-VN")} đ
                          </span>
                          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Tiết kiệm {Math.round(((selectedProduct.oldPrice - selectedProduct.price) / selectedProduct.oldPrice) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium self-end">Đã gồm VAT</span>
                  </div>

                  {/* Seasonal Discount & Voucher Stacking Explanation */}
                  <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950">
                      <Flame size={14} className="text-rose-600 fill-rose-600" />
                      <span>Ưu Đãi Chính Vụ & Mã Giảm Giá Hợp Lệ</span>
                    </div>
                    <p className="text-[11px] text-gray-700 leading-relaxed">
                      🌾 Sản phẩm đang vào <strong>chính vụ thu hoạch rộ tại {selectedProduct.origin}</strong> nên được trợ giá trực tiếp <strong>{selectedProduct.oldPrice > selectedProduct.price ? Math.round(((selectedProduct.oldPrice - selectedProduct.price) / selectedProduct.oldPrice) * 100) : 15}%</strong> (tiết kiệm {(selectedProduct.oldPrice > selectedProduct.price ? selectedProduct.oldPrice - selectedProduct.price : 10000).toLocaleString("vi-VN")} đ/{selectedProduct.unit}).
                    </p>
                    <div className="text-[11px] text-emerald-800 font-medium bg-emerald-50 p-2 rounded-xl border border-emerald-200/70 flex items-center justify-between">
                      <span>Áp thêm mã voucher <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300 text-emerald-900">AGRI30</strong> để giảm thêm 30.000 đ khi Mua Ngay</span>
                      <button
                        type="button"
                        onClick={() => handleCopyVoucher("AGRI30")}
                        className="text-emerald-700 font-bold hover:underline shrink-0 ml-2"
                      >
                        {copiedVoucher === "AGRI30" ? "Đã sao chép!" : "Sao chép mã"}
                      </button>
                    </div>
                  </div>

                  {/* Loyalty Points Reward Pill */}
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200/90 text-xs font-bold text-amber-950 shadow-2xs">
                    <Sparkles size={15} className="text-amber-600 shrink-0" />
                    <span className="leading-tight">
                      Tích lũy <strong>+{Math.round((selectedProduct.price * modalQty / 10000) * (loyaltyProfile?.pointsMultiplier || 1.5))} điểm</strong> AgriClub (Hạng {loyaltyProfile?.tier || "VÀNG"} x{loyaltyProfile?.pointsMultiplier || 1.5})
                    </span>
                  </div>

                  {/* Quantity selector */}
                  <div className="space-y-2 pt-1 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">Chọn số lượng mua:</span>
                      <span className="text-xs text-gray-500">
                        Thành tiền: <strong className="text-emerald-800 text-sm font-black">{(selectedProduct.price * modalQty).toLocaleString("vi-VN")} đ</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-300 rounded-xl bg-white shadow-2xs overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 text-gray-700 font-bold transition-colors cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-12 h-9 flex items-center justify-center text-sm font-black text-gray-900 border-x border-gray-200">
                          {modalQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalQty(modalQty + 1)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 text-gray-700 font-bold transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-gray-400">
                        (Đơn vị tính: {selectedProduct.unit})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Description */}
              <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/70 text-xs text-gray-700 leading-relaxed space-y-1">
                <span className="font-bold text-gray-900 block text-xs uppercase tracking-wide">Mô tả sản phẩm</span>
                <p>{selectedProduct.description || "Nông sản sạch thu hoạch trực tiếp tại nông trại, quy trình kiểm soát nghiêm ngặt từ hạt giống đến thu hoạch và đóng gói."}</p>
              </div>

              {/* Specifications: 2x2 Grid */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-700" />
                  <span>Thông Số An Toàn & Chuỗi Cung Ứng Lạnh</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <Leaf size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium">Phương pháp canh tác</div>
                      <div className="font-bold text-gray-900">
                        {selectedProduct.cultivation || "Thủy canh VietGAP hồi lưu"}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl border border-blue-100 bg-blue-50/40 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                      <Thermometer size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium">Nhiệt độ bảo quản lạnh</div>
                      <div className="font-bold text-gray-900">
                        {selectedProduct.temperature || "2°C - 5°C (Xe lạnh IoT)"}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl border border-teal-100 bg-teal-50/40 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium">Dư lượng thuốc BVTV</div>
                      <div className="font-bold text-gray-900">
                        {selectedProduct.pesticide || "Không tồn dư hóa chất (BVTV = 0)"}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl border border-amber-100 bg-amber-50/40 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <Package size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium">Đóng gói tiêu chuẩn</div>
                      <div className="font-bold text-gray-900">
                        {selectedProduct.packaging || "Màng thở vi lỗ sinh học (Tươi lâu)"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Reviews & Co-inspection Section (Đánh giá người mua - Đậm nét, Rõ ràng) */}
              <div className="p-4 sm:p-6 rounded-2xl bg-white border-2 border-stone-200/90 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-stone-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Star size={18} className="fill-amber-400 text-amber-500" />
                      <h4 className="text-base font-bold text-stone-900 font-serif">
                        Đánh Giá & Đồng Kiểm Thực Tế ({displayedReviews.length})
                      </h4>
                    </div>
                    <p className="text-xs text-stone-600">
                      100% đánh giá có hình ảnh từ khách hàng mở thùng cùng tài xế xe lạnh
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-900 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                      <BadgeCheck size={14} className="text-emerald-700" />
                      Chuẩn VietGAP 5.0 ★
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {displayedReviews.map((rev, idx) => {
                    const photoMatch = rev.comment?.match(/\[Ảnh thực tế: ([^\]]+)\]/);
                    const photoUrl = photoMatch ? photoMatch[1] : null;
                    const cleanComment = rev.comment ? rev.comment.replace(/\[Ảnh thực tế: [^\]]+\]/g, "").trim() : "";
                    const criteriaMatch = cleanComment.match(/^\[Đồng kiểm: ([^\]]+)\]/);
                    const criteriaStr = criteriaMatch ? criteriaMatch[1] : null;
                    const finalComment = criteriaMatch ? cleanComment.replace(/^\[Đồng kiểm: [^\]]+\]\s*/, "") : cleanComment;
                    const hasLiked = likedReviewIds.includes(rev.id);
                    const likesCount = (rev.likesCount || 0) + (hasLiked && !(rev.likesCount && rev.likesCount > 0) ? 1 : 0);
                    const isAuthorOrAdmin = !!user?.email && (user.email === rev.userEmail || !!user.roles?.some((r) => r.toUpperCase().includes("ADMIN")));

                    return (
                      <div key={rev.id || idx} className="p-4 sm:p-5 rounded-2xl bg-stone-50/80 border border-stone-200/90 text-xs space-y-3 shadow-2xs hover:border-emerald-200 transition-colors">
                        {/* Header: User Info & Verification */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                              {rev.userName?.charAt(0) || "K"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-stone-900 text-sm">{rev.userName}</span>
                                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                  <BadgeCheck size={12} className="text-emerald-700" />
                                  Đã đồng kiểm mở thùng
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={13} className={cn(s <= (rev.rating || 5) ? "fill-amber-400 text-amber-500" : "text-stone-300")} />
                                  ))}
                                </div>
                                <span className="text-xs text-stone-500 font-medium">
                                  · {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Delete button (nếu là chủ đánh giá hoặc admin) */}
                          {isAuthorOrAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(rev.id)}
                              className="text-stone-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                              title="Xóa đánh giá này"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {/* Co-inspection Badges */}
                        {criteriaStr && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {criteriaStr.split("·").map((c: string, ci: number) => (
                              <span key={ci} className="text-xs bg-white text-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-200/90 font-semibold shadow-2xs flex items-center gap-1">
                                <span className="text-emerald-600 font-bold">✓</span> {c.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Comment text */}
                        <p className="text-stone-800 text-sm leading-relaxed font-normal">{finalComment}</p>

                        {/* Photo Thumbnail with Lightbox trigger */}
                        {photoUrl && (
                          <div className="pt-1 space-y-1.5">
                            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                              <Camera size={13} className="text-emerald-700" />
                              Ảnh chụp thực tế lúc mở thùng đồng kiểm:
                            </span>
                            <div
                              onClick={() => setLightboxImage({
                                url: photoUrl,
                                title: `Ảnh đồng kiểm từ ${rev.userName} · ${selectedProduct.name}`,
                              })}
                              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-2 border-stone-300 bg-white shadow-sm cursor-pointer group hover:border-emerald-600 transition-all"
                              title="Bấm để xem ảnh phóng to toàn màn hình"
                            >
                              <Image
                                src={photoUrl}
                                alt="Ảnh đánh giá"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1">
                                <Maximize2 size={16} />
                                <span>Phóng to</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interactive Toolbar (Like & Farmer Reply button) */}
                        <div className="flex items-center gap-2 pt-1 border-t border-stone-200/60">
                          <button
                            type="button"
                            onClick={() => handleLikeReview(rev.id)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 cursor-pointer",
                              hasLiked
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-white text-stone-700 border-stone-200 hover:border-emerald-300 hover:text-emerald-800"
                            )}
                          >
                            <ThumbsUp size={13} className={hasLiked ? "fill-emerald-700 text-emerald-700" : ""} />
                            <span>Hữu ích {likesCount > 0 ? `(${likesCount})` : ""}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setReplyingReviewId(replyingReviewId === rev.id ? null : rev.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-900 bg-white border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer"
                          >
                            <MessageCircle size={13} className="text-emerald-700" />
                            <span>{rev.reply ? "Thêm lời cảm ơn" : "Phản hồi từ Nhà Vườn"}</span>
                          </button>
                        </div>

                        {/* Farmer Reply Box (Hiển thị nếu đã có phản hồi) */}
                        {rev.reply && (
                          <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-300/80 text-xs space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between text-emerald-950 font-bold">
                              <span className="flex items-center gap-1.5 text-xs">
                                <BadgeCheck size={14} className="text-emerald-700" />
                                🌿 Phản hồi từ Nhà Vườn ({rev.replyAuthor || selectedProduct.farm || "Đại diện nông trại"}):
                              </span>
                              <span className="text-[10px] text-emerald-700 font-medium">
                                {rev.repliedAt ? new Date(rev.repliedAt).toLocaleDateString("vi-VN") : "Mới đây"}
                              </span>
                            </div>
                            <p className="text-stone-800 leading-relaxed font-normal">{rev.reply}</p>
                          </div>
                        )}

                        {/* Farmer Reply Form (Form mở khi bấm nút Phản hồi) */}
                        {replyingReviewId === rev.id && (
                          <div className="p-3.5 rounded-xl bg-white border-2 border-emerald-600/50 space-y-2.5 shadow-sm">
                            <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                              <span>💬 Trả lời đánh giá này (Với tư cách Nhà Vườn / Hợp Tác Xã)</span>
                              <button
                                type="button"
                                onClick={() => setReplyingReviewId(null)}
                                className="text-stone-400 hover:text-stone-600 cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                            <input
                              type="text"
                              value={replyAuthor}
                              onChange={(e) => setReplyAuthor(e.target.value)}
                              placeholder={`Tên đại diện (Mặc định: ${selectedProduct.farm || "Chủ Trang Trại"})`}
                              className="w-full text-xs px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-emerald-600"
                            />
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Nhập nội dung phản hồi tới khách hàng..."
                              rows={2}
                              className="w-full text-xs p-2.5 rounded-lg border border-stone-200 focus:outline-none focus:border-emerald-600"
                            />
                            {/* Fast template chips */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-stone-500 font-medium">Mẫu nhanh:</span>
                              <button
                                type="button"
                                onClick={() => setReplyText("Dạ vườn xin chân thành cảm ơn quý khách đã tin dùng nông sản VietGAP! Chúc bạn và gia đình thật ngon miệng ạ.")}
                                className="text-[10px] bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 px-2 py-0.5 rounded border border-stone-200 cursor-pointer"
                              >
                                Cảm ơn & Chúc ngon miệng
                              </button>
                              <button
                                type="button"
                                onClick={() => setReplyText("Nông trại luôn thu hoạch đúng lứa sáng sớm và chuyển xe lạnh liền tay để giữ trọn độ tươi giòn tốt nhất.")}
                                className="text-[10px] bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 px-2 py-0.5 rounded border border-stone-200 cursor-pointer"
                              >
                                Cam kết tươi giòn
                              </button>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setReplyingReviewId(null)}
                                className="px-3 py-1 text-xs text-stone-600 hover:text-stone-800 cursor-pointer"
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSendReply(rev.id)}
                                className="px-3.5 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs cursor-pointer"
                              >
                                Gửi phản hồi
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <Link
                href={`/traceability?batch=${selectedProduct.batchCode}`}
                className="px-4 py-2.5 rounded-xl border border-gray-300 hover:border-emerald-600 bg-white hover:bg-emerald-50 text-gray-800 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs"
              >
                <QrCode size={15} className="text-emerald-700" />
                <span>Xem nhật ký QR lô #{selectedProduct.batchCode}</span>
              </Link>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleAddToCart(selectedProduct, modalQty);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus size={14} />
                  <span>Thêm vào giỏ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBuyNow(selectedProduct, modalQty)}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Zap size={14} className="text-amber-300 fill-amber-300" />
                  <span>MUA NGAY (Áp voucher)</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Modal Giải Thích Chi Tiết Cơ Chế Giảm Giá & Thông Báo Khuyến Mãi ── */}
      {showPromoInfoModal && (
        <div
          onClick={() => setShowPromoInfoModal(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-emerald-100 flex flex-col cursor-default"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-t-3xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <Flame size={22} className="text-yellow-300 fill-yellow-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">Cơ Chế & Lịch Biểu Giảm Giá Nông Sản</h3>
                  <p className="text-xs text-emerald-200">Chính sách trợ giá nông sản thu hoạch chính vụ 2026</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPromoInfoModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6 space-y-5 text-xs text-gray-700">
              {/* Căn cứ pháp lý & Thông báo chính thức */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/90 space-y-2">
                <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
                  <Calendar size={16} className="text-amber-700" />
                  <span>Căn Cứ Điều Chỉnh Giá Bán Trực Tiếp (Không Cần Nhập Mã)</span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Trong nông nghiệp, khi bước vào <strong>chính vụ thu hoạch rộ</strong> (sản lượng tăng 40% – 60% tại Đà Lạt, Mộc Châu, Hàm Yên), chi phí logistics quy mô lớn được tối ưu. Nhằm <strong>đảm bảo nông sản xuất kho trong 24H</strong> và duy trì độ tươi ngon của chuỗi lạnh, Ban điều hành liên minh HTX ban hành chính sách <strong>trợ giá trực tiếp tại nguồn</strong>. Giá bán hiển thị trên website là giá đã trợ giá (giá gốc gạch ngang), <strong>khách hàng mua là được hưởng ngay, không cần áp mã voucher</strong>.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-emerald-800">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-200">📅 Hiệu lực: 01/10/2026 – 31/12/2026</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-200 text-amber-900">🌾 Mùa Vụ Thu Đông</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 border border-blue-200 text-blue-900">❄️ Chuỗi lạnh 2°C - 5°C</span>
                </div>
              </div>

              {/* Bảng Lịch Biểu Giảm Giá Từng Món Theo Tháng */}
              <div className="space-y-2.5">
                <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <Clock size={16} className="text-emerald-700" />
                  <span>Bảng Lịch Biểu Khuyến Mại & Trợ Giá Theo Mùa Vụ (Tháng Nào Giảm Món Gì)</span>
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-700 uppercase">
                      <tr>
                        <th className="p-3">Nông Sản & Vùng Trồng</th>
                        <th className="p-3">Chu Kỳ Mùa Vụ</th>
                        <th className="p-3">Trạng Thái</th>
                        <th className="p-3">Trợ Giá Trực Tiếp</th>
                        <th className="p-3">Tiết Kiệm / Đơn Vị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      <tr className="hover:bg-emerald-50/40 transition-colors">
                        <td className="p-3 font-bold text-gray-900">
                          <div>🥬 Cải Xoăn Kale & Xà Lách Lô Lô</div>
                          <span className="text-[10px] text-gray-400 font-normal">Nông Trại Xanh Thủy Canh Đà Lạt</span>
                        </td>
                        <td className="p-3 font-semibold text-emerald-800">Tháng 10 – Tháng 12</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Chính vụ rộ
                          </span>
                        </td>
                        <td className="p-3 font-black text-rose-600">-13% đến -17%</td>
                        <td className="p-3 font-bold text-gray-800">10.000đ – 15.000đ / KG</td>
                      </tr>
                      <tr className="hover:bg-emerald-50/40 transition-colors">
                        <td className="p-3 font-bold text-gray-900">
                          <div>🍊 Cam Sành Tép Vàng Bố Hạ</div>
                          <span className="text-[10px] text-gray-400 font-normal">Vườn Cam Sành Hàm Yên & Tuyên Quang</span>
                        </td>
                        <td className="p-3 font-semibold text-emerald-800">Tháng 9 – Tháng 12</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Đang rộ mùa
                          </span>
                        </td>
                        <td className="p-3 font-black text-rose-600">-18%</td>
                        <td className="p-3 font-bold text-gray-800">10.000đ / KG</td>
                      </tr>
                      <tr className="hover:bg-emerald-50/40 transition-colors">
                        <td className="p-3 font-bold text-gray-900">
                          <div>🍓 Dâu Tây New Zealand Mộc Châu</div>
                          <span className="text-[10px] text-gray-400 font-normal">HTX Nông Sản Sạch Mộc Châu (Sơn La)</span>
                        </td>
                        <td className="p-3 font-semibold text-emerald-800">Tháng 10 – Tháng 4</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Vào vụ đông
                          </span>
                        </td>
                        <td className="p-3 font-black text-rose-600">-14%</td>
                        <td className="p-3 font-bold text-gray-800">25.000đ / Hộp 500g</td>
                      </tr>
                      <tr className="hover:bg-emerald-50/40 transition-colors">
                        <td className="p-3 font-bold text-gray-900">
                          <div>🥑 Bơ Sáp 034 Đặc Sản</div>
                          <span className="text-[10px] text-gray-400 font-normal">Nông Trại Bơ Sáp Tây Nguyên</span>
                        </td>
                        <td className="p-3 font-semibold text-gray-600">Tháng 4 – Tháng 10</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">
                            Cuối mùa thu hoạch
                          </span>
                        </td>
                        <td className="p-3 font-black text-rose-600">-17%</td>
                        <td className="p-3 font-bold text-gray-800">15.000đ / KG</td>
                      </tr>
                      <tr className="hover:bg-emerald-50/40 transition-colors">
                        <td className="p-3 font-bold text-gray-900">
                          <div>🥭 Xoài Cát Hòa Lộc</div>
                          <span className="text-[10px] text-gray-400 font-normal">Vùng trồng Tiền Giang & Đồng Tháp</span>
                        </td>
                        <td className="p-3 font-semibold text-blue-700">Tháng 11 – Tháng 3</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Sắp vào mùa
                          </span>
                        </td>
                        <td className="p-3 font-bold text-blue-700">Pre-order</td>
                        <td className="p-3 font-bold text-blue-800">Tích x2 Điểm thưởng</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Phân biệt rõ: Trợ giá mùa vụ vs Mã Voucher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-950 text-xs">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Tầng 1: Giảm Giá Mùa Vụ (Trực Tiếp)</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Giảm sẵn trên từng sản phẩm, thể hiện bằng giá cũ gạch ngang (VD: ~75.000đ~ còn 65.000đ). Áp dụng tự động trong suốt thời gian vụ mùa, <strong>không cần nhập mã</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-blue-950 text-xs">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Tầng 2: Áp Thêm Voucher (Cộng Dồn)</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Nhập mã tại bước Mua Ngay để trừ thêm tiền (ví dụ <code className="font-mono font-bold text-emerald-800">AGRI30</code> trừ thêm 30k, <code className="font-mono font-bold text-emerald-800">FREESHIP</code> trừ 25k xe lạnh). Hưởng trọn cả 2 ưu đãi!
                  </p>
                </div>
              </div>

              {/* Thông báo sale & lịch vụ mùa xem ở đâu */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="font-bold text-gray-900 flex items-center gap-2 text-xs">
                  <Bell size={14} className="text-emerald-700" />
                  <span>Kênh Nhận Thông Báo & Tra Cứu Lịch Mùa Vụ Nông Sản:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-600">
                  <div className="p-2 bg-white rounded-xl border border-gray-200">
                    <strong className="text-gray-900 block">• Biểu tượng Chuông 🔔 Navbar:</strong>
                    Nhận thông báo tự động khi nông trại vừa thu hoạch xong lô mới hoặc phát hành quyết định trợ giá vụ mới.
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-gray-200">
                    <strong className="text-gray-900 block">• Trang Sự Kiện & Mùa Vụ (/events):</strong>
                    Theo dõi từng sự kiện trợ giá, đếm ngược thời gian áp dụng và danh sách quả đang rộ vụ.
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-gray-200">
                    <strong className="text-gray-900 block">• Kho Voucher & Hội Viên (/vouchers):</strong>
                    Lưu các mã freeship và mã giảm giá 30k - 50k dành riêng cho hội viên AgriClub.
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-gray-200">
                    <strong className="text-gray-900 block">• Trợ Lý AI Nông Nghiệp:</strong>
                    Hỏi AI: &ldquo;Tháng này nông sản nào đang được trợ giá chính vụ?&rdquo; để nhận gợi ý tức thì.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-3xl flex flex-wrap items-center justify-between gap-2 shrink-0">
              <Link
                href="/events"
                onClick={() => setShowPromoInfoModal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles size={14} />
                <span>Xem Tất Cả Sự Kiện & Mùa Vụ Khuyến Mãi (/events) →</span>
              </Link>
              <div className="flex items-center gap-2">
                <Link
                  href="/vouchers"
                  onClick={() => setShowPromoInfoModal(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all"
                >
                  Kho Voucher
                </Link>
                <button
                  type="button"
                  onClick={() => setShowPromoInfoModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mua Ngay Siêu Tốc Modal */}
      {/* Lightbox Modal Xem Ảnh Đánh Giá Phóng To */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] bg-stone-900 rounded-2xl overflow-hidden border border-white/20 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-stone-950/90 border-b border-white/10 flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-2">
                <Camera size={15} className="text-emerald-400" />
                <span className="font-bold">{lightboxImage.title || "Ảnh đồng kiểm thực tế"}</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            <div className="relative flex-1 min-h-[350px] sm:min-h-[500px] bg-black/70 flex items-center justify-center p-2">
              <Image
                src={lightboxImage.url}
                alt={lightboxImage.title || "Ảnh đồng kiểm"}
                fill
                className="object-contain"
              />
            </div>
            <div className="p-3 bg-stone-950/95 text-stone-300 text-xs flex items-center justify-between border-t border-white/10">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <BadgeCheck size={14} />
                Ảnh chụp thực tế của khách hàng mở thùng cùng tài xế xe lạnh
              </span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="px-3 py-1 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <QuickBuyModal
        isOpen={!!quickBuyProduct}
        onClose={() => setQuickBuyProduct(null)}
        product={quickBuyProduct}
        initialQty={quickBuyQty}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-gray-400">Đang tải sản phẩm...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
