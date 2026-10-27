"use client";

import {
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  Crown,
  Gift,
  HelpCircle,
  History,
  Info,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  TrendingUp,
  Truck,
  Wifi,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

type TierInfo = {
  name: string;
  threshold: number;
  mult: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  perks: string[];
  isCurrent?: boolean;
};

const tiers: TierInfo[] = [
  {
    name: "Đồng",
    threshold: 0,
    mult: "x1.0",
    badgeBg: "bg-slate-100",
    badgeBorder: "border-slate-200",
    textColor: "text-slate-700",
    perks: [
      "Tích lũy 1 điểm cho mỗi 10.000đ chi tiêu",
      "Voucher chào mừng giảm 20.000đ đơn đầu tiên",
      "Thông báo khi nông sản yêu thích vào chính vụ",
    ],
  },
  {
    name: "Bạc",
    threshold: 1000000,
    mult: "x1.2",
    badgeBg: "bg-blue-50",
    badgeBorder: "border-blue-200",
    textColor: "text-blue-700",
    perks: [
      "Hệ số tích điểm x1.2 (10.000đ = 1.2 điểm)",
      "1 Voucher Miễn Phí Vận Chuyển xe lạnh / tháng",
      "Ưu tiên hỗ trợ tư vấn nguồn gốc lô hàng",
    ],
  },
  {
    name: "Vàng",
    threshold: 3000000,
    mult: "x1.5",
    badgeBg: "bg-amber-50",
    badgeBorder: "border-amber-300",
    textColor: "text-amber-800",
    isCurrent: true,
    perks: [
      "Hệ số tích điểm x1.5 (10.000đ = 1.5 điểm)",
      "2 Voucher Freeship xe lạnh + Giảm 5% đơn hàng quý",
      "Ưu tiên xuất kho xe lạnh nhanh trong vòng 2 giờ",
      "Tặng quà nông sản đặc sản sinh nhật",
    ],
  },
  {
    name: "Kim Cương",
    threshold: 7000000,
    mult: "x2.0",
    badgeBg: "bg-indigo-50",
    badgeBorder: "border-indigo-300",
    textColor: "text-indigo-800",
    perks: [
      "Hệ số tích điểm tối đa x2.0 (10.000đ = 2 điểm)",
      "3 Voucher Freeship xe lạnh + Giảm 10% trọn đời",
      "Trợ lý chăm sóc riêng 24/7 kiểm định đơn hàng",
      "Mời tham gia sự kiện thăm quan Nông Trại Xanh",
    ],
  },
];

const redeemOptions = [
  {
    id: 1,
    title: "Voucher Giảm 10.000 đ",
    desc: "Áp dụng cho tất cả đơn hàng rau củ quả tươi",
    cost: 100,
    minOrder: "100.000 đ",
    minTier: "Đồng",
    tag: "Phổ biến",
  },
  {
    id: 2,
    title: "Freeship Xe Lạnh 25.000 đ",
    desc: "Miễn phí vận chuyển bảo quản nhiệt độ chuẩn 4-8°C",
    cost: 200,
    minOrder: "120.000 đ",
    minTier: "Đồng",
    tag: "Freeship",
  },
  {
    id: 3,
    title: "Voucher Giảm 30.000 đ",
    desc: "Áp dụng cho giỏ hàng trái cây mùa vụ Mộc Châu & Đà Lạt",
    cost: 280,
    minOrder: "250.000 đ",
    minTier: "Bạc",
    tag: "Tiết kiệm",
  },
  {
    id: 4,
    title: "Voucher Giảm 8% (Tối đa 60k)",
    desc: "Đặc quyền đổi điểm dành cho hội viên Vàng trở lên",
    cost: 500,
    minOrder: "350.000 đ",
    minTier: "Vàng",
    tag: "Đặc quyền VIP",
  },
];

export default function LoyaltyPage() {
  const { user } = useAuthStore();
  const [points, setPoints] = useState(248);
  const [spent12m, setSpent12m] = useState(2748000); // Needs 252k to Gold
  const targetGold = 3000000;
  const progressPercent = Math.min(100, Math.round((spent12m / targetGold) * 100));

  function handleRedeem(item: (typeof redeemOptions)[0]) {
    if (points < item.cost) {
      toast.error(`Bạn chưa đủ điểm! Cần ${item.cost} điểm (Hiện có: ${points} điểm).`);
      return;
    }
    setPoints((p) => p - item.cost);
    toast.success(`Đổi thành công "${item.title}"! Đã tự động lưu vào Ví Voucher của bạn.`);
  }

  return (
    <div className="bg-[#f8faf8] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-emerald-700 transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-800">Hội viên AgriClub</span>
        </div>

        {/* ── Page Header (Clean Commercial Title) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
              <span>Hội Viên Thân Thiết & Tích Điểm</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                AgriClub
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Tích lũy điểm thưởng trên mỗi đơn hàng nông sản, tận hưởng chiết khấu độc quyền và ưu tiên vận chuyển xe lạnh.
            </p>
          </div>

          <Link
            href="/dashboard/customer?tab=vouchers"
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-emerald-700 hover:border-emerald-300 text-xs font-semibold transition-colors flex items-center gap-2 self-start sm:self-auto shadow-xs"
          >
            <Ticket size={15} />
            <span>Xem Ví Voucher của tôi</span>
          </Link>
        </div>

        {/* ── Digital VIP Membership Card (Luxury Wallet Aesthetic) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Presentation */}
          <div className="lg:col-span-2 relative rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden bg-gradient-to-tr from-[#0b2414] via-[#123e21] to-[#1c5d33] border border-emerald-700/50 flex flex-col justify-between min-h-[250px]">
            {/* Background Sheen & Card Emblem */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-400/10 via-emerald-300/5 to-transparent pointer-events-none" />

            {/* Top Row: Brand & Chip */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-black flex items-center justify-center font-black text-sm shadow-md">
                  <Crown size={18} className="text-black" />
                </div>
                <div>
                  <span className="font-extrabold text-sm tracking-wide block">AgriTrace VIP</span>
                  <span className="text-[10px] text-emerald-200 tracking-widest uppercase">Member Privilege</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-emerald-200/80">
                <Wifi size={18} className="rotate-90" />
                <span className="text-[11px] font-mono tracking-wider">#AGRI-88219</span>
              </div>
            </div>

            {/* Middle: User & Tier */}
            <div className="my-6 space-y-1 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-xs font-bold text-amber-300">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                Hạng Hiện Tại: HỘI VIÊN VÀNG (GOLD)
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {user?.name || "Lê Quang Minh"}
              </h2>
              <p className="text-xs text-emerald-200/90">
                Hệ số tích lũy: <strong>x1.5 điểm</strong> · Ưu tiên giao hàng xe lạnh trong 2 giờ
              </p>
            </div>

            {/* Bottom Row: Spending Progress */}
            <div className="pt-4 border-t border-white/10 space-y-2 relative z-10">
              <div className="flex justify-between items-center text-xs text-emerald-100">
                <span>
                  Chi tiêu 12 tháng: <strong>{spent12m.toLocaleString("vi-VN")} đ</strong>
                </span>
                <span className="font-medium text-amber-300">
                  Mục tiêu Kim Cương: 7.000.000 đ
                </span>
              </div>

              <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-[11px] text-emerald-200/80">
                Tích lũy thêm <strong>{(targetGold - spent12m).toLocaleString("vi-VN")} đ</strong> nữa để nâng cấp đặc quyền Kim Cương chiết khấu 10% trọn đời.
              </p>
            </div>
          </div>

          {/* Points Box (Clean Wallet Overview) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/90 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Ví Điểm Thưởng Của Bạn
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
                  {points}
                </span>
                <span className="text-sm font-bold text-emerald-700">điểm khả dụng</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Tương đương khoảng <strong>~{(points * 500).toLocaleString("vi-VN")} đ</strong> giá trị quy đổi voucher giảm giá trên giỏ hàng.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-100 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>Hạn sử dụng điểm:</span>
                <span className="font-semibold text-gray-800">12 tháng</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Điểm tích gần nhất:</span>
                <span className="font-semibold text-emerald-700">+28 điểm (Đơn AGRI-8841)</span>
              </div>
            </div>

            <a
              href="#redeem-section"
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold text-center transition-colors shadow-xs block"
            >
              Đổi Điểm Lấy Voucher Ngay ↓
            </a>
          </div>
        </div>

        {/* ── 4 Membership Tiers Display ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Crown size={19} className="text-emerald-700" />
              Bảng Cấp Độ Hội Viên & Đặc Quyền
            </h2>
            <span className="text-xs text-gray-500">Cập nhật tự động sau mỗi đơn hoàn thành</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={cn(
                  "bg-white rounded-2xl p-5 border shadow-xs transition-all flex flex-col justify-between space-y-4 relative",
                  t.isCurrent
                    ? "border-amber-400 ring-2 ring-amber-400/20 shadow-md"
                    : "border-gray-200/90 hover:border-gray-300"
                )}
              >
                {t.isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                    Hạng Của Bạn
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-gray-900">Hạng {t.name}</h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {t.threshold === 0
                          ? "Mặc định khi đăng ký"
                          : `Từ ${t.threshold.toLocaleString("vi-VN")} đ / năm`}
                      </p>
                    </div>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border", t.badgeBg, t.badgeBorder, t.textColor)}>
                      {t.mult}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                    {t.perks.map((perk, i) => (
                      <div key={i} className="flex items-start gap-2 text-gray-600">
                        <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 text-center">
                  <span className="text-[11px] font-semibold text-gray-400">
                    {t.isCurrent ? "Đang áp dụng cho tài khoản" : "Cần đạt mức chi tiêu tương ứng"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Redeem Points Section ── */}
        <div id="redeem-section" className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <Gift size={19} className="text-emerald-700" />
                Quầy Đổi Điểm Lấy Mã Giảm Giá
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Đổi điểm tích lũy lấy voucher freeship hoặc giảm tiền mặt cho đơn hàng tiếp theo.
              </p>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold self-start sm:self-auto">
              Số dư: <strong>{points} điểm</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {redeemOptions.map((opt) => {
              const canRedeem = points >= opt.cost;
              return (
                <div
                  key={opt.id}
                  className="p-4 rounded-2xl border border-gray-200/80 bg-gray-50/50 flex flex-col justify-between space-y-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {opt.tag}
                      </span>
                      <span className="text-xs font-extrabold text-purple-800">
                        {opt.cost} điểm
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-gray-900">{opt.title}</h3>
                    <p className="text-[11px] text-gray-500 leading-snug">{opt.desc}</p>
                    <div className="text-[11px] text-gray-400 pt-1">
                      <span>Đơn tối thiểu: </span>
                      <strong className="text-gray-600">{opt.minOrder}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRedeem(opt)}
                    disabled={!canRedeem}
                    className={cn(
                      "w-full py-2 rounded-xl text-xs font-semibold transition-all shadow-xs",
                      canRedeem
                        ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {canRedeem ? `Đổi ngay (${opt.cost}đ)` : "Chưa đủ điểm"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── How it works (Quy trình tích điểm) ── */}
        <div className="bg-emerald-950 text-white rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="max-w-xl">
            <h3 className="text-base sm:text-lg font-bold">Cơ Chế Hoạt Động Của AgriClub</h3>
            <p className="text-xs text-emerald-200 mt-1">
              Mọi quy trình tính điểm và thăng hạng đều được quản lý tự động, minh bạch qua hệ thống.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="font-bold text-white text-sm">Mua Nông Sản Sạch</h4>
              <p className="text-emerald-200/80 leading-relaxed">
                Mỗi đơn hàng giao thành công sẽ được tích lũy điểm dựa trên tổng tiền thanh toán và hệ số cấp bậc của bạn.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="font-bold text-white text-sm">Tự Động Nâng Cấp</h4>
              <p className="text-emerald-200/80 leading-relaxed">
                Tổng chi tiêu trong vòng 12 tháng được cập nhật liên tục để nâng hạng Bạc, Vàng và Kim Cương mà không cần đăng ký thủ công.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="font-bold text-white text-sm">Đổi Quà & Freeship</h4>
              <p className="text-emerald-200/80 leading-relaxed">
                Dùng điểm tại quầy đổi thưởng để lấy voucher giảm giá, mã miễn phí xe lạnh hoặc quà tặng đặc sản theo mùa vụ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
