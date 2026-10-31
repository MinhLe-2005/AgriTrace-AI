"use client";

import {
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
import { useCartStore } from "@/stores/cart-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catParam = searchParams.get("cat") || "all";

  const { addItem } = useCartStore();

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [filterCategory, setFilterCategory] = useState<string>(catParam);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Modal Product Detail
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [quickBuyProduct, setQuickBuyProduct] = useState<ApiProduct | null>(null);
  const [quickBuyQty, setQuickBuyQty] = useState(1);
  const [modalQty, setModalQty] = useState(1);

  useEffect(() => {
    if (catParam) setFilterCategory(catParam);
  }, [catParam]);

  // Load live data from Supabase
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [prods, cats] = await Promise.all([
          catalogService.getProducts(),
          catalogService.getCategories(),
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch (err) {
        console.error("Error loading products from Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute product count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach((p) => {
      if (p.categoryCode) {
        counts[p.categoryCode] = (counts[p.categoryCode] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Unique Origins from products
  const availableOrigins = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.origin) {
        const province = p.origin.split(",").pop()?.trim() || p.origin;
        set.add(province);
      }
    });
    return Array.from(set);
  }, [products]);

  // Filter & Sort
  const filteredAndSorted = useMemo(() => {
    const result = products.filter((p) => {
      // 1. Category
      const pCat = (p.categoryCode || "").toLowerCase().replace(/_/g, "-");
      const fCat = (filterCategory || "").toLowerCase().replace(/_/g, "-");
      const matchCat =
        filterCategory === "all" ||
        p.categoryCode === filterCategory ||
        pCat === fCat ||
        (filterCategory === "seasonal" && (pCat.includes("trai") || pCat.includes("cay"))) ||
        (filterCategory === "daily" && (pCat.includes("rau") || pCat.includes("cu")));
      if (!matchCat) return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          p.name.toLowerCase().includes(q) ||
          (p.farm && p.farm.toLowerCase().includes(q)) ||
          (p.origin && p.origin.toLowerCase().includes(q)) ||
          (p.batchCode && p.batchCode.toLowerCase().includes(q));
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
    products,
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
            const isSelected = filterCategory === c.code;
            const count = categoryCounts[c.code] || 0;
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

      {/* ── Header Banner ── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-900 p-6 sm:p-10 text-white shadow-md">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300">
            <Sparkles size={13} />
            Dữ liệu trực tiếp từ Supabase Database
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Nông Sản Sạch Có Mã QR Nguồn Gốc
          </h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
            100% rau củ quả được thu hoạch mỗi sáng, bảo quản bằng chuỗi lạnh khép kín và gắn mã định danh điện tử
            truy xuất tận nông trại.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
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
                  Danh mục: {categories.find((c) => c.code === filterCategory)?.name || filterCategory}
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

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="group bg-white rounded-3xl border border-gray-200/90 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      {/* Image container */}
                      <div className="relative aspect-4/3 overflow-hidden bg-gray-50">
                        <Image
                          src={p.image || "/images/products/xa-lach.jpg"}
                          alt={p.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Badges on image */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-700 text-white shadow-md flex items-center gap-1">
                              <ShieldCheck size={12} />
                              {p.cert}
                            </span>
                            {p.batchCode && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/60 text-white backdrop-blur-xs">
                                #{p.batchCode}
                              </span>
                            )}
                          </div>

                          {discountPercent > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-600 text-white shadow-md">
                              -{discountPercent}%
                            </span>
                          )}
                        </div>

                        {/* Harvest tag */}
                        <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{p.harvest}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin size={12} className="text-emerald-600 shrink-0" />
                          <span className="truncate">{p.farm || p.origin}</span>
                        </div>

                        <h3 className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {p.name}
                        </h3>

                        {/* Rating & Reviews */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="flex items-center text-amber-400">
                            <Star size={12} className="fill-amber-400" />
                            <span className="ml-1 font-bold text-gray-800">
                              {p.rating}
                            </span>
                          </div>
                          <span className="text-gray-400">
                            ({p.reviews} đánh giá)
                          </span>
                        </div>

                        {/* Price */}
                        <div className="pt-1 flex items-baseline gap-2">
                          <span className="text-lg font-black text-emerald-800">
                            {p.price.toLocaleString("vi-VN")} đ
                          </span>
                          <span className="text-xs text-gray-400 font-normal">
                            / {p.unit}
                          </span>
                          {p.oldPrice > p.price && (
                            <span className="text-xs text-gray-400 line-through">
                              {p.oldPrice.toLocaleString("vi-VN")} đ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(p);
                        }}
                        className="w-full py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye size={13} />
                        <span>Chi tiết</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(p, 1);
                        }}
                        className="w-full py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs flex items-center justify-center gap-1"
                      >
                        <ShoppingBag size={13} />
                        <span>Mua ngay</span>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
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

      {/* ── Product Detail Modal ── */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-gray-200/80 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-700 text-white">
                  {selectedProduct.cert}
                </span>
                <span className="text-xs font-bold text-gray-500">
                  Mã lô: {selectedProduct.batchCode}
                </span>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-5 max-h-[75vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
                  <Image
                    src={selectedProduct.image || "/images/products/xa-lach.jpg"}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-medium">
                    {selectedProduct.harvest}
                  </div>
                </div>

                <div className="space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin size={13} className="text-emerald-600" />
                      <span>{selectedProduct.origin || selectedProduct.farm}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 leading-snug">
                      {selectedProduct.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="flex items-center text-amber-400">
                        <Star size={13} className="fill-amber-400" />
                        <span className="ml-1 font-bold text-gray-800">
                          {selectedProduct.rating}
                        </span>
                      </div>
                      <span className="text-gray-400">
                        · {selectedProduct.reviews} đánh giá
                      </span>
                    </div>

                    <div className="pt-2">
                      <span className="text-2xl font-black text-emerald-800">
                        {selectedProduct.price.toLocaleString("vi-VN")} đ
                      </span>
                      <span className="text-xs text-gray-500 font-normal">
                        {" "}
                        / {selectedProduct.unit}
                      </span>
                      {selectedProduct.oldPrice > selectedProduct.price && (
                        <div className="text-xs text-gray-400 line-through">
                          {selectedProduct.oldPrice.toLocaleString("vi-VN")} đ
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-semibold text-gray-700">Chọn số lượng:</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                          className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 text-sm font-bold"
                        >
                          -
                        </button>
                        <span className="px-3 py-1.5 text-xs font-bold text-gray-800 min-w-8 text-center">
                          {modalQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalQty(modalQty + 1)}
                          className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">
                        = {(selectedProduct.price * modalQty).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-2xl bg-gray-50 text-xs text-gray-600 leading-relaxed">
                {selectedProduct.description}
              </div>

              {/* Specifications */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  Thông số an toàn & Bảo quản
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl border border-gray-200 flex items-center gap-2">
                    <Leaf size={14} className="text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400">Phương pháp canh tác</div>
                      <div className="font-semibold text-gray-800">
                        {selectedProduct.cultivation || "Thủy canh VietGAP"}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-gray-200 flex items-center gap-2">
                    <Thermometer size={14} className="text-blue-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400">Nhiệt độ bảo quản lạnh</div>
                      <div className="font-semibold text-gray-800">
                        {selectedProduct.temperature || "2°C - 5°C"}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-gray-200 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400">Dư lượng thuốc BVTV</div>
                      <div className="font-semibold text-gray-800">
                        {selectedProduct.pesticide || "Không tồn dư hóa chất (BVTV = 0)"}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-gray-200 flex items-center gap-2">
                    <Package size={14} className="text-amber-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400">Đóng gói tiêu chuẩn</div>
                      <div className="font-semibold text-gray-800">
                        {selectedProduct.packaging || "Màng thở vi lỗ sinh học"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3">
              <Link
                href={`/traceability?batch=${selectedProduct.batchCode}`}
                className="px-4 py-2.5 rounded-xl border border-gray-300 hover:border-emerald-500 bg-white text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <QrCode size={14} className="text-emerald-700" />
                <span>Xem nhật ký QR</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleAddToCart(selectedProduct, modalQty);
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors"
                >
                  + Thêm vào giỏ
                </button>

                <button
                  type="button"
                  onClick={() => handleBuyNow(selectedProduct, modalQty)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-colors flex items-center gap-1"
                >
                  <span>Mua ngay</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mua Ngay Siêu Tốc Modal */}
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
