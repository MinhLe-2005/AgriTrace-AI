"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Leaf,
  MapPin,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const seasonData = [
  {
    name: "Dâu Tây Đà Lạt & Mộc Châu",
    startMonth: "Tháng 10",
    endMonth: "Tháng 4",
    currentStatus: "Đang vào mùa (Chính vụ)",
    statusColor: "#10b981",
    region: "Lâm Đồng, Sơn La",
    yieldEst: "85 tấn",
    demandTrend: "Tăng 35% trong tháng 11",
    directDiscount: "-14% (Trợ giá trực tiếp tại vườn)",
    discountPeriod: "Tháng 10 – Tháng 4/2026",
    aiNote: "Dự báo đạt đỉnh tiêu thụ vào dịp Giáng sinh & Tết. Đang áp dụng biểu giá chính vụ tiết kiệm 25.000đ/Hộp.",
  },
  {
    name: "Cam Sành Bố Hạ & Hàm Yên",
    startMonth: "Tháng 9",
    endMonth: "Tháng 12",
    currentStatus: "Đang rộ mùa",
    statusColor: "#10b981",
    region: "Bắc Giang, Tuyên Quang",
    yieldEst: "120 tấn",
    demandTrend: "Ổn định cao",
    directDiscount: "-18% (Trợ giá trực tiếp tại vườn)",
    discountPeriod: "Tháng 9 – Tháng 12/2026",
    aiNote: "Năng suất cao, trợ giá 10.000đ/KG xuất kho trực tiếp. Áp thêm voucher AGRI30 để giảm thêm 30k.",
  },
  {
    name: "Bơ Sáp 034 Tây Nguyên",
    startMonth: "Tháng 4",
    endMonth: "Tháng 10",
    currentStatus: "Cuối mùa",
    statusColor: "#ea580c",
    region: "Đắk Lắk, Lâm Đồng",
    yieldEst: "40 tấn (còn 15%)",
    demandTrend: "Giảm dần",
    directDiscount: "-17% (Xả kho tươi cuối vụ)",
    discountPeriod: "Tháng 4 – Tháng 10/2026",
    aiNote: "Trái cây cuối mùa, trợ giá 15.000đ/KG và ưu tiên xuất kho nhanh theo nguyên tắc FEFO.",
  },
  {
    name: "Vải Thiều Lục Ngạn",
    startMonth: "Tháng 5",
    endMonth: "Tháng 7",
    currentStatus: "Hết mùa (Chờ vụ 2027)",
    statusColor: "#6b7280",
    region: "Bắc Giang, Hải Dương",
    yieldEst: "200 tấn",
    demandTrend: "Không có hàng",
    directDiscount: "Hết vụ mùa",
    discountPeriod: "Đón vụ mới Tháng 5/2027",
    aiNote: "Hệ thống tự động tạm ẩn sản phẩm hoặc hiển thị chế độ đăng ký nhận thông báo vụ mới.",
  },
  {
    name: "Xoài Cát Hòa Lộc",
    startMonth: "Tháng 11",
    endMonth: "Tháng 3",
    currentStatus: "Sắp vào mùa (Sau 2 tuần)",
    statusColor: "#3b82f6",
    region: "Tiền Giang, Đồng Tháp",
    yieldEst: "95 tấn",
    demandTrend: "Chuẩn bị mở bán sớm",
    directDiscount: "Pre-order (Tích x2 Điểm)",
    discountPeriod: "Mở bán: 15/11/2026",
    aiNote: "Khách hàng có thể đặt trước (Pre-order) nhận ưu đãi nhân đôi điểm hội viên AgriClub.",
  },
  {
    name: "Bưởi Da Xanh Bến Tre",
    startMonth: "Quanh năm",
    endMonth: "Cao điểm Tết",
    currentStatus: "Quanh năm (Vào vụ Tết)",
    statusColor: "#10b981",
    region: "Bến Tre, Vĩnh Long",
    yieldEst: "150 tấn",
    demandTrend: "Dự kiến tăng 70% dịp Tết",
    directDiscount: "Bình ổn giá Tết Nguyên Đán",
    discountPeriod: "Tháng 12 – Tháng 1",
    aiNote: "Bao tiêu vườn bưởi VietGAP Bến Tre, cam kết bình ổn giá dịp Tết và ưu tiên xe lạnh 24H.",
  },
];

export default function SeasonsPage() {
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filtered = seasonData.filter((item) => {
    if (selectedFilter === "active") return item.currentStatus.includes("Đang");
    if (selectedFilter === "upcoming") return item.currentStatus.includes("Sắp");
    if (selectedFilter === "ending") return item.currentStatus.includes("Cuối");
    return true;
  });

  return (
    <div className="bg-[#f8faf8] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Module Header */}
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Calendar className="text-emerald-700" size={24} />
              <span>Lịch Mùa Vụ & Biểu Giá Trợ Giá Nông Sản 2026</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Theo dõi lịch thu hoạch chính vụ của các loại nông sản sạch trên toàn quốc để chọn mua đúng thời điểm tươi ngon nhất và được hưởng mức trợ giá tự động tại vườn.
            </p>
          </div>
          <Link
            href="/ai-hub#forecasting"
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Sparkles size={14} /> AI Dự Báo Nhu Cầu Mùa Vụ
          </Link>
        </div>

        {/* ── Official Season Pricing Regulation Announcement Banner ── */}
        <div className="mb-8 rounded-3xl overflow-hidden border border-amber-300/90 bg-gradient-to-br from-amber-500/10 via-yellow-50/70 to-emerald-50/70 p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
                  📢 THÔNG BÁO MÙA VỤ
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  Chương Trình Trợ Giá Thu Đông
                </span>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                  Hiệu lực: 01/10/2026 – 31/12/2026
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                Cơ Chế Trợ Giá Trực Tiếp Nông Sản Chính Vụ Thu Đông (Không Cần Nhập Mã)
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
                Căn cứ năng suất thu hoạch đạt đỉnh tại các nông trại đối tác (Đà Lạt, Mộc Châu, Hàm Yên), hệ thống AgriTrace áp dụng <strong>khung trợ giá trực tiếp 13% – 18%</strong> trên giá niêm yết xuất kho trong 3 tháng cao điểm (Tháng 10 – Tháng 12). Khách hàng không cần nhập mã, giá bán hiển thị trên cửa hàng đã là giá tốt nhất!
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="#pricing-policy"
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-amber-50 text-amber-950 border border-amber-300 text-xs font-bold transition-all shadow-2xs"
              >
                Xem Toàn Văn Cơ Chế →
              </a>
              <Link
                href="/products"
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm"
              >
                Đến Cửa Hàng Mua Ngay
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedFilter === "all" ? "bg-[#1a7a3a] text-white shadow-sm" : "bg-white text-gray-700 border border-gray-200"
            }`}
          >
            Tất cả mùa vụ ({seasonData.length})
          </button>
          <button
            onClick={() => setSelectedFilter("active")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedFilter === "active" ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-gray-700 border border-gray-200"
            }`}
          >
            Đang vào mùa / Chính vụ
          </button>
          <button
            onClick={() => setSelectedFilter("upcoming")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedFilter === "upcoming" ? "bg-blue-600 text-white shadow-sm" : "bg-white text-gray-700 border border-gray-200"
            }`}
          >
            Sắp vào mùa (Pre-order)
          </button>
          <button
            onClick={() => setSelectedFilter("ending")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedFilter === "ending" ? "bg-amber-600 text-white shadow-sm" : "bg-white text-gray-700 border border-gray-200"
            }`}
          >
            Cuối mùa (Ưu đãi xả kho)
          </button>
        </div>

        {/* Season Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    style={{ backgroundColor: item.statusColor }}
                    className="text-[11px] font-bold text-white px-2.5 py-1 rounded-lg"
                  >
                    {item.currentStatus}
                  </span>
                  <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                    <Clock size={13} /> {item.startMonth} – {item.endMonth}
                  </span>
                </div>

                <h3 className="font-bold text-base text-gray-900 mb-2">{item.name}</h3>

                <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Vùng trồng chính:</span>
                    <span className="font-semibold text-gray-800">{item.region}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Sản lượng dự kiến:</span>
                    <span className="font-semibold text-gray-800">{item.yieldEst}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Xu hướng tiêu thụ:</span>
                    <span className="font-semibold text-emerald-700">{item.demandTrend}</span>
                  </div>

                  {item.directDiscount && (
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/80 text-[11px] font-bold text-rose-900 flex items-center justify-between">
                      <span>🌾 {item.directDiscount}</span>
                      <span className="text-[10px] text-gray-500 font-normal">{item.discountPeriod}</span>
                    </div>
                  )}
                </div>

                {/* AI Demand Forecasting Note */}
                <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-[#1a7a3a]">
                    <Sparkles size={13} /> Phân tích AI Mùa Vụ:
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-800">{item.aiNote}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <Link
                  href="/products"
                  className="text-xs font-semibold text-[#1a7a3a] hover:underline"
                >
                  Xem nông sản vụ này →
                </Link>
                <Link
                  href="/vouchers"
                  className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-1 rounded-md hover:bg-amber-200 transition-colors"
                >
                  Kho Voucher (Giảm 30%)
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* ── Section: Toàn Văn Quy Định Cơ Chế Định Giá Trợ Giá Nông Sản Theo Vụ Mùa ── */}
        <section id="pricing-policy" className="mt-12 scroll-mt-24 bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Chính Sách Bán Hàng Minh Bạch
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
                Quy Chế & Cơ Chế Giảm Giá Nông Sản Theo Mùa Vụ
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Minh bạch chuỗi giá trị và cơ chế định giá xuất kho của hệ thống AgriTrace AI.
              </p>
            </div>
            <span className="text-xs text-emerald-800 font-semibold">Vụ Thu Đông 2026</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-700">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="font-black text-amber-950 text-sm flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs">1</span>
                <span>Vì sao giảm giá trực tiếp mà không cần áp mã?</span>
              </div>
              <p className="text-gray-600 leading-relaxed text-[11px]">
                Khi bước vào chính vụ (Peak Season), năng suất thu hoạch tại các nông trại đạt đỉnh (tăng 40% – 60%). Để tránh lưu kho lạnh lâu ngày gây giảm chất lượng và duy trì chuẩn tươi mới 24H, liên minh HTX chủ động hạ giá niêm yết bán lẻ từ 13% – 18%. Mọi người mua đều được hưởng trực tiếp trên giá bán.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
              <div className="font-black text-blue-950 text-sm flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                <span>Khác gì so với Mã Voucher Khuyến Mãi?</span>
              </div>
              <p className="text-gray-600 leading-relaxed text-[11px]">
                Giảm giá vụ mùa là <strong>giá xuất xưởng công khai</strong> theo mùa, còn Voucher là <strong>mã ưu đãi thêm</strong> tại bước thanh toán (như AGRI30 giảm 30k, FREESHIP miễn phí vận chuyển). Hai tầng ưu đãi này <strong>CỘNG DỒN</strong> với nhau giúp tiết kiệm tối đa!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs">3</span>
                <span>Thông báo mùa vụ sale ở đâu để theo dõi?</span>
              </div>
              <p className="text-gray-600 leading-relaxed text-[11px]">
                Khách hàng xem thông báo tại: (1) Chuông 🔔 thông báo tài khoản cá nhân; (2) Banner chiến dịch đầu trang Cửa hàng; (3) Trang Lịch Mùa Vụ này; (4) Trợ lý AI nông nghiệp tư vấn 24/7.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
