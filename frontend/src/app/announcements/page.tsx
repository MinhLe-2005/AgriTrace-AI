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
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  Flame,
  HelpCircle,
  Info,
  Leaf,
  Layers,
  Megaphone,
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
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

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

          {/* Điều 2: Biểu Giá Trợ Giá Mùa Vụ Chi Tiết (BẢNG TRỌNG TÂM CỦA NGƯỜI DÙNG) */}
          <div className="space-y-3">
            <div className="font-bold text-gray-900 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                  2
                </span>
                <span>Điều 2: Biểu Giá Trợ Giá & Lịch Thu Hoạch Chi Tiết Từng Loại Nông Sản</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-800 font-bold">Kèm phụ lục bảng biểu số 01</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-900 text-white font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Thời Gian Áp Dụng</th>
                    <th className="p-3">Nông Sản Chính Vụ</th>
                    <th className="p-3 text-center">Mức Trợ Giá Trực Tiếp</th>
                    <th className="p-3">Tiết Kiệm So Với Giá Gốc</th>
                    <th className="p-3 text-center">Trạng Thái Thực Hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  <tr className="hover:bg-emerald-50/40 bg-emerald-50/20">
                    <td className="p-3 font-bold text-gray-900 whitespace-nowrap">Tháng 10 – Tháng 12</td>
                    <td className="p-3 font-semibold text-emerald-950">
                      🥗 Cải Xoăn Kale & Xà Lách Lô Lô Đà Lạt
                      <span className="block text-[10px] text-gray-500 font-normal">Canh tác thủy canh NFT chuẩn VietGAP / Organic</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                        -13% đến -17%
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                      Tiết kiệm 10.000đ – 15.000đ/KG
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        🔥 Đang Thu Hoạch Rộ
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-emerald-50/40">
                    <td className="p-3 font-bold text-gray-900 whitespace-nowrap">Tháng 9 – Tháng 12</td>
                    <td className="p-3 font-semibold text-emerald-950">
                      🍊 Cam Sành Bố Hạ & Hàm Yên
                      <span className="block text-[10px] text-gray-500 font-normal">Vỏ mỏng, tép vàng giòn, mọng nước giàu Vitamin C</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                        -18%
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                      Tiết kiệm 10.000đ/KG
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        🔥 Đang Áp Dụng
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-emerald-50/40 bg-emerald-50/20">
                    <td className="p-3 font-bold text-gray-900 whitespace-nowrap">Tháng 10 – Tháng 4</td>
                    <td className="p-3 font-semibold text-emerald-950">
                      🍓 Dâu Tây New Zealand Mộc Châu
                      <span className="block text-[10px] text-gray-500 font-normal">Trồng nhà kính công nghệ cao, đạt chuẩn GlobalGAP</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                        -14%
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                      Tiết kiệm 25.000đ/Hộp 500g
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        🔥 Vụ Mới Xuất Kho
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-emerald-50/40">
                    <td className="p-3 font-bold text-gray-900 whitespace-nowrap">Tháng 4 – Tháng 10</td>
                    <td className="p-3 font-semibold text-emerald-950">
                      🥑 Bơ Sáp 034 Tây Nguyên
                      <span className="block text-[10px] text-gray-500 font-normal">Cơm vàng dẻo quánh, hạt lép, xả kho tươi cuối vụ</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200">
                        -17%
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                      Tiết kiệm 15.000đ/KG
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        ❄️ Cuối Vụ (Ưu Tiên FEFO)
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-emerald-50/40 bg-emerald-50/20">
                    <td className="p-3 font-bold text-gray-900 whitespace-nowrap">Tháng 11 – Tháng 3</td>
                    <td className="p-3 font-semibold text-emerald-950">
                      🥭 Xoài Cát Hòa Lộc
                      <span className="block text-[10px] text-gray-500 font-normal">Vựa trái cây Tiền Giang & Đồng Tháp</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
                        Pre-order
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-purple-800 whitespace-nowrap">
                      Nhân đôi (x2) điểm hội viên
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        ⏳ Mở Bán 15/11
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-emerald-50/40">
                    <td className="p-3 font-bold text-gray-900 whitespace-nowrap">Tháng 12 – Tháng 1</td>
                    <td className="p-3 font-semibold text-emerald-950">
                      🍈 Bưởi Da Xanh Bến Tre
                      <span className="block text-[10px] text-gray-500 font-normal">Vườn Bến Tre, cam kết không tăng giá dịp Tết</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
                        Bình ổn giá Tết
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-800 whitespace-nowrap">
                      Giữ nguyên giá niêm yết dịp Tết
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        🌾 Đã Ký Bao Tiêu
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
    </div>
  );
}
