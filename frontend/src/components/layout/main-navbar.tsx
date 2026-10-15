"use client";

import {
  AlertTriangle,
  Award,
  BookOpen,
  Bot,
  Calendar,
  ChevronDown,
  Compass,
  Gift,
  Globe,
  HelpCircle,
  Leaf,
  Lightbulb,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Newspaper,
  Package,
  Phone,
  QrCode,
  Shield,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  User,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/stores/auth-store";

export function MainNavbar() {
  const pathname = usePathname();
  const { user, clearSession } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<"vi" | "en">("vi");

  // Close menus on path change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    setUserMenuOpen(false);
    setLangMenuOpen(false);
  }, [pathname]);

  const isProductsActive =
    pathname.startsWith("/products") ||
    pathname.startsWith("/seasons") ||
    pathname.startsWith("/vouchers");

  const isKnowledgeActive =
    pathname.startsWith("/knowledge") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/faq") ||
    pathname.startsWith("/guides");

  const isAiActive = pathname.startsWith("/ai-hub");
  const isRolesActive = pathname.startsWith("/dashboard");

  return (
    <>
      {/* ─── Minimalist Top Strip ─── */}
      <div className="bg-[#0b2414] text-white/90 text-[12px] py-1.5 px-4 hidden md:block border-b border-emerald-950/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Leaf size={13} className="text-emerald-400" /> AgriTrace AI
            </span>
            <span className="text-white/30">•</span>
            <span className="text-white/75 text-[11.5px]">
              Hệ thống Quản lý Chuỗi Cung Ứng Nông Sản Sạch & Truy Xuất Nguồn Gốc QR Code
            </span>
          </div>

          <div className="flex items-center gap-4 text-white/75 text-[11.5px]">
            <Link href="/about" className="hover:text-emerald-300 transition-colors">
              Về chúng tôi
            </Link>
            <span className="text-white/20">|</span>
            <Link href="/knowledge?tab=export" className="hover:text-emerald-300 transition-colors">
              Xuất khẩu nông sản
            </Link>
            <span className="text-white/20">|</span>
            <Link href="/faq" className="hover:text-emerald-300 transition-colors">
              Hỏi đáp FAQ
            </Link>
            <span className="text-white/20">|</span>
            <Link href="/contact" className="hover:text-emerald-300 transition-colors">
              Liên hệ
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-emerald-300 font-medium flex items-center gap-1">
              <Phone size={11} /> 1900 1234
            </span>
          </div>
        </div>
      </div>

      {/* ─── Main Sticky Header ─── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-150 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 xl:gap-3">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#156e34] to-[#25a854] flex items-center justify-center text-white shadow-sm shadow-emerald-700/20 group-hover:scale-105 transition-transform">
              <Leaf size={19} strokeWidth={2.4} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[17px] text-gray-900 tracking-tight leading-none">
                AgriTrace <span className="text-[#1a7a3a]">AI</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                Smart Supply Chain
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
            {/* 1. Trang chủ */}
            <Link
              href="/"
              className={`px-2.5 py-2 rounded-lg text-[13px] xl:text-[13.5px] font-medium whitespace-nowrap transition-colors ${
                pathname === "/"
                  ? "text-[#1a7a3a] bg-emerald-50 font-semibold"
                  : "text-gray-700 hover:text-[#1a7a3a] hover:bg-gray-50"
              }`}
            >
              Trang Chủ
            </Link>

            {/* 2. Sản Phẩm (Dropdown) */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("products")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-[13px] xl:text-[13.5px] font-medium whitespace-nowrap transition-colors ${
                  isProductsActive
                    ? "text-[#1a7a3a] bg-emerald-50 font-semibold"
                    : "text-gray-700 hover:text-[#1a7a3a] hover:bg-gray-50"
                }`}
              >
                <span>Sản Phẩm</span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transition-transform ${activeDropdown === "products" ? "rotate-180 text-emerald-600" : ""}`}
                />
              </button>

              {activeDropdown === "products" && (
                <div className="absolute top-full left-0 w-68 pt-1.5 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    <Link
                      href="/products"
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-emerald-50/70 transition-colors group"
                    >
                      <div className="p-1.5 rounded-md bg-emerald-50 text-[#1a7a3a] group-hover:bg-[#1a7a3a] group-hover:text-white transition-colors">
                        <Package size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-gray-800">Tất cả Nông Sản</div>
                        <div className="text-[11px] text-gray-500">Rau củ quả sạch đạt chuẩn VietGAP</div>
                      </div>
                    </Link>

                    <Link
                      href="/products?category=seasonal"
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-emerald-50/70 transition-colors group"
                    >
                      <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-gray-800">Trái Cây Mùa Vụ</div>
                        <div className="text-[11px] text-gray-500">Đang vào chính vụ thu hoạch rộ</div>
                      </div>
                    </Link>

                    <Link
                      href="/seasons"
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-emerald-50/70 transition-colors group"
                    >
                      <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                        <TrendingUp size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-gray-800">Lịch Vụ & Sản Lượng</div>
                        <div className="text-[11px] text-gray-500">Kế hoạch gieo trồng & dự báo cả năm</div>
                      </div>
                    </Link>

                    <Link
                      href="/vouchers"
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-amber-50/70 transition-colors group"
                    >
                      <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Gift size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-gray-800">Kho Voucher Ưu Đãi</div>
                        <div className="text-[11px] text-gray-500">Giảm giá tới 30% & Freeship</div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Kỹ Thuật Chăm Sóc Cây Trồng (Direct link as requested) */}
            <Link
              href="/farming-techniques"
              className={`px-2.5 py-2 rounded-lg text-[13px] xl:text-[13.5px] font-medium whitespace-nowrap transition-colors ${
                pathname === "/farming-techniques"
                  ? "text-[#1a7a3a] bg-emerald-50 font-semibold"
                  : "text-gray-700 hover:text-[#1a7a3a] hover:bg-gray-50"
              }`}
            >
              Kỹ Thuật Canh Tác
            </Link>

            {/* 4. Kiến Thức & Chia Sẻ (Dropdown matching user reference) */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("knowledge")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-[13px] xl:text-[13.5px] font-medium whitespace-nowrap transition-colors ${
                  isKnowledgeActive
                    ? "text-[#1a7a3a] bg-emerald-50 font-semibold"
                    : "text-gray-700 hover:text-[#1a7a3a] hover:bg-gray-50"
                }`}
              >
                <span>Kiến Thức & Chia Sẻ</span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transition-transform ${activeDropdown === "knowledge" ? "rotate-180 text-emerald-600" : ""}`}
                />
              </button>

              {activeDropdown === "knowledge" && (
                <div className="absolute top-full left-0 w-72 pt-1.5 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    <Link
                      href="/knowledge?tab=export"
                      className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-emerald-50/70 transition-colors group"
                    >
                      <div className="p-1.5 rounded-md bg-emerald-50 text-[#1a7a3a] group-hover:bg-[#1a7a3a] group-hover:text-white transition-colors">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-gray-800">Chuyên Đề Xuất Khẩu Nông Sản</div>
                        <div className="text-[11px] text-gray-500">Mã số vùng trồng, GlobalGAP & Logistics lạnh</div>
                      </div>
                    </Link>

                    <Link
                      href="/knowledge?tab=tips"
                      className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-amber-50/70 transition-colors group"
                    >
                      <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Lightbulb size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-gray-800">Tips & Tricks (Mẹo Hay)</div>
                        <div className="text-[11px] text-gray-500">Bảo quản rau củ tươi lâu & nhận biết chín cây</div>
                      </div>
                    </Link>

                    <Link
                      href="/blog"
                      className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-blue-50/70 transition-colors group"
                    >
                      <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Newspaper size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-gray-800">Bản Tin & Blog Nông Sản</div>
                        <div className="text-[11px] text-gray-500">Xu hướng công nghệ AI & lịch mùa vụ mới</div>
                      </div>
                    </Link>

                    <Link
                      href="/guides"
                      className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-purple-50/70 transition-colors group"
                    >
                      <div className="p-1.5 rounded-md bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Compass size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-gray-800">Cẩm Nang Hướng Dẫn</div>
                        <div className="text-[11px] text-gray-500">Quy trình vận hành 4 vai trò chi tiết</div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Truy xuất QR */}
            <Link
              href="/traceability"
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[13px] xl:text-[13.5px] font-medium whitespace-nowrap transition-colors ${
                pathname === "/traceability"
                  ? "text-[#1a7a3a] bg-emerald-50 font-semibold"
                  : "text-gray-700 hover:text-[#1a7a3a] hover:bg-gray-50"
              }`}
            >
              <QrCode size={15} className="text-gray-500" />
              <span>Truy Xuất QR</span>
            </Link>

            {/* 6. Giải Pháp AI */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("ai")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[13px] xl:text-[13.5px] font-medium whitespace-nowrap transition-colors ${
                  isAiActive
                    ? "text-[#1a7a3a] bg-emerald-50 font-semibold"
                    : "text-gray-700 hover:text-[#1a7a3a] hover:bg-gray-50"
                }`}
              >
                <Sparkles size={14} className="text-emerald-600" />
                <span>Giải Pháp AI</span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transition-transform ${activeDropdown === "ai" ? "rotate-180 text-emerald-600" : ""}`}
                />
              </button>

              {activeDropdown === "ai" && (
                <div className="absolute top-full left-0 w-72 pt-1.5 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    <Link
                      href="/ai-hub#chatbot"
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-emerald-50/70 transition-colors group"
                    >
                      <div className="p-1.5 rounded-md bg-emerald-50 text-[#1a7a3a] group-hover:bg-[#1a7a3a] group-hover:text-white transition-colors">
                        <Bot size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-gray-800">1. Trợ Lý Tư Vấn AI</div>
                        <div className="text-[11px] text-gray-500">Hỏi đáp nguồn gốc, VietGAP & lô hàng</div>
                      </div>
                    </Link>

                    <Link
                      href="/ai-hub#forecasting"
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-blue-50/70 transition-colors group"
                    >
                      <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <TrendingUp size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-gray-800">2. Dự Đoán Nhu Cầu Thị Trường</div>
                        <div className="text-[11px] text-gray-500">Dự báo tiêu thụ & kế hoạch nhập hàng</div>
                      </div>
                    </Link>

                    <Link
                      href="/ai-hub#risks"
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-amber-50/70 transition-colors group"
                    >
                      <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-gray-800">3. Cảnh Báo Rủi Ro Chuỗi</div>
                        <div className="text-[11px] text-gray-500">Hạn dùng, tồn kho FEFO & giao trễ</div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 7. Về Chúng Tôi */}
            <Link
              href="/about"
              className={`px-2.5 py-2 rounded-lg text-[13px] xl:text-[13.5px] font-medium whitespace-nowrap transition-colors ${
                pathname === "/about"
                  ? "text-[#1a7a3a] bg-emerald-50 font-semibold"
                  : "text-gray-700 hover:text-[#1a7a3a] hover:bg-gray-50"
              }`}
            >
              Về Chúng Tôi
            </Link>

            {/* 8. Liên Hệ */}
            <Link
              href="/contact"
              className={`px-2.5 py-2 rounded-lg text-[13px] xl:text-[13.5px] font-medium whitespace-nowrap transition-colors ${
                pathname === "/contact"
                  ? "text-[#1a7a3a] bg-emerald-50 font-semibold"
                  : "text-gray-700 hover:text-[#1a7a3a] hover:bg-gray-50"
              }`}
            >
              Liên Hệ
            </Link>
          </nav>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* ─── Language Selector Pill (Matching reference image) ─── */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-200/90 hover:border-emerald-500 text-gray-700 hover:text-emerald-700 text-xs font-medium transition-colors bg-white shadow-2xs"
                title="Chọn ngôn ngữ hiển thị"
              >
                <Globe size={14} className="text-emerald-600" />
                <span className="hidden sm:inline">
                  {currentLang === "vi" ? "Tiếng Việt" : "English"}
                </span>
                <ChevronDown size={12} className={`text-gray-400 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      setCurrentLang("vi");
                      setLangMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-colors ${
                      currentLang === "vi" ? "bg-emerald-50 text-[#1a7a3a]" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>🇻🇳 Tiếng Việt</span>
                    {currentLang === "vi" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentLang("en");
                      setLangMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-colors ${
                      currentLang === "en" ? "bg-emerald-50 text-[#1a7a3a]" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>🇬🇧 English</span>
                    {currentLang === "en" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
                  </button>
                </div>
              )}
            </div>

            {/* Live Chat Link */}
            <Link
              href="/chat"
              title="Kênh chat hỗ trợ khách hàng & chủ nông trại"
              className="relative p-2 rounded-lg text-gray-600 hover:text-[#1a7a3a] hover:bg-emerald-50 transition-colors"
            >
              <MessageSquare size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </Link>

            {/* Cart Link */}
            <Link
              href="/cart"
              title="Giỏ hàng nông sản"
              className="relative p-2 rounded-lg text-gray-600 hover:text-[#1a7a3a] hover:bg-emerald-50 transition-colors"
            >
              <ShoppingBag size={18} />
              <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                3
              </span>
            </Link>

            {/* Cổng 5 vai trò dropdown */}
            <div
              className="relative hidden sm:block"
              onMouseEnter={() => setActiveDropdown("roles")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`p-2 rounded-lg transition-colors ${
                  isRolesActive
                    ? "text-[#1a7a3a] bg-emerald-50"
                    : "text-gray-600 hover:text-[#1a7a3a] hover:bg-gray-100"
                }`}
                title="Cổng phân quyền 5 vai trò"
              >
                <Shield size={18} />
              </button>

              {activeDropdown === "roles" && (
                <div className="absolute top-full right-0 w-72 pt-1.5 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-2.5 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Cổng 5 vai trò (Đồ án):
                    </div>
                    <Link
                      href="/dashboard/admin"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-red-50 text-gray-700 hover:text-red-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="text-[13px] font-medium">1. Quản trị viên (Admin)</span>
                      </div>
                      <span className="text-[10.5px] text-gray-400">Audit & Duyệt</span>
                    </Link>
                    <Link
                      href="/dashboard/farmer"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-[13px] font-medium">2. Nông dân (Farmer)</span>
                      </div>
                      <span className="text-[10.5px] text-gray-400">Nông trại & Lô</span>
                    </Link>
                    <Link
                      href="/dashboard/warehouse"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="text-[13px] font-medium">3. Nhân viên kho (Warehouse)</span>
                      </div>
                      <span className="text-[10.5px] text-gray-400">Nhập/Xuất FEFO</span>
                    </Link>
                    <Link
                      href="/dashboard/distributor"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-amber-50 text-gray-700 hover:text-amber-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="text-[13px] font-medium">4. Nhà phân phối (Distributor)</span>
                      </div>
                      <span className="text-[10.5px] text-gray-400">Vận chuyển QR</span>
                    </Link>
                    <Link
                      href="/dashboard/customer"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        <span className="text-[13px] font-medium">5. Khách hàng (Customer)</span>
                      </div>
                      <span className="text-[10.5px] text-gray-400">Đơn & Tích điểm</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1a7a3a] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
                    <div className="p-2 border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-emerald-50 rounded-lg transition-colors mt-1"
                    >
                      <User size={15} /> Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        clearSession();
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut size={15} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  href="/login"
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:text-[#1a7a3a] hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1a7a3a] hover:bg-[#156e34] rounded-lg shadow-xs transition-all whitespace-nowrap"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ─── Mobile Drawer ─── */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 shadow-xl max-h-[85vh] overflow-y-auto space-y-3">
            <div className="space-y-1">
              <Link
                href="/"
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-[#1a7a3a]"
              >
                Trang Chủ
              </Link>

              <div className="pt-2 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3">
                Sản Phẩm & Canh Tác:
              </div>
              <Link
                href="/products"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-[#1a7a3a]"
              >
                <Package size={15} className="text-emerald-600" /> Sản Phẩm Nông Sản
              </Link>
              <Link
                href="/farming-techniques"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-[#1a7a3a]"
              >
                <Leaf size={15} className="text-emerald-600" /> Kỹ Thuật Chăm Sóc Cây Trồng
              </Link>
              <Link
                href="/traceability"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-[#1a7a3a]"
              >
                <QrCode size={15} className="text-blue-600" /> Truy Xuất Nguồn Gốc QR
              </Link>

              <div className="pt-2 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3">
                Kiến Thức & Chia Sẻ:
              </div>
              <Link
                href="/knowledge?tab=export"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-[#1a7a3a]"
              >
                <BookOpen size={15} className="text-emerald-600" /> Chuyên Đề Xuất Khẩu Nông Sản
              </Link>
              <Link
                href="/knowledge?tab=tips"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-[#1a7a3a]"
              >
                <Lightbulb size={15} className="text-amber-500" /> Tips & Tricks (Mẹo Hay)
              </Link>
              <Link
                href="/blog"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-[#1a7a3a]"
              >
                <Newspaper size={15} className="text-blue-600" /> Bản Tin & Blog Nông Sản
              </Link>

              <div className="pt-2 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3">
                Thông Tin Doanh Nghiệp:
              </div>
              <Link
                href="/about"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-[#1a7a3a]"
              >
                <Users size={15} className="text-emerald-600" /> Về Chúng Tôi
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-[#1a7a3a]"
              >
                <Mail size={15} className="text-emerald-600" /> Liên Hệ
              </Link>
              <Link
                href="/faq"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-[#1a7a3a]"
              >
                <HelpCircle size={15} className="text-purple-600" /> Câu Hỏi Thường Gặp (FAQ)
              </Link>

              <div className="pt-2 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3">
                Cổng 5 vai trò (Đồ án):
              </div>
              <div className="grid grid-cols-1 gap-1">
                <Link href="/dashboard/admin" className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg">
                  🛡️ Admin Portal
                </Link>
                <Link href="/dashboard/farmer" className="px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 rounded-lg">
                  👨‍🌾 Nông dân (Farmer)
                </Link>
                <Link href="/dashboard/warehouse" className="px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 rounded-lg">
                  📦 Nhân viên kho (Warehouse)
                </Link>
                <Link href="/dashboard/distributor" className="px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 rounded-lg">
                  🚚 Nhà phân phối (Distributor)
                </Link>
                <Link href="/dashboard/customer" className="px-3 py-1.5 text-xs text-purple-700 hover:bg-purple-50 rounded-lg">
                  🛒 Khách hàng (Customer)
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
