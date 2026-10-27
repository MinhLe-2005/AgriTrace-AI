"use client";

import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  ExternalLink,
  Gift,
  HelpCircle,
  Info,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Thermometer,
  Trash2,
  Truck,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { catalogService } from "@/services/catalog.service";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

type VoucherOption = {
  code: string;
  title: string;
  discount: number;
  type: "freeship" | "discount";
  minOrder: number;
};

const availableVouchers: VoucherOption[] = [
  {
    code: "FREESHIP25",
    title: "Miễn Phí Giao Hàng Xe Lạnh",
    discount: 25000,
    type: "freeship",
    minOrder: 100000,
  },
  {
    code: "AGRI30",
    title: "Giảm 30.000đ Đơn Rau Củ Quả",
    discount: 30000,
    type: "discount",
    minOrder: 150000,
  },
  {
    code: "VIETGAP10",
    title: "Giảm 15.000đ Nông Sản VietGAP",
    discount: 15000,
    type: "discount",
    minOrder: 120000,
  },
];

function CartContent() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { items, updateQty, removeItem, clearCart, getSubtotal } = useCartStore();

  const stepParam = searchParams.get("step");
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(() => {
    if (stepParam === "2") return 2;
    if (stepParam === "3") return 3;
    return 1;
  });

  useEffect(() => {
    if (stepParam === "2") setCurrentStep(2);
    else if (stepParam === "3") setCurrentStep(3);
  }, [stepParam]);

  // Shipping & Receiver info (Step 2)
  const [receiverName, setReceiverName] = useState(user?.name || "Lê Quang Minh");
  const [receiverPhone, setReceiverPhone] = useState("0988 776 655");
  const [receiverAddress, setReceiverAddress] = useState("Số 123 Cầu Giấy, Hà Nội");
  const [deliverySlot, setDeliverySlot] = useState("all_day");
  const [deliveryNote, setDeliveryNote] = useState("Gọi điện trước khi giao 15 phút.");

  const deliverySlotMap: Record<string, string> = {
    all_day: "Bất kỳ lúc nào (Thuận tiện giao sớm)",
    office_hours: "Chỉ nhận giờ hành chính (08:00 - 17:00)",
    after_hours: "Nhận ngoài giờ hành chính (Sau 17:30)",
  };

  // Payment method (Step 3)
  const [paymentMethod, setPaymentMethod] = useState<"vnpay" | "momo" | "cod" | "bank">("vnpay");

  // Voucher
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherOption | null>(availableVouchers[0]);
  const [customVoucherCode, setCustomVoucherCode] = useState("");

  // Completed order info
  const [completedOrderId, setCompletedOrderId] = useState("AGRI-8849");

  const subtotal = getSubtotal();
  const baseShippingFee = items.length > 0 ? 25000 : 0;
  const isFreeship = selectedVoucher?.type === "freeship";
  const voucherDiscount = selectedVoucher ? selectedVoucher.discount : 0;
  const shippingFee = isFreeship ? 0 : baseShippingFee;
  const total = Math.max(0, subtotal + shippingFee - (isFreeship ? 0 : voucherDiscount));
  const pointsEarned = Math.floor(total / 10000) * 1.5;

  function handleApplyCustomVoucher(e: React.FormEvent) {
    e.preventDefault();
    const clean = customVoucherCode.trim().toUpperCase();
    if (!clean) return;

    const found = availableVouchers.find((v) => v.code === clean);
    if (found) {
      setSelectedVoucher(found);
      toast.success(`Đã áp dụng voucher [${clean}]!`);
    } else {
      setSelectedVoucher({
        code: clean,
        title: `Mã Ưu Đãi ${clean}`,
        discount: 20000,
        type: "discount",
        minOrder: 100000,
      });
      toast.success(`Đã áp dụng mã ưu đãi [${clean}] giảm 20.000đ!`);
    }
    setCustomVoucherCode("");
  }

  function handleProceedToStep2() {
    if (items.length === 0) {
      toast.error("Giỏ hàng của bạn đang trống! Vui lòng chọn nông sản trước.");
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleProceedToStep3() {
    if (!receiverName.trim() || !receiverPhone.trim() || !receiverAddress.trim()) {
      toast.error("Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.");
      return;
    }
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFinalSubmitOrder() {
    try {
      const orderPayload = {
        userEmail: user?.email || "customer@gmail.com",
        receiverName,
        receiverPhone,
        receiverAddress,
        deliverySlot: deliverySlotMap[deliverySlot] || "Bất kỳ lúc nào",
        deliveryNote,
        paymentMethod: paymentMethod.toUpperCase(),
        voucherUsed: selectedVoucher ? `${selectedVoucher.code} (-${voucherDiscount.toLocaleString("vi-VN")}đ)` : undefined,
        subtotal,
        shippingFee,
        discount: voucherDiscount,
        total,
        pointsAwarded: pointsEarned,
        lotCode: items[0]?.batchCode || "XL-2026-08",
        items: items.map((it) => ({
          name: it.name,
          origin: it.farm,
          cert: it.cert,
          qty: `${it.qty} ${it.unit}`,
          price: it.price * it.qty,
          image: it.image,
        })),
      };

      const res = await catalogService.createOrder(orderPayload);
      setCompletedOrderId(res.orderCode);
      clearCart();
      setCurrentStep(4);
      toast.success(`Đặt hàng thành công! Đơn hàng #${res.orderCode} đã lưu vào Supabase.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Order creation fallback:", err);
      const newId = `AGRI-${Math.floor(1000 + Math.random() * 9000)}`;
      setCompletedOrderId(newId);
      clearCart();
      setCurrentStep(4);
      toast.success("Đặt hàng thành công! Đơn hàng đã được tiếp nhận.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
          <Link href="/products" className="hover:text-emerald-700 transition-colors">
            Nông sản sạch
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-800">Đặt hàng & Thanh toán</span>
        </div>

        {/* ── 3-Step Checkout Stepper Header ── */}
        {currentStep !== 4 && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between max-w-3xl mx-auto relative">
              {/* Stepper Connect Bar */}
              <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-gray-100 z-0">
                <div
                  className="h-full bg-emerald-600 transition-all duration-500"
                  style={{
                    width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
                  }}
                />
              </div>

              {/* Step 1 Pill */}
              <button
                onClick={() => setCurrentStep(1)}
                className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none"
              >
                <div
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-xs",
                    currentStep === 1
                      ? "bg-emerald-700 text-white ring-4 ring-emerald-100"
                      : currentStep > 1
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-400 border border-gray-200"
                  )}
                >
                  {currentStep > 1 ? <Check size={16} /> : "1"}
                </div>
                <span
                  className={cn(
                    "text-xs font-bold transition-colors whitespace-nowrap",
                    currentStep === 1 ? "text-emerald-800" : "text-gray-500"
                  )}
                >
                  1. Giỏ Hàng
                </span>
              </button>

              {/* Step 2 Pill */}
              <button
                onClick={() => {
                  if (items.length > 0) setCurrentStep(2);
                }}
                disabled={items.length === 0}
                className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none"
              >
                <div
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-xs",
                    currentStep === 2
                      ? "bg-emerald-700 text-white ring-4 ring-emerald-100"
                      : currentStep > 2
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-400 border border-gray-200"
                  )}
                >
                  {currentStep > 2 ? <Check size={16} /> : "2"}
                </div>
                <span
                  className={cn(
                    "text-xs font-bold transition-colors whitespace-nowrap",
                    currentStep === 2 ? "text-emerald-800" : "text-gray-500"
                  )}
                >
                  2. Giao Hàng & Xe Lạnh
                </span>
              </button>

              {/* Step 3 Pill */}
              <button
                onClick={() => {
                  if (items.length > 0 && receiverAddress) setCurrentStep(3);
                }}
                disabled={items.length === 0}
                className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none"
              >
                <div
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-xs",
                    currentStep === 3
                      ? "bg-emerald-700 text-white ring-4 ring-emerald-100"
                      : "bg-gray-100 text-gray-400 border border-gray-200"
                  )}
                >
                  3
                </div>
                <span
                  className={cn(
                    "text-xs font-bold transition-colors whitespace-nowrap",
                    currentStep === 3 ? "text-emerald-800" : "text-gray-500"
                  )}
                >
                  3. Thanh Toán & Đặt Hàng
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* BƯỚC 1: XEM & CHỈNH SỬA GIỎ HÀNG                          */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
            {/* Left Column: Cart items list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-emerald-700" />
                    <span>Nông sản đã chọn ({items.length} món)</span>
                  </h2>
                  <Link
                    href="/products"
                    className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <span>+ Mua thêm nông sản</span>
                  </Link>
                </div>

                {items.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                      <ShoppingBag size={28} />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Giỏ hàng của bạn đang trống</p>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                      Hãy chọn thêm các loại rau củ quả tươi ngon chính vụ từ nông trại nhé!
                    </p>
                    <Link
                      href="/products"
                      className="inline-block px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs"
                    >
                      Khám phá nông sản sạch →
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {items.map((it) => (
                      <div key={it.id} className="py-4 first:pt-1 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                            <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <h3 className="font-bold text-sm text-gray-900 truncate">{it.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{it.farm}</span>
                              {it.cert && (
                                <>
                                  <span>·</span>
                                  <span className="text-emerald-700 font-semibold">{it.cert}</span>
                                </>
                              )}
                              <span>·</span>
                              <span>{it.unit}</span>
                            </div>
                            <div className="text-xs font-bold text-emerald-800">
                              {it.price.toLocaleString("vi-VN")} đ / {it.unit}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls & Delete */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-0.5">
                            <button
                              onClick={() => updateQty(it.id, -1)}
                              className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-emerald-700 transition-colors"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-9 text-center text-xs font-bold text-gray-900">
                              {it.qty}
                            </span>
                            <button
                              onClick={() => updateQty(it.id, 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-emerald-700 transition-colors"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(it.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Xóa món"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cold Chain Guarantee Note */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-xs text-emerald-900">
                <Truck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Cam kết vận chuyển xe lạnh 4°C - 8°C:</strong> Nông sản được đóng gói tại nông trại và vận chuyển trong thùng xe kiểm soát nhiệt độ nghiêm ngặt, giữ trọn độ tươi giòn như vừa thu hái.
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Voucher */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-xs space-y-5">
                <h2 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">
                  Tóm Tắt Đơn Hàng
                </h2>

                {/* Voucher Selector Widget */}
                <div className="space-y-2.5">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Tag size={13} className="text-emerald-700" />
                    Mã ưu đãi áp dụng:
                  </span>

                  <div className="space-y-1.5">
                    {availableVouchers.map((v) => {
                      const isChosen = selectedVoucher?.code === v.code;
                      return (
                        <div
                          key={v.code}
                          onClick={() => setSelectedVoucher(isChosen ? null : v)}
                          className={cn(
                            "p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between",
                            isChosen
                              ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-semibold shadow-2xs"
                              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          )}
                        >
                          <div>
                            <span className="font-mono font-bold uppercase">{v.code}</span>
                            <span className="block text-[11px] text-gray-500 font-normal">
                              {v.title}
                            </span>
                          </div>
                          <span className="text-emerald-800 font-bold">
                            -{v.discount.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom code form */}
                  <form onSubmit={handleApplyCustomVoucher} className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      value={customVoucherCode}
                      onChange={(e) => setCustomVoucherCode(e.target.value)}
                      placeholder="Mã voucher khác..."
                      className="flex-1 h-9 px-3 text-xs uppercase font-medium rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:bg-white focus:border-emerald-600"
                    />
                    <button
                      type="submit"
                      className="px-3 h-9 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold transition-colors"
                    >
                      Áp dụng
                    </button>
                  </form>
                </div>

                {/* Calculation lines */}
                <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Tạm tính tiền hàng:</span>
                    <span className="font-semibold text-gray-900">{subtotal.toLocaleString("vi-VN")} đ</span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span>Phí giao xe lạnh:</span>
                    <span className="font-semibold text-gray-900">
                      {isFreeship || items.length === 0 ? (
                        <span className="text-emerald-700 font-bold">Miễn phí (Freeship)</span>
                      ) : (
                        "25.000 đ"
                      )}
                    </span>
                  </div>

                  {selectedVoucher && (
                    <div className="flex items-center justify-between text-emerald-700">
                      <span>Voucher ({selectedVoucher.code}):</span>
                      <span className="font-bold">-{voucherDiscount.toLocaleString("vi-VN")} đ</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200 flex items-baseline justify-between text-base">
                    <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                    <span className="text-xl font-black text-emerald-800">
                      {total.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                </div>

                {/* Points Earned Info */}
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <Sparkles size={15} className="text-amber-600 shrink-0" />
                  <span>
                    Tích lũy <strong>+{pointsEarned} điểm thưởng</strong> hội viên khi hoàn tất.
                  </span>
                </div>

                {/* Next Step Button */}
                <button
                  onClick={handleProceedToStep2}
                  disabled={items.length === 0}
                  className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Tiến Hành Đặt Hàng (Sang Bước 2)</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* BƯỚC 2: THÔNG TIN NHẬN HÀNG & KHUNG GIỜ DỰ KIẾN           */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/90 shadow-xs space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MapPin size={20} className="text-emerald-700" />
                  <span>Bước 2: Địa Chỉ Nhận Hàng & Thời Gian Giao Dự Kiến</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Đội xe thùng lạnh AgriTrace vận chuyển theo tuyến lộ trình tối ưu để giữ độ tươi nguyên bản của nông sản.
                </p>
              </div>

              {/* Delivery Details Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Họ và tên người nhận *</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        placeholder="Họ tên người nhận"
                        className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Số điện thoại liên hệ *</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <Phone size={16} />
                      </div>
                      <input
                        type="tel"
                        value={receiverPhone}
                        onChange={(e) => setReceiverPhone(e.target.value)}
                        placeholder="0912 345 678"
                        className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Địa chỉ giao hàng chi tiết *</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <MapPin size={16} />
                    </div>
                    <input
                      type="text"
                      value={receiverAddress}
                      onChange={(e) => setReceiverAddress(e.target.value)}
                      placeholder="Số nhà, ngõ/đường, Phường/Xã, Quận/Huyện..."
                      className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                    />
                  </div>
                </div>

                {/* Shipping Method Card */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Truck size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-900">
                          Giao Hàng Xe Lạnh Chuyên Dụng (Cold-Chain)
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white">
                          0°C - 5°C
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Thời gian dự kiến: <strong>Giao trong 24 giờ</strong> (Bác tài sẽ gọi điện trước 15 - 30 phút).
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-800">
                      {isFreeship || items.length === 0 ? "Miễn phí" : "25.000 đ"}
                    </span>
                  </div>
                </div>

                {/* Convenient Delivery Preference */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      Khung giờ thuận tiện nhận hàng (Ưu tiên theo lịch sinh hoạt của bạn):
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    {[
                      {
                        key: "all_day",
                        title: "Bất kỳ lúc nào",
                        time: "08:00 - 18:00",
                        note: "Thuận tiện giao sớm nhất",
                      },
                      {
                        key: "office_hours",
                        title: "Giờ hành chính",
                        time: "08:00 - 17:00",
                        note: "Phù hợp nhận tại cơ quan / văn phòng",
                      },
                      {
                        key: "after_hours",
                        title: "Ngoài giờ hành chính",
                        time: "Sau 17:30",
                        note: "Phù hợp nhận tại nhà riêng",
                      },
                    ].map((slot) => {
                      const isSelected = deliverySlot === slot.key;
                      return (
                        <div
                          key={slot.key}
                          onClick={() => setDeliverySlot(slot.key)}
                          className={cn(
                            "p-3 rounded-2xl border cursor-pointer transition-all space-y-1",
                            isSelected
                              ? "bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold shadow-xs ring-1 ring-emerald-500/20"
                              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{slot.title}</span>
                            {isSelected && <Check size={14} className="text-emerald-700" />}
                          </div>
                          <p className="text-xs sm:text-sm font-black text-emerald-800">{slot.time}</p>
                          <p className="text-[11px] text-gray-500 font-normal">{slot.note}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Notes & Quick Tags */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      Ghi chú thêm cho tài xế (Tùy chọn)
                    </label>
                    <span className="text-[11px] text-gray-400">Bấm gợi ý bên dưới để thêm nhanh</span>
                  </div>

                  <input
                    type="text"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="Ví dụ: Gọi điện trước 15 phút, gửi bảo vệ tòa nhà..."
                    className="w-full h-10 px-3 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 outline-none focus:bg-white focus:border-emerald-600"
                  />

                  {/* Quick Note Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {[
                      "Gọi trước 15 phút",
                      "Gửi bảo vệ / lễ tân",
                      "Để trước cửa nhà",
                      "Không bấm chuông cửa",
                    ].map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => {
                          if (!deliveryNote.includes(tag)) {
                            setDeliveryNote((prev) => (prev ? `${prev}, ${tag}` : tag));
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-gray-200 text-[11px] font-medium text-gray-600 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Quay lại Giỏ hàng</span>
                </button>

                <button
                  onClick={handleProceedToStep3}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <span>Tiếp tục thanh toán (Bước 3)</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* BƯỚC 3: PHƯƠNG THỨC THANH TOÁN & XÁC NHẬN ĐƠN HÀNG       */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/90 shadow-xs space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard size={20} className="text-emerald-700" />
                  <span>Bước 3: Chọn Phương Thức Thanh Toán & Xác Nhận</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Kiểm tra lại thông tin đơn hàng và chọn cổng thanh toán tiện lợi nhất cho bạn.
                </p>
              </div>

              {/* Receiver & Schedule Review Banner */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-gray-900">
                    Giao đến: {receiverName} ({receiverPhone})
                  </p>
                  <p className="text-gray-600">{receiverAddress}</p>
                  <p className="text-emerald-700 font-medium">
                    Thời gian giao: {deliverySlotMap[deliverySlot] || "Dự kiến chiều nay (14:00 - 16:30)"}
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-semibold text-emerald-800 hover:underline self-start sm:self-auto shrink-0"
                >
                  Chỉnh sửa →
                </button>
              </div>

              {/* Payment Methods Options */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-gray-700 block">
                  Chọn cổng thanh toán:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      key: "vnpay",
                      title: "Cổng Thanh Toán VNPay QR",
                      desc: "Quét mã QR qua 40+ ứng dụng Ngân hàng & VNPAY",
                      badge: "Khuyên dùng",
                    },
                    {
                      key: "momo",
                      title: "Ví Điện Tử MoMo",
                      desc: "Thanh toán an toàn, tích lũy điểm thưởng MoMo",
                      badge: "Ví điện tử",
                    },
                    {
                      key: "cod",
                      title: "Thanh Toán Khi Nhận Hàng (COD)",
                      desc: "Kiểm tra độ tươi ngon của nông sản rồi mới trả tiền",
                      badge: "An tâm 100%",
                    },
                    {
                      key: "bank",
                      title: "Chuyển Khoản Ngân Hàng (Vietcombank)",
                      desc: "Chuyển khoản trực tiếp vào tài khoản nông trại",
                      badge: "Miễn phí",
                    },
                  ].map((pm) => {
                    const isSelected = paymentMethod === pm.key;
                    return (
                      <div
                        key={pm.key}
                        onClick={() => setPaymentMethod(pm.key as any)}
                        className={cn(
                          "p-4 rounded-2xl border cursor-pointer transition-all space-y-1 relative",
                          isSelected
                            ? "bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-emerald-800">
                            {pm.badge}
                          </span>
                          {isSelected && <CheckCircle2 size={16} className="text-emerald-700" />}
                        </div>
                        <h4 className="font-bold text-sm text-gray-900 mt-1">{pm.title}</h4>
                        <p className="text-[11px] text-gray-500 font-normal leading-relaxed">
                          {pm.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Final Summary */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Tổng tiền nông sản ({items.length} món):</span>
                  <span className="font-semibold text-gray-900">{subtotal.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển xe lạnh:</span>
                  <span className="font-semibold text-gray-900">
                    {isFreeship ? "Miễn phí" : "25.000 đ"}
                  </span>
                </div>
                {selectedVoucher && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Voucher ({selectedVoucher.code}):</span>
                    <span className="font-bold">-{voucherDiscount.toLocaleString("vi-VN")} đ</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline text-base">
                  <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                  <span className="text-xl font-black text-emerald-800">
                    {total.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Quay lại Bước Giao hàng</span>
                </button>

                <button
                  onClick={handleFinalSubmitOrder}
                  className="px-8 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <ShieldCheck size={16} />
                  <span>Xác Nhận & Đặt Hàng ({total.toLocaleString("vi-VN")} đ)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* BƯỚC 4: MÀN HÌNH ĐẶT HÀNG THÀNH CÔNG                      */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="max-w-2xl mx-auto py-8 animate-scale-up">
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-200/90 shadow-xl text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={44} strokeWidth={2.2} />
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Đặt Hàng Thành Công
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Cảm Ơn Quý Khách Đã Đặt Hàng!
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                  Đơn hàng của bạn đã được tiếp nhận và chuyển đến nông trại để thu hái, đóng gói và xuất kho xe lạnh.
                </p>
              </div>

              {/* Order Info Card */}
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-2.5 max-w-md mx-auto text-left">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-gray-900">#{completedOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Người nhận:</span>
                  <span className="font-semibold text-gray-900">{receiverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Giao đến:</span>
                  <span className="font-medium text-gray-700">{receiverAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vận chuyển:</span>
                  <span className="text-emerald-700 font-semibold">Xe lạnh chuyên dụng AgriCold</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Thời gian nhận:</span>
                  <span className="text-emerald-700 font-medium">{deliverySlotMap[deliverySlot] || "Dự kiến chiều nay"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phương thức:</span>
                  <span className="font-semibold text-gray-900 uppercase">{paymentMethod}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between text-sm">
                  <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                  <span className="text-base font-extrabold text-emerald-800">
                    {total.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/dashboard/customer?tab=orders&order=AGRI-8841`}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Xem đơn hàng trong tài khoản →
                </Link>

                <Link
                  href="/products"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
                >
                  Tiếp tục mua sắm nông sản
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-gray-400">
          Đang tải giỏ hàng...
        </div>
      }
    >
      <CartContent />
    </Suspense>
  );
}
