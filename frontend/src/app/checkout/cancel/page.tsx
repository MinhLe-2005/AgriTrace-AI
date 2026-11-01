"use client";

import { AlertTriangle, ArrowLeft, RefreshCw, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CancelContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("orderCode") || searchParams.get("code") || "";

  return (
    <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-amber-200 shadow-xl p-6 sm:p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
          <AlertTriangle size={44} className="stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Thanh Toán Đã Hủy
          </h1>
          <p className="text-sm text-gray-500">
            Giao dịch thanh toán payOS cho đơn hàng {orderCode ? `#${orderCode}` : ""} đã tạm dừng hoặc bạn đã hủy giao dịch.
          </p>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-xs text-left leading-relaxed">
          Đơn hàng của bạn vẫn được lưu lại ở trạng thái <strong>Chờ thanh toán</strong> trong mục Quản lý đơn hàng. Bạn có thể tiến hành thanh toán lại hoặc chọn phương thức khác (COD) bất kỳ lúc nào.
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/dashboard/customer"
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-800 hover:bg-emerald-900 text-white shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw size={16} /> Xem Đơn Hàng & Thử Lại
          </Link>
          <Link
            href="/cart"
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center gap-2 transition-all"
          >
            <ShoppingCart size={16} /> Quay Lại Giỏ Hàng
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Đang tải...</div>}>
      <CancelContent />
    </Suspense>
  );
}
