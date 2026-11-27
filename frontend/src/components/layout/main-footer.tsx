"use client";

import {
  Award,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Gift,
  Leaf,
  Mail,
  MapPin,
  Package,
  Phone,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserCheck,
  Users,
  Warehouse,
} from "lucide-react";
import Link from "next/link";

export function MainFooter() {
  const actors = [
    {
      role: "Quản Trị Viên (Admin)",
      desc: "Quản lý hệ thống & phân quyền",
      href: "/dashboard/admin",
      icon: "👑",
      badge: "Admin",
      badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
    },
    {
      role: "Nông Dân (Farmer)",
      desc: "Quản lý nông trại, lô hái & mùa vụ",
      href: "/dashboard/farmer",
      icon: "🌾",
      badge: "Nông trại",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    {
      role: "Thủ Kho (Warehouse)",
      desc: "Kho lạnh FEFO & quản lý tồn kho",
      href: "/dashboard/warehouse",
      icon: "📦",
      badge: "Kho lạnh",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
    {
      role: "Nhà Phân Phối (Distributor)",
      desc: "Vận chuyển xe lạnh & lộ trình giao",
      href: "/dashboard/distributor",
      icon: "🚚",
      badge: "Vận chuyển",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    {
      role: "Khách Hàng (Customer)",
      desc: "Mua sắm, ví voucher & tích điểm",
      href: "/dashboard/customer",
      icon: "🛒",
      badge: "Mua hàng",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    },
  ];

  return (
    <footer className="bg-[#0b1d12] text-white border-t border-emerald-950/80">
      {/* ─── Khối Cổng 5 Vai Trò (Actors Hub) Nổi Bật & Chuyên Nghiệp ─── */}
      <div className="border-b border-white/10 bg-[#0e2417]/80 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-base font-extrabold text-white tracking-wide uppercase">
                  Cổng Đăng Nhập 5 Vai Trò Chuỗi Cung Ứng
                </h3>
              </div>
              <p className="text-xs text-emerald-200/70 mt-1">
                Chọn vai trò để truy cập nhanh bảng điều khiển nghiệp vụ tương ứng
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-900/40 hover:bg-emerald-900/70 px-3.5 py-1.5 rounded-xl border border-emerald-700/50 transition-all self-start md:self-auto"
            >
              Trang Đăng Nhập Chung <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {actors.map((actor) => (
              <Link
                key={actor.role}
                href={actor.href}
                className="group relative p-3.5 rounded-2xl bg-[#122e1e]/90 hover:bg-[#183d28] border border-emerald-900/60 hover:border-emerald-500/60 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{actor.icon}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${actor.badgeColor}`}
                    >
                      {actor.badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors">
                    {actor.role}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-snug line-clamp-2">
                    {actor.desc}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-semibold text-emerald-400 group-hover:text-emerald-200">
                  <span>Truy cập</span>
                  <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Nội Dung Footer Chính (4 Cột Chuẩn Mực) ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 text-xs">
          {/* Cột 1: Thương hiệu & Giới thiệu */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#2e7d32] text-white flex items-center justify-center font-bold shadow-md">
                <Leaf size={20} />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Agri<span className="text-emerald-400">Trace</span>
                </span>
                <span className="block text-[10px] text-emerald-300/80 font-medium tracking-wide">
                  Nông sản sạch từ trang trại
                </span>
              </div>
            </Link>

            <p className="text-gray-300 text-xs leading-relaxed">
              Nền tảng quản lý chuỗi cung ứng nông sản an toàn từ nông trại đến bàn ăn.
              Minh bạch 100% dữ liệu gieo trồng, kiểm định chất lượng và truy xuất nguồn gốc bằng mã QR độc bản.
            </p>

            <div className="pt-1 space-y-2 text-gray-300">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                <ShieldCheck size={15} />
                <span>Tiêu chuẩn VietGAP & GlobalGAP</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin size={14} className="text-emerald-400 shrink-0" />
                <span>Tiểu khu 112, Huyện Lạc Dương, Lâm Đồng</span>
              </div>
            </div>
          </div>

          {/* Cột 2: Cửa Hàng & Khách Hàng */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ShoppingBag size={14} className="text-emerald-400" /> Dành Cho Khách Hàng
            </h4>
            <ul className="space-y-2.5 text-gray-300">
              <li>
                <Link href="/products" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">•</span> Cửa hàng nông sản sạch
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">•</span> Rau ăn lá thủy canh Đà Lạt
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">•</span> Dâu tây & Trái cây Mộc Châu
                </Link>
              </li>
              <li>
                <Link href="/vouchers" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">•</span> Kho mã giảm giá (Vouchers)
                </Link>
              </li>
              <li>
                <Link href="/loyalty" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">•</span> Hội viên & Tích lũy điểm thưởng
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">•</span> Giỏ hàng & Tra cứu đơn mua
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Nông Trại & Chuỗi Cung Ứng */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <QrCode size={14} className="text-emerald-400" /> Nông Nghiệp & Truy Xuất
            </h4>
            <ul className="space-y-2.5 text-gray-300">
              <li>
                <Link href="/traceability" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">•</span> Tra cứu mã QR nguồn gốc lô hàng
                </Link>
              </li>
              <li>
                <Link href="/seasons" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">•</span> Lịch mùa vụ & Kế hoạch gieo trồng
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">•</span> Tiêu chuẩn canh tác VietGAP
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">•</span> Quy trình bảo quản kho lạnh FEFO
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">•</span> Đội xe lạnh vận chuyển liên tỉnh
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Liên Hệ & Hỗ Trợ Kỹ Thuật */}
          <div className="space-y-3.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Phone size={14} className="text-emerald-400" /> Tổng Đài & Trợ Giúp
            </h4>

            <div className="p-3.5 rounded-2xl bg-[#122e1e] border border-emerald-900/60 space-y-1.5">
              <div className="text-[11px] text-gray-400">Hotline tư vấn khách hàng:</div>
              <div className="text-lg font-extrabold text-emerald-400">1900 1234</div>
              <div className="text-[11px] text-gray-400">Hỗ trợ từ 07:00 đến 21:00 hàng ngày</div>
            </div>

            <div className="space-y-2 text-gray-300 text-xs">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-emerald-400 shrink-0" />
                <span>hotro@agritrace.vn</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={14} className="text-emerald-400 shrink-0" />
                <span>Hợp tác nông trại: hoptac@agritrace.vn</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Dòng Bản Quyền & Tech Stack ─── */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-400">
          <div>
            © 2026 AgriTrace Project. Hệ thống Quản Lý Chuỗi Cung Ứng Nông Sản Sạch & Truy Xuất Nguồn Gốc.
          </div>
          <div className="flex items-center gap-2.5 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/60 text-emerald-300">
              Spring Boot 3
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/60 text-emerald-300">
              Next.js 15
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/60 text-emerald-300">
              Supabase PostgreSQL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
