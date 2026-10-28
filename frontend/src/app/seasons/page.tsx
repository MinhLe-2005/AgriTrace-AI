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
    aiNote: "Dự báo đạt đỉnh tiêu thụ vào dịp Giáng sinh & Tết. Đề xuất tăng tỷ lệ đặt trước.",
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
    aiNote: "Năng suất cao, khuyến nghị áp dụng voucher mùa vụ giảm 10% để kích cầu nhanh.",
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
    aiNote: "Trái cây cuối mùa, ưu tiên xuất kho nhanh theo nguyên tắc FEFO để tránh hao hụt.",
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
    aiNote: "Hệ thống tự động tạm ẩn sản phẩm hoặc hiển thị chế độ đăng ký thông báo vụ mới.",
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
    aiNote: "Khách hàng có thể đặt trước (Pre-order) nhận ưu đãi tích x2 điểm thành viên.",
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
    aiNote: "AI cảnh báo nguy cơ thiếu hàng vào tháng Chạp. Đề xuất ký hợp đồng bao tiêu sớm.",
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
              <span>Lịch Mùa Vụ Nông Sản 2026</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Theo dõi lịch thu hoạch chính vụ của các loại nông sản sạch trên toàn quốc để chọn mua đúng thời điểm tươi ngon nhất.
            </p>
          </div>
          <Link
            href="/ai-hub#forecasting"
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Sparkles size={14} /> AI Dự Báo Nhu Cầu Mùa Vụ
          </Link>
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
                  href="/products?category=seasonal"
                  className="text-xs font-semibold text-[#1a7a3a] hover:underline"
                >
                  Xem nông sản loại này →
                </Link>
                <Link
                  href="/vouchers"
                  className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-1 rounded-md hover:bg-amber-200 transition-colors"
                >
                  Áp Voucher Mùa Vụ
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
