"use client";

import {
  FileText,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Lock,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Leaf,
  Scale,
  PhoneCall,
} from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-emerald-700 transition-colors flex items-center gap-1 font-medium">
            <ArrowLeft size={13} />
            <span>Trang chủ</span>
          </Link>
          <ChevronRight size={12} className="text-gray-400" />
          <span className="text-emerald-900 font-bold">Điều khoản dịch vụ & Chính sách nông sản</span>
        </div>

        {/* Hero Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold shadow-inner">
              <Scale size={14} />
              <span>Chính Sách & Quy Định Mua Bán Chính Thức</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Điều Khoản Dịch Vụ & Chính Sách Nông Sản
            </h1>
            <p className="text-emerald-200/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Quy chế hoạt động, cam kết chuỗi cung ứng lạnh khép kín, chính sách bảo vệ người tiêu dùng và quy định đổi trả 1-đổi-1 trong vòng 24 giờ của hệ sinh thái AgriTrace AI.
            </p>
            <div className="pt-2 flex items-center gap-4 text-[11px] text-emerald-300/80">
              <span>Hiệu lực: Tháng 11/2026</span>
              <span>•</span>
              <span>Áp dụng toàn quốc</span>
              <span>•</span>
              <span>Phiên bản v2.4</span>
            </div>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Leaf size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-gray-900">
                  1. Cam Kết Tiêu Chuẩn Nông Sản & Nguồn Gốc Minh Bạch
                </h2>
                <p className="text-xs text-gray-500">Tiêu chí chất lượng và truy xuất nguồn gốc điện tử</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
              <p>
                Toàn bộ rau, củ, quả và nông sản phân phối trên hệ sinh thái AgriTrace AI đều tuân thủ các quy chuẩn nghiêm ngặt:
              </p>
              <ul className="space-y-2 list-disc list-inside text-gray-600 pl-1">
                <li>
                  <strong className="text-gray-900">100% Đạt Chứng Nhận An Toàn Thực Phẩm:</strong> Canh tác theo tiêu chuẩn VietGAP, GlobalGAP hoặc Organic hữu cơ, có đầy đủ giấy kiểm định dư lượng hóa chất bảo vệ thực vật định kỳ.
                </li>
                <li>
                  <strong className="text-gray-900">Mã Định Danh QR GS1 Chuẩn Quốc Tế:</strong> Mỗi lô nông sản xuất kho đều được gắn mã QR duy nhất, cho phép người tiêu dùng quét tra cứu thời gian thu hoạch, phân bón/dinh dưỡng sử dụng, nhiệt độ bảo quản và hình ảnh thực địa tại nông trại.
                </li>
                <li>
                  <strong className="text-gray-900">Thu Hoạch Sáng Sớm:</strong> Nông sản ăn lá và trái cây đặc sản được thu hoạch trong khung giờ vàng 05:00 - 08:00 sáng để đảm bảo độ tươi giòn và hàm lượng dinh dưỡng tối ưu.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold">
                <Truck size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-gray-900">
                  2. Quy Định Vận Chuyển Chuỗi Lạnh AgriCold-Chain (2°C - 5°C)
                </h2>
                <p className="text-xs text-gray-500">Kiểm soát nhiệt độ thùng kín suốt quá trình giao nhận</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
              <p>
                Để giữ trọn độ tươi mát như vừa hái tại vườn, AgriTrace áp dụng chuỗi cung ứng lạnh khép kín:
              </p>
              <ul className="space-y-2 list-disc list-inside text-gray-600 pl-1">
                <li>
                  <strong className="text-gray-900">Bảo Quản Xe Lạnh:</strong> Đội xe tải lạnh chuyên dụng luôn duy trì nhiệt độ từ 2°C đến 5°C đối với rau củ quả tươi, tránh sốc nhiệt làm biến đổi chất.
                </li>
                <li>
                  <strong className="text-gray-900">Đóng Gói Màng Thở Sinh Học:</strong> Bao bì chuyên dụng thông khí sinh học, ngăn ngừa đọng sương, giảm thiểu tối đa hiện tượng hấp hơi và dập nát cơ học.
                </li>
                <li>
                  <strong className="text-gray-900">Khung Giờ Giao Linh Hoạt:</strong> Hỗ trợ giao nhanh 24H, giao trong giờ hành chính hoặc giao ngoài giờ theo nhu cầu của khách hàng.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <RotateCcw size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-gray-900">
                  3. Chính Sách Đổi Trả 1-Đổi-1 & Hoàn Tiền Trong 24 Giờ
                </h2>
                <p className="text-xs text-gray-500">Quyền lợi đồng kiểm và bảo hành nông sản</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
              <p>
                AgriTrace tôn trọng tối đa quyền lợi người tiêu dùng và cam kết chính sách bảo hành nông sản rõ ràng:
              </p>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-medium">
                Khách hàng được quyền <strong>ĐỒNG KIỂM HÀNG</strong> cùng tài xế khi nhận hàng trước khi thanh toán hoặc ký nhận.
              </div>
              <ul className="space-y-2 list-disc list-inside text-gray-600 pl-1">
                <li>
                  <strong className="text-gray-900">Đổi Mới 1-Đổi-1 Miễn Phí:</strong> Nếu phát hiện sản phẩm bị dập nát do vận chuyển, úng hỏng bên trong hoặc không đúng mã lô sản phẩm đã đặt.
                </li>
                <li>
                  <strong className="text-gray-900">Thời Gian Khiếu Nại:</strong> Trong vòng 24 giờ kể từ thời điểm nhận hàng, khách hàng chỉ cần chụp ảnh/quay video và liên hệ qua hotline hoặc mục phản ánh đơn hàng.
                </li>
                <li>
                  <strong className="text-gray-900">Hoàn Tiền Siêu Tốc:</strong> Trường hợp hết hàng đổi mới, AgriTrace hoàn tiền 100% qua tài khoản ngân hàng / VietQR trong vòng 2 giờ làm việc.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-gray-900">
                  4. Phương Thức Thanh Toán & Bảo Mật Dữ Liệu
                </h2>
                <p className="text-xs text-gray-500">Cổng thanh toán điện tử payOS VietQR Napas 24/7 & COD</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
              <ul className="space-y-2 list-disc list-inside text-gray-600 pl-1">
                <li>
                  <strong className="text-gray-900">VietQR Napas 24/7 (payOS):</strong> Thanh toán chuyển khoản tự động, không qua trung gian lưu số thẻ, xác thực an toàn chuẩn Ngân hàng Nhà nước.
                </li>
                <li>
                  <strong className="text-gray-900">Thanh Toán Khi Nhận Hàng (COD):</strong> Quý khách thanh toán tiền mặt trực tiếp cho tài xế sau khi đã kiểm tra nông sản đạt yêu cầu.
                </li>
                <li>
                  <strong className="text-gray-900">Bảo Mật Dữ Liệu:</strong> Toàn bộ thông tin cá nhân (họ tên, số điện thoại, địa chỉ nhận hàng) được mã hóa SSL 256-bit và chỉ sử dụng cho mục đích giao hàng và chăm sóc hậu mãi.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Support Banner */}
        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <PhoneCall size={22} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-gray-950">Bạn Cần Hỗ Trợ Hoặc Khiếu Nại Đơn Hàng?</h4>
              <p className="text-xs text-gray-500">Bộ phận CSKH AgriTrace luôn túc trực hỗ trợ đổi trả và giải đáp 24/7.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/contact"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold text-center transition-all shadow-sm"
            >
              Liên Hệ Hotline 1900 888 666
            </Link>
            <Link
              href="/products"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold text-center transition-colors"
            >
              Xem Nông Sản
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
