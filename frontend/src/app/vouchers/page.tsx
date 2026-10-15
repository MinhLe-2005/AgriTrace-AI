"use client";

import {
  Award,
  CheckCircle2,
  Clock,
  Gift,
  Percent,
  Sparkles,
  Tag,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/stores/toast-store";

const vouchersList = [
  {
    code: "FREESHIP25",
    type: "shipping",
    title: "Miễn Phí Vận Chuyển Toàn Quốc",
    discount: "Giảm 25.000 đ",
    minOrder: "Đơn từ 100.000 đ",
    expiry: "Còn 15 ngày",
    usageLeft: "Còn 142 lượt",
    tier: "Tất cả thành viên",
    tag: "Freeship",
    color: "#059669",
  },
  {
    code: "MUAVU10",
    type: "seasonal",
    title: "Ưu Đãi Trái Cây Mùa Vụ",
    discount: "Giảm 10% (Tối đa 30.000 đ)",
    minOrder: "Đơn từ 150.000 đ",
    expiry: "Hết hạn ngày 31/10/2026",
    usageLeft: "Còn 85 lượt",
    tier: "Áp dụng trái cây cuối mùa",
    tag: "Mùa vụ",
    color: "#ea580c",
  },
  {
    code: "CHAOBANMOI",
    type: "new",
    title: "Voucher Chào Mừng Thành Viên Mới",
    discount: "Giảm 20.000 đ",
    minOrder: "Đơn từ 120.000 đ",
    expiry: "Còn 30 ngày kể từ khi lưu",
    usageLeft: "1 lần / tài khoản",
    tier: "Hạng Đồng trở lên",
    tag: "Thành viên mới",
    color: "#2563eb",
  },
  {
    code: "VANGVIP5",
    type: "membership",
    title: "Đặc Quyền Thành Viên Hạng Vàng",
    discount: "Giảm 5% (Không giới hạn)",
    minOrder: "Đơn từ 300.000 đ",
    expiry: "Ưu đãi theo quý Q4/2026",
    usageLeft: "Đặc quyền riêng",
    tier: "Hạng Vàng & Kim Cương",
    tag: "Hạng VIP",
    color: "#d97706",
  },
  {
    code: "RAUSACH50",
    type: "percent",
    title: "Siêu Sale Nông Sản Đầu Tuần",
    discount: "Giảm 15% (Tối đa 50.000 đ)",
    minOrder: "Đơn từ 250.000 đ",
    expiry: "Chỉ áp dụng Thứ 2 - Thứ 4",
    usageLeft: "Còn 34 lượt",
    tier: "Tất cả thành viên",
    tag: "Hot Sale",
    color: "#dc2626",
  },
  {
    code: "DOIDIEM10K",
    type: "points",
    title: "Voucher Đổi Từ Điểm Thưởng",
    discount: "Giảm 10.000 đ",
    minOrder: "Đơn từ 100.000 đ",
    expiry: "Đổi bằng 100 điểm",
    usageLeft: "Xem số dư ví điểm",
    tier: "Đổi tại quầy Loyalty",
    tag: "Đổi điểm",
    color: "#7c3aed",
  },
];

export default function VouchersPage() {
  const [claimedCodes, setClaimedCodes] = useState<string[]>(["FREESHIP25"]);

  function handleClaim(code: string) {
    if (claimedCodes.includes(code)) {
      toast.info(`Voucher [${code}] đã có sẵn trong ví của bạn!`);
      return;
    }
    setClaimedCodes((prev) => [...prev, code]);
    toast.success(`Đã lưu voucher [${code}] vào ví thành công!`);
  }

  return (
    <div className="bg-[#f8faf8] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Module Header */}
        <div className="mb-6 bg-emerald-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm border border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center text-emerald-200">
              <Gift size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">Kho Voucher & Ví Khuyến Mãi Nông Sản</h1>
                <span className="text-[11px] bg-emerald-500/30 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Module 4 (Mục 5.2)
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Phụ trách: Member 4 (Quản lý Voucher, Ví Voucher, Tích điểm & Đơn hàng)
              </p>
            </div>
          </div>
          <Link
            href="/loyalty"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 flex items-center gap-1.5 transition-colors"
          >
            <Award size={14} /> Xem Hạng & Đổi Điểm Lấy Voucher
          </Link>
        </div>

        {/* Voucher Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchersList.map((v) => {
            const isClaimed = claimedCodes.includes(v.code);
            return (
              <div
                key={v.code}
                className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Header ribbon */}
                <div
                  style={{ backgroundColor: v.color }}
                  className="px-4 py-2.5 text-white flex items-center justify-between"
                >
                  <span className="text-xs font-bold uppercase tracking-wider">{v.tag}</span>
                  <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    {v.tier}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <div className="text-lg font-extrabold text-gray-900">{v.discount}</div>
                    <div className="text-sm font-semibold text-gray-700 leading-snug">{v.title}</div>
                  </div>

                  <div className="space-y-1 text-xs text-gray-500 pt-1 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span>Điều kiện:</span>
                      <strong className="text-gray-700">{v.minOrder}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Hạn dùng:</span>
                      <span className="text-amber-700 font-medium">{v.expiry}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Lượt còn lại:</span>
                      <span>{v.usageLeft}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <div className="font-mono text-xs font-bold text-gray-700 bg-gray-200 px-2 py-1 rounded">
                    {v.code}
                  </div>

                  <button
                    onClick={() => handleClaim(v.code)}
                    disabled={isClaimed}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isClaimed
                        ? "bg-emerald-100 text-emerald-800 cursor-default"
                        : "bg-[#1a7a3a] hover:bg-[#156e34] text-white shadow-xs"
                    }`}
                  >
                    {isClaimed ? "✓ Đã Lưu Vào Ví" : "Lưu Voucher"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
