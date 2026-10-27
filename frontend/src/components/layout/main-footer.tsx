"use client";

import {
  Award,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Facebook,
  Gift,
  HelpCircle,
  Instagram,
  Leaf,
  Lock,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Store,
  Truck,
  Users,
  Warehouse,
  Youtube,
} from "lucide-react";
import Link from "next/link";

export function MainFooter() {
  const actors = [
    {
      role: "Quản Trị Viên",
      sub: "Admin Portal",
      href: "/dashboard/admin",
      icon: Shield,
      badge: "Admin",
      badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
    },
    {
      role: "Nông Dân",
      sub: "Farmer Portal",
      href: "/dashboard/farmer",
      icon: Sprout,
      badge: "Nông Trại",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    {
      role: "Thủ Kho",
      sub: "Warehouse FEFO",
      href: "/dashboard/warehouse",
      icon: Warehouse,
      badge: "Kho Lạnh",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
    {
      role: "Nhà Phân Phối",
      sub: "Cold Logistics",
      href: "/dashboard/distributor",
      icon: Truck,
      badge: "Vận Chuyển",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    {
      role: "Khách Hàng",
      sub: "Customer Account",
      href: "/dashboard/customer",
      icon: ShoppingBag,
      badge: "Tài Khoản",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    },
  ];

  return (
    <footer className="bg-[#08170d] text-white border-t border-emerald-950">
      {/* ─── Thanh Chứng Nhận & Bảo Chứng Chất Lượng Quốc Tế ─── */}
      <div className="border-b border-white/10 bg-[#0c2013] py-5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-6 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span className="font-semibold text-white">Chứng nhận VietGAP số 284/2026/NNPTNT</span>
            </div>
            <span className="hidden sm:inline text-white/20">|</span>
            <div className="flex items-center gap-2">
              <Award size={18} className="text-amber-400" />
              <span className="font-semibold text-white">Tiêu chuẩn GlobalGAP & HACCP</span>
            </div>
            <span className="hidden sm:inline text-white/20">|</span>
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-blue-400" />
              <span className="font-semibold text-white">Chuỗi lạnh Cold-Chain kiểm soát 24/7</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-300/80">
            <Lock size={13} className="text-emerald-400" />
            <span>Thanh toán bảo mật SSL 256-bit qua VNPay, MoMo, Visa</span>
          </div>
        </div>
      </div>

      {/* ─── Nội Dung Footer Chính (4 Cột Chuẩn Mực Doanh Nghiệp) ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 text-xs">
          {/* Cột 1: Thương hiệu & Giới thiệu */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
                <Leaf size={20} />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white">
                  Agri<span className="text-emerald-400">Trace</span>
                </span>
                <span className="block text-[9px] uppercase tracking-wider text-emerald-400 font-bold">
                  Nông sản sạch từ gốc
                </span>
              </div>
            </Link>

            <p className="text-gray-400 leading-relaxed text-[11px]">
              Hệ sinh thái số hóa quản lý chuỗi cung ứng nông sản sạch và truy xuất nguồn gốc bằng mã QR từ
              nông trại đến bàn ăn người tiêu dùng.
            </p>

            <div className="pt-1 flex items-center gap-3 text-gray-400">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-emerald-600 hover:text-white transition-colors"
                title="Facebook"
              >
                <Facebook size={14} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-emerald-600 hover:text-white transition-colors"
                title="Instagram"
              >
                <Instagram size={14} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-emerald-600 hover:text-white transition-colors"
                title="YouTube"
              >
                <Youtube size={14} />
              </a>
            </div>
          </div>

          {/* Cột 2: Nông Sản & Dịch Vụ */}
          <div>
            <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
              <Leaf size={14} className="text-emerald-400" />
              <span>Nông Sản & Dịch Vụ</span>
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/products" className="hover:text-emerald-400 transition-colors">
                  Rau củ thủy canh Đà Lạt
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-emerald-400 transition-colors">
                  Trái cây chính vụ Mộc Châu
                </Link>
              </li>
              <li>
                <Link href="/traceability" className="hover:text-emerald-400 transition-colors">
                  Tra cứu nhật ký canh tác số
                </Link>
              </li>
              <li>
                <Link href="/traceability" className="hover:text-emerald-400 transition-colors">
                  Quét mã QR truy xuất lô hàng
                </Link>
              </li>
              <li>
                <Link href="/vouchers" className="hover:text-emerald-400 transition-colors">
                  Ví Voucher & Mã giảm giá hôm nay
                </Link>
              </li>
              <li>
                <Link href="/loyalty" className="hover:text-emerald-400 transition-colors">
                  Thẻ hội viên VIP & Tích điểm
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ Trợ & Chính Sách */}
          <div>
            <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
              <Shield size={14} className="text-emerald-400" />
              <span>Hỗ Trợ & Chính Sách</span>
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors">
                  Về chúng tôi & Tiêu chuẩn nông trại
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-emerald-400 transition-colors">
                  Chính sách giao hàng xe lạnh 24H
                </Link>
              </li>
              <li>
                <Link href="/dashboard/customer?tab=orders" className="hover:text-emerald-400 transition-colors">
                  Quy định đổi trả hàng miễn phí
                </Link>
              </li>
              <li>
                <Link href="/traceability" className="hover:text-emerald-400 transition-colors">
                  Báo cáo kiểm nghiệm an toàn thực phẩm
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-400 transition-colors">
                  Trung tâm trợ giúp & Khiếu nại
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Thông Tin Liên Hệ */}
          <div>
            <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
              <Phone size={14} className="text-emerald-400" />
              <span>Tổng Đài Hỗ Trợ</span>
            </h4>
            <ul className="space-y-2.5 text-gray-400 text-[11px]">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Trụ sở chính: Tòa nhà AgriTrace, Khu Công Nghệ Cao, TP. Hồ Chí Minh</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-300 text-xs">Hotline: 1900 888 666</span>
                  <span className="block text-[10px] text-gray-500">(Miễn phí cuộc gọi · 08:00 - 21:00)</span>
                </div>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-emerald-400 shrink-0" />
                <span>cskh@agritrace.vn</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── Khu Vực Cổng Vận Hành Nội Bộ & Đối Tác Chuỗi Cung Ứng (Tinh Tế, Gọn Gàng) ─── */}
        <div className="pt-6 border-t border-white/10 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Cổng Vận Hành Chuỗi Cung Ứng Nội Bộ & B2B:
            </span>
            <Link
              href="/login"
              className="text-[11px] font-semibold text-emerald-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Đăng nhập cổng chuyên dụng</span>
              <ChevronRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {actors.map((actor) => {
              const Icon = actor.icon;
              return (
                <Link
                  key={actor.role}
                  href={actor.href}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-emerald-900/40 border border-white/10 hover:border-emerald-500/50 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon size={14} className="text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-xs truncate group-hover:text-emerald-300">
                        {actor.role}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">{actor.sub}</div>
                    </div>
                  </div>
                  <ChevronRight size={12} className="text-gray-500 group-hover:text-white shrink-0 ml-1" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* ─── Dòng Bản Quyền & Giấy Phép Cuối Cùng ─── */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
          <p>© 2026 AgriTrace Ecosystem. Nền tảng số hóa chuỗi cung ứng nông sản sạch.</p>
          <div className="flex items-center gap-4 text-gray-400">
            <Link href="/about" className="hover:text-white transition-colors">
              Điều khoản dịch vụ
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Chính sách bảo mật
            </Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-white transition-colors">
              Hỗ trợ kỹ thuật
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
