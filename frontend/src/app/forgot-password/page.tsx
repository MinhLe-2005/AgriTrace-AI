"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, type ClipboardEvent, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Leaf,
  KeyRound,
  Sparkles
} from "lucide-react";

import { getApiErrorMessage } from "@/lib/api";
import { authService } from "@/services/auth.service";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step state: 1 (input email) | 2 (input OTP + new password)
  const [step, setStep] = useState<1 | 2>(1);

  // Form values
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  // Step 2 values
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
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

  function triggerShake() {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  }

  // Handle Step 1: Send OTP for forgot password
  async function handleSendResetOtp(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError("Vui lòng nhập địa chỉ email của bạn.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError("Địa chỉ email không đúng định dạng (VD: example@gmail.com).");
      return;
    }

    setIsSubmittingEmail(true);
    try {
      await authService.forgotPassword(cleanEmail);
      setStep(2);
      setCountdown(60);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setStep2Error(null);
      toast.success(`Mã OTP đặt lại mật khẩu đã được gửi đến: ${cleanEmail}`);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (error) {
      const msg = getApiErrorMessage(error);
      setEmailError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingEmail(false);
    }
  }

  // Handle OTP digit changes
  function handleOtpChange(index: number, val: string) {
    const cleanVal = val.replace(/\D/g, "");
    const newDigits = [...otpDigits];

    if (cleanVal.length > 0) {
      newDigits[index] = cleanVal[cleanVal.length - 1];
      setOtpDigits(newDigits);
      setStep2Error(null);

      if (index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    } else {
      newDigits[index] = "";
      setOtpDigits(newDigits);
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
    setStep2Error(null);

    const focusIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIdx]?.focus();
  }

  // Handle Step 2: Reset password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setStep2Error(null);

    const code = otpDigits.join("");
    if (code.length < 6) {
      setStep2Error("Vui lòng nhập đủ 6 chữ số mã OTP xác thực.");
      triggerShake();
      const firstEmpty = otpDigits.findIndex((d) => !d);
      if (firstEmpty !== -1) otpInputRefs.current[firstEmpty]?.focus();
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setStep2Error("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      triggerShake();
      return;
    }

    if (newPassword !== confirmPassword) {
      setStep2Error("Mật khẩu xác nhận không trùng khớp.");
      triggerShake();
      return;
    }

    setIsResetting(true);
    try {
      await authService.resetPassword({
        email: email.trim(),
        otp: code,
        newPassword
      });
      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.");
      router.replace("/login");
    } catch (error) {
      const msg = getApiErrorMessage(error);
      const displayMsg = msg && !msg.includes("INTERNAL") ? msg : "Mã OTP không chính xác hoặc đã hết hiệu lực.";
      setStep2Error(displayMsg);
      triggerShake();
      toast.error(displayMsg);
    } finally {
      setIsResetting(false);
    }
  }

  async function handleResendOtp() {
    if (!canResend) return;
    try {
      await authService.forgotPassword(email.trim());
      setCountdown(60);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setStep2Error(null);
      toast.success(`Đã gửi lại mã OTP mới tới email: ${email}`);
      otpInputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(`Gửi lại thất bại: ${getApiErrorMessage(error)}`);
    }
  }

  return (
    <div className="min-h-screen flex bg-neutral-50/60 antialiased font-sans">
      {/* Showcase Visual Section */}
      <div className="hidden lg:flex lg:w-[48%] relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-emerald-950 via-[#0d3b24] to-[#082818] text-white">
        {/* Ambient background glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-green-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Tagline */}
        <div className="relative z-10 animate-fade-in-up">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-xs font-medium text-emerald-300 mb-3">
            <Sparkles className="h-3 w-3" /> Bảo mật tài khoản AgriTrace
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white/95">
            Khôi phục mật khẩu an toàn & nhanh chóng qua Gmail.
          </h2>
        </div>

        {/* Hero Card & Floating Micro-Widgets */}
        <div className="relative z-10 my-auto py-6 animate-fade-in-scale">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40 group">
            <Image
              src="/images/hero-farm.png"
              alt="Nông trại xanh AgriTrace"
              width={640}
              height={400}
              priority
              className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                Bảo vệ dữ liệu
              </span>
              <p className="text-sm font-medium text-white/95 mt-0.5">
                Mã xác thực gửi trực tiếp về email chính chủ, hiệu lực 5 phút bảo vệ tài khoản
              </p>
            </div>
          </div>

          {/* Floating Widget */}
          <div className="absolute -top-2 -left-4 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-2.5 animate-float">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-md shadow-emerald-500/40">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Xác thực 2 lớp</p>
              <p className="text-[10px] text-emerald-200">Mã hóa mật khẩu an toàn</p>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
          <div className="space-y-1">
            <div className="text-lg font-extrabold text-white">100%</div>
            <div className="text-[11px] text-emerald-200/70">Bảo mật thông tin</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-extrabold text-white">5 Phút</div>
            <div className="text-[11px] text-emerald-200/70">Thời hạn mã OTP</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-extrabold text-white">Gmail</div>
            <div className="text-[11px] text-emerald-200/70">Xác thực chính chủ</div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-y-auto">
        {/* Top Back bar & Mobile Logo */}
        <div className="flex items-center justify-between max-w-md mx-auto w-full mb-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-emerald-700 transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Quay lại đăng nhập</span>
          </Link>

          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-bold text-base tracking-tight text-gray-900">
              Agri<span className="text-emerald-600">Trace</span>
            </span>
          </Link>
        </div>

        {/* Main Content Area */}
        <div className="max-w-md mx-auto w-full my-auto animate-fade-in-up">
          {/* ========================================= */}
          {/* STEP 1: NHẬP EMAIL ĐỂ NHẬN MÃ OTP        */}
          {/* ========================================= */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Quên mật khẩu?
                </h1>
                <p className="text-sm text-gray-500 mt-1.5">
                  Nhập địa chỉ email tài khoản của bạn để nhận mã xác thực đặt lại mật khẩu mới.
                </p>
              </div>

              <form noValidate onSubmit={handleSendResetOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Địa chỉ Email tài khoản
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError(null);
                      }}
                      placeholder="Nhập email của bạn (VD: name@gmail.com)"
                      className={cn(
                        "w-full h-11 pl-10 pr-3.5 text-sm rounded-xl border bg-gray-50/60 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200",
                        "focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10",
                        emailError ? "border-rose-400 bg-rose-50/20" : "border-gray-200 hover:border-gray-300"
                      )}
                    />
                  </div>
                  {emailError && (
                    <p role="alert" className="text-xs text-rose-500 font-medium pt-0.5 animate-fade-in-up">
                      {emailError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEmail}
                  className={cn(
                    "w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all duration-200",
                    "bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-700 hover:from-emerald-700 hover:to-green-800",
                    "shadow-lg shadow-emerald-700/20 hover:shadow-emerald-700/30 active:scale-[0.99]",
                    isSubmittingEmail && "opacity-75 cursor-not-allowed"
                  )}
                >
                  {isSubmittingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang gửi mã xác thực về Gmail...</span>
                    </>
                  ) : (
                    <>
                      <span>Gửi mã OTP khôi phục</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-gray-500">
                Nhớ mật khẩu rồi?{" "}
                <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          )}

          {/* ========================================= */}
          {/* STEP 2: NHẬP OTP & ĐẶT LẠI MẬT KHẨU MỚI    */}
          {/* ========================================= */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in-up">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-emerald-700 transition-colors group"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                <span>Đổi email khác</span>
              </button>

              <div className="text-center space-y-1.5">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shadow-emerald-500/10">
                  <KeyRound className="h-7 w-7 animate-pulse text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  Đặt lại mật khẩu mới
                </h2>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Nhập mã 6 số gửi đến <strong className="text-emerald-950">{email}</strong> và mật khẩu mới của bạn.
                </p>
              </div>

              <form noValidate onSubmit={handleResetPassword} className="space-y-4">
                {/* 6 Digit OTP Inputs */}
                <div className="space-y-2">
                  <label className="block text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Mã xác thực OTP (6 chữ số)
                  </label>
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
                          step2Error
                            ? "border-rose-400 bg-rose-50/30 text-rose-700"
                            : digit
                            ? "border-emerald-500 bg-white"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setStep2Error(null);
                      }}
                      placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                      className="w-full h-11 pl-10 pr-10 text-sm rounded-xl border border-gray-200 bg-gray-50/60 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setStep2Error(null);
                      }}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full h-11 pl-10 pr-10 text-sm rounded-xl border border-gray-200 bg-gray-50/60 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
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
                </div>

                {/* Error Box */}
                {step2Error && (
                  <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-medium animate-fade-in-up">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{step2Error}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isResetting}
                  className={cn(
                    "w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all duration-200",
                    "bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-700 hover:from-emerald-700 hover:to-green-800",
                    "shadow-lg shadow-emerald-700/20 hover:shadow-emerald-700/30 active:scale-[0.99]",
                    isResetting && "opacity-75 cursor-not-allowed"
                  )}
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang cập nhật mật khẩu...</span>
                    </>
                  ) : (
                    <>
                      <span>Xác nhận đổi mật khẩu</span>
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

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
          )}
        </div>

        {/* Footer info */}
        <div className="max-w-md mx-auto w-full mt-6 text-center text-[11px] text-gray-400">
          © 2026 AgriTrace Ecosystem. Nông sản sạch từ tâm.
        </div>
      </div>
    </div>
  );
}
