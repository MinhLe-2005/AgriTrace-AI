"use client";

import {
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  User,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { catalogService, type ApiProduct } from "@/services/catalog.service";
import { paymentService, type PaymentLinkResponse } from "@/services/payment.service";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

type QuickBuyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: ApiProduct | null;
  initialQty?: number;
};

type AppliedVoucher = {
  code: string;
  type: "freeship" | "discount";
  discount: number;
  message: string;
};

const QUICK_VOUCHERS = [
  { code: "FREESHIP", label: "Freeship 25k", desc: "Đơn từ 150k", min: 150000 },
  { code: "AGRI30", label: "Giảm 30%", desc: "Đơn từ 100k (Tối đa 50k)", min: 100000 },
  { code: "VIPGOLD", label: "VIP Gold -50k", desc: "Đơn từ 300k", min: 300000 },
];

export function QuickBuyModal({
  isOpen,
  onClose,
  product,
  initialQty = 1,
}: QuickBuyModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  const [qty, setQty] = useState(initialQty);
  const [receiverName, setReceiverName] = useState(user?.name || "Lê Quang Minh");
  const [receiverPhone, setReceiverPhone] = useState(user?.phone || "0988 776 655");
  const [receiverAddress, setReceiverAddress] = useState(
    user?.address || "Số 123 Cầu Giấy, Hà Nội"
  );
  const [deliveryNote, setDeliveryNote] = useState("");

  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"payos" | "cod">("payos");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrderCode, setCompletedOrderCode] = useState<string | null>(null);

  // payOS VietQR Modal state
  const [showPayosQr, setShowPayosQr] = useState(false);
  const [payosData, setPayosData] = useState<PaymentLinkResponse | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  // Sync state when product opens
  useEffect(() => {
    if (isOpen) {
      setQty(initialQty > 0 ? initialQty : 1);
      setVoucherInput("");
      setAppliedVoucher(null);
      setVoucherError(null);
      setCompletedOrderCode(null);
      setShowPayosQr(false);
      setPayosData(null);
      if (user?.name) setReceiverName(user.name);
      if (user?.phone) setReceiverPhone(user.phone);
      if (user?.address) setReceiverAddress(user.address);
    }
  }, [isOpen, initialQty, user]);

  if (!isOpen || !product) return null;

  const subtotal = product.price * qty;
  const baseShipping = 25000;
  const isFreeship = appliedVoucher?.type === "freeship";
  const shippingFee = isFreeship ? 0 : baseShipping;
  const discountAmount = appliedVoucher
    ? appliedVoucher.type === "freeship"
      ? baseShipping
      : appliedVoucher.discount
    : 0;

  const total = Math.max(0, subtotal + shippingFee - (appliedVoucher?.type === "discount" ? appliedVoucher.discount : 0));
  const pointsEarned = Math.max(10, Math.round(total / 5000));

  async function handleApplyVoucher(codeToApply?: string) {
    const targetCode = (codeToApply || voucherInput).trim().toUpperCase();
    if (!targetCode) {
      setVoucherError("Vui lòng nhập mã ưu đãi.");
      return;
    }

    setIsValidatingVoucher(true);
    setVoucherError(null);

    try {
      const res = await catalogService.validateVoucher({
        code: targetCode,
        subtotal,
        email: user?.email,
      });

      if (!res.valid) {
        setAppliedVoucher(null);
        setVoucherError(res.message);
        toast.error(res.message);
      } else {
        setAppliedVoucher({
          code: res.code,
          type: res.type || "discount",
          discount: res.discount || 0,
          message: res.message,
        });
        setVoucherInput(res.code);
        setVoucherError(null);
        toast.success(`Đã áp dụng mã ${res.code}: Giảm ${res.type === "freeship" ? "Miễn phí vận chuyển" : res.discount?.toLocaleString("vi-VN") + " đ"}`);
      }
    } catch (err: unknown) {
      setVoucherError("Không thể kiểm tra mã ưu đãi. Vui lòng thử lại!");
    } finally {
      setIsValidatingVoucher(false);
    }
  }

  function handleRemoveVoucher() {
    setAppliedVoucher(null);
    setVoucherInput("");
    setVoucherError(null);
  }

  async function handleConfirmQuickOrder() {
    if (!product) return;
    if (!receiverName.trim()) {
      toast.error("Vui lòng nhập họ và tên người nhận hàng.");
      return;
    }
    if (!receiverPhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại người nhận hàng.");
      return;
    }
    if (!receiverAddress.trim()) {
      toast.error("Vui lòng nhập địa chỉ giao nhận hàng.");
      return;
    }

    setIsSubmitting(true);

    try {
      const voucherText = appliedVoucher
        ? `${appliedVoucher.code} (${appliedVoucher.type === "freeship" ? "Freeship" : "-" + appliedVoucher.discount.toLocaleString("vi-VN") + "đ"})`
        : undefined;

      const orderPayload = {
        userEmail: user?.email || "customer@gmail.com",
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        receiverAddress: receiverAddress.trim(),
        deliverySlot: "Giao hỏa tốc xe lạnh 24H",
        deliveryNote: deliveryNote.trim() || undefined,
        paymentMethod: paymentMethod.toUpperCase(),
        voucherUsed: voucherText,
        subtotal,
        shippingFee,
        discount: discountAmount,
        total,
        pointsAwarded: pointsEarned,
        lotCode: product.batchCode || "XL-2026-08",
        items: [
          {
            name: product.name,
            origin: product.farm || product.origin || "Đà Lạt, Lâm Đồng",
            cert: product.cert || "VietGAP",
            qty: `${qty} ${product.unit}`,
            price: product.price * qty,
            image: product.image,
          },
        ],
      };

      const res = await catalogService.createOrder(orderPayload);
      setCompletedOrderCode(res.orderCode);

      if (paymentMethod === "payos") {
        try {
          const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
          const payLink = await paymentService.createPayOSPaymentLink(
            res.orderCode,
            `${origin}/checkout/success?orderCode=${res.orderCode}`,
            `${origin}/checkout/cancel?orderCode=${res.orderCode}`
          );
          setPayosData(payLink);
          setShowPayosQr(true);
          return;
        } catch (payErr) {
          console.error("PayOS error fallback:", payErr);
        }
      }

      toast.success(`Đặt hàng mua ngay thành công! Đơn hàng #${res.orderCode}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Có lỗi xảy ra khi tạo đơn.";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmPayosPaid() {
    if (!completedOrderCode) return;
    setIsCheckingPayment(true);
    try {
      await paymentService.simulatePaymentSuccess(completedOrderCode);
      toast.success("Xác nhận thanh toán payOS thành công! Đơn hàng chuyển sang ĐÃ THANH TOÁN.");
      setShowPayosQr(false);
    } catch (err) {
      toast.error("Không thể xác nhận thanh toán.");
    } finally {
      setIsCheckingPayment(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full my-auto shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-700/80 flex items-center justify-center font-bold text-xs text-emerald-200">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Mua Ngay Siêu Tốc (1 Sản Phẩm)</h3>
              <p className="text-[11px] text-emerald-200">
                Thanh toán trực tiếp sản phẩm này — Không làm xáo trộn giỏ hàng hiện tại
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Order Completed State */}
          {completedOrderCode && !showPayosQr ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-gray-900">Đặt Hàng Thành Công!</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Mã đơn hàng: <strong className="text-emerald-800">#{completedOrderCode}</strong>
                </p>
                <p className="text-xs text-gray-500">
                  Nông sản sẽ được thu hoạch tươi và giao xe lạnh đến địa chỉ của bạn.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <Link
                  href={`/dashboard/customer?tab=orders&order=${completedOrderCode}`}
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
                >
                  Xem chi tiết đơn hàng →
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
                >
                  Đóng & Tiếp tục xem hàng
                </button>
              </div>
            </div>
          ) : showPayosQr && payosData ? (
            /* payOS VietQR Payment State */
            <div className="space-y-4 text-center">
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-3">
                <div className="text-xs font-bold text-emerald-900 flex items-center justify-center gap-1.5">
                  <QrCode size={16} className="text-emerald-700" />
                  <span>Quét Mã VietQR Napas 24/7 Bằng Bất Kỳ App Ngân Hàng</span>
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-sm border border-emerald-200/80 inline-block mx-auto">
                  {payosData.qrCode ? (
                    <img
                      src={payosData.qrCode}
                      alt="VietQR payOS"
                      className="w-48 h-48 object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-400">
                      Đang tạo mã QR thanh toán...
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Số tiền cần chuyển khoản:</span>
                  <div className="text-2xl font-black text-emerald-700">
                    {payosData.amount.toLocaleString("vi-VN")} đ
                  </div>
                </div>

                <div className="text-[11px] text-gray-600 bg-white/80 p-2.5 rounded-xl border border-gray-100 text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ngân hàng:</span>
                    <span className="font-semibold">{payosData.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Số tài khoản:</span>
                    <span className="font-mono font-bold text-emerald-900">{payosData.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nội dung CK:</span>
                    <span className="font-mono font-bold text-emerald-900">{payosData.description}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmPayosPaid}
                  disabled={isCheckingPayment}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
                >
                  {isCheckingPayment ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang kiểm tra giao dịch...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Đã Chuyển Khoản Thành Công</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Regular Quick Buy Form */
            <>
              {/* 1. Item Summary with In-Modal Quantity Controls */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0 relative">
                    <Image
                      src={product.image || "/images/products/xa-lach.jpg"}
                      alt={product.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <span>{product.farm || product.origin || "Đà Lạt"}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">{product.cert || "VietGAP"}</span>
                    </p>
                    <div className="text-xs font-bold text-emerald-800 mt-1">
                      {product.price.toLocaleString("vi-VN")} đ <span className="font-normal text-gray-400">/ {product.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Qty Stepper */}
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 disabled:opacity-40"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-gray-900">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* 2. Receiver Shipping Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                  <MapPin size={14} className="text-emerald-700" />
                  <span>Địa Chỉ Nhận Hàng</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="Họ và tên người nhận *"
                    className="w-full h-10 px-3 text-xs rounded-xl border border-gray-200 bg-white focus:border-emerald-600 outline-none"
                  />
                  <input
                    type="tel"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    placeholder="Số điện thoại *"
                    className="w-full h-10 px-3 text-xs rounded-xl border border-gray-200 bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <input
                  type="text"
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  placeholder="Địa chỉ giao hàng chi tiết (Số nhà, đường, phường, quận) *"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-gray-200 bg-white focus:border-emerald-600 outline-none"
                />
              </div>

              {/* 3. Voucher & Discount Code Section */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                    <Tag size={14} className="text-amber-600" />
                    <span>Áp Dụng Mã Giảm Giá (Mỗi TK 1 Lần)</span>
                  </div>
                  {appliedVoucher && (
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="text-[11px] text-rose-600 hover:underline"
                    >
                      Bỏ áp dụng
                    </button>
                  )}
                </div>

                {/* Input & Apply Button */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => {
                      setVoucherInput(e.target.value.toUpperCase());
                      setVoucherError(null);
                    }}
                    placeholder="Nhập mã: FREESHIP, AGRI30, VIPGOLD..."
                    disabled={!!appliedVoucher}
                    className="flex-1 h-10 px-3 text-xs rounded-xl border border-gray-200 bg-white uppercase font-semibold text-gray-900 focus:border-emerald-600 outline-none disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyVoucher()}
                    disabled={isValidatingVoucher || !!appliedVoucher}
                    className="px-4 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1"
                  >
                    {isValidatingVoucher ? <Loader2 size={13} className="animate-spin" /> : "Áp dụng"}
                  </button>
                </div>

                {/* Voucher Error Toast/Banner */}
                {voucherError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0 text-rose-600" />
                    <span>{voucherError}</span>
                  </div>
                )}

                {/* Applied Voucher Success Banner */}
                {appliedVoucher && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>
                        Mã <strong>{appliedVoucher.code}</strong>: Giảm{" "}
                        {appliedVoucher.type === "freeship"
                          ? "25.000đ (Miễn phí vận chuyển)"
                          : `${appliedVoucher.discount.toLocaleString("vi-VN")} đ`}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      Hợp lệ
                    </span>
                  </div>
                )}

                {/* Quick Voucher Chips */}
                {!appliedVoucher && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                    <span className="text-gray-400 text-[10px] shrink-0">Gợi ý:</span>
                    {QUICK_VOUCHERS.map((v) => (
                      <button
                        key={v.code}
                        type="button"
                        onClick={() => handleApplyVoucher(v.code)}
                        className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-100 hover:border-amber-300 font-semibold shrink-0 transition-colors"
                      >
                        {v.code} ({v.label})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Payment Method Selection */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Phương Thức Thanh Toán
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("payos")}
                    className={cn(
                      "p-3 rounded-xl border text-left flex flex-col justify-between transition-all",
                      paymentMethod === "payos"
                        ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">payOS (VietQR)</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Khuyên Dùng
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 mt-1">Quét QR ngân hàng tự động</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={cn(
                      "p-3 rounded-xl border text-left flex flex-col justify-between transition-all",
                      paymentMethod === "cod"
                        ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    )}
                  >
                    <span className="font-bold text-gray-900">Khi Nhận Hàng (COD)</span>
                    <span className="text-[11px] text-gray-500 mt-1">Kiểm tra nông sản rồi trả</span>
                  </button>
                </div>
              </div>

              {/* 5. Points Info */}
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600 shrink-0" />
                  <span>Điểm tích lũy nhận được:</span>
                </div>
                <strong className="text-amber-800">+{pointsEarned} điểm AgriClub</strong>
              </div>

              {/* 6. Pricing Summary Breakdown */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính hàng ({qty} x {product.price.toLocaleString("vi-VN")} đ):</span>
                  <span>{subtotal.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí giao xe lạnh 24H:</span>
                  <span>{isFreeship ? <span className="text-emerald-700 font-semibold">Miễn phí (Freeship)</span> : "25.000 đ"}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Voucher ({appliedVoucher?.code}):</span>
                    <span>-{discountAmount.toLocaleString("vi-VN")} đ</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
                  <span>Tổng thanh toán:</span>
                  <span className="text-base text-emerald-800 font-black">
                    {total.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!completedOrderCode && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleConfirmQuickOrder}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Đang xử lý đơn...</span>
                </>
              ) : (
                <>
                  <span>Xác Nhận Đặt Hàng ({total.toLocaleString("vi-VN")} đ)</span>
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
