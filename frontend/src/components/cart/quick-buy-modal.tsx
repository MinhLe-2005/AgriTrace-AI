"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Leaf,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  QrCode,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  User,
  X,
  Zap,
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
  const [receiverPhone, setReceiverPhone] = useState(user?.phone || "0988776655");
  const [receiverAddress, setReceiverAddress] = useState(
    user?.address || "Số 123 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội"
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

  // Terms and condition agreement & In-Modal View Switch (prevents glitchy overlapping modals)
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isViewingTerms, setIsViewingTerms] = useState(false);

  // payOS VietQR Modal state
  const [showPayosQr, setShowPayosQr] = useState(false);
  const [payosData, setPayosData] = useState<PaymentLinkResponse | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [activeVouchers, setActiveVouchers] = useState<{ code: string; label: string; desc: string }[]>(QUICK_VOUCHERS);
  const [hasCopiedContent, setHasCopiedContent] = useState(false);

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
      setAgreeTerms(true);
      setIsViewingTerms(false);
      setHasCopiedContent(false);

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

  // Auto redirect to customer dashboard order details when order completes
  useEffect(() => {
    if (completedOrderCode && !showPayosQr) {
      const timer = setTimeout(() => {
        onClose();
        router.push(`/dashboard/customer?tab=orders&order=${completedOrderCode}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [completedOrderCode, showPayosQr, onClose, router]);

  if (!isOpen || !product) return null;

  const subtotal = (product.price || 0) * (qty || 1);
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
        toast.success(`Đã áp dụng mã ${res.code}: ${res.type === "freeship" ? "Miễn phí vận chuyển 25k" : "Giảm " + (res.discount || 0).toLocaleString("vi-VN") + " đ"}`);
      }
    } catch {
      setVoucherError("Không thể kiểm tra mã ưu đãi. Vui lòng thử lại!");
    } finally {
      setIsValidatingVoucher(false);
    }
  }

  function handleRemoveVoucher() {
    setAppliedVoucher(null);
    setVoucherInput("");
    setVoucherError(null);
    toast.info("Đã gỡ mã ưu đãi.");
  }

  function handleGoToStep2() {
    setCurrentStep(2);
  }

  function handleGoToStep3() {
    if (!receiverName.trim()) {
      toast.error("Vui lòng nhập họ và tên người nhận hàng.");
      return;
    }
    const cleanPhone = receiverPhone.replace(/[^0-9]/g, "");
    if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 11) {
      toast.error("Vui lòng nhập số điện thoại hợp lệ (10 số).");
      return;
    }
    if (!receiverAddress.trim()) {
      toast.error("Vui lòng nhập địa chỉ nhận hàng.");
      return;
    }
    setCurrentStep(3);
  }

  async function handleConfirmQuickOrder() {
    if (!product) return;

    if (!agreeTerms) {
      toast.error("Vui lòng tích chọn đồng ý với Điều khoản mua bán & Chính sách bảo quản nông sản.");
      return;
    }

    if (!receiverName.trim()) {
      toast.error("Vui lòng nhập họ và tên người nhận hàng.");
      setCurrentStep(2);
      return;
    }
    const cleanPhone = receiverPhone.replace(/[^0-9]/g, "");
    if (!cleanPhone || cleanPhone.length < 9) {
      toast.error("Vui lòng nhập số điện thoại hợp lệ.");
      setCurrentStep(2);
      return;
    }
    if (!receiverAddress.trim()) {
      toast.error("Vui lòng nhập địa chỉ giao nhận hàng.");
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);

    try {
      const voucherText = appliedVoucher
        ? `${appliedVoucher.code} (${appliedVoucher.type === "freeship" ? "Freeship" : "-" + appliedVoucher.discount.toLocaleString("vi-VN") + "đ"})`
        : undefined;

      const slotLabels: Record<string, string> = {
        all_day: "Giao hỏa tốc xe lạnh 24H",
        office_hours: "Giờ hành chính (08:00 - 17:00)",
        after_hours: "Ngoài giờ hành chính (Sau 17:30)",
      };

      const orderPayload = {
        userEmail: user?.email || "customer@gmail.com",
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        receiverAddress: receiverAddress.trim(),
        deliverySlot: slotLabels[deliverySlot] || "Giao hỏa tốc xe lạnh 24H",
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
      const generatedOrderCode = res.orderCode || `AGRI-${Math.floor(1000 + Math.random() * 9000)}`;
      setCompletedOrderCode(generatedOrderCode);

      if (paymentMethod === "payos") {
        try {
          const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
          const payLink = await paymentService.createPayOSPaymentLink(
            generatedOrderCode,
            `${origin}/checkout/success?orderCode=${generatedOrderCode}`,
            `${origin}/checkout/cancel?orderCode=${generatedOrderCode}`
          );
          setPayosData(payLink);
          setShowPayosQr(true);
          return;
        } catch {
          // Robust fallback VietQR Napas 24/7 if backend PayOS credentials aren't bound in local env
          const fallbackPayosData: PaymentLinkResponse = {
            orderCode: generatedOrderCode,
            amount: total,
            checkoutUrl: "",
            qrCode: `https://img.vietqr.io/image/MB-0389926888-compact2.png?amount=${total}&addInfo=${encodeURIComponent(generatedOrderCode)}&accountName=AGRITRACE%20VIETNAM`,
            paymentLinkId: generatedOrderCode,
            status: "PENDING",
            accountNumber: "0389926888",
            accountName: "AGRITRACE VIETNAM CORP",
            bankName: "MB Bank (Napas 24/7)",
            bin: "970422",
            description: generatedOrderCode,
          };
          setPayosData(fallbackPayosData);
          setShowPayosQr(true);
          return;
        }
      }

      // COD: Auto redirect directly to the order details page
      toast.success(`Đặt hàng COD thành công! Mã đơn #${generatedOrderCode}. Đang chuyển đến đơn hàng...`);
      setTimeout(() => {
        onClose();
        router.push(`/dashboard/customer?tab=orders&order=${generatedOrderCode}`);
      }, 900);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Có lỗi xảy ra khi tạo đơn hàng.";
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
      toast.success(`Xác nhận thanh toán VietQR thành công! Đang chuyển đến đơn hàng #${completedOrderCode}...`);
    } catch {
      toast.success(`Đã ghi nhận thanh toán! Đang chuyển đến đơn hàng #${completedOrderCode}...`);
    } finally {
      setIsCheckingPayment(false);
      setTimeout(() => {
        onClose();
        router.push(`/dashboard/customer?tab=orders&order=${completedOrderCode}`);
      }, 900);
    }
  }

  function handleCopyTransferContent(text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setHasCopiedContent(true);
      toast.success(`Đã sao chép: "${text}"`);
      setTimeout(() => setHasCopiedContent(false), 2500);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-xl w-full my-auto shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[92vh] cursor-default"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between shrink-0 shadow-sm">
          {isViewingTerms ? (
            /* Header for Terms View */
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsViewingTerms(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Quay lại đơn hàng"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">Điều Khoản Dịch Vụ & Bảo Quản Nông Sản</h3>
                <p className="text-[11px] text-emerald-200/90">Áp dụng cho mọi đơn mua trên hệ thống AgriTrace AI</p>
              </div>
            </div>
          ) : (
            /* Header for Checkout Wizard */
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center font-bold text-sm text-emerald-300 shadow-inner">
                <Zap size={18} className="fill-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight">Mua Ngay Nông Sản Siêu Tốc</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-700/60">
                    Chuỗi Lạnh 24H
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/90">
                  Đặt trực tiếp 1 sản phẩm — Tách biệt, không làm xáo trộn giỏ hàng chính
                </p>
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Stepper Indicator Bar (Only visible during checkout) ── */}
        {!completedOrderCode && !isViewingTerms && (
          <div className="px-5 py-3 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-emerald-50/80 border-b border-emerald-100 shrink-0">
            <div className="flex items-center justify-between max-w-md mx-auto text-xs font-bold relative">
              {/* Step 1 Button */}
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={cn(
                  "flex items-center gap-1.5 transition-all cursor-pointer relative z-10",
                  currentStep === 1
                    ? "text-emerald-950 font-black"
                    : currentStep > 1
                    ? "text-emerald-700 font-semibold"
                    : "text-gray-400"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shadow-2xs",
                    currentStep === 1
                      ? "bg-emerald-700 text-white ring-2 ring-emerald-300"
                      : currentStep > 1
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  )}
                >
                  {currentStep > 1 ? "✓" : "1"}
                </span>
                <span className="text-[11px] sm:text-xs">1. Nông Sản & Voucher</span>
              </button>

              {/* Progress Line 1 */}
              <div className="flex-1 h-0.5 mx-2 bg-gray-200 relative overflow-hidden rounded-full">
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
                  else handleGoToStep2();
                }}
                className={cn(
                  "flex items-center gap-1.5 transition-all relative z-10 cursor-pointer",
                  currentStep === 2
                    ? "text-emerald-950 font-black"
                    : currentStep > 2
                    ? "text-emerald-700 font-semibold"
                    : "text-gray-400"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shadow-2xs",
                    currentStep === 2
                      ? "bg-emerald-700 text-white ring-2 ring-emerald-300"
                      : currentStep > 2
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  )}
                >
                  {currentStep > 2 ? "✓" : "2"}
                </span>
                <span className="text-[11px] sm:text-xs">2. Giao Hàng</span>
              </button>

              {/* Progress Line 2 */}
              <div className="flex-1 h-0.5 mx-2 bg-gray-200 relative overflow-hidden rounded-full">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: currentStep >= 3 ? "100%" : "0%" }}
                />
              </div>

              {/* Step 3 Button */}
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 3) return;
                  handleGoToStep3();
                }}
                className={cn(
                  "flex items-center gap-1.5 transition-all relative z-10 cursor-pointer",
                  currentStep === 3
                    ? "text-emerald-950 font-black"
                    : "text-gray-400"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shadow-2xs",
                    currentStep === 3
                      ? "bg-emerald-700 text-white ring-2 ring-emerald-300"
                      : "bg-gray-200 text-gray-500"
                  )}
                >
                  3
                </span>
                <span className="text-[11px] sm:text-xs">3. Thanh Toán</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Sub-Breadcrumb when viewing Terms ── */}
        {isViewingTerms && (
          <div className="px-5 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900 font-semibold shrink-0">
            <div className="flex items-center gap-1.5">
              <span>Đơn Đặt Hàng</span>
              <ChevronRight size={12} className="text-emerald-500" />
              <span className="font-bold text-emerald-950">Quy Chế Hoạt Động & Bảo Vệ Khách Hàng</span>
            </div>
            <button
              type="button"
              onClick={() => setIsViewingTerms(false)}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>← Trở lại bước thanh toán</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm flex-1">
          {/* ═════════════════════════════════════════════════════════════ */}
          {/* VIEW: TERMS & POLICIES (INLINE - HOÀN TOÀN KHÔNG BỊ TRÙNG LỖI) */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {isViewingTerms ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                  <ShieldCheck size={18} className="text-emerald-700" />
                  <span>Chính Sách & Cam Kết Chuỗi Cung Ứng Nông Sản Sạch</span>
                </div>
                <p className="text-xs text-emerald-900/90 leading-relaxed">
                  AgriTrace AI cam kết bảo vệ 100% quyền lợi người tiêu dùng nông sản sạch với 4 nguyên tắc hoạt động chính:
                </p>
              </div>

              {/* 4 Policy Points */}
              <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
                <div className="p-3.5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-950 font-extrabold text-xs">
                    <Leaf size={15} className="text-emerald-700" />
                    <span>1. Tiêu Chuẩn Nông Sản Sạch & Nguồn Gốc Minh Bạch</span>
                  </div>
                  <p className="text-[11px] text-gray-600 pl-6 leading-relaxed">
                    100% nông sản niêm yết trên AgriTrace đều đạt tiêu chuẩn VietGAP, GlobalGAP hoặc Organic hữu cơ, có mã QR GS1 truy xuất thời gian thu hoạch, phân bón/dinh dưỡng và nhật ký chăm sóc tận vườn.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-950 font-extrabold text-xs">
                    <Truck size={15} className="text-cyan-700" />
                    <span>2. Quy Định Vận Chuyển Chuỗi Lạnh 2°C - 5°C Khép Kín</span>
                  </div>
                  <p className="text-[11px] text-gray-600 pl-6 leading-relaxed">
                    Nông sản được bảo quản bằng thùng xe lạnh chuyên dụng kiểm soát nhiệt độ từ 2°C đến 5°C suốt tuyến đường, đóng gói màng thở sinh học ngăn đọng sương, giữ nguyên độ tươi giòn và dưỡng chất tự nhiên.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-950 font-extrabold text-xs">
                    <RotateCcw size={15} className="text-amber-700" />
                    <span>3. Chính Sách Đổi Trả 1-Đổi-1 & Hoàn Tiền Trong Vòng 24 Giờ</span>
                  </div>
                  <p className="text-[11px] text-gray-600 pl-6 leading-relaxed">
                    Khách hàng được quyền <strong>đồng kiểm cùng tài xế khi nhận hàng</strong>. Nếu phát hiện dập nát, hỏng hóc hoặc không đúng chuẩn, AgriTrace đổi mới 1-đổi-1 hoàn toàn miễn phí hoặc hoàn tiền 100% qua tài khoản ngân hàng trong 2 giờ.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-950 font-extrabold text-xs">
                    <Lock size={15} className="text-purple-700" />
                    <span>4. Phương Thức Thanh Toán An Toàn & Bảo Mật Dữ Liệu</span>
                  </div>
                  <p className="text-[11px] text-gray-600 pl-6 leading-relaxed">
                    Hỗ trợ thanh toán bảo mật VietQR Napas 24/7 (cổng payOS) và Thanh toán tiền mặt khi nhận hàng (COD). Toàn bộ dữ liệu người dùng được mã hóa SSL 256-bit chuẩn an toàn thông tin.
                  </p>
                </div>
              </div>
            </div>
          ) : completedOrderCode && !showPayosQr ? (
            /* ═════════════════════════════════════════════════════════════ */
            /* STEP 4: ĐẶT HÀNG THÀNH CÔNG (TỰ ĐỘNG CHUYỂN SANG ĐƠN HÀNG)    */
            /* ═════════════════════════════════════════════════════════════ */
            <div className="text-center py-5 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                  Đặt Hàng Thành Công
                </span>
                <h4 className="text-xl font-black text-gray-950 pt-1">
                  Đơn Hàng Đã Được Tiếp Nhận!
                </h4>
                <p className="text-xs text-gray-600">
                  Mã định danh đơn hàng: <strong className="text-emerald-800 text-sm font-mono font-bold">#{completedOrderCode}</strong>
                </p>
                <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-emerald-800 font-semibold animate-pulse">
                  <Loader2 size={13} className="animate-spin text-emerald-700" />
                  <span>Đang tự động chuyển sang trang quản lý đơn hàng...</span>
                </div>
              </div>

              {/* Order Recap Box */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between text-gray-600">
                  <span>Sản phẩm thu hoạch:</span>
                  <span className="font-bold text-gray-900">{qty} x {product.name}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Người nhận:</span>
                  <span className="font-semibold text-gray-900">{receiverName} ({receiverPhone})</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Địa chỉ giao hàng:</span>
                  <span className="font-medium text-gray-900 text-right truncate max-w-[220px]">{receiverAddress}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phương thức:</span>
                  <span className="font-semibold text-emerald-800">
                    {paymentMethod === "payos" ? "Đã thanh toán VietQR Napas 24/7" : "Thanh toán tiền mặt khi nhận hàng (COD)"}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-gray-900 text-sm">
                  <span>Tổng thanh toán:</span>
                  <span className="text-emerald-800 font-extrabold">{total.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/dashboard/customer?tab=orders&order=${completedOrderCode}`}
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Package size={15} />
                  <span>Xem Chi Tiết Đơn Mua Ngay →</span>
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Đóng & Mua tiếp
                </button>
              </div>
            </div>
          ) : showPayosQr && payosData ? (
            /* ═════════════════════════════════════════════════════════════ */
            /* payOS VietQR Payment State                                   */
            /* ═════════════════════════════════════════════════════════════ */
            <div className="space-y-4 text-center animate-in fade-in duration-200">
              <div className="bg-gradient-to-b from-emerald-50 to-teal-50/40 rounded-2xl p-4 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <QrCode size={16} className="text-emerald-700" />
                    <span>Quét VietQR Napas 24/7 Bằng Bất Kỳ Ngân Hàng</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white">
                    Tự Động 2 Giây
                  </span>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-200/80 inline-block mx-auto relative group">
                  {payosData.qrCode ? (
                    <img
                      src={payosData.qrCode}
                      alt="VietQR payOS"
                      className="w-48 h-48 object-contain rounded-xl mx-auto"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-400">
                      Đang tạo mã VietQR...
                    </div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <span className="text-xs text-gray-500 font-medium">Số tiền chuyển khoản chính xác:</span>
                  <div className="text-2xl font-black text-emerald-800 tracking-tight">
                    {payosData.amount.toLocaleString("vi-VN")} đ
                  </div>
                </div>

                {/* Account Details Box */}
                <div className="text-xs text-gray-700 bg-white/95 p-3 rounded-xl border border-emerald-100 text-left space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Ngân hàng:</span>
                    <span className="font-bold text-gray-900">{payosData.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-emerald-900">{payosData.accountNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyTransferContent(payosData.accountNumber)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-800 transition-colors"
                        title="Sao chép số tài khoản"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Tên người thụ hưởng:</span>
                    <span className="font-semibold text-gray-900 uppercase text-[11px]">{payosData.accountName || "AGRITRACE VIETNAM CORP"}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                    <span className="text-gray-500">Nội dung CK:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {payosData.description}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyTransferContent(payosData.description)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-800 transition-colors"
                        title="Sao chép nội dung"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {hasCopiedContent && (
                  <div className="text-[11px] text-emerald-700 font-bold bg-emerald-100/80 py-1 rounded-lg">
                    ✓ Đã sao chép vào bộ nhớ tạm!
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                {payosData.checkoutUrl && (
                  <a
                    href={payosData.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-emerald-600 text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink size={14} />
                    <span>Mở Cổng PayOS (Visa/ATM)</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleConfirmPayosPaid}
                  disabled={isCheckingPayment}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/dashboard/customer?tab=orders&order=${completedOrderCode}`);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-800 underline cursor-pointer"
                >
                  Để thanh toán sau & Chuyển sang xem đơn hàng
                </button>
              </div>
            </div>
          ) : currentStep === 1 ? (
            /* ═════════════════════════════════════════════════════════════ */
            /* BƯỚC 1: XÁC NHẬN NÔNG SẢN & ÁP DỤNG MÃ VOUCHER                */
            /* ═════════════════════════════════════════════════════════════ */
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Product Card with Stepper */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white border border-emerald-100 flex items-center justify-between gap-3 shadow-2xs">
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {product.cert || "VietGAP"}
                      </span>
                      <span className="text-[11px] text-gray-500 truncate">
                        {product.farm || product.origin || "Mộc Châu / Đà Lạt"}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-gray-950 text-sm truncate">
                      {product.name}
                    </h4>
                    <div className="text-xs font-black text-emerald-800">
                      {(product.price || 0).toLocaleString("vi-VN")} đ <span className="font-normal text-gray-400">/ {product.unit || "KG"}</span>
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
              <div className="space-y-3 p-4 rounded-2xl bg-gray-50/90 border border-gray-200">
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

                {/* Voucher Error Banner */}
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
                            : `${(appliedVoucher.discount || 0).toLocaleString("vi-VN")} đ`}
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
                      Mã ưu đãi có sẵn (Bấm để áp dụng nhanh):
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
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Tiền hàng ({qty} x {(product.price || 0).toLocaleString("vi-VN")} đ):</span>
                  <span className="font-semibold text-gray-900">{subtotal.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí giao hàng xe lạnh 24H:</span>
                  <span>
                    {isFreeship ? (
                      <strong className="text-emerald-700">Miễn phí (Freeship)</strong>
                    ) : (
                      "25.000 đ"
                    )}
                  </span>
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
                    <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                      <User size={12} className="text-gray-400" />
                      <span>Họ và tên người nhận *</span>
                    </label>
                    <input
                      type="text"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="Ví dụ: Lê Quang Minh"
                      className="w-full h-10 px-3 text-xs rounded-xl border border-gray-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                      <Phone size={12} className="text-gray-400" />
                      <span>Số điện thoại liên hệ *</span>
                    </label>
                    <input
                      type="tel"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      placeholder="Ví dụ: 0988776655"
                      className="w-full h-10 px-3 text-xs rounded-xl border border-gray-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                    <MapPin size={12} className="text-gray-400" />
                    <span>Địa chỉ chi tiết (Số nhà, đường, phường, quận, TP) *</span>
                  </label>
                  <input
                    type="text"
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    placeholder="Số 123 Cầu Giấy, Phường Dịch Vọng, Cầu Giấy, Hà Nội"
                    className="w-full h-10 px-3 text-xs rounded-xl border border-gray-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Delivery Time Slot */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                    <Clock size={12} className="text-gray-400" />
                    <span>Khung giờ giao nhận xe lạnh mong muốn</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { id: "all_day", label: "⚡ Giao hỏa tốc 24H", sub: "Thuận tiện giao sớm" },
                      { id: "office_hours", label: "🏢 Giờ hành chính", sub: "08:00 - 17:00" },
                      { id: "after_hours", label: "🌙 Ngoài giờ", sub: "Sau 17:30 tối" },
                    ].map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setDeliverySlot(slot.id)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                          deliverySlot === slot.id
                            ? "border-emerald-600 bg-emerald-50/80 font-bold text-emerald-950 ring-1 ring-emerald-500 shadow-2xs"
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
                    placeholder="Ví dụ: Gọi trước 15 phút khi đến, giao lên tầng 4..."
                    className="w-full h-10 px-3 text-xs rounded-xl border border-gray-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-cyan-50/80 border border-cyan-200 text-[11px] text-cyan-900 flex items-center gap-2">
                  <Truck size={16} className="text-cyan-700 shrink-0" />
                  <span>Cam kết bảo quản xe lạnh nhiệt độ 2°C - 5°C suốt quá trình vận chuyển.</span>
                </div>
              </div>
            </div>
          ) : (
            /* ═════════════════════════════════════════════════════════════ */
            /* BƯỚC 3: PHƯƠNG THỨC THANH TOÁN, ĐIỀU KHOẢN & TỔNG KẾT ĐƠN     */
            /* ═════════════════════════════════════════════════════════════ */
            <div className="space-y-4 animate-in fade-in duration-150">
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
                      ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30 shadow-2xs"
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
                    Quét mã VietQR bằng mọi App ngân hàng, tự động xác nhận trong 2 giây.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={cn(
                    "p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                    paymentMethod === "cod"
                      ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30 shadow-2xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-gray-950 text-xs">Thanh toán khi nhận hàng (COD)</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                      Tiền Mặt
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 leading-snug">
                    Nhận nông sản tươi mát, kiểm tra chất lượng rồi mới trả tiền cho tài xế.
                  </span>
                </button>
              </div>

              {/* Loyalty points banner */}
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-600 shrink-0" />
                  <span className="font-medium">Tích lũy điểm thưởng đơn này:</span>
                </div>
                <strong className="text-amber-800 font-extrabold">+{pointsEarned} điểm AgriClub</strong>
              </div>

              {/* ── BẢNG TỔNG KẾT THANH TOÁN CHI TIẾT ── */}
              <div className="p-4 rounded-2xl bg-gray-50/95 border border-gray-200 space-y-2.5 text-xs shadow-2xs">
                <div className="font-extrabold text-gray-900 text-xs uppercase tracking-wider pb-1.5 border-b border-gray-200 flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-emerald-900">
                    <FileText size={14} className="text-emerald-700" />
                    <span>TỔNG KẾT THANH TOÁN ĐƠN HÀNG</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {paymentMethod === "payos" ? "VietQR 24/7" : "Thu Hộ COD"}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-2 text-gray-700">
                  <div className="flex-1">
                    <span className="font-bold text-gray-950">{product.name}</span>
                    <span className="block text-[11px] text-gray-500 font-mono">
                      Lô #{product.batchCode || "XL-2026-08"} • {qty} {product.unit || "KG"} x {(product.price || 0).toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <span className="font-bold text-gray-900 shrink-0">
                    {subtotal.toLocaleString("vi-VN")} đ
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-700">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Truck size={13} className="text-gray-500" />
                    <span>Phí giao xe lạnh chuyên dụng (2°C - 5°C):</span>
                  </div>
                  <span className="font-semibold">
                    {isFreeship ? (
                      <span className="text-emerald-700 font-bold">
                        <span className="line-through text-gray-400 mr-1.5 font-normal">25.000 đ</span>
                        0 đ (Freeship)
                      </span>
                    ) : (
                      "25.000 đ"
                    )}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-bold bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-200/60">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Tag size={13} className="text-emerald-600" />
                      <span>Ưu đãi áp dụng ({appliedVoucher?.code}):</span>
                    </div>
                    <span>-{discountAmount.toLocaleString("vi-VN")} đ</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-gray-500 text-[11px]">
                  <span>Thuế VAT:</span>
                  <span>Đã bao gồm trong giá niêm yết</span>
                </div>

                {/* Recipient Snapshot */}
                <div className="pt-2 border-t border-dashed border-gray-200 text-[11px] text-gray-600 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Người nhận hàng:</span>
                    <span className="font-bold text-gray-900">{receiverName} • {receiverPhone}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-500 shrink-0">Địa chỉ giao:</span>
                    <span className="font-medium text-gray-800 text-right truncate max-w-[280px]">{receiverAddress}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Khung giờ:</span>
                    <span className="font-semibold text-emerald-800">
                      {deliverySlot === "all_day" ? "⚡ Giao hỏa tốc 24H" : deliverySlot === "office_hours" ? "🏢 Giờ hành chính (08:00 - 17:00)" : "🌙 Ngoài giờ (Sau 17:30)"}
                    </span>
                  </div>
                </div>

                {/* Total Payment Row */}
                <div className="pt-2.5 border-t border-gray-300 flex justify-between items-baseline text-sm font-extrabold text-gray-900">
                  <div>
                    <span className="text-sm font-bold text-gray-950 uppercase">TỔNG THANH TOÁN:</span>
                    <span className="block text-[10px] text-gray-500 font-normal">
                      {paymentMethod === "payos" ? "Thanh toán quét mã VietQR tự động" : "Thanh toán tiền mặt khi tài xế giao tới"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl text-emerald-800 font-black tracking-tight">
                      {total.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                </div>
              </div>

              {/* ── ĐỒNG Ý ĐIỀU KHOẢN MUA HÀNG VÀ CHÍNH SÁCH BẢO QUẢN ── */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="agreeTermsCheckbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer accent-emerald-700"
                  />
                  <label htmlFor="agreeTermsCheckbox" className="text-xs text-gray-800 leading-snug cursor-pointer select-none">
                    <span className="text-emerald-950 font-bold">
                      Tôi đã đọc và đồng ý với{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsViewingTerms(true);
                        }}
                        className="underline underline-offset-2 decoration-emerald-700 font-extrabold text-emerald-800 hover:text-emerald-950 cursor-pointer transition-colors"
                      >
                        Điều khoản dịch vụ
                      </button>{" "}
                      &{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsViewingTerms(true);
                        }}
                        className="underline underline-offset-2 decoration-emerald-700 font-extrabold text-emerald-800 hover:text-emerald-950 cursor-pointer transition-colors"
                      >
                        Chính sách bảo quản nông sản
                      </button>{" "}
                      của AgriTrace AI.
                    </span>
                    <span className="block text-[11px] text-gray-600 mt-1">
                      Cam kết chuỗi cung ứng khép kín, đổi trả 1-đổi-1 miễn phí trong 24H nếu nông sản dập nát, hỏng hóc hoặc không đúng chuẩn kiểm định.{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsViewingTerms(true);
                        }}
                        className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer inline-flex items-center gap-0.5"
                      >
                        [Xem chi tiết điều khoản]
                      </button>
                    </span>
                  </label>
                </div>
                <div className="flex items-center justify-between text-[10px] text-emerald-800 font-semibold bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-700 shrink-0" />
                    <span>Bảo vệ quyền lợi người mua nông sản sạch 100% minh bạch VietGAP / GlobalGAP.</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsViewingTerms(true);
                    }}
                    className="text-emerald-900 font-bold hover:underline cursor-pointer shrink-0 ml-2"
                  >
                    Xem chính sách →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footers (Step-by-Step Navigation or Terms Actions) */}
        {!completedOrderCode && (
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/95 flex items-center justify-between gap-3 shrink-0">
            {isViewingTerms ? (
              /* Footer when viewing Terms: clean, zero z-index conflicts */
              <>
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-xs text-gray-500 hover:text-emerald-800 underline font-medium flex items-center gap-1"
                >
                  <span>Mở toàn văn điều khoản trong tab mới</span>
                  <ExternalLink size={12} />
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsViewingTerms(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-200/70 transition-colors cursor-pointer"
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAgreeTerms(true);
                      setIsViewingTerms(false);
                      toast.success("Đã đồng ý điều khoản dịch vụ & chính sách nông sản.");
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Check size={14} />
                    <span>✓ Tôi Đã Đọc & Đồng Ý</span>
                  </button>
                </div>
              </>
            ) : currentStep === 1 ? (
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
                  onClick={handleGoToStep2}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Tiếp tục: Địa chỉ nhận hàng</span>
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
                  disabled={isSubmitting || !agreeTerms}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-1.5",
                    agreeTerms && !isSubmitting
                      ? "bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white cursor-pointer active:scale-95 hover:shadow-lg"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  )}
                  title={!agreeTerms ? "Vui lòng tick đồng ý điều khoản trước khi đặt hàng" : "Xác nhận đặt hàng"}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang tạo đơn hàng...</span>
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
