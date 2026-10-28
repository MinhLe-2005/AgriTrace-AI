"use client";

import {
  Award,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  Gift,
  Percent,
  Search,
  Sparkles,
  Tag,
  Ticket,
  Truck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

type VoucherItem = {
  code: string;
  category: "all" | "shipping" | "discount" | "seasonal" | "vip";
  title: string;
  discount: string;
  shortDiscount: string;
  minOrder: string;
  expiry: string;
  usagePercent: number;
  usageLeft: string;
  tag: string;
  theme: {
    stubBg: string;
    stubText: string;
    accent: string;
  };
};

const vouchersList: VoucherItem[] = [
  {
    code: "FREESHIP25",
    category: "shipping",
    title: "Miễn Phí Vận Chuyển Xe Lạnh Toàn Quốc",
    discount: "Giảm 25.000 đ",
    shortDiscount: "25K",
    minOrder: "Đơn từ 100.000 đ",
    expiry: "Còn 15 ngày (Đến 15/11)",
    usagePercent: 68,
    usageLeft: "Còn 142 lượt",
    tag: "Freeship",
    theme: {
      stubBg: "from-emerald-600 to-teal-700",
      stubText: "text-emerald-100",
      accent: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
  },
  {
    code: "MUAVU10",
    category: "seasonal",
    title: "Ưu Đãi Trái Cây & Nông Sản Chính Vụ",
    discount: "Giảm 10% (Tối đa 30.000 đ)",
    shortDiscount: "10%",
    minOrder: "Đơn từ 150.000 đ",
    expiry: "Hết hạn ngày 31/10/2026",
    usagePercent: 82,
    usageLeft: "Còn 85 lượt",
    tag: "Mùa vụ",
    theme: {
      stubBg: "from-amber-600 to-orange-600",
      stubText: "text-amber-100",
      accent: "text-amber-700 bg-amber-50 border-amber-200",
    },
  },
  {
    code: "CHAOBANMOI",
    category: "discount",
    title: "Voucher Chào Mừng Khách Hàng Mới",
    discount: "Giảm 20.000 đ",
    shortDiscount: "20K",
    minOrder: "Đơn từ 120.000 đ",
    expiry: "Hạn 30 ngày từ khi lưu",
    usagePercent: 45,
    usageLeft: "1 lượt / tài khoản",
    tag: "Khách mới",
    theme: {
      stubBg: "from-blue-600 to-indigo-700",
      stubText: "text-blue-100",
      accent: "text-blue-700 bg-blue-50 border-blue-200",
    },
  },
  {
    code: "VANGVIP5",
    category: "vip",
    title: "Đặc Quyền Thành Viên Hạng Vàng & Kim Cương",
    discount: "Giảm 5% (Không giới hạn)",
    shortDiscount: "5%",
    minOrder: "Đơn từ 300.000 đ",
    expiry: "Ưu đãi quý 4/2026",
    usagePercent: 91,
    usageLeft: "Đặc quyền VIP",
    tag: "Hạng VIP",
    theme: {
      stubBg: "from-yellow-600 to-amber-700",
      stubText: "text-yellow-100",
      accent: "text-amber-800 bg-amber-50 border-amber-300",
    },
  },
  {
    code: "RAUSACH50",
    category: "discount",
    title: "Siêu Sale Nông Sản Đầu Tuần",
    discount: "Giảm 15% (Tối đa 50.000 đ)",
    shortDiscount: "15%",
    minOrder: "Đơn từ 250.000 đ",
    expiry: "Áp dụng Thứ 2 - Thứ 4",
    usagePercent: 74,
    usageLeft: "Còn 34 lượt",
    tag: "Flash Sale",
    theme: {
      stubBg: "from-rose-600 to-red-700",
      stubText: "text-rose-100",
      accent: "text-red-700 bg-red-50 border-red-200",
    },
  },
  {
    code: "DOIDIEM10K",
    category: "vip",
    title: "Voucher Đổi Từ Điểm Thưởng Tích Lũy",
    discount: "Giảm 10.000 đ",
    shortDiscount: "10K",
    minOrder: "Đơn từ 100.000 đ",
    expiry: "Đổi bằng 100 điểm",
    usagePercent: 30,
    usageLeft: "Đổi tại ví điểm",
    tag: "Điểm thưởng",
    theme: {
      stubBg: "from-purple-600 to-violet-700",
      stubText: "text-purple-100",
      accent: "text-purple-700 bg-purple-50 border-purple-200",
    },
  },
];

export default function VouchersPage() {
  const [claimedCodes, setClaimedCodes] = useState<string[]>(["FREESHIP25"]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [customCode, setCustomCode] = useState("");

  function handleClaim(code: string) {
    if (claimedCodes.includes(code)) {
      toast.info(`Mã [${code}] đã có sẵn trong ví của bạn!`);
      return;
    }
    setClaimedCodes((prev) => [...prev, code]);
    toast.success(`Đã lưu mã [${code}] vào ví thành công!`);
  }

  function handleApplyCustomCode(e: React.FormEvent) {
    e.preventDefault();
    const clean = customCode.trim().toUpperCase();
    if (!clean) return;

    if (claimedCodes.includes(clean)) {
      toast.info(`Mã [${clean}] đã có sẵn trong ví!`);
      return;
    }
    setClaimedCodes((prev) => [...prev, clean]);
    toast.success(`Đã lưu thành công mã ưu đãi [${clean}] vào ví!`);
    setCustomCode("");
  }

  function handleCopy(code: string) {
    navigator.clipboard?.writeText(code);
    toast.success(`Đã sao chép mã ${code}!`);
  }

  const filteredVouchers = vouchersList.filter((v) => {
    if (activeCategory === "all") return true;
    return v.category === activeCategory;
  });

  return (
    <div className="bg-[#f8faf8] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-emerald-700 transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-800">Mã ưu đãi & Voucher</span>
        </div>

        {/* ── Hero Banner (Enterprise Commerce Style) ── */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-emerald-200">
                <Sparkles size={13} />
                <span>Kho ưu đãi nông sản sạch AgriTrace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Mã Giảm Giá & Miễn Phí Vận Chuyển
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                Lưu ngay các mã ưu đãi độc quyền để áp dụng khi thanh toán đơn hàng nông sản VietGAP.
                Mã sau khi lưu sẽ tự động xuất hiện trong giỏ hàng của bạn.
              </p>
            </div>

            {/* Quick action: Link to Customer Wallet */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/customer?tab=vouchers"
                className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <Ticket size={15} className="text-emerald-700" />
                <span>Ví voucher của tôi ({claimedCodes.length})</span>
              </Link>
              <Link
                href="/loyalty"
                className="px-4 py-2.5 rounded-xl bg-emerald-700/60 hover:bg-emerald-700 border border-emerald-500/40 text-white text-xs font-semibold transition-all flex items-center gap-2"
              >
                <Award size={15} />
                <span>Đổi điểm lấy mã</span>
              </Link>
            </div>
          </div>

          {/* Quick Input Box */}
          <div className="mt-6 pt-5 border-t border-emerald-700/60 max-w-lg">
            <form onSubmit={handleApplyCustomCode} className="flex gap-2">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-300">
                  <Tag size={15} />
                </div>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="Nhập mã voucher cá nhân (ví dụ: AGRI50)..."
                  className="w-full h-10 pl-9 pr-3 text-xs uppercase font-medium rounded-xl bg-white/10 border border-white/20 text-white placeholder-emerald-200/60 outline-none focus:bg-white/20 focus:border-white transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-4 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-bold transition-colors shrink-0"
              >
                Lưu Mã
              </button>
            </form>
          </div>
        </div>

        {/* ── Category Filters ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {(
            [
              { key: "all", label: "Tất cả ưu đãi", count: vouchersList.length },
              { key: "shipping", label: "Miễn phí vận chuyển", count: 1 },
              { key: "discount", label: "Mã giảm giá", count: 2 },
              { key: "seasonal", label: "Chính vụ nông sản", count: 1 },
              { key: "vip", label: "Đặc quyền hội viên", count: 2 },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={cn(
                "px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
                activeCategory === tab.key
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-white border border-gray-200/90 text-gray-600 hover:bg-gray-50"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                  activeCategory === tab.key
                    ? "bg-emerald-950 text-emerald-200"
                    : "bg-gray-100 text-gray-500"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Voucher Tickets Grid (Clean Perforated Card Layout) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredVouchers.map((v) => {
            const isClaimed = claimedCodes.includes(v.code);
            return (
              <div
                key={v.code}
                className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row overflow-hidden relative group"
              >
                {/* Left Ticket Stub */}
                <div
                  className={cn(
                    "sm:w-36 bg-gradient-to-br p-4 sm:p-5 flex flex-col justify-between items-center text-center text-white relative shrink-0",
                    v.theme.stubBg
                  )}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/20">
                      {v.tag}
                    </span>
                    <div className="text-2xl sm:text-3xl font-black tracking-tight mt-2">
                      {v.shortDiscount}
                    </div>
                    <span className="text-[11px] block font-medium opacity-90">OFF</span>
                  </div>

                  <div className="hidden sm:flex items-center gap-1 text-[10px] opacity-80 pt-3">
                    <Ticket size={12} />
                    <span>AgriVoucher</span>
                  </div>

                  {/* Punch Hole Notches (Desktop Perforation Effect) */}
                  <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#f8faf8] border-l border-gray-200" />
                </div>

                {/* Perforation Divider Line */}
                <div className="hidden sm:block border-r border-dashed border-gray-200 my-3" />

                {/* Right Voucher Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", v.theme.accent)}>
                        {v.discount}
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        {v.expiry}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 mt-2 leading-snug">
                      {v.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>Điều kiện:</span>
                      <strong className="text-gray-700">{v.minOrder}</strong>
                    </div>

                    {/* Usage Progress Bar */}
                    <div className="mt-2.5 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                        <span>Đã dùng {v.usagePercent}%</span>
                        <span className="text-gray-500">{v.usageLeft}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                          style={{ width: `${v.usagePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 border border-gray-200 px-2 py-1 rounded-lg">
                        {v.code}
                      </span>
                      <button
                        onClick={() => handleCopy(v.code)}
                        title="Sao chép mã"
                        className="p-1 rounded-md text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        <Copy size={13} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {isClaimed ? (
                        <>
                          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 size={13} />
                            Đã lưu ví
                          </span>
                          <Link
                            href="/products"
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
                          >
                            Dùng ngay
                          </Link>
                        </>
                      ) : (
                        <button
                          onClick={() => handleClaim(v.code)}
                          className="px-4 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold transition-colors shadow-xs"
                        >
                          Lưu Voucher
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
