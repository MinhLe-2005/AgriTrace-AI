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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [deliverySlot, setDeliverySlot] = useState("all_day");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrderCode, setCompletedOrderCode] = useState<string | null>(null);

  // payOS VietQR Modal state
  const [showPayosQr, setShowPayosQr] = useState(false);
  const [payosData, setPayosData] = useState<PaymentLinkResponse | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [activeVouchers, setActiveVouchers] = useState<{ code: string; label: string; desc: string }[]>(QUICK_VOUCHERS);

  // Sync state when product opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
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

      // Fetch active vouchers from backend to show live redeemed vouchers too
      catalogService.getVouchers().then((list) => {
        if (list && list.length > 0) {
          const mapped = list.map((v) => ({
            code: v.code,
            label: v.badge || (v.code.includes("10K") ? "-10k" : v.code),
            desc: v.title || v.description,
          }));
          const seen = new Set<string>();
          const merged: { code: string; label: string; desc: string }[] = [];
          for (const item of [...mapped, ...QUICK_VOUCHERS]) {
            if (!seen.has(item.code)) {
              seen.add(item.code);
              merged.push(item);
            }
          }
          setActiveVouchers(merged);
        }
      }).catch(() => {});
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

  function handleGoToStep3() {
    if (!receiverName.trim()) {
      toast.error("Vui lòng nhập họ và tên người nhận hàng.");
      return;
    }
    if (!receiverPhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại người nhận hàng.");
      return;
    }
    if (!receiverAddress.trim()) {
      toast.error("Vui lòng nhập địa chỉ nhận hàng.");
      return;
    }
    setCurrentStep(3);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full my-auto shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700/80 flex items-center justify-center font-bold text-xs text-emerald-200">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Mua Ngay Nông Sản (Quy Trình 3 Bước)</h3>
              <p className="text-[11px] text-emerald-200/90">
                Thanh toán trực tiếp sản phẩm này — Không làm xáo trộn giỏ hàng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Stepper Indicator Bar ── */}
        {!completedOrderCode && (
          <div className="px-5 py-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-emerald-100/80 shrink-0">
            <div className="flex items-center justify-between max-w-md mx-auto text-xs font-bold relative">
              {/* Step 1 Button */}
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={cn(
                  "flex items-center gap-1.5 transition-all cursor-pointer relative z-10",
                  currentStep === 1
                    ? "text-emerald-900 font-black"
                    : currentStep > 1
                    ? "text-emerald-700 font-semibold"
                    : "text-gray-400"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors",
                    currentStep === 1
                      ? "bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-200"
                      : currentStep > 1
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-200 text-gray-500"
                  )}
                >
                  {currentStep > 1 ? "✓" : "1"}
                </span>
                <span>1. Hàng & Voucher</span>
              </button>

              {/* Progress Line 1 */}
              <div className="flex-1 h-0.5 mx-2 bg-gray-200 relative">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: currentStep >= 2 ? "100%" : "0%" }}
                />
              </div>

              {/* Step 2 Button */}
              <button
                type="button"
                onClick={() => {
                  if (currentStep >= 2) setCurrentStep(2);
                }}
                className={cn(
                  "flex items-center gap-1.5 transition-all relative z-10",
                  currentStep === 2
                    ? "text-emerald-900 font-black cursor-pointer"
                    : currentStep > 2
                    ? "text-emerald-700 font-semibold cursor-pointer"
                    : "text-gray-400 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors",
                    currentStep === 2
                      ? "bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-200"
                      : currentStep > 2
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-200 text-gray-500"
                  )}
                >
                  {currentStep > 2 ? "✓" : "2"}
                </span>
                <span>2. Giao Hàng</span>
              </button>

              {/* Progress Line 2 */}
              <div className="flex-1 h-0.5 mx-2 bg-gray-200 relative">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: currentStep >= 3 ? "100%" : "0%" }}
                />
              </div>

              {/* Step 3 Button */}
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1.5 transition-all relative z-10",
                  currentStep === 3
                    ? "text-emerald-900 font-black cursor-pointer"
                    : "text-gray-400 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors",
                    currentStep === 3
                      ? "bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-200"
                      : "bg-gray-200 text-gray-500"
                  )}
                >
                  3
                </span>
                <span>3. Thanh Toán</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm flex-1">
          {/* ═════════════════════════════════════════════════════════════ */}
          {/* STEP 4: ĐẶT HÀNG THÀNH CÔNG (HIỆN KHI ĐÃ ĐẶT HOÀN TẤT)        */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {completedOrderCode && !showPayosQr ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-gray-950">Đặt Hàng Thành Công!</h4>
                <p className="text-xs text-gray-500">
                  Mã đơn hàng: <strong className="text-emerald-800 text-sm font-mono font-bold">#{completedOrderCode}</strong>
                </p>
                <p className="text-xs text-gray-600 max-w-sm mx-auto pt-1">
                  Đơn hàng đã được lưu chính thức vào tài khoản của bạn. Nông sản sẽ được thu hoạch tươi và giao bằng xe lạnh 2°C - 5°C.
                </p>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/dashboard/customer?tab=orders&order=${completedOrderCode}`}
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Package size={14} />
                  <span>Xem trong Đơn Mua của tôi →</span>
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Đóng & Tiếp tục mua sắm
                </button>
              </div>
            </div>
          ) : showPayosQr && payosData ? (
            /* payOS VietQR Payment State */
            <div className="space-y-4 text-center animate-in fade-in duration-200">
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
                  <span className="text-xs text-gray-500 font-medium">Số tiền chuyển khoản:</span>
                  <div className="text-2xl font-black text-emerald-800">
                    {payosData.amount.toLocaleString("vi-VN")} đ
                  </div>
                </div>

                <div className="text-[11px] text-gray-600 bg-white/90 p-3 rounded-xl border border-gray-100 text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Ngân hàng:</span>
                    <span className="font-semibold text-gray-900">{payosData.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Số tài khoản:</span>
                    <span className="font-mono font-bold text-emerald-900">{payosData.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Nội dung CK:</span>
                    <span className="font-mono font-bold text-emerald-900">{payosData.description}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmPayosPaid}
                  disabled={isCheckingPayment}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
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
          ) : currentStep === 1 ? (
            /* ═════════════════════════════════════════════════════════════ */
            /* BƯỚC 1: XÁC NHẬN NÔNG SẢN & ÁP DỤNG MÃ VOUCHER                */
            /* ═════════════════════════════════════════════════════════════ */
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Product Card with Stepper */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/60 to-white border border-emerald-100 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-gray-200 shrink-0 relative shadow-2xs">
                    <Image
                      src={product.image || "/images/products/xa-lach.jpg"}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {product.cert || "VietGAP"}
                      </span>
                      <span className="text-[11px] text-gray-500 truncate">
                        {product.farm || product.origin || "Đà Lạt"}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-gray-950 text-sm truncate">
                      {product.name}
                    </h4>
                    <div className="text-xs font-black text-emerald-800">
                      {product.price.toLocaleString("vi-VN")} đ <span className="font-normal text-gray-400">/ {product.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Qty Stepper */}
                <div className="flex items-center border border-gray-300 rounded-xl bg-white shadow-2xs overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-8 text-center text-xs font-black text-gray-900 border-x border-gray-200">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Voucher Application Section */}
              <div className="space-y-3 p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wide">
                    <Tag size={14} className="text-amber-600" />
                    <span>Áp Dụng Mã Ưu Đãi (Voucher)</span>
                  </div>
                  {appliedVoucher && (
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
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
                    className="flex-1 h-10 px-3.5 text-xs rounded-xl border border-gray-300 bg-white uppercase font-bold text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-gray-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyVoucher()}
                    disabled={isValidatingVoucher || !!appliedVoucher}
                    className="px-5 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-50 shrink-0 flex items-center gap-1 cursor-pointer"
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
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                      <span>
                        Đã áp dụng mã <strong>{appliedVoucher.code}</strong>: Giảm{" "}
                        <strong className="text-emerald-800">
                          {appliedVoucher.type === "freeship"
                            ? "25.000đ (Miễn phí vận chuyển)"
                            : `${appliedVoucher.discount.toLocaleString("vi-VN")} đ`}
                        </strong>
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-md">
                      Thành công
                    </span>
                  </div>
                )}

                {/* Quick Voucher Chips */}
                {!appliedVoucher && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-gray-500 text-[11px] font-semibold block">
                      Mã ưu đãi có sẵn (Bấm để áp dụng ngay):
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {activeVouchers.map((v) => (
                        <button
                          key={v.code}
                          type="button"
                          onClick={() => handleApplyVoucher(v.code)}
                          className="px-2.5 py-1.5 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-950 hover:bg-amber-100 hover:border-amber-400 font-bold text-xs shrink-0 transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                        >
                          <Tag size={12} className="text-amber-600" />
                          <span>{v.code}</span>
                          <span className="text-[10px] font-normal text-amber-800">({v.label})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 1 Price Breakdown */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Tiền hàng ({qty} x {product.price.toLocaleString("vi-VN")} đ):</span>
                  <span className="font-semibold text-gray-900">{subtotal.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí giao hàng xe lạnh 24H:</span>
                  <span>{isFreeship ? <strong className="text-emerald-700">Miễn phí (Freeship)</strong> : "25.000 đ"}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Mã giảm giá ({appliedVoucher?.code}):</span>
                    <span>-{discountAmount.toLocaleString("vi-VN")} đ</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-extrabold text-gray-900">
                  <span>Tổng tạm tính:</span>
                  <span className="text-base text-emerald-800 font-black">
                    {total.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>
            </div>
          ) : currentStep === 2 ? (
            /* ═════════════════════════════════════════════════════════════ */
            /* BƯỚC 2: THÔNG TIN GIAO HÀNG & XE LẠNH 24H                     */
            /* ═════════════════════════════════════════════════════════════ */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <MapPin size={16} className="text-emerald-700" />
                <h4 className="font-extrabold text-gray-900 text-sm">Địa Chỉ & Thông Tin Nhận Hàng</h4>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">Họ và tên người nhận *</label>
                    <input
                      type="text"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full h-10 px-3 text-xs rounded-xl border border-gray-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">Số điện thoại liên hệ *</label>
                    <input
                      type="tel"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      placeholder="0988 776 655"
                      className="w-full h-10 px-3 text-xs rounded-xl border border-gray-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700">Địa chỉ chi tiết (Số nhà, đường, phường, quận) *</label>
                  <input
                    type="text"
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    placeholder="Số 123 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội"
                    className="w-full h-10 px-3 text-xs rounded-xl border border-gray-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Delivery Time Slot */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-gray-700">Khung giờ giao nhận mong muốn</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { id: "all_day", label: "Giao hỏa tốc 24H", sub: "Thuận tiện giao sớm" },
                      { id: "office_hours", label: "Giờ hành chính", sub: "08:00 - 17:00" },
                      { id: "after_hours", label: "Ngoài giờ", sub: "Sau 17:30 tối" },
                    ].map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setDeliverySlot(slot.id)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                          deliverySlot === slot.id
                            ? "border-emerald-600 bg-emerald-50/80 font-bold text-emerald-950 ring-1 ring-emerald-500"
                            : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                        )}
                      >
                        <div className="text-xs">{slot.label}</div>
                        <div className="text-[10px] text-gray-400 font-normal">{slot.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery Note */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-bold text-gray-700">Ghi chú cho tài xế xe lạnh (Tùy chọn)</label>
                  <input
                    type="text"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="Ví dụ: Gọi trước 15 phút, giao lên tầng 4..."
                    className="w-full h-10 px-3 text-xs rounded-xl border border-gray-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-cyan-50/80 border border-cyan-200 text-[11px] text-cyan-900 flex items-center gap-2">
                  <Truck size={16} className="text-cyan-700 shrink-0" />
                  <span>Cam kết bảo quản xe lạnh 2°C - 5°C suốt quá trình vận chuyển.</span>
                </div>
              </div>
            </div>
          ) : (
            /* ═════════════════════════════════════════════════════════════ */
            /* BƯỚC 3: PHƯƠNG THỨC THANH TOÁN & XÁC NHẬN ĐƠN HÀNG            */
            /* ═════════════════════════════════════════════════════════════ */
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <CreditCard size={16} className="text-emerald-700" />
                <h4 className="font-extrabold text-gray-900 text-sm">Chọn Phương Thức Thanh Toán</h4>
              </div>

              {/* Payment Method Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("payos")}
                  className={cn(
                    "p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative",
                    paymentMethod === "payos"
                      ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/30"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-gray-950 text-xs">payOS (VietQR Napas 24/7)</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-700 text-white shadow-2xs">
                      Khuyên Dùng
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 leading-snug">
                    Quét mã QR bằng bất kỳ App ngân hàng, tự động xác nhận trong 2 giây.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={cn(
                    "p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                    paymentMethod === "cod"
                      ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/30"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-gray-950 text-xs">Thanh toán khi nhận hàng (COD)</span>
                  </div>
                  <span className="text-[11px] text-gray-500 leading-snug">
                    Nhận nông sản tươi mát, kiểm tra chuẩn rồi mới thanh toán tiền mặt.
                  </span>
                </button>
              </div>

              {/* Loyalty points card */}
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-600 shrink-0" />
                  <span className="font-medium">Tích lũy điểm thưởng đơn này:</span>
                </div>
                <strong className="text-amber-800 font-extrabold">+{pointsEarned} điểm AgriClub</strong>
              </div>

              {/* Final Summary Card */}
              <div className="p-4 rounded-2xl bg-gray-50/90 border border-gray-200 space-y-2 text-xs">
                <div className="font-bold text-gray-900 text-xs uppercase tracking-wider pb-1 border-b border-gray-200 flex justify-between">
                  <span>Tóm Tắt Đơn Hàng</span>
                  <span className="text-emerald-700 font-mono font-bold">1 Món Hàng</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Sản phẩm:</span>
                  <span className="font-semibold text-gray-900">{qty} x {product.name}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Người nhận:</span>
                  <span className="text-gray-900">{receiverName} ({receiverPhone})</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Địa chỉ:</span>
                  <span className="text-gray-900 truncate max-w-[200px]">{receiverAddress}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí ship xe lạnh:</span>
                  <span>{isFreeship ? <strong className="text-emerald-700">Miễn phí (Freeship)</strong> : "25.000 đ"}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Mã voucher ({appliedVoucher?.code}):</span>
                    <span>-{discountAmount.toLocaleString("vi-VN")} đ</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline text-sm font-extrabold text-gray-900">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-xl text-emerald-800 font-black">
                    {total.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footers (Step-by-Step Navigation) */}
        {!completedOrderCode && (
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/90 flex items-center justify-between gap-3 shrink-0">
            {currentStep === 1 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200/70 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Tiếp tục: Địa chỉ giao hàng</span>
                  <ChevronRight size={14} />
                </button>
              </>
            ) : currentStep === 2 ? (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-200/70 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>← Quay lại bước 1</span>
                </button>
                <button
                  type="button"
                  onClick={handleGoToStep3}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Tiếp tục: Chọn thanh toán</span>
                  <ChevronRight size={14} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-200/70 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  <span>← Sửa địa chỉ</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmQuickOrder}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 active:scale-95 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang đặt đơn...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡ XÁC NHẬN ĐẶT HÀNG ({total.toLocaleString("vi-VN")} đ)</span>
                      <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
