"use client";

import {
  Award,
  CheckCircle2,
  Clock,
  Gift,
  Package,
  ShoppingBag,
  Star,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/stores/toast-store";

export default function CustomerPortalPage() {
  const [orders, setOrders] = useState([
    {
      id: "ORD-8841",
      date: "14/10/2026",
      items: "2x Xà lách thủy canh, 1x Dâu tây Mộc Châu",
      total: 236000,
      status: "Đang giao hàng",
      statusColor: "#f59e0b",
      pointsAwarded: 28,
    },
    {
      id: "ORD-8790",
      date: "10/10/2026",
      items: "2kg Cam sành Bố Hạ, 1kg Bơ sáp",
      total: 200000,
      status: "Đã nhận hàng thành công",
      statusColor: "#10b981",
      pointsAwarded: 24,
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Module Banner */}
      <div className="bg-purple-950 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm border border-purple-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-800 flex items-center justify-center text-white">
            <User size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Trung Tâm Khách Hàng (Customer Center)</h1>
              <span className="text-[11px] bg-purple-500/30 text-purple-300 font-semibold px-2 py-0.5 rounded-full border border-purple-400/30">
                Module 4 (Đơn hàng & Loyalty)
              </span>
            </div>
            <p className="text-xs text-purple-200/80">
              Phụ trách: Member 4 (Theo dõi đơn mua, Ví voucher, Tích điểm & Đánh giá sản phẩm)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/vouchers"
            className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-purple-950 text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition-all"
          >
            <Gift size={14} /> Ví Voucher
          </Link>
          <Link
            href="/loyalty"
            className="px-3 py-1.5 bg-white hover:bg-gray-100 text-purple-950 text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition-all"
          >
            <Award size={14} /> Điểm & Hạng
          </Link>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <ShoppingBag size={18} className="text-purple-700" />
            Lịch Sử Mua Hàng & Đơn Đặt Gần Đây
          </h3>
          <span className="text-xs text-gray-400">Tích lũy điểm sau khi giao thành công</span>
        </div>

        <div className="divide-y divide-gray-100">
          {orders.map((ord) => (
            <div key={ord.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/70">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-purple-950">{ord.id}</span>
                  <span
                    style={{ backgroundColor: ord.statusColor }}
                    className="text-[10px] text-white font-bold px-2 py-0.5 rounded"
                  >
                    {ord.status}
                  </span>
                  <span className="text-xs text-gray-400">{ord.date}</span>
                </div>
                <div className="text-xs text-gray-800 font-semibold">{ord.items}</div>
                <div className="text-xs text-purple-700 font-bold flex items-center gap-1">
                  <Award size={13} /> Tích lũy: +{ord.pointsAwarded} điểm thưởng
                </div>
              </div>

              <div className="flex sm:flex-col items-end justify-between gap-2">
                <div className="text-base font-extrabold text-[#1a7a3a]">
                  {ord.total.toLocaleString("vi-VN")} đ
                </div>
                <button
                  onClick={() => toast.success(`Đang mở chi tiết hành trình đơn [${ord.id}]!`)}
                  className="px-3 py-1 text-xs font-semibold rounded-lg border border-purple-600 text-purple-700 hover:bg-purple-50"
                >
                  Theo Dõi Đơn
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
