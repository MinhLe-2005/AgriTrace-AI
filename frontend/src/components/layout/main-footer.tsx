import {
  BookOpen,
  Compass,
  HelpCircle,
  Leaf,
  Mail,
  MapPin,
  Newspaper,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export function MainFooter() {
  return (
    <footer className="bg-[#0b2114] text-white pt-14 pb-8 border-t border-[#184227]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Col 1: About */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#156e34] to-[#25a854] flex items-center justify-center text-white shadow-md">
                <Leaf size={20} strokeWidth={2.3} />
              </div>
              <span className="font-extrabold text-[20px] text-white tracking-tight">
                AgriTrace <span className="text-emerald-400">AI</span>
              </span>
            </Link>
            <p className="text-gray-300 text-[13px] leading-relaxed">
              Hệ thống quản lý chuỗi cung ứng nông sản sạch tích hợp trí tuệ nhân tạo và truy xuất nguồn gốc bằng mã QR độc bản.
            </p>
            <div className="space-y-1.5 text-[12.5px] text-gray-400">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Khu Công nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-emerald-400 shrink-0" />
                <span>Hotline: 1900 1234 (8:00 - 21:00)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-emerald-400 shrink-0" />
                <span>contact@agritrace.ai</span>
              </div>
            </div>
          </div>

          {/* Col 2: Nông sản & Mùa vụ */}
          <div>
            <h4 className="font-bold text-[14px] text-white uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <Leaf size={15} className="text-emerald-400" /> Nông Sản & Vụ Mùa
            </h4>
            <ul className="space-y-2 text-[13px] text-gray-300">
              <li>
                <Link href="/products" className="hover:text-emerald-300 transition-colors">
                  Tất cả Nông sản sạch
                </Link>
              </li>
              <li>
                <Link href="/products?category=seasonal" className="hover:text-emerald-300 transition-colors">
                  Trái cây theo mùa vụ
                </Link>
              </li>
              <li>
                <Link href="/seasons" className="hover:text-emerald-300 transition-colors">
                  Lịch mùa vụ & Sản lượng
                </Link>
              </li>
              <li>
                <Link href="/traceability" className="hover:text-emerald-300 transition-colors">
                  Truy xuất nguồn gốc QR
                </Link>
              </li>
              <li>
                <Link href="/vouchers" className="hover:text-emerald-300 transition-colors">
                  Kho Voucher & Giảm giá
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Thông tin & Kiến thức */}
          <div>
            <h4 className="font-bold text-[14px] text-white uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <Compass size={15} className="text-emerald-400" /> Kiến Thức & Hỗ Trợ
            </h4>
            <ul className="space-y-2 text-[13px] text-gray-300">
              <li>
                <Link href="/farming-techniques" className="hover:text-emerald-300 transition-colors">
                  Kỹ thuật chăm sóc cây trồng
                </Link>
              </li>
              <li>
                <Link href="/knowledge?tab=export" className="hover:text-emerald-300 transition-colors">
                  Chuyên đề xuất khẩu nông sản
                </Link>
              </li>
              <li>
                <Link href="/knowledge?tab=tips" className="hover:text-emerald-300 transition-colors">
                  Tips & Tricks (Mẹo hay nông nghiệp)
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-300 transition-colors">
                  Về chúng tôi (Sứ mệnh)
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-300 transition-colors">
                  Liên hệ hợp tác nông trại
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-emerald-300 transition-colors">
                  Câu hỏi thường gặp (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Công nghệ AI & Hỗ trợ */}
          <div>
            <h4 className="font-bold text-[14px] text-white uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <Sparkles size={15} className="text-emerald-400" /> Công Nghệ & AI
            </h4>
            <ul className="space-y-2 text-[13px] text-gray-300">
              <li>
                <Link href="/ai-hub#chatbot" className="hover:text-emerald-300 transition-colors">
                  Trợ lý Chatbot Nông sản AI
                </Link>
              </li>
              <li>
                <Link href="/ai-hub#forecasting" className="hover:text-emerald-300 transition-colors">
                  Dự đoán nhu cầu tiêu thụ 7 ngày
                </Link>
              </li>
              <li>
                <Link href="/ai-hub#risks" className="hover:text-emerald-300 transition-colors">
                  Cảnh báo rủi ro chuỗi cung ứng
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-emerald-300 transition-colors">
                  Kênh Chat Nhân viên & Nông trại
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Cổng 5 Vai trò */}
          <div>
            <h4 className="font-bold text-[14px] text-white uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-400" /> Cổng Phân Quyền
            </h4>
            <ul className="space-y-2 text-[13px] text-gray-300">
              <li>
                <Link href="/dashboard/admin" className="hover:text-emerald-300 transition-colors">
                  🛡️ Quản trị viên (Admin)
                </Link>
              </li>
              <li>
                <Link href="/dashboard/farmer" className="hover:text-emerald-300 transition-colors">
                  👨‍🌾 Nông dân (Farmer)
                </Link>
              </li>
              <li>
                <Link href="/dashboard/warehouse" className="hover:text-emerald-300 transition-colors">
                  📦 Nhân viên kho (Warehouse)
                </Link>
              </li>
              <li>
                <Link href="/dashboard/distributor" className="hover:text-emerald-300 transition-colors">
                  🚚 Nhà phân phối (Distributor)
                </Link>
              </li>
              <li>
                <Link href="/dashboard/customer" className="hover:text-emerald-300 transition-colors">
                  🛒 Khách hàng (Customer)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-[#184227] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-gray-400">
          <div>
            © 2026 AgriTrace AI Project. Hệ thống Đồ án Tốt nghiệp Quản lý Chuỗi Cung Ứng Nông Sản Sạch.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-500 font-semibold">Java 21 • Spring Boot 3.4 • Next.js 15 • AI Powered</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
