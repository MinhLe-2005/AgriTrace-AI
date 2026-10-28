import { AuthForm } from "@/features/auth/auth-form";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, QrCode, Sparkles, Leaf } from "lucide-react";

export const metadata = { title: "Đăng ký tài khoản | AgriTrace" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex bg-neutral-50/60 antialiased font-sans">
      {/* Form Section */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-y-auto">
        {/* Top Back bar & Mobile Logo */}
        <div className="flex items-center justify-between max-w-md mx-auto w-full mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-emerald-700 transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Về trang chủ</span>
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

        {/* Main Form Container */}
        <div className="max-w-md mx-auto w-full my-auto animate-fade-in-up">
          {/* Tabs: Đăng nhập / Đăng ký */}
          <div className="flex p-1 bg-gray-100/80 rounded-xl mb-6">
            <Link
              href="/login"
              className="flex-1 py-2 text-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors rounded-lg"
            >
              Đăng nhập
            </Link>
            <span className="flex-1 py-2 text-center text-xs font-semibold bg-white text-emerald-800 rounded-lg shadow-sm">
              Đăng ký tài khoản
            </span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Tạo tài khoản mới
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Đăng ký để khám phá nông sản sạch và theo dõi nguồn gốc xuất xứ.
            </p>
          </div>

          {/* Role notice - cleanly styled */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 mb-5 text-xs text-emerald-900">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px] mt-0.5">
              i
            </span>
            <p className="leading-relaxed">
              Tài khoản mới mặc định là <strong className="font-semibold text-emerald-950">Khách hàng</strong>. Ban quản trị sẽ nâng quyền nếu bạn là Nông dân, Nhân viên kho hoặc Nhà phân phối.
            </p>
          </div>

          <AuthForm mode="register" />

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
      <div className="hidden lg:flex lg:w-[48%] relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-emerald-950 via-[#0d3b24] to-[#082818] text-white">
        {/* Ambient background glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-green-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Tagline */}
        <div className="relative z-10 animate-fade-in-up">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-xs font-medium text-emerald-300 mb-3">
            <Sparkles className="h-3 w-3" /> Chuỗi cung ứng nông nghiệp số
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white/95">
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
