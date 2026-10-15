"use client";

import {
  Award,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Gift,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/stores/toast-store";

export default function CartPage() {
  const [items, setItems] = useState([
    {
      id: "sp-01",
      name: "Dâu Tây Giống Nhật Mộc Châu",
      price: 185000,
      unit: "Hộp 500g",
      qty: 1,
      farm: "Nông Trại Dâu Mộc Châu",
      image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=200&auto=format&fit=crop&q=80",
    },
    {
      id: "sp-02",
      name: "Xà Lách Thủy Canh Lô Lô Xanh",
      price: 38000,
      unit: "Gói 400g",
      qty: 2,
      farm: "Nông Trại Xanh Đà Lạt",
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&auto=format&fit=crop&q=80",
    },
  ]);

  const [selectedVoucher, setSelectedVoucher] = useState<{ code: string; discount: number } | null>({
    code: "FREESHIP25",
    discount: 25000,
  });

  const [paymentMethod, setPaymentMethod] = useState<"vnpay" | "momo" | "cod">("vnpay");

  const subtotal = items.reduce((acc, it) => acc + it.price * it.qty, 0);
  const shippingFee = 25000;
  const discountAmount = selectedVoucher ? selectedVoucher.discount : 0;
  const total = Math.max(0, subtotal + shippingFee - discountAmount);
  const loyaltyEarned = Math.floor(total / 10000) * 1.2; // Silver tier mult 1.2

  function updateQty(id: string, delta: number) {
    setItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, qty: it.qty + delta } : it))
        .filter((it) => it.qty > 0)
    );
  }

  function handleCheckout() {
    toast.success("Đơn hàng đã được tạo thành công! Đang chuyển hướng sang cổng thanh toán thử nghiệm...");
  }

  return (
    <div className="bg-[#f8faf8] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Module Header */}
        <div className="bg-emerald-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm border border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center text-emerald-200">
              <ShoppingBag size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">Giỏ Hàng & Quy Trình Đặt Hàng</h1>
                <span className="text-[11px] bg-emerald-500/30 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Module 4 (Mục 7.1)
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Phụ trách: Member 4 (Giỏ hàng, Tạo đơn, Áp voucher, Thanh toán VNPay/MoMo & Tích điểm)
              </p>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center justify-between">
                <span>Nông sản đã chọn ({items.length} món)</span>
                <Link href="/products" className="text-xs font-semibold text-[#1a7a3a] hover:underline">
                  + Mua thêm nông sản
                </Link>
              </h2>

              {items.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  Giỏ hàng của bạn đang trống.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <div key={item.id} className="py-4 flex gap-4 items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover bg-gray-100"
                        />
                        <div>
                          <h3 className="font-bold text-sm text-gray-900">{item.name}</h3>
                          <div className="text-xs text-gray-500">{item.farm} • {item.unit}</div>
                          <div className="text-sm font-extrabold text-[#1a7a3a] mt-1">
                            {item.price.toLocaleString("vi-VN")} đ
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="p-1.5 hover:bg-gray-200 text-gray-600 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3 text-xs font-bold text-gray-800">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="p-1.5 hover:bg-gray-200 text-gray-600 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          onClick={() => updateQty(item.id, -item.qty)}
                          className="text-gray-400 hover:text-red-500 p-1.5 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Summary & Checkout */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                Tổng Kết Đơn Hàng
              </h2>

              {/* Voucher Box */}
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80">
                <div className="flex items-center justify-between text-xs font-bold text-[#1a7a3a] mb-1">
                  <span className="flex items-center gap-1.5">
                    <Gift size={14} /> Voucher Đã Chọn:
                  </span>
                  <Link href="/vouchers" className="underline font-semibold">Đổi mã</Link>
                </div>
                {selectedVoucher ? (
                  <div className="text-xs text-gray-700 flex justify-between items-center mt-1">
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold">
                      {selectedVoucher.code}
                    </span>
                    <span className="text-emerald-700 font-bold">
                      -{selectedVoucher.discount.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">Chưa chọn voucher</div>
                )}
              </div>

              {/* Price Calculation */}
              <div className="space-y-2 text-xs text-gray-600 pt-1">
                <div className="flex justify-between">
                  <span>Tạm tính tiền hàng:</span>
                  <span className="font-semibold text-gray-900">{subtotal.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển giao nhanh:</span>
                  <span className="font-semibold text-gray-900">{shippingFee.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Giảm giá từ voucher:</span>
                  <span className="font-bold">-{discountAmount.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-gray-900">Tổng thanh toán:</span>
                  <span className="text-xl font-extrabold text-[#1a7a3a]">
                    {total.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              {/* Loyalty Reward Preview */}
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2">
                <Award size={16} className="text-amber-600 flex-shrink-0" />
                <span>
                  Bạn sẽ tích được <strong>+{loyaltyEarned} điểm</strong> sau khi đơn giao thành công!
                </span>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="text-xs font-bold text-gray-700 mb-1">Phương thức thanh toán:</div>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === "vnpay"}
                    onChange={() => setPaymentMethod("vnpay")}
                  />
                  <span className="font-semibold">Cổng VNPay Sandbox</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === "momo"}
                    onChange={() => setPaymentMethod("momo")}
                  />
                  <span className="font-semibold">Ví điện tử MoMo Sandbox</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                  />
                  <span className="font-semibold">Thanh toán khi nhận hàng (COD)</span>
                </label>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={items.length === 0}
                className="w-full py-3 bg-[#1a7a3a] hover:bg-[#156e34] disabled:opacity-40 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <span>Xác Nhận Đặt Hàng</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
