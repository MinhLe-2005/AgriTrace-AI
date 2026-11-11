"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Flame,
  HelpCircle,
  Info,
  Leaf,
  Layers,
  Megaphone,
  Plus,
  Printer,
  QrCode,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sprout,
  Tag,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useCampaignStore, type CampaignItem } from "@/stores/campaign-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

interface AnnouncementItem {
  id: string;
  code: string;
  type: "decision" | "harvest" | "inspection" | "policy";
  typeLabel: string;
  typeColor: string;
  title: string;
  date: string;
  issuer: string;
  summary: string;
  priority?: "urgent" | "normal";
  link?: string;
  content?: string[];
}

const ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: "ann-88",
    code: "QĐ số 88/2026/QĐ-AGRI",
    type: "decision",
    typeLabel: "Quyết Định Trợ Giá Mùa Vụ",
    typeColor: "bg-rose-100 text-rose-900 border-rose-300",
    priority: "urgent",
    title: "Quyết Định Ban Hành Biểu Giá Trợ Giá Nông Sản Theo Mùa Vụ Thu Đông 2026 (Giảm 13% – 18% Tại Vườn)",
    date: "01/10/2026 (Hiệu lực: 01/10 – 31/12/2026)",
    issuer: "Liên Minh HTX Nông Sản Sạch Việt Nam & Tổng Giám Đốc AgriTrace AI",
    summary:
      "Trợ giá trực tiếp 13% – 18% cho rau củ quả chính vụ thu hoạch rộ tại Đà Lạt, Mộc Châu và Hàm Yên. Không cần nhập mã, cộng dồn với mã giảm giá và freeship.",
    link: "#decision-88",
  },
  {
    id: "ann-dau-tay",
    code: "TB số 14/TB-AGRI",
    type: "harvest",
    typeLabel: "Thông Báo Thu Hoạch Vụ Mới",
    typeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    title: "Chính Thức Mở Bán Mùa Dâu Tây New Zealand Mộc Châu & Giao Xe Lạnh 24H",
    date: "12/10/2026",
    issuer: "Hợp Tác Xã Nông Sản Sạch Mộc Châu Eco",
    summary:
      "Vườn dâu tây công nghệ cao Mộc Châu bước vào đợt thu hoạch quả đỏ mọng nước đầu mùa. Áp dụng giá trợ giá vụ mới 180.000đ/Hộp 500g (Giá niêm yết 210.000đ).",
    link: "/products?search=Dâu+Tây",
  },
  {
    id: "ann-quatest",
    code: "TB số 11/TB-AGRI",
    type: "inspection",
    typeLabel: "Kết Quả Thử Nghiệm Quatest 1",
    typeColor: "bg-blue-100 text-blue-900 border-blue-300",
    title: "Chứng Thư Kiểm Nghiệm Định Kỳ: 100% Lô Hàng Rau Thủy Canh Đạt Chuẩn Dư Lượng BVTV = 0",
    date: "14/10/2026",
    issuer: "Trung Tâm Kỹ Thuật Tiêu Chuẩn Đo Lường Chất Lượng 1 (QUATEST 1)",
    summary:
      "Kết quả xét nghiệm mẫu sắc ký khối phổ GC-MS/MS đối với lô Xà lách thủy canh và Cải Kale đạt chuẩn an toàn tuyệt đối, hàm lượng Nitrat chỉ 68 mg/kg (ngưỡng cho phép < 500 mg/kg).",
    link: "/traceability?batch=XL-2026-08&tab=cert",
  },
  {
    id: "ann-coldchain",
    code: "QĐ số 284/2026/QĐ-NNPTNT",
    type: "policy",
    typeLabel: "Chính Sách Chuỗi Lạnh 24H",
    typeColor: "bg-teal-100 text-teal-900 border-teal-300",
    title: "Ban Hành Quy Chuẩn Kiểm Soát Nhiệt Độ Thùng Xe Lạnh 2°C – 5°C Bằng Cảm Biến IoT Toàn Trình",
    date: "25/09/2026",
    issuer: "Bộ Nông Nghiệp & PTNT phối hợp cùng AgriTrace Logistics",
    summary:
      "100% chuyến xe vận chuyển nông sản từ Đà Lạt và Tây Bắc về các đại lý phân phối bắt buộc phải lắp cảm biến IoT đồng bộ dữ liệu nhiệt độ và GPS theo thời gian thực.",
    link: "/about#coldchain",
  },
];

export default function AnnouncementsPage() {
  const { campaigns, getCampaignStatus } = useCampaignStore();
  const { user } = useAuthStore();
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CampaignItem | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);

  const handleCopyVoucher = (code: string) => {
    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedVoucher(code);
    toast.success(`Đã sao chép mã voucher [${code}]!`);
    setTimeout(() => setCopiedVoucher(null), 2500);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("Đã sao chép liên kết Trung Tâm Thông Báo vào bộ nhớ tạm!");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const filteredAnnouncements = ANNOUNCEMENTS.filter((item) => {
    const matchType = filterType === "all" || item.type === filterType;
    const matchSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="bg-[#f8faf8] min-h-screen py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-emerald-700 transition-colors flex items-center gap-1">
            <ArrowLeft size={13} />
            <span>Trang chủ</span>
          </Link>
          <span>/</span>
          <Link href="/terms" className="hover:text-emerald-700 transition-colors">
            Hỗ Trợ & Chính Sách
          </Link>
          <span>/</span>
          <span className="font-semibold text-emerald-900">Trung Tâm Thông Báo & Quyết Định</span>
        </div>

        {/* ── Hero Banner ── */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/20 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold shadow-inner">
              <Megaphone size={14} className="text-emerald-300" />
              <span>Cổng Thông Tin Công Báo & Quyết Định Chính Thức</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Trung Tâm Thông Báo & Quyết Định Nghiệp Vụ
            </h1>

            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
              Nơi công bố chính thức các quyết định trợ giá nông sản theo mùa vụ, biểu giá trực tiếp tại vườn, lịch thu hoạch 12 tháng, kết quả kiểm nghiệm Quatest 1 và chính sách chuỗi cung ứng minh bạch của AgriTrace AI.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs">
              <a
                href="#decision-88"
                className="px-4 py-2 rounded-xl bg-white text-emerald-950 font-bold hover:bg-emerald-50 transition-all flex items-center gap-1.5 shadow-md"
              >
                <Flame size={14} className="text-rose-600 fill-rose-600" />
                <span>Xem Quyết Định Trợ Giá Vụ Mùa (QĐ #88)</span>
              </a>

              <Link
                href="/seasons"
                className="px-4 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 font-bold border border-emerald-400/30 transition-all flex items-center gap-1.5"
              >
                <Calendar size={14} />
                <span>Lịch Thu Hoạch 12 Tháng</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Tabs ── */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
            {[
              { key: "all", label: "Tất cả thông báo" },
              { key: "decision", label: "Quyết định mùa vụ & Trợ giá" },
              { key: "harvest", label: "Mùa vụ thu hoạch" },
              { key: "inspection", label: "Kiểm nghiệm Quatest 1" },
              { key: "policy", label: "Chính sách chuỗi lạnh" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterType(tab.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  filterType === tab.key
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo số hiệu, vụ mùa..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Banner Link to Dynamic Events Page */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 rounded-2xl border-2 border-emerald-400 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md text-2xl">
              🍓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-gray-900 text-sm sm:text-base">
                  Trang Sự Kiện & Mùa Vụ Khuyến Mãi (Events & Campaigns)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  MỚI
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Các sự kiện trợ giá nông sản theo mùa được quản lý độc lập với thời hạn, đồng hồ đếm ngược và tự động tắt giảm giá khi hết mùa thu hoạch.
              </p>
            </div>
          </div>
          <Link
            href="/events"
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Sparkles size={14} />
            <span>Xem Các Sự Kiện Đang Diễn Ra →</span>
          </Link>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* SPOTLIGHT DOCUMENT: TOÀN VĂN QUYẾT ĐỊNH SỐ 88/2026/QĐ-AGRI       */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <section
          id="decision-88"
          className="scroll-mt-24 bg-white rounded-3xl border-2 border-emerald-500/40 p-6 sm:p-9 shadow-md space-y-6 relative overflow-hidden"
        >
          {/* Official Stamp Watermark on Right */}
          <div className="absolute top-6 right-6 hidden md:flex flex-col items-center p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-md uppercase">
              DẤU ĐỎ
            </div>
            <span className="text-[10px] font-bold text-emerald-900 mt-1 uppercase">Đã Phê Duyệt</span>
            <span className="text-[9px] font-mono text-gray-400">01/10/2026</span>
          </div>

          {/* Document Header */}
          <div className="space-y-1 border-b border-gray-100 pb-4 pr-0 md:pr-24">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              LIÊN MINH HỢP TÁC XÃ NÔNG SẢN VIỆT NAM • HỆ THỐNG AGRITRACE AI
            </div>
            <div className="text-xs font-mono font-bold text-emerald-800">
              Số: 88/2026/QĐ-AGRI • Hà Nội & TP. Hồ Chí Minh
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight pt-1 leading-snug">
              Quyết Định Về Việc Ban Hành Biểu Giá Trợ Giá Nông Sản Theo Mùa Vụ Thu Đông 2026
            </h2>
            <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2 pt-0.5">
              <span>📅 Ngày ban hành: <strong>01/10/2026</strong></span>
              <span>•</span>
              <span className="text-rose-600 font-bold">⏱️ Thời gian áp dụng: 01/10/2026 – 31/12/2026</span>
              <span>•</span>
              <span>Phạm vi: <strong>Toàn bộ hệ thống bán lẻ & đại lý liên kết</strong></span>
            </div>
          </div>

          {/* Điều 1: Căn Cứ & Nguyên Nhân Trợ Giá Trực Tiếp */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs sm:text-sm text-gray-800">
            <div className="font-bold text-amber-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                1
              </span>
              <span className="text-sm">Điều 1: Căn Cứ Và Nguyên Nhân Trợ Giá Trực Tiếp Tại Vườn</span>
            </div>
            <p className="text-gray-700 leading-relaxed text-xs">
              Vào thời điểm vụ Thu Đông, các vùng chuyên canh nông sản đối tác của AgriTrace AI tại <strong>Đà Lạt, Mộc Châu, Hàm Yên và Bảo Lộc</strong> bước vào giai đoạn thu hoạch rộ nhất trong năm. Sản lượng hái mới tại các nông trại công nghệ cao đạt đỉnh (tăng 40% – 60% so với vụ trước).
            </p>
            <p className="text-gray-700 leading-relaxed text-xs">
              Để bảo đảm nông sản tươi sống được luân chuyển ngay trong vòng <strong>24H</strong> (giữ chuẩn tươi giòn và dinh dưỡng, bảo quản liên tục bằng chuỗi xe lạnh 2°C – 5°C), Liên minh HTX thống nhất áp dụng chính sách <strong>trợ giá trực tiếp 13% – 18%</strong> trên giá niêm yết bán lẻ. Khoản trợ giá này được trừ thẳng vào đơn giá hiển thị trên website, người tiêu dùng không cần săn mã hay nhập voucher thủ công.
            </p>
          </div>

          {/* Điều 2: Các Sự Kiện & Mùa Vụ Khuyến Mãi (DỮ LIỆU ĐỘNG TỪ HỆ THỐNG ADMIN) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">
                    Điều 2: Danh Sách Các Sự Kiện Giảm Giá & Trợ Giá Mùa Vụ (Đồng Bộ Động Từ Admin)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Mỗi sự kiện dưới đây được thiết lập độc lập. Khi Admin thêm mới hoặc sửa sự kiện, sản phẩm sẽ tự động giảm giá trên cửa hàng và tự động về giá gốc khi hết thời hạn.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {user?.roles?.includes("ADMIN") && (
                  <Link
                    href="/dashboard/admin"
                    className="px-3 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 text-white text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs"
                    title="Vào Cổng Admin để thêm, sửa, xóa sự kiện"
                  >
                    <Plus size={13} />
                    <span>Admin: Quản Lý Sự Kiện</span>
                  </Link>
                )}
                <div className="flex items-center bg-gray-100 p-0.5 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setViewMode("cards")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                      viewMode === "cards" ? "bg-white text-emerald-900 shadow-2xs" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    Dạng Thẻ
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                      viewMode === "table" ? "bg-white text-emerald-900 shadow-2xs" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    Dạng Bảng
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Content: CARDS VIEW (Mặc định) */}
            {viewMode === "cards" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {campaigns.map((camp) => {
                  const status = getCampaignStatus(camp);
                  const isActive = status === "active";
                  const isExpired = status === "expired";

                  return (
                    <div
                      key={camp.id}
                      className={cn(
                        "p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 bg-white",
                        isActive
                          ? "border-emerald-300 shadow-xs hover:border-emerald-500 hover:shadow-md"
                          : isExpired
                          ? "border-gray-200 bg-gray-50/60 opacity-80"
                          : "border-blue-200"
                      )}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl p-1 rounded-xl bg-gray-100 shrink-0">
                              {camp.bannerIcon || "🌾"}
                            </span>
                            <div>
                              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", camp.typeColor)}>
                                {camp.typeLabel}
                              </span>
                              <h4 className="font-bold text-gray-900 text-xs sm:text-sm mt-0.5 line-clamp-1">
                                {camp.title}
                              </h4>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-xl font-black text-xs shrink-0 shadow-2xs",
                              isActive
                                ? "bg-rose-500 text-white"
                                : isExpired
                                ? "bg-gray-200 text-gray-500 line-through"
                                : "bg-blue-600 text-white"
                            )}
                          >
                            -{camp.discountPercent}%
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                          {camp.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-50 rounded-xl text-[11px]">
                          <span className="text-gray-500 flex items-center gap-1 font-mono text-[10px]">
                            <Calendar size={12} className="text-gray-400" />
                            <span>{camp.startDate} → {camp.endDate}</span>
                          </span>
                          <span
                            className={cn(
                              "font-bold text-[10px] px-2 py-0.5 rounded-full",
                              isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : isExpired
                                ? "bg-gray-200 text-gray-600"
                                : "bg-blue-100 text-blue-800"
                            )}
                          >
                            {isActive ? "🔥 Đang áp dụng" : isExpired ? "⏹️ Đã hết hạn (Về giá gốc)" : "⏳ Sắp tới"}
                          </span>
                        </div>

                        {camp.targetProductNames && camp.targetProductNames.length > 0 && (
                          <div className="text-[11px] text-gray-700">
                            <span className="font-semibold text-gray-500">Nông sản: </span>
                            <span className="font-bold text-emerald-900">{camp.targetProductNames.join(", ")}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(camp)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>Xem Bài Chi Tiết</span>
                        </button>

                        <Link
                          href={
                            camp.targetProductNames && camp.targetProductNames.length > 0
                              ? `/products?search=${encodeURIComponent(camp.targetProductNames[0])}`
                              : "/products"
                          }
                          className={cn(
                            "px-3 py-1.5 rounded-xl font-bold text-[11px] transition-colors flex items-center gap-1",
                            isActive
                              ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          )}
                        >
                          <ShoppingBag size={12} />
                          <span>{isActive ? "Mua ngay" : "Xem sản phẩm"}</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Dynamic Content: TABLE VIEW */
              <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-2xs bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-900 text-white font-bold uppercase text-[11px]">
                    <tr>
                      <th className="p-3">Thời Gian Áp Dụng</th>
                      <th className="p-3">Sự Kiện & Nông Sản</th>
                      <th className="p-3 text-center">Mức Giảm</th>
                      <th className="p-3">Voucher Kèm</th>
                      <th className="p-3 text-center">Trạng Thái Thực Hiện</th>
                      <th className="p-3 text-right">Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {campaigns.map((camp) => {
                      const status = getCampaignStatus(camp);
                      const isActive = status === "active";
                      const isExpired = status === "expired";

                      return (
                        <tr key={camp.id} className={cn("hover:bg-emerald-50/40 transition-colors", isActive ? "bg-emerald-50/15" : "")}>
                          <td className="p-3 font-mono font-bold text-gray-800 whitespace-nowrap">
                            {camp.startDate} → {camp.endDate}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              <span>{camp.bannerIcon || "🌾"}</span>
                              <span>{camp.title}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 block mt-0.5">
                              Áp dụng: {camp.targetProductNames?.join(", ") || camp.targetCategoryCodes?.join(", ") || "Toàn bộ"}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-black border",
                                isActive
                                  ? "bg-rose-100 text-rose-800 border-rose-200"
                                  : "bg-gray-100 text-gray-500 border-gray-200 line-through"
                              )}
                            >
                              -{camp.discountPercent}%
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px]">
                            {camp.voucherCode ? (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                                {camp.voucherCode}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            {isActive ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                🔥 Đang Áp Dụng Giảm Giá
                              </span>
                            ) : isExpired ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                ⏹️ Đã Hết Hạn (Về Giá Gốc)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                ⏳ Sắp Diễn Ra
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedEvent(camp)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] transition-colors cursor-pointer"
                            >
                              Xem bài viết
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Điều 3: Cơ Chế Cộng Dồn 2 Tầng Ưu Đãi */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2 text-xs sm:text-sm text-gray-800">
            <div className="font-bold text-blue-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                3
              </span>
              <span className="text-sm">Điều 3: Cơ Chế Cộng Dồn 2 Tầng Ưu Đãi (Dual-Tier Savings)</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-blue-200 text-center font-mono font-bold text-xs sm:text-sm text-blue-950">
              Tổng Tiết Kiệm = Trợ Giá Vụ Mùa (Giảm trực tiếp) + Voucher Áp Dụng (Trừ thêm tại thanh toán)
            </div>
            <p className="text-gray-700 leading-relaxed text-xs">
              Người mua vừa được hưởng giá xuất xưởng đã giảm 13% – 18%, vừa được nhập thêm các mã Voucher độc quyền của AgriClub (như mã <strong className="font-mono text-emerald-800">AGRI30</strong> giảm thêm 30.000đ hoặc mã <strong className="font-mono text-emerald-800">FREESHIP</strong> giảm 25.000đ phí vận chuyển xe lạnh). Hai tầng ưu đãi này <strong>CỘNG DỒN ĐỒNG THỜI</strong> trong cùng một đơn hàng!
            </p>
          </div>

          {/* Điều 4: Các Kênh Thông Báo Sale Chính Thức */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5 text-xs text-gray-800">
            <div className="font-bold text-emerald-950 flex items-center gap-2 text-xs sm:text-sm">
              <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                4
              </span>
              <span>Điều 4: Các Kênh Tra Cứu & Nhận Thông Báo Sale Mùa Vụ</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-600">
              <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                <strong className="text-gray-900 block">• 🔔 Chuông Thông Báo Navbar:</strong>
                Tự động gửi thông báo trực tiếp khi nông trại phát hành quyết định trợ giá mới hoặc thu hoạch xong lô rau củ sáng sớm.
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                <strong className="text-gray-900 block">• 🌾 Banner Trang Sản Phẩm (/products):</strong>
                Bấm vào nút &ldquo;Cơ Chế &amp; Lịch Trợ Giá Mùa Vụ&rdquo; hoặc nhãn giảm giá trên từng thẻ sản phẩm để xem quy chế.
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                <strong className="text-gray-900 block">• 📅 Trang Lịch Mùa Vụ (/seasons):</strong>
                Theo dõi lịch biểu thu hoạch 12 tháng trên toàn quốc và tiến độ sinh trưởng từng vùng.
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                <strong className="text-gray-900 block">• 🤖 Trợ Lý AI Nông Nghiệp:</strong>
                Bấm nút &ldquo;Hỏi Trợ Lý AI&rdquo; và hỏi: &ldquo;Tháng này có món nào đang trợ giá?&rdquo; để nhận câu trả lời tức thì.
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer size={13} />
                <span>In Văn Bản Quyết Định</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Share2 size={13} />
                <span>{copiedLink ? "Đã sao chép liên kết" : "Chia sẻ quyết định"}</span>
              </button>
            </div>

            <Link
              href="/products"
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2"
            >
              <ShoppingBag size={15} />
              <span>Đến Cửa Hàng Mua Nông Sản Trợ Giá Ngay →</span>
            </Link>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* LIST OF OTHER RECENT ANNOUNCEMENTS                               */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileCheck size={18} className="text-emerald-700" />
              <span>Các Thông Báo & Công Báo Khác Trong Hệ Thống</span>
            </h3>
            <span className="text-xs text-gray-400 font-medium">
              Cập nhật lần cuối: 11/11/2026
            </span>
          </div>

          <div className="space-y-3">
            {filteredAnnouncements
              .filter((item) => item.id !== "ann-88")
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs hover:shadow-md transition-shadow space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-full border", item.typeColor)}>
                        {item.typeLabel}
                      </span>
                      <span className="font-mono text-xs text-gray-500 font-bold">{item.code}</span>
                    </div>
                    <span className="text-xs text-gray-400">{item.date}</span>
                  </div>

                  <h4 className="font-bold text-gray-900 text-sm sm:text-base hover:text-emerald-800 transition-colors">
                    {item.title}
                  </h4>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>Ban hành: <strong>{item.issuer}</strong></span>
                    {item.link && (
                      <Link
                        href={item.link}
                        className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <span>Xem chi tiết</span>
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: BÀI VIẾT CHI TIẾT SỰ KIỆN GIẢM GIÁ (BLOG-STYLE)    */}
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
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center text-sm shrink-0 cursor-pointer"
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

            {/* Event Description & Blog Content */}
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

              {/* Voucher Action if any */}
              {selectedEvent.voucherCode && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-amber-900 block text-xs">
                      Tặng thêm Voucher độc quyền sự kiện này:
                    </span>
                    <span className="font-mono text-base font-black text-amber-950">
                      {selectedEvent.voucherCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyVoucher(selectedEvent.voucherCode!)}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>Lấy Mã Giảm Giá</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
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
