import { AuthForm } from "@/features/auth/auth-form";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, QrCode, Sparkles, Leaf, Sprout, ArrowRight } from "lucide-react";

export const metadata = { title: "Đăng ký tài khoản | AgriTrace" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex bg-[#FBF9F5] text-[#16261E] antialiased font-sans">
      {/* Form Section */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-y-auto">
        {/* Top Back bar & Mobile Logo */}
        <div className="flex items-center justify-between max-w-md mx-auto w-full mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-[#166534] transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Về trang chủ</span>
          </Link>

          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#16261E] text-amber-300 shadow-sm">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-serif font-bold text-base tracking-tight text-[#16261E]">
              Agri<span className="text-[#166534]">Trace</span>
            </span>
          </Link>
        </div>

        {/* Main Form Container */}
        <div className="max-w-lg mx-auto w-full my-auto animate-fade-in-up">
          {/* Tabs: Đăng nhập / Đăng ký */}
          <div className="flex p-1 bg-[#F6F3EC] border border-[#E4DFD5] rounded-xl mb-6">
            <Link
              href="/login"
              className="flex-1 py-2 text-center text-xs font-semibold text-stone-500 hover:text-[#16261E] transition-colors rounded-lg"
            >
              Đăng nhập
            </Link>
            <span className="flex-1 py-2 text-center text-xs font-semibold bg-white text-[#16261E] rounded-lg shadow-sm">
              Đăng ký tài khoản
            </span>
          </div>

          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16261E] text-amber-300 text-[11px] font-mono font-bold mb-2.5">
              <Sparkles className="h-3 w-3" /> THÀNH VIÊN MUA SẮM & TÍCH ĐIỂM
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#16261E] tracking-tight">
              Đăng ký tài khoản khách hàng
            </h1>
            <p className="text-sm text-stone-600 mt-1.5">
              Tạo tài khoản để mua sắm nông sản hữu cơ tươi sạch, truy xuất nguồn gốc QR và nhận voucher giảm 30%.
            </p>
          </div>

          <AuthForm mode="register" />

          {/* Partner Onboarding Link Card */}
          <div className="mt-8 p-4 rounded-2xl bg-[#F6F3EC] border border-[#E4DFD5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#16261E] text-amber-300 shadow-sm mt-0.5">
                <Sprout className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-[#16261E]">
                  Bạn là Chủ Trang Trại hoặc Đơn Vị Vận Chuyển?
                </p>
                <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                  Đăng ký gia nhập mạng lưới đối tác cung ứng và xe lạnh cùng AgriTrace AI.
                </p>
              </div>
            </div>
            <Link
              href="/partner-register"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs shrink-0"
            >
              <span>Đăng ký đối tác</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            Bằng việc đăng ký, bạn đồng ý với{" "}
            <Link href="/terms" className="text-gray-600 underline hover:text-emerald-700">
              Điều khoản
            </Link>{" "}
            &{" "}
            <Link href="/privacy" className="text-gray-600 underline hover:text-emerald-700">
              Chính sách bảo mật
            </Link>{" "}
            của AgriTrace.
          </p>
        </div>

        {/* Footer info */}
        <div className="max-w-md mx-auto w-full mt-6 text-center text-[11px] text-gray-400">
          © 2026 AgriTrace Ecosystem. Nông sản sạch từ tâm.
        </div>
      </div>

      {/* Showcase Visual Section */}
      <div className="hidden lg:flex lg:w-[48%] relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#16261E] via-[#1B3326] to-[#112018] text-white border-l border-[#243B2E]">
        {/* Ambient background glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Tagline */}
        <div className="relative z-10 animate-fade-in-up">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/30 text-xs font-mono font-bold text-amber-300 mb-3">
            <Sparkles className="h-3 w-3" /> CHUỖI CUNG ỨNG NÔNG NGHIỆP SỐ
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white/95 leading-snug">
            Minh bạch từng luống rau, vững tin từng bữa ăn.
          </h2>
        </div>

        {/* Hero Card & Floating Micro-Widgets */}
        <div className="relative z-10 my-auto py-6 animate-fade-in-scale">
          {/* Main Visual Image Card */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40 group">
            <Image
              src="/images/fresh-produce.png"
              alt="Nông sản sạch"
              width={640}
              height={400}
              priority
              className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                Chứng nhận chất lượng
              </span>
              <p className="text-sm font-medium text-white/95 mt-0.5">
                Rau củ hữu cơ tiêu chuẩn VietGAP thu hoạch tại nông trại Đà Lạt
              </p>
            </div>
          </div>

          {/* Floating Widget 1: QR Verification */}
          <div className="absolute -top-2 -right-4 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-2.5 animate-float">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-md shadow-emerald-500/40">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Mã QR truy xuất</p>
              <p className="text-[10px] text-emerald-200">Kiểm tra nguồn gốc 1-chạm</p>
            </div>
          </div>

          {/* Floating Widget 2: Security & Trust */}
          <div className="absolute -bottom-4 -left-4 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-2.5 animate-float-delayed">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500 text-white shadow-md shadow-green-500/40">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Kiểm định minh bạch</p>
              <p className="text-[10px] text-green-200">Giám sát nhật ký từ nông hộ</p>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
          <div className="space-y-1">
            <div className="text-lg font-extrabold text-white">100%</div>
            <div className="text-[11px] text-emerald-200/70">Nông sản sạch VietGAP</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-extrabold text-white">24/7</div>
            <div className="text-[11px] text-emerald-200/70">Giám sát nhật ký canh tác</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-extrabold text-white">5 Vai trò</div>
            <div className="text-[11px] text-emerald-200/70">Kết nối chuỗi cung ứng</div>
          </div>
        </div>
      </div>
    </div>
  );
}
