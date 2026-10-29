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
  AlertCircle
} from "lucide-react";

import { getApiErrorMessage } from "@/lib/api";
import { loginSchema, registerSchema } from "@/lib/validation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

type Mode = "login" | "register";
type FormValues = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const DEMO_ACCOUNTS = [
  { username: "customer", label: "Khách hàng", role: "Mua sắm & Truy xuất", icon: ShoppingBag },
  { username: "farmer", label: "Nông dân", role: "Quản lý nông trại", icon: Sprout },
  { username: "warehouse", label: "Thủ kho", role: "Kiểm định & Lưu kho", icon: Package },
  { username: "distributor", label: "Nhà phân phối", role: "Vận chuyển & Giao hàng", icon: Truck },
  { username: "admin", label: "Quản trị viên", role: "Toàn quyền hệ thống", icon: ShieldCheck },
];

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  // Form states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

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
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: "", username: "", email: "", password: "", confirmPassword: "" }
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
          // Khách hàng / User thông thường -> chuyển về Trang chủ
          router.replace("/");
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    } else {
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
        email: pendingData.email,
        password: pendingData.password,
        confirmPassword: pendingData.confirmPassword
      });

      setSession(session);
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

  function fillDemoAccount(username: string) {
    setActiveDemo(username);
    setValue("email", username, { shouldValidate: true });
    setValue("password", "123456", { shouldValidate: true });
  }

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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || isSendingOtp}
        className={cn(
          "w-full h-11 mt-2 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all duration-200",
          "bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-700 hover:from-emerald-700 hover:to-green-800",
          "shadow-lg shadow-emerald-700/20 hover:shadow-emerald-700/30 active:scale-[0.99]",
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
            <span>{isLogin ? "Đăng nhập" : "Nhận mã OTP qua Email"}</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Demo Accounts Quick-Select for Login */}
      {isLogin && (
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Tài khoản demo (Pass: 123456)</span>
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
                  onClick={() => fillDemoAccount(acc.username)}
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
      )}
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
