"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Search,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { catalogService, type ApiOrder } from "@/services/catalog.service";

function OrdersLookupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || searchParams.get("order") || "";
  const { user } = useAuthStore();

  const [orderCodeInput, setOrderCodeInput] = useState(initialCode);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedOrder, setSearchedOrder] = useState<ApiOrder | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState("");

  // If user is logged in and didn't specify an explicit lookup code, redirect to customer dashboard orders tab
  useEffect(() => {
    if (user && !initialCode) {
      router.replace("/dashboard/customer?tab=orders");
    }
  }, [user, initialCode, router]);

  useEffect(() => {
    if (initialCode) {
      handleLookup(initialCode);
    }
  }, [initialCode]);

  async function handleLookup(codeToSearch?: string) {
    const q = (codeToSearch || orderCodeInput).trim().toUpperCase();
    if (!q) {
      setSearchError("Vui lòng nhập mã đơn hàng (ví dụ: AGRI-8790 hoặc AGRI-5875).");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchedOrder(null);

    try {
      const cleanQ = q.replace(/^#/, "");
      const phone = phoneInput.trim() || undefined;
      const code = cleanQ.startsWith("AGRI-") ? cleanQ : `AGRI-${cleanQ}`;
      const found = await catalogService.getOrderByCode(code, phone);

      if (found) {
        setSearchedOrder(found);
      } else {
        setSearchError(`Không tìm thấy đơn hàng "${q}" khớp với số điện thoại đã nhập. Vui lòng kiểm tra lại.`);
      }
    } catch {
      setSearchError("Có lỗi khi tra cứu đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8faf8] py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-emerald-700">Trang chủ</Link>
          <span>/</span>
          <span className="font-semibold text-gray-800">Tra cứu đơn hàng</span>
        </div>

        {/* Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <Truck size={13} />
            <span>Hệ thống giám sát chuỗi lạnh 24/7</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Tra Cứu Đơn Hàng & Chuỗi Lạnh
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Nhập mã đơn hàng (ví dụ: <strong className="text-gray-700">AGRI-8790</strong>) kèm số điện thoại người nhận để theo dõi tiến độ thu hái, kiểm định và vận chuyển xe lạnh.
          </p>
        </div>

        {/* Search Box */}
        <div className="max-w-2xl mx-auto bg-white p-4 sm:p-5 rounded-3xl shadow-xs border border-gray-200/90 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={orderCodeInput}
                onChange={(e) => setOrderCodeInput(e.target.value)}
                placeholder="Nhập mã đơn hàng (VD: AGRI-8790, AGRI-5875...)"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="SĐT người nhận"
              className="sm:w-44 px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSearching ? "Đang tra cứu..." : "Tra Cứu Đơn"}
            </button>
          </form>

          {searchError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {searchError}
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
            <span>Mã mẫu kiểm tra nhanh: <button type="button" onClick={() => { setOrderCodeInput("AGRI-8790"); handleLookup("AGRI-8790"); }} className="font-mono font-bold text-emerald-700 hover:underline">AGRI-8790</button> hoặc <button type="button" onClick={() => { setOrderCodeInput("AGRI-5875"); handleLookup("AGRI-5875"); }} className="font-mono font-bold text-emerald-700 hover:underline">AGRI-5875</button></span>
            {user ? (
              <Link href="/dashboard/customer?tab=orders" className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5">
                Xem tất cả đơn của bạn →
              </Link>
            ) : (
              <Link href="/login" className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5">
                Đăng nhập để xem lịch sử →
              </Link>
            )}
          </div>
        </div>

        {/* Search Result Card */}
        {searchedOrder && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-md border border-emerald-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-emerald-200 uppercase tracking-wider font-bold block">Thông tin đơn hàng</span>
                <h3 className="text-lg font-black font-mono">#{searchedOrder.orderCode}</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-900 shadow-xs">
                {searchedOrder.status === "DELIVERED"
                  ? "ĐÃ GIAO THÀNH CÔNG"
                  : searchedOrder.status === "SHIPPING"
                  ? "ĐANG VẬN CHUYỂN XE LẠNH"
                  : searchedOrder.status === "CONFIRMED"
                  ? "ĐÃ XÁC NHẬN"
                  : searchedOrder.status === "PENDING_PAYMENT"
                  ? "CHỜ THANH TOÁN"
                  : searchedOrder.status}
              </span>
            </div>

            {/* Content Details */}
            <div className="p-5 sm:p-6 space-y-5 text-xs text-gray-700">
              {/* Cold Chain Tracker */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  <span>Trạng Thái Chuỗi Lạnh & Vận Chuyển</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div>Nhiệt độ thùng xe: <strong className="text-emerald-800">2°C - 5°C (Cảm biến IoT)</strong></div>
                  <div>Tài xế chuyên trách: <strong>{searchedOrder.driverName || "Nguyễn Văn Thắng (0912.888.777)"}</strong></div>
                  <div>Người nhận: <strong>{searchedOrder.receiverName}</strong> ({searchedOrder.receiverPhone})</div>
                  <div>Địa chỉ giao: <strong>{searchedOrder.receiverAddress}</strong></div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">Danh Sách Nông Sản</span>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                  {(searchedOrder.items || []).map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between bg-white hover:bg-gray-50/60">
                      <div>
                        <strong className="text-gray-900 block font-bold text-xs">{it.name}</strong>
                        <span className="text-[11px] text-gray-500">
                          {it.origin || "Nông Trại Xanh"} · Chuẩn {it.cert || "VietGAP"} · SL: {it.qty}
                        </span>
                      </div>
                      <span className="font-bold text-emerald-800 text-xs">
                        {(it.price || 0).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/70 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tiền hàng:</span>
                  <span className="font-semibold">{searchedOrder.subtotal?.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phí vận chuyển xe lạnh:</span>
                  <span className="font-semibold">{searchedOrder.shippingFee?.toLocaleString("vi-VN")} đ</span>
                </div>
                {searchedOrder.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Voucher đã giảm ({searchedOrder.voucherUsed || "Ưu đãi"}):</span>
                    <span>-{searchedOrder.discount?.toLocaleString("vi-VN")} đ</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-black text-emerald-800">
                  <span>Tổng thanh toán:</span>
                  <span>{searchedOrder.total?.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                {searchedOrder.lotCode && (
                  <Link
                    href={`/traceability?batch=${searchedOrder.lotCode}`}
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1 text-xs"
                  >
                    <span>Xem chứng nhận QR lô #{searchedOrder.lotCode} →</span>
                  </Link>
                )}
                <Link
                  href={`/dashboard/customer?tab=orders&order=${encodeURIComponent(searchedOrder.orderCode)}`}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Package size={14} />
                  <span>Xem Chi Tiết Đầy Đủ</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-gray-500">Đang tải trang đơn hàng...</div>}>
      <OrdersLookupContent />
    </Suspense>
  );
}
