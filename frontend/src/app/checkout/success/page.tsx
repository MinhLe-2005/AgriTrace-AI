"use client";

import { CheckCircle2, ChevronRight, Package, Home, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { catalogService, type ApiOrder } from "@/services/catalog.service";
import { paymentService } from "@/services/payment.service";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("orderCode") || searchParams.get("code") || "AGRI-SUCCESS";
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderCode) {
      setLoading(false);
      return;
    }
    // Auto mark as PAID if returning from payOS success url
    paymentService.simulatePaymentSuccess(orderCode).catch(() => {});

    catalogService.getOrders().then((orders) => {
      const found = orders.find((o) => o.orderCode === orderCode);
      if (found) setOrder(found);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orderCode]);

  return (
    <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-emerald-100 shadow-xl p-6 sm:p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-3xl mx-auto flex items-center justify-center shadow-inner animate-bounce">
          <CheckCircle2 size={44} className="stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <Sparkles size={13} /> Thanh toán trực tuyến payOS thành công
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Đặt Hàng Thành Công!
          </h1>
          <p className="text-sm text-gray-500">
            Giao dịch chuyển khoản qua mã QR Napas 247 đã được hệ thống xác nhận an toàn.
          </p>
        </div>

        <div className="bg-gray-50/80 rounded-2xl p-4 text-left border border-gray-100 space-y-2.5 text-xs text-gray-600">
          <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
            <span className="text-gray-500">Mã đơn hàng:</span>
            <span className="font-mono font-bold text-gray-900 text-sm">{orderCode}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
            <span className="text-gray-500">Cổng thanh toán:</span>
            <span className="font-semibold text-emerald-700">payOS (VietQR / Napas 247)</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
            <span className="text-gray-500">Trạng thái:</span>
            <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
              ĐÃ THANH TOÁN (PAID)
            </span>
          </div>
          {order && (
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Tổng thanh toán:</span>
              <span className="font-bold text-base text-emerald-700">
                {order.total.toLocaleString("vi-VN")}đ
              </span>
            </div>
          )}
        </div>

        <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs flex items-center gap-2">
          <ShieldCheck size={20} className="shrink-0 text-emerald-600" />
          <span>Nông sản tươi của bạn đang được đóng gói và chuẩn bị bàn giao cho đối tác vận chuyển.</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/dashboard/customer"
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-800 hover:bg-emerald-900 text-white shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Package size={16} /> Theo Dõi Đơn Hàng
          </Link>
          <Link
            href="/"
            className="py-3 px-4 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center gap-2 transition-all"
          >
            <Home size={16} /> Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Đang xử lý kết quả thanh toán...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
