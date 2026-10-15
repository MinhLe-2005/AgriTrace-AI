"use client";

import {
  Award,
  CheckCircle2,
  ChevronRight,
  Crown,
  Gift,
  HelpCircle,
  History,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/stores/toast-store";

export default function LoyaltyPage() {
  const [points, setPoints] = useState(480);
  const [spent12m, setSpent12m] = useState(2450000); // 2.45M -> Silver, needs 550k to Gold

  const tiers = [
    { name: "Đồng", threshold: 0, mult: "x1.0", color: "#94a3b8", perk: "Voucher chào mừng thành viên mới" },
    { name: "Bạc", threshold: 1000000, mult: "x1.2", color: "#64748b", perk: "1 voucher Freeship mỗi tháng" },
    { name: "Vàng", threshold: 3000000, mult: "x1.5", color: "#eab308", perk: "2 voucher Freeship/tháng + Giảm 5%/quý" },
    { name: "Kim Cương", threshold: 7000000, mult: "x2.0", color: "#3b82f6", perk: "3 voucher Freeship/tháng + Giảm 10%/quý & Ưu tiên chat" },
  ];

  const redeemOptions = [
    { id: 1, title: "Voucher Giảm 10.000 đ", cost: 100, minOrder: "100.000 đ", minTier: "Đồng" },
    { id: 2, title: "Freeship Tối Đa 25.000 đ", cost: 200, minOrder: "100.000 đ", minTier: "Đồng" },
    { id: 3, title: "Voucher Giảm 30.000 đ", cost: 280, minOrder: "250.000 đ", minTier: "Bạc" },
    { id: 4, title: "Voucher Giảm 8% (Max 60k)", cost: 500, minOrder: "300.000 đ", minTier: "Vàng" },
  ];

  function handleRedeem(item: (typeof redeemOptions)[0]) {
    if (points < item.cost) {
      toast.error(`Bạn không đủ điểm! Cần ${item.cost} điểm (Hiện có: ${points} điểm).`);
      return;
    }
    setPoints((p) => p - item.cost);
    toast.success(`Đổi thành công "${item.title}"! Đã thêm vào Ví Voucher của bạn.`);
  }

  return (
    <div className="bg-[#f8faf8] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Module Header */}
        <div className="bg-emerald-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm border border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center text-emerald-200">
              <Award size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">Chương Trình Khách Hàng Thân Thiết & Tích Điểm</h1>
                <span className="text-[11px] bg-emerald-500/30 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Module 4 (Mục 5.3 & 5.4)
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Phụ trách: Member 4 (Xét Hạng Thành Viên, Hệ Số Điểm, Lịch Sử Điểm & Đổi Voucher)
              </p>
            </div>
          </div>
          <Link
            href="/vouchers"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 flex items-center gap-1.5 transition-colors"
          >
            <Gift size={14} /> Mở Ví Voucher
          </Link>
        </div>

        {/* User Status Card */}
        <div className="bg-gradient-to-r from-[#144825] to-[#1e6b37] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-bold text-emerald-200 backdrop-blur-xs">
              <Crown size={14} className="text-amber-300" /> Hạng Hiện Tại: HẠNG BẠC (Silver)
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Nguyễn Văn An</h2>
            <p className="text-xs text-emerald-200">
              Hệ số tích điểm: <strong>x1.2 điểm</strong> (Cứ 10.000 đ chi tiêu = 1.2 điểm thưởng)
            </p>

            {/* Progress Bar to Gold */}
            <div className="pt-2 max-w-md">
              <div className="flex justify-between text-xs text-emerald-200 mb-1">
                <span>Chi tiêu 12 tháng: <strong>{spent12m.toLocaleString("vi-VN")} đ</strong></span>
                <span>Mục tiêu Hạng Vàng: 3.000.000 đ</span>
              </div>
              <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500"
                  style={{ width: `${(spent12m / 3000000) * 100}%` }}
                />
              </div>
              <div className="text-[11px] text-emerald-300/90 mt-1">
                Chỉ còn thiếu <strong>{(3000000 - spent12m).toLocaleString("vi-VN")} đ</strong> để thăng hạng Vàng!
              </div>
            </div>
          </div>

          {/* Points Box */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center flex-shrink-0 min-w-[200px]">
            <div className="text-xs text-emerald-200 font-semibold mb-1">Số dư điểm thưởng</div>
            <div className="text-4xl font-black text-amber-300">{points}</div>
            <div className="text-[11px] text-emerald-100 mt-1">Điểm có hạn dùng 12 tháng</div>
            <button
              onClick={() => { setPoints((p) => p + 50); toast.success("Đã cộng thử nghiệm +50 điểm đơn hàng!"); }}
              className="mt-3 w-full py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl transition-colors"
            >
              + Giả Lập Tích Điểm
            </button>
          </div>
        </div>

        {/* 4 Membership Tiers Display */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Crown size={20} className="text-[#1a7a3a]" /> 4 Cấp Độ Hạng Thành Viên & Đặc Quyền
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((t) => (
              <div
                key={t.name}
                className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs space-y-2 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-gray-900">Hạng {t.name}</span>
                  <span
                    style={{ backgroundColor: t.color }}
                    className="text-white text-xs font-bold px-2 py-0.5 rounded-full"
                  >
                    {t.mult}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Từ {t.threshold.toLocaleString("vi-VN")} đ / 12 tháng
                </div>
                <div className="pt-2 border-t border-gray-100 text-xs text-gray-700 leading-relaxed font-medium">
                  🎁 {t.perk}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Redeem Points Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Gift size={20} className="text-[#1a7a3a]" /> Quầy Đổi Điểm Lấy Voucher
              </h3>
              <p className="text-xs text-gray-500">Sử dụng điểm tích lũy để đổi các mã giảm giá cho đơn tiếp theo</p>
            </div>
            <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Điểm khả dụng: <strong>{points} điểm</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {redeemOptions.map((opt) => (
              <div
                key={opt.id}
                className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="text-xs font-bold text-purple-700 mb-1">Cần {opt.cost} điểm</div>
                  <div className="font-bold text-sm text-gray-900">{opt.title}</div>
                  <div className="text-[11px] text-gray-500 mt-1">Đơn tối thiểu: {opt.minOrder}</div>
                  <div className="text-[11px] text-gray-500">Yêu cầu: Hạng {opt.minTier} trở lên</div>
                </div>

                <button
                  onClick={() => handleRedeem(opt)}
                  disabled={points < opt.cost}
                  className="w-full py-2 bg-[#1a7a3a] hover:bg-[#156e34] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
                >
                  Đổi Ngay ({opt.cost}đ)
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
