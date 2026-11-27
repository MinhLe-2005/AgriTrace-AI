"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, type ReactNode, type ClipboardEvent, type KeyboardEvent } from "react";
import { useForm, type Resolver } from "react-hook-form";
import {
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Truck,
  Package,
  Sprout,
  ShoppingBag,
  ArrowLeft,
  MailCheck,
  RefreshCw,
  AlertCircle,
  Phone,
  FileText,
  Building2,
  Upload,
  Clock
} from "lucide-react";

import { getApiErrorMessage } from "@/lib/api";
import { loginSchema, registerSchema } from "@/lib/validation";
import { authService } from "@/services/auth.service";
import { verificationsService } from "@/services/verifications.service";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";
import type { VerificationType } from "@/types/verification";
import { cn } from "@/utils/cn";
import { compressImageFile } from "@/utils/image-compress";

type Mode = "login" | "register";
type RegisterRoleOption = "CUSTOMER" | VerificationType;
type FormValues = {
  name: string;
  username: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const PARTNER_REGISTER_ROLES: {
  id: "FARMER" | "DISTRIBUTOR";
  label: string;
  subtitle: string;
  badge: string;
  icon: typeof Sprout;
  orgLabel: string;
  orgPlaceholder: string;
  docOptions: string[];
  noteLabel: string;
  notePlaceholder: string;
}[] = [
  {
    id: "FARMER",
    label: "Nông dân / Trang trại canh tác",
    subtitle: "Canh tác, cấp mã QR & cung ứng nông sản sạch",
    badge: "Thẩm định VietGAP",
    icon: Sprout,
    orgLabel: "Tên Nông trại / Hợp tác xã canh tác",
    orgPlaceholder: "VD: Nông trại Xanh Đà Lạt / HTX Rau Sạch Mộc Châu",
    docOptions: [
      "Chứng nhận VietGAP",
      "Chứng nhận GlobalGAP",
      "Chứng nhận Hữu cơ (Organic)",
      "Giấy phép Hợp tác xã / Hộ nông nghiệp",
    ],
    noteLabel: "Năng lực canh tác, diện tích & nông sản chủ lực",
    notePlaceholder: "VD: Diện tích 2.5ha tại Đà Lạt, sản lượng 10 tấn/tháng (Xà lách thủy canh, Dâu tây, Cà chua bi)...",
  },
  {
    id: "DISTRIBUTOR",
    label: "Nhà phân phối / Đội xe lạnh",
    subtitle: "Vận chuyển lạnh 2°C - 5°C, điều phối chặng cuối",
    badge: "Thẩm định Xe lạnh IoT",
    icon: Truck,
    orgLabel: "Tên Đội xe lạnh / Đơn vị vận chuyển",
    orgPlaceholder: "VD: Đội Xe Lạnh AgriTrans Express / Hợp tác xã Vận tải",
    docOptions: [
      "Giấy phép Kinh doanh Vận tải bằng xe ô tô",
      "Giấy Đăng kiểm Xe tải lạnh & Thiết bị giám sát nhiệt độ IoT",
      "Bằng lái xe & Hồ sơ đối tác giao nhận chặng cuối",
    ],
    noteLabel: "Thông tin phương tiện xe lạnh, tải trọng & tuyến đường",
    notePlaceholder: "VD: Sở hữu 2 xe tải lạnh 1.5 - 2.5 tấn (thùng mát 2°C - 5°C), chuyên tuyến Đà Lạt - TP.HCM & nội thành...",
  },
];

const DEMO_ACCOUNTS = [
  { username: "customer", email: "customer@sportvenue.com", label: "Khách hàng", role: "Mua sắm & Truy xuất", icon: ShoppingBag },
  { username: "farmer", email: "farmer@sportvenue.com", label: "Nông dân", role: "Quản lý nông trại", icon: Sprout },
  { username: "warehouse", email: "warehouse@sportvenue.com", label: "Thủ kho", role: "Kiểm định & Lưu kho", icon: Package },
  { username: "distributor", email: "distributor@sportvenue.com", label: "Nhà phân phối", role: "Vận chuyển & Giao hàng", icon: Truck },
  { username: "admin", email: "admin@sportvenue.com", label: "Quản trị viên", role: "Toàn quyền hệ thống", icon: ShieldCheck },
];

export function AuthForm({
  mode,
  isPartnerFlow = false,
  defaultPartnerRole = "FARMER",
}: {
  mode: Mode;
  isPartnerFlow?: boolean;
  defaultPartnerRole?: "FARMER" | "DISTRIBUTOR";
}) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  // Form states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  // Role & Dossier states (only active in partner flow)
  const [selectedRole, setSelectedRole] = useState<RegisterRoleOption>(
    isPartnerFlow ? defaultPartnerRole : "CUSTOMER"
  );
  const [organizationName, setOrganizationName] = useState("");
  const [documentType, setDocumentType] = useState("Chứng nhận VietGAP");
  const [documentUrl, setDocumentUrl] = useState("");
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [dossierNote, setDossierNote] = useState("");
  const [dossierError, setDossierError] = useState<string | null>(null);
  const docFileInputRef = useRef<HTMLInputElement | null>(null);

  // OTP flow states (for register)
  const [step, setStep] = useState<"form" | "otp">("form");
  const [pendingData, setPendingData] = useState<FormValues | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const schema = mode === "login" ? loginSchema : registerSchema;
  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    setFocus,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: "", username: "", phone: "", email: "", password: "", confirmPassword: "" }
  });

  const isLogin = mode === "login";

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Focus first OTP input when step changes to OTP
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  function triggerShake() {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  }

  async function onSubmit(values: FormValues) {
    if (isLogin) {
      try {
        const session = await authService.login({ email: values.email, password: values.password });
        setSession(session);
        toast.success(`Đăng nhập thành công! Chào mừng ${session.user.name}`);
        // Giữ luồng đăng nhập hiện có cho các vai trò khác, đồng thời đưa Distributor
        // trực tiếp vào khu vực điều phối để không phải đi qua trang chủ.
        const roles = session.user.roles || [];
        if (roles.includes("ADMIN")) {
          router.replace("/dashboard/admin");
        } else if (roles.includes("WAREHOUSE") || roles.includes("WAREHOUSE_STAFF")) {
          router.replace("/dashboard/warehouse");
        } else if (roles.includes("DISTRIBUTOR")) {
          router.replace("/dashboard/distributor");
        } else if (roles.includes("FARMER")) {
          router.replace("/dashboard/farmer");
        } else {
          try {
            const myReqs = await verificationsService.myRequests(session.user.email);
            if (myReqs && myReqs.length > 0) {
              const latest = myReqs[0];
              if (latest.status === "PENDING" || latest.status === "UNDER_REVIEW") {
                toast.info("Hồ sơ đăng ký vị trí của bạn đang chờ Ban Quản Trị phê duyệt.");
                router.replace("/dashboard");
                return;
              }
              if (latest.status === "REJECTED" || latest.status === "CHANGES_REQUESTED") {
                toast.info("Hồ sơ vị trí của bạn có phản hồi từ Ban Quản Trị. Vui lòng kiểm tra.");
                router.replace("/dashboard");
                return;
              }
            }
          } catch {
            // ignore and fallback to normal redirect
          }
          let redirectUrl = "/";
          if (typeof window !== "undefined") {
            const savedRedirect = sessionStorage.getItem("agri_post_login_redirect");
            if (savedRedirect && savedRedirect.startsWith("/")) {
              redirectUrl = savedRedirect;
              sessionStorage.removeItem("agri_post_login_redirect");
            }
          }
          router.replace(redirectUrl);
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    } else {
      // Validate role dossier if in partner onboarding flow
      if (isPartnerFlow && selectedRole !== "CUSTOMER") {
        if (!organizationName.trim() || organizationName.trim().length < 3) {
          const msg = "Vui lòng nhập tên đơn vị / nông trại / đội xe để xét duyệt.";
          setDossierError(msg);
          toast.error(msg);
          return;
        }
        if (!documentUrl.trim()) {
          const msg = "Vui lòng nhập mã số giấy phép / link minh chứng hoặc tải ảnh hồ sơ xác minh.";
          setDossierError(msg);
          toast.error(msg);
          return;
        }
        if (!dossierNote.trim() || dossierNote.trim().length < 10) {
          const msg = "Vui lòng mô tả ngắn gọn năng lực / kinh nghiệm / phương tiện (tối thiểu 10 ký tự).";
          setDossierError(msg);
          toast.error(msg);
          return;
        }
      }
      setDossierError(null);

      // Register mode -> Call backend send OTP email!
      setIsSendingOtp(true);
      try {
        await authService.sendOtp(values.email);
        setPendingData(values);
        setStep("otp");
        setCountdown(60);
        setCanResend(false);
        setOtpDigits(["", "", "", "", "", ""]);
        setOtpError(null);
        toast.success(`Mã xác thực OTP đã được gửi về Gmail: ${values.email}`);
      } catch (error) {
        const msg = getApiErrorMessage(error);
        toast.error(msg);
      } finally {
        setIsSendingOtp(false);
      }
    }
  }

  // Handle OTP digit change
  function handleOtpChange(index: number, val: string) {
    const cleanVal = val.replace(/\D/g, "");
    const newDigits = [...otpDigits];

    if (cleanVal.length > 0) {
      newDigits[index] = cleanVal[cleanVal.length - 1];
      setOtpDigits(newDigits);
      setOtpError(null);

      // Auto move to next input
      if (index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    } else {
      newDigits[index] = "";
      setOtpDigits(newDigits);
    }

    // Auto submit if all 6 digits are entered
    if (newDigits.every((d) => d !== "")) {
      verifyOtpCode(newDigits.join(""));
    }
  }

  function handleOtpKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);
    setOtpError(null);

    const focusIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIdx]?.focus();

    if (pasted.length === 6) {
      verifyOtpCode(pasted);
    }
  }

  function handleManualVerifyClick() {
    const emptyIdx = otpDigits.findIndex((d) => !d);
    if (emptyIdx !== -1) {
      setOtpError("Vui lòng nhập đầy đủ 6 chữ số mã xác thực OTP.");
      triggerShake();
      otpInputRefs.current[emptyIdx]?.focus();
      return;
    }

    verifyOtpCode(otpDigits.join(""));
  }

  async function verifyOtpCode(code: string) {
    if (!pendingData) return;

    if (code.length < 6) {
      setOtpError("Vui lòng nhập đủ 6 chữ số mã OTP.");
      triggerShake();
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    try {
      // 1. Verify OTP with Backend (real verification)
      await authService.verifyOtp(pendingData.email, code);

      // 2. Complete registration on Backend
      const session = await authService.register({
        name: pendingData.name,
        username: pendingData.username,
        phone: pendingData.phone,
        email: pendingData.email,
        password: pendingData.password,
        confirmPassword: pendingData.confirmPassword
      });

      setSession(session);

      // 3. Nếu là luồng đăng ký đối tác (FARMER / DISTRIBUTOR) -> Gửi hồ sơ chờ duyệt!
      if (isPartnerFlow && selectedRole !== "CUSTOMER") {
        try {
          await verificationsService.submit({
            type: selectedRole,
            organizationName: organizationName.trim(),
            documentType: documentType.trim(),
            documentUrl: documentUrl.trim(),
            note: `[SĐT: ${pendingData.phone}] ${dossierNote.trim()}`,
            subjectEmail: pendingData.email,
          });
        } catch (verifyErr) {
          console.error("Failed to submit verification dossier:", verifyErr);
        }
        const roleObj = PARTNER_REGISTER_ROLES.find((r) => r.id === selectedRole);
        toast.success(
          `Đăng ký tài khoản & gửi hồ sơ đối tác "${roleObj?.label || selectedRole}" thành công! Vui lòng chờ Ban Quản Trị thẩm định.`
        );
        router.replace("/dashboard");
        return;
      }

      toast.success("Xác thực OTP thành công! Chào mừng bạn gia nhập AgriTrace.");
      router.replace("/");
    } catch (error) {
      const msg = getApiErrorMessage(error);
      const displayMsg = msg && !msg.includes("INTERNAL") ? msg : "Mã OTP không chính xác hoặc đã hết hiệu lực. Vui lòng kiểm tra lại Gmail!";
      setOtpError(displayMsg);
      triggerShake();
      toast.error(displayMsg);
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendOtp() {
    if (!canResend || !pendingData) return;
    try {
      await authService.sendOtp(pendingData.email);
      setCountdown(60);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError(null);
      toast.success(`Đã gửi lại mã OTP mới tới email ${pendingData.email}`);
      otpInputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(`Gửi lại thất bại: ${getApiErrorMessage(error)}`);
    }
  }

  function fillDemoAccount(account: (typeof DEMO_ACCOUNTS)[number]) {
    setActiveDemo(account.username);
    reset({ ...getValues(), email: account.email, password: "123456" });
    clearErrors(["email", "password"]);
    requestAnimationFrame(() => setFocus("email"));
  }

  function handleSelectRole(role: "FARMER" | "DISTRIBUTOR") {
    setSelectedRole(role);
    setDossierError(null);
    const roleConfig = PARTNER_REGISTER_ROLES.find((r) => r.id === role);
    if (roleConfig && roleConfig.docOptions.length > 0) {
      setDocumentType(roleConfig.docOptions[0]);
    }
  }

  async function handleDocFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDoc(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 900, 0.78);
      setDocumentUrl(compressedDataUrl);
      setUploadedDocName(file.name);
      setDossierError(null);
      toast.success(`Đã đính kèm ảnh minh chứng: ${file.name}`);
    } catch {
      toast.error("Không thể xử lý tệp ảnh. Vui lòng chọn ảnh JPG/PNG hoặc nhập link tài liệu.");
    } finally {
      setIsUploadingDoc(false);
    }
  }

  const activeRoleConfig = PARTNER_REGISTER_ROLES.find((r) => r.id === selectedRole) || PARTNER_REGISTER_ROLES[0];

  // ==========================================
  // VIEW: STEP 2 - OTP VERIFICATION
  // ==========================================
  if (step === "otp" && pendingData) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        {/* Back to form button */}
        <button
          type="button"
          onClick={() => {
            setStep("form");
            setOtpError(null);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-emerald-700 transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Quay lại chỉnh sửa thông tin</span>
        </button>

        {/* OTP Header Icon */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shadow-emerald-500/10">
            <MailCheck className="h-7 w-7 animate-pulse text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Kiểm tra hộp thư Gmail của bạn
          </h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
            Hệ thống AgriTrace đã gửi mã xác thực 6 số đến:
            <br />
            <strong className="text-emerald-900 font-semibold">{pendingData.email}</strong>
          </p>
        </div>

        {/* 6 Digit OTP Inputs */}
        <div className="space-y-3">
          <div className={cn("flex justify-center gap-2 sm:gap-2.5", isShaking && "animate-shake")}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpInputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                onPaste={handleOtpPaste}
                className={cn(
                  "w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border bg-gray-50/60 text-gray-900 outline-none transition-all duration-200",
                  "focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15",
                  otpError
                    ? "border-rose-400 bg-rose-50/30 text-rose-700"
                    : digit
                    ? "border-emerald-500 bg-white"
                    : "border-gray-200 hover:border-gray-300"
                )}
              />
            ))}
          </div>

          {/* Error Message Alert */}
          {otpError && (
            <div className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-medium animate-fade-in-up">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          <p className="text-center text-[11px] text-gray-400">
            Không thấy email? Hãy kiểm tra thêm mục <b>Thư rác (Spam)</b>
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={isVerifying}
          onClick={handleManualVerifyClick}
          className={cn(
            "w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all duration-200",
            "bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-700 hover:from-emerald-700 hover:to-green-800",
            "shadow-lg shadow-emerald-700/20 hover:shadow-emerald-700/30 active:scale-[0.99]",
            isVerifying && "opacity-75 cursor-not-allowed"
          )}
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang kiểm tra mã OTP...</span>
            </>
          ) : (
            <>
              <span>Xác nhận & Kích hoạt tài khoản</span>
              <CheckCircle2 className="h-4 w-4" />
            </>
          )}
        </button>

        {/* Resend Countdown */}
        <div className="text-center text-xs text-gray-500">
          {canResend ? (
            <button
              type="button"
              onClick={handleResendOtp}
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Gửi lại mã OTP mới</span>
            </button>
          ) : (
            <span>
              Gửi lại mã sau <b className="text-gray-700 font-mono">{countdown}s</b>
            </span>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: STEP 1 - STANDARD FORM
  // ==========================================
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 0. Chọn Vai Trò Đối Tác (Chỉ hiển thị trong luồng Đăng ký đối tác) */}
      {!isLogin && isPartnerFlow && (
        <div className="space-y-2.5 pb-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
              Mô hình đối tác hợp tác
            </label>
            <span className="text-[11px] font-medium text-emerald-700">
              Thẩm định & kích hoạt quyền trong 24h
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PARTNER_REGISTER_ROLES.map((roleOpt) => {
              const Icon = roleOpt.icon;
              const isSelected = selectedRole === roleOpt.id;
              return (
                <button
                  key={roleOpt.id}
                  type="button"
                  onClick={() => handleSelectRole(roleOpt.id)}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/90 ring-2 ring-emerald-500/20 shadow-xs"
                      : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-gray-50/60"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg",
                        isSelected ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        isSelected
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {roleOpt.badge}
                    </span>
                  </div>
                  <span className={cn("text-xs font-bold", isSelected ? "text-emerald-950" : "text-gray-800")}>
                    {roleOpt.label}
                  </span>
                  <span className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{roleOpt.subtitle}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. Họ và tên (Register only) */}
      {!isLogin && (
        <Field label="Họ và tên" error={errors.name?.message}>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <User className="h-4 w-4" />
            </div>
            <input
              type="text"
              autoComplete="name"
              placeholder="Ví dụ: Lê Quang Minh"
              className={cn(
                "w-full h-11 pl-10 pr-3.5 text-sm rounded-xl border bg-gray-50/60 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200",
                "focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10",
                errors.name ? "border-rose-400 bg-rose-50/20" : "border-gray-200 hover:border-gray-300"
              )}
              {...register("name")}
            />
          </div>
        </Field>
      )}

      {/* 2. Tên tài khoản / Username (Register only) */}
      {!isLogin && (
        <Field label="Tên tài khoản (Username)" error={errors.username?.message}>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <AtSign className="h-4 w-4" />
            </div>
            <input
              type="text"
              autoComplete="username"
              placeholder="Ví dụ: lequangminh2026"
              className={cn(
                "w-full h-11 pl-10 pr-3.5 text-sm rounded-xl border bg-gray-50/60 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200",
                "focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10",
                errors.username ? "border-rose-400 bg-rose-50/20" : "border-gray-200 hover:border-gray-300"
              )}
              {...register("username")}
            />
          </div>
        </Field>
      )}

            {/* 2.5. Số điện thoại (Register only) */}
      {!isLogin && (
        <Field label="Số điện thoại liên hệ" error={errors.phone?.message}>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <Phone className="h-4 w-4" />
            </div>
            <input
              type="tel"
              autoComplete="tel"
              placeholder="Ví dụ: 0988776655"
              className={cn(
                "w-full h-11 pl-10 pr-3.5 text-sm rounded-xl border bg-gray-50/60 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200",
                "focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10",
                errors.phone ? "border-rose-400 bg-rose-50/20" : "border-gray-200 hover:border-gray-300"
              )}
              {...register("phone")}
            />
          </div>
        </Field>
      )}

      {/* 3. Email / Username for Login */}
      <Field
        label={isLogin ? "Tài khoản hoặc Email" : "Địa chỉ Email"}
        error={errors.email?.message}
      >
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
            <Mail className="h-4 w-4" />
          </div>
          <input
            type={isLogin ? "text" : "email"}
            autoComplete="email"
            placeholder={isLogin ? "Nhập tên tài khoản hoặc email" : "tenban@gmail.com"}
            className={cn(
              "w-full h-11 pl-10 pr-3.5 text-sm rounded-xl border bg-gray-50/60 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200",
              "focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10",
              errors.email ? "border-rose-400 bg-rose-50/20" : "border-gray-200 hover:border-gray-300"
            )}
            {...register("email")}
          />
        </div>
      </Field>

      {/* 4. Mật khẩu */}
      <Field
        label="Mật khẩu"
        error={errors.password?.message}
        action={
          isLogin ? (
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          ) : undefined
        }
      >
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
            <Lock className="h-4 w-4" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder={isLogin ? "Mật khẩu (demo: 123456)" : "Tối thiểu 6 ký tự"}
            className={cn(
              "w-full h-11 pl-10 pr-10 text-sm rounded-xl border bg-gray-50/60 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200",
              "focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10",
              errors.password ? "border-rose-400 bg-rose-50/20" : "border-gray-200 hover:border-gray-300"
            )}
            {...register("password")}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      {/* 5. Xác nhận mật khẩu (Register only) */}
      {!isLogin && (
        <Field label="Xác nhận mật khẩu" error={errors.confirmPassword?.message}>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu vừa đặt"
              className={cn(
                "w-full h-11 pl-10 pr-10 text-sm rounded-xl border bg-gray-50/60 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200",
                "focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10",
                errors.confirmPassword ? "border-rose-400 bg-rose-50/20" : "border-gray-200 hover:border-gray-300"
              )}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
      )}

      {/* 6. Hồ Sơ Năng Lực Xét Duyệt Vị Trí (Chỉ khi trong luồng Đăng ký đối tác) */}
      {!isLogin && isPartnerFlow && selectedRole !== "CUSTOMER" && (
        <div className="rounded-2xl border border-gray-200/90 bg-[#FBF9F5]/80 p-5 space-y-4 animate-fade-in shadow-2xs">
          <div className="flex items-start justify-between gap-2 border-b border-gray-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-700 text-white shrink-0 shadow-2xs">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#16261E]">
                  Hồ sơ năng lực: {activeRoleConfig.label}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Ban Quản Trị AgriTrace thẩm định hồ sơ trong 24 giờ trước khi kích hoạt quyền.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 shrink-0">
              <Clock className="h-3 w-3" /> Thẩm định 24h
            </span>
          </div>

          {/* Tên tổ chức / nông trại / kho / đội xe */}
          <Field label={activeRoleConfig.orgLabel}>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Building2 className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => {
                  setOrganizationName(e.target.value);
                  setDossierError(null);
                }}
                placeholder={activeRoleConfig.orgPlaceholder}
                className="w-full h-10 pl-10 pr-3.5 text-xs sm:text-sm rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 shadow-2xs"
              />
            </div>
          </Field>

          {/* Loại giấy tờ / Chứng chỉ */}
          <Field label="Loại giấy tờ / Chứng chỉ năng lực">
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-gray-300 bg-white text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 shadow-2xs cursor-pointer"
            >
              {activeRoleConfig.docOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>

          {/* Mã số giấy phép / Link hồ sơ hoặc Tải ảnh */}
          <Field label="Mã số chứng nhận / Link tra cứu hoặc Bản chụp hồ sơ">
            <div className="space-y-3">
              <input
                type="text"
                value={documentUrl.startsWith("data:image/") ? "" : documentUrl}
                onChange={(e) => {
                  setUploadedDocName(null);
                  setDocumentUrl(e.target.value);
                  setDossierError(null);
                }}
                placeholder="Nhập mã chứng nhận VietGAP (VD: VG-2026-ĐL-0899) hoặc link hồ sơ..."
                className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 shadow-2xs"
              />

              <input
                ref={docFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleDocFileChange}
                className="hidden"
              />

              {documentUrl.startsWith("data:image/") ? (
                <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/70 flex items-center justify-between text-xs text-emerald-900">
                  <span className="truncate font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                    Đã đính kèm ảnh: {uploadedDocName || "Hồ sơ minh chứng"}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => docFileInputRef.current?.click()}
                      className="text-emerald-800 underline hover:text-emerald-950 font-semibold cursor-pointer"
                    >
                      Đổi ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDocumentUrl("");
                        setUploadedDocName(null);
                      }}
                      className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isUploadingDoc}
                  onClick={() => docFileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-gray-300 hover:border-emerald-600 bg-white hover:bg-emerald-50/20 text-xs font-semibold text-gray-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  {isUploadingDoc ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                      <span>Đang nén và xử lý ảnh...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-emerald-700" />
                      <span>Bấm để tải ảnh chụp giấy phép / chứng chỉ VietGAP</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </Field>

          {/* Ghi chú năng lực / kinh nghiệm */}
          <Field label={activeRoleConfig.noteLabel}>
            <textarea
              rows={3}
              value={dossierNote}
              onChange={(e) => {
                setDossierNote(e.target.value);
                setDossierError(null);
              }}
              placeholder={activeRoleConfig.notePlaceholder}
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 shadow-2xs leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
              <span>Mô tả diện tích canh tác, sản lượng hoặc phương tiện xe lạnh.</span>
              <span className={dossierNote.trim().length >= 10 ? "text-emerald-700 font-semibold" : "text-gray-400"}>
                {dossierNote.trim().length} ký tự
              </span>
            </div>
          </Field>

          {dossierError && (
            <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{dossierError}</span>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || isSendingOtp}
        className={cn(
          "w-full h-11 mt-2 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all duration-200",
          "bg-[#166534] hover:bg-[#14532D]",
          "shadow-md shadow-emerald-900/15 active:scale-[0.99]",
          (isSubmitting || isSendingOtp) && "opacity-75 cursor-not-allowed"
        )}
      >
        {isSubmitting || isSendingOtp ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang gửi mã xác thực về Email...</span>
          </>
        ) : (
          <>
            <span>
              {isLogin
                ? "Đăng nhập"
                : isPartnerFlow
                ? "Nhận mã OTP & Gửi hồ sơ đối tác"
                : "Nhận mã OTP tạo tài khoản"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Demo Accounts Quick-Select for Login & Reference */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">
            {isLogin ? "Tài khoản demo (Pass: 123456)" : "Tài khoản trải nghiệm nhanh (Pass: 123456)"}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">Bấm để tự điền</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            const isSelected = activeDemo === acc.username;
            return (
              <button
                key={acc.username}
                type="button"
                onClick={() => {
                  if (!isLogin) {
                    router.push("/login");
                  }
                  fillDemoAccount(acc);
                }}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left text-xs transition-all",
                  isSelected
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-medium ring-2 ring-emerald-500/20"
                    : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/40"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-emerald-700" : "text-gray-500")} />
                <span className="truncate">{acc.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  action,
  children
}: {
  label: string;
  error?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
          {label}
        </label>
        {action}
      </div>
      {children}
      {error && (
        <p role="alert" className="text-xs text-rose-500 font-medium pt-0.5 animate-fade-in-up">
          {error}
        </p>
      )}
    </div>
  );
}
