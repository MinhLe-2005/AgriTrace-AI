"use client";

import {
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Gift,
  Info,
  Leaf,
  Percent,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Ticket,
  Truck,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { catalogService, type ApiProduct } from "@/services/catalog.service";
import {
  useCampaignStore,
  type CampaignItem,
} from "@/stores/campaign-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

export default function EventsPage() {
  const router = useRouter();
  const { campaigns, getCampaignStatus } = useCampaignStore();

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "active" | "upcoming" | "expired"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CampaignItem | null>(null);
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await catalogService.getProducts();
        setProducts(data || []);
      } catch (err) {
        console.error("Failed to load products for events page:", err);
      }
    }
    loadCatalog();
  }, []);

  const handleCopyVoucher = (code: string) => {
    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedVoucher(code);
    toast.success(`Đã sao chép mã voucher [${code}]!`);
    setTimeout(() => setCopiedVoucher(null), 2500);
  };

  // Filtered campaigns
  const filteredEvents = useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch =
        !searchQuery.trim() ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.voucherCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.targetProductNames?.some((n) =>
          n.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const status = getCampaignStatus(c);
      const matchStatus =
        selectedFilter === "all" || status === selectedFilter;

      return matchSearch && matchStatus;
    });
  }, [campaigns, searchQuery, selectedFilter, getCampaignStatus]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    let active = 0;
    let upcoming = 0;
    let expired = 0;
    campaigns.forEach((c) => {
      const st = getCampaignStatus(c);
      if (st === "active") active++;
      else if (st === "upcoming") upcoming++;
      else expired++;
    });
    return { all: campaigns.length, active, upcoming, expired };
  }, [campaigns, getCampaignStatus]);

  // Calculate days remaining or days ago
  const getTimeRemainingText = (endDateStr: string, status: string) => {
    const today = new Date();
    const end = new Date(endDateStr + "T23:59:59");
    const diffMs = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (status === "expired") {
      return `Đã kết thúc vào ngày ${new Date(endDateStr).toLocaleDateString("vi-VN")}`;
    }
    if (status === "upcoming") {
      return `Sắp bắt đầu`;
    }
    if (diffDays <= 0) {
      return `Hôm nay là ngày cuối cùng!`;
    }
    return `Còn lại ${diffDays} ngày áp dụng`;
  };

  // Find products matching an event
  const getEventProducts = (event: CampaignItem) => {
    return products.filter((p) => {
      // 1. Target by product names
      if (event.targetProductNames && event.targetProductNames.length > 0) {
        const pName = p.name.toLowerCase();
        const matchedName = event.targetProductNames.some((n) =>
          pName.includes(n.toLowerCase())
        );
        if (matchedName) return true;
      }
      // 2. Target by category
      if (event.targetCategoryCodes && event.targetCategoryCodes.length > 0) {
        const cleanCat = (p.categoryCode || "").toLowerCase().replace(/[_-]/g, "");
        const matchedCat = event.targetCategoryCodes.some((code) => {
          const c = code.toLowerCase().replace(/[_-]/g, "");
          return cleanCat.includes(c) || c.includes(cleanCat);
        });
        if (matchedCat) return true;
      }
      // 3. Target all
      if (event.targetType === "all") return true;

      return false;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/60 pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-emerald-700 transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={13} />
          <span className="text-gray-900 font-semibold">
            Sự Kiện & Mùa Vụ Khuyến Mãi
          </span>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-900 via-teal-900 to-green-950 p-6 sm:p-10 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <Sparkles size={14} />
              <span>Chính Sách Trợ Giá Trực Tiếp Từ Vườn 2026</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Sự Kiện & Lễ Hội Mùa Vụ Nông Sản Sạch
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Tổng hợp tất cả chiến dịch trợ giá nông sản thu hoạch rộ, xả kho bảo quản lạnh FEFO và tuần lễ đặc sản vùng miền. Giá giảm trực tiếp tại vườn theo từng giai đoạn mùa vụ và tự động ngưng áp dụng khi hết thời hạn.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>100% Chuẩn VietGAP / GlobalGAP</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                <Truck size={14} className="text-emerald-400" />
                <span>Xe Lạnh 2°C - 5°C Trong 24H</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                <Clock size={14} className="text-emerald-400" />
                <span>Tự Động Kết Thúc Đúng Hạn</span>
              </div>
            </div>
          </div>

          {/* Decorative Floating Emojis */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 sm:opacity-30 text-8xl sm:text-9xl pointer-events-none select-none">
            🍓🥗🍊
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { key: "all", label: `Tất cả (${tabCounts.all})` },
                { key: "active", label: `🔥 Đang diễn ra (${tabCounts.active})` },
                { key: "upcoming", label: `⏳ Sắp diễn ra (${tabCounts.upcoming})` },
                { key: "expired", label: `⏹️ Đã kết thúc (${tabCounts.expired})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedFilter(tab.key)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                  selectedFilter === tab.key
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm theo sự kiện, tên quả, voucher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-emerald-700 bg-gray-50/50"
            />
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center space-y-3">
            <div className="text-4xl">🌾</div>
            <h3 className="text-base font-bold text-gray-900">
              Không tìm thấy sự kiện mùa vụ nào
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Không có sự kiện nào phù hợp với bộ lọc hiện tại. Bạn có thể chọn tab &quot;Tất cả&quot; hoặc quay lại trang sản phẩm.
            </p>
            <button
              onClick={() => {
                setSelectedFilter("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors"
            >
              Xem tất cả sự kiện
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEvents.map((event) => {
              const status = getCampaignStatus(event);
              const isActive = status === "active";
              const isExpired = status === "expired";
              const matchedProducts = getEventProducts(event);

              return (
                <div
                  key={event.id}
                  className={cn(
                    "group bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-lg",
                    isActive
                      ? "border-emerald-300 hover:border-emerald-600"
                      : isExpired
                      ? "border-gray-200 opacity-80 bg-gray-50/50"
                      : "border-blue-200 hover:border-blue-500"
                  )}
                >
                  <div className="p-6 space-y-4">
                    {/* Top Row: Type & Status & Discount Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-3xl p-2 rounded-2xl bg-gray-100 border border-gray-200 shrink-0">
                          {event.bannerIcon || "🌾"}
                        </span>
                        <div>
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                              event.typeColor
                            )}
                          >
                            {event.typeLabel}
                          </span>
                          <div className="mt-1 flex items-center gap-1.5">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                                Đang diễn ra
                              </span>
                            ) : isExpired ? (
                              <span className="text-[11px] font-bold text-gray-400">
                                ⏹️ Đã hết hạn (Về giá gốc)
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-blue-600">
                                ⏳ Sắp diễn ra
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Big Discount Tag */}
                      <div className="text-right shrink-0">
                        <span
                          className={cn(
                            "inline-block px-3 py-1 rounded-xl font-black text-sm shadow-xs",
                            isActive
                              ? "bg-rose-500 text-white"
                              : isExpired
                              ? "bg-gray-200 text-gray-500 line-through"
                              : "bg-blue-600 text-white"
                          )}
                        >
                          -{event.discountPercent}%
                        </span>
                        {event.discountAmount ? (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Tiết kiệm ~{event.discountAmount.toLocaleString("vi-VN")}đ
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h2 className="text-lg font-black text-gray-900 group-hover:text-emerald-800 transition-colors">
                        {event.title}
                      </h2>
                      <p className="text-xs text-gray-600 mt-1.5 leading-relaxed line-clamp-3">
                        {event.description}
                      </p>
                    </div>

                    {/* Timeline & Countdown */}
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/70 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar size={13} className="text-gray-400" />
                        <span>
                          {new Date(event.startDate).toLocaleDateString("vi-VN")} →{" "}
                          {new Date(event.endDate).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "font-bold text-[11px]",
                          isActive
                            ? "text-rose-600 flex items-center gap-1"
                            : isExpired
                            ? "text-gray-400"
                            : "text-blue-600"
                        )}
                      >
                        {isActive && <Flame size={12} />}
                        <span>{getTimeRemainingText(event.endDate, status)}</span>
                      </div>
                    </div>

                    {/* Direct Discount Banner */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          ⚡
                        </span>
                        <div>
                          <span className="text-emerald-950 font-bold block">
                            Trợ giá trực tiếp vụ mùa:
                          </span>
                          <span className="text-gray-500 text-[10px]">
                            Đã trừ thẳng vào giá bán, không cần nhập mã
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-800 font-extrabold text-[10px] shrink-0">
                        Mua là giảm ngay
                      </span>
                    </div>

                    {/* Applied Products Preview */}
                    {matchedProducts.length > 0 && (
                      <div className="space-y-2 pt-1 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                          <span>Nông sản áp dụng giá sự kiện ({matchedProducts.length}):</span>
                          <span className="text-emerald-700 font-semibold normal-case">
                            {isActive ? "Đang giảm giá" : "Đã trở về giá niêm yết"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {matchedProducts.slice(0, 2).map((p) => {
                            const origPrice = p.oldPrice > 0 ? p.oldPrice : p.price;
                            const salePrice = isActive
                              ? Math.round((origPrice * (100 - event.discountPercent)) / 100)
                              : p.price;

                            return (
                              <div
                                key={p.id}
                                className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 border border-gray-200/80"
                              >
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                                  <Image
                                    src={p.image || "/images/products/xa-lach.jpg"}
                                    alt={p.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-gray-900 truncate">
                                    {p.name}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <span className="font-extrabold text-emerald-800">
                                      {salePrice.toLocaleString("vi-VN")} đ
                                    </span>
                                    {isActive && origPrice > salePrice && (
                                      <span className="text-gray-400 line-through text-[10px]">
                                        {origPrice.toLocaleString("vi-VN")} đ
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-gray-200 transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Eye size={13} />
                      <span>Xem Bài Chi Tiết Sự Kiện</span>
                    </button>

                    <Link
                      href={
                        event.targetProductNames && event.targetProductNames.length > 0
                          ? `/products?search=${encodeURIComponent(event.targetProductNames[0])}`
                          : event.targetCategoryCodes && event.targetCategoryCodes.length > 0
                          ? `/products?cat=${event.targetCategoryCodes[0]}`
                          : "/products"
                      }
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs",
                        isActive
                          ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      )}
                    >
                      <ShoppingBag size={13} />
                      <span>{isActive ? "Mua nông sản sự kiện" : "Xem sản phẩm"}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: BÀI CHI TIẾT SỰ KIỆN (BLOG-STYLE EVENT ARTICLE)    */}
      {/* ========================================================= */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 my-8 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-4xl p-2 rounded-2xl bg-gray-100 border border-gray-200 shrink-0">
                  {selectedEvent.bannerIcon || "🌾"}
                </span>
                <div>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                      selectedEvent.typeColor
                    )}
                  >
                    {selectedEvent.typeLabel}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 mt-1">
                    {selectedEvent.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center text-sm shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs">
              <div>
                <span className="text-gray-500 block">Thời gian diễn ra:</span>
                <strong className="text-gray-900">
                  {new Date(selectedEvent.startDate).toLocaleDateString("vi-VN")} -{" "}
                  {new Date(selectedEvent.endDate).toLocaleDateString("vi-VN")}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block">Mức trợ giá tại vườn:</span>
                <strong className="text-rose-600 text-sm">
                  -{selectedEvent.discountPercent}% trực tiếp
                </strong>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-gray-500 block">Trạng thái:</span>
                <strong
                  className={cn(
                    getCampaignStatus(selectedEvent) === "active"
                      ? "text-emerald-700"
                      : "text-gray-500"
                  )}
                >
                  {getCampaignStatus(selectedEvent) === "active"
                    ? "🔥 Đang áp dụng"
                    : "⏹️ Đã kết thúc"}
                </strong>
              </div>
            </div>

            {/* Event Description & Blog Article Content */}
            <div className="space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 font-medium italic text-gray-800">
                &quot;{selectedEvent.description}&quot;
              </div>

              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1.5">
                  Bối cảnh mùa vụ & Thỏa thuận trợ giá:
                </h4>
                <p>
                  {selectedEvent.fullContent ||
                    "Chiến dịch do Ban điều phối mùa vụ AgriTrace AI phối hợp trực tiếp cùng các Hợp tác xã thành viên tổ chức. Nhằm bảo đảm bao tiêu toàn bộ sản lượng thu hoạch rộ lúc nông sản đạt độ ngọt đậm đà nhất và hàm lượng vitamin cao nhất, sản phẩm được phân phối thẳng từ kho lạnh trung tâm đến người tiêu dùng với biểu giá tối ưu nhất."}
                </p>
              </div>

              {/* Quality Commitments */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-2">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-700" />
                  <span>Cam kết chất lượng xuyên suốt sự kiện:</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-600 list-disc list-inside">
                  <li>Không xả hàng cận date: 100% nông sản thu hoạch mới lúc 05:30 sáng.</li>
                  <li>Dư lượng thuốc BVTV = 0 (Kiểm định độc lập Quatest 1).</li>
                  <li>Bảo quản chuỗi lạnh khép kín 2°C - 5°C, giao tận tay trong 24H.</li>
                  <li>Tự động đóng chiến dịch khi mùa thu hoạch kết thúc theo đúng ngày công bố.</li>
                </ul>
              </div>

              {/* Direct discount explanation */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 text-lg font-bold shadow-xs">
                  ⚡
                </div>
                <div>
                  <span className="font-bold text-emerald-950 block text-xs sm:text-sm">
                    Cơ chế: Trợ giá xuất xưởng trực tiếp (Không cần nhập mã giảm giá)
                  </span>
                  <p className="text-[11px] sm:text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    Mức giảm giá đã được liên minh HTX trừ trực tiếp vào giá bán niêm yết trên website. Quý khách chỉ cần chọn mua sản phẩm là tự động được hưởng mức giá ưu đãi này mà không cần nhập bất kỳ mã ưu đãi nào.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
              >
                Đóng
              </button>
              <Link
                href={
                  selectedEvent.targetProductNames &&
                  selectedEvent.targetProductNames.length > 0
                    ? `/products?search=${encodeURIComponent(
                        selectedEvent.targetProductNames[0]
                      )}`
                    : "/products"
                }
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
              >
                <ShoppingBag size={14} />
                <span>Mua Nông Sản Sự Kiện Này</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
