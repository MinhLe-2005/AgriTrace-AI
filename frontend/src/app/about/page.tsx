import {
  Award,
  CheckCircle2,
  Cpu,
  HeartHandshake,
  Leaf,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  const CORE_VALUES = [
    {
      icon: ShieldCheck,
      title: "Minh Bạch Tuyệt Đối",
      desc: "Mọi lô rau củ quả đều có mã QR tra cứu nguồn gốc thật, ngày thu hoạch, chứng nhận VietGAP và hành trình vận chuyển chi tiết.",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      icon: Cpu,
      title: "Ứng Dụng AI Thực Tiễn",
      desc: "Tích hợp AI Chatbot giải đáp thông tin, AI dự báo nhu cầu thị trường 7 ngày và AI cảnh báo rủi ro hạn sử dụng theo chuẩn FEFO.",
      color: "text-blue-600 bg-blue-50",
    },
    {
      icon: HeartHandshake,
      title: "Đồng Hành Cùng Nông Dân",
      desc: "Hỗ trợ bà con nông dân và hợp tác xã số hóa quy trình quản lý mùa vụ, nâng cao giá trị nông sản và tiếp cận người tiêu dùng trực tiếp.",
      color: "text-amber-600 bg-amber-50",
    },
    {
      icon: Award,
      title: "Chuẩn Mực Chất Lượng",
      desc: "Chỉ liên kết với các nông trại đạt chuẩn VietGAP, GlobalGAP hoặc canh tác hữu cơ đã qua thẩm định gắt gao của bộ phận Admin.",
      color: "text-purple-600 bg-purple-50",
    },
  ];

  const STATS = [
    { num: "50+", label: "Hợp tác xã & Nông trại liên kết", desc: "Đà Lạt, Mộc Châu, Tiền Giang, Bến Tre" },
    { num: "1,200+", label: "Lô nông sản đã định danh QR", desc: "Quét tra cứu minh bạch 100%" },
    { num: "99.8%", label: "Tỷ lệ kiểm định đạt chuẩn", desc: "Chứng nhận VietGAP / GlobalGAP" },
    { num: "15,000+", label: "Khách hàng tin tưởng sử dụng", desc: "Tích điểm & nhận ưu đãi mùa vụ" },
  ];

  const PARTNERS = [
    { name: "Nông Trại Xanh Đà Lạt", location: "Lâm Đồng", spec: "Xà lách thủy canh, Dâu tây & Cà chua bi", tag: "VietGAP #VG-2024-889" },
    { name: "Hợp Tác Xã Rau Sạch Mộc Châu", location: "Sơn La", spec: "Cải kale, Bắp cải tím, Cà rốt hữu cơ", tag: "GlobalGAP #GG-2025-102" },
    { name: "Vườn Cam Sành Hàm Yên", location: "Tuyên Quang", spec: "Cam sành chính vụ, Bưởi da xanh", tag: "VietGAP #VG-2024-412" },
    { name: "Nông Trại Bơ Sáp Tây Nguyên", location: "Đắk Lắk", spec: "Bơ Booth, Bơ 034 xuất khẩu", tag: "Organic Cert #ORG-VN-08" },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* ─── Hero Section ─── */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-emerald-50/60 via-white to-white overflow-hidden border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-[#156e34] text-xs font-bold mb-4 tracking-wide">
              <Leaf size={14} /> VỀ CHÚNG TÔI • AGRITRACE AI
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Số Hóa Chuỗi Nông Sản Sạch
              <br />
              <span className="text-[#1a7a3a]">Minh Bạch Từng Bữa Ăn Gia Đình</span>
            </h1>
            <p className="mt-5 text-gray-600 text-base sm:text-lg leading-relaxed">
              AgriTrace AI là giải pháp công nghệ kết hợp trí tuệ nhân tạo (AI) và mã QR định danh, kết nối khép kín từ khâu gieo trồng tại nông trại đến bàn ăn của người tiêu dùng trên khắp Việt Nam.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/products"
                className="px-6 py-3 rounded-xl bg-[#1a7a3a] text-white font-semibold text-sm hover:bg-[#156e34] shadow-md shadow-emerald-700/20 transition-all"
              >
                Khám Phá Nông Sản Sạch
              </Link>
              <Link
                href="/traceability"
                className="px-6 py-3 rounded-xl bg-white text-gray-700 border border-gray-200 font-semibold text-sm hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <QrCode size={16} className="text-emerald-600" /> Trải Nghiệm Quét QR
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Section ─── */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100 text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#1a7a3a]">{s.num}</div>
                <div className="font-semibold text-gray-800 text-sm mt-1">{s.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Story & Mission Section ─── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-5">
              <div className="inline-flex items-center gap-1 text-xs font-bold text-[#1a7a3a] tracking-wider uppercase">
                <Sparkles size={13} /> Sứ mệnh của chúng tôi
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug">
                Nỗi trăn trở về nguồn gốc thực phẩm và lời giải từ Công nghệ
              </h2>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Người tiêu dùng Việt Nam ngày nay luôn lo lắng: Rau này trồng ở đâu? Có phun thuốc bảo vệ thực vật quá hạn không? Trái cây này có đúng chính vụ tươi ngon hay hàng tồn kho ngâm hóa chất?
              </p>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Trong khi đó, những người nông dân tâm huyết canh tác theo chuẩn VietGAP lại chật vật tìm đầu ra, thường xuyên bị thương lái ép giá và không có công cụ chứng minh độ sạch của sản phẩm.
              </p>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-medium text-emerald-900 bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100">
                AgriTrace AI ra đời để xóa bỏ rào cản đó — biến mỗi sản phẩm nông nghiệp thành một câu chuyện minh bạch, tra cứu được nguồn cội bằng một cú quét mã QR.
              </p>
            </div>

            {/* Right Feature Highlights */}
            <div className="bg-gradient-to-tr from-[#0e2c17] to-[#1c5d33] rounded-3xl p-7 sm:p-9 text-white shadow-xl space-y-6">
              <h3 className="text-xl font-bold text-emerald-200">
                Mô hình Khép kín 5 Mắt xích của AgriTrace AI
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center font-bold text-emerald-300 shrink-0">1</div>
                  <div>
                    <strong className="text-white block">Nông trại (Farmer):</strong>
                    <span className="text-emerald-100/80">Khai báo mùa vụ, ghi nhật ký chăm bón, gắn chứng chỉ VietGAP và sinh mã QR lô hàng.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center font-bold text-emerald-300 shrink-0">2</div>
                  <div>
                    <strong className="text-white block">Kiểm định & Quản trị (Admin):</strong>
                    <span className="text-emerald-100/80">Đối soát tính pháp lý chứng chỉ, phê duyệt lô nông sản đủ tiêu chuẩn lưu hành.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center font-bold text-emerald-300 shrink-0">3</div>
                  <div>
                    <strong className="text-white block">Kho hàng (Warehouse):</strong>
                    <span className="text-emerald-100/80">Quản lý nhập xuất theo quy tắc FEFO (hàng hạn ngắn xuất trước), kiểm soát nhiệt độ bảo quản.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center font-bold text-emerald-300 shrink-0">4</div>
                  <div>
                    <strong className="text-white block">Vận chuyển (Distributor):</strong>
                    <span className="text-emerald-100/80">Cập nhật lộ trình vận tải thời gian thực bằng cách quét mã QR các điểm chạm giao nhận.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center font-bold text-emerald-300 shrink-0">5</div>
                  <div>
                    <strong className="text-white block">Người tiêu dùng (Customer):</strong>
                    <span className="text-emerald-100/80">Quét QR tra cứu 100% minh bạch, tích điểm thưởng, dùng voucher và chat trực tiếp với chủ nông trại.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Core Values ─── */}
      <section className="py-16 sm:py-20 bg-gray-50/60 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              4 Giá Trị Cốt Lõi Định Hình AgriTrace AI
            </h2>
            <p className="mt-2 text-gray-600 text-sm">
              Kim chỉ nam trong mọi quyết định phát triển công nghệ và xây dựng cộng đồng nông nghiệp sạch.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORE_VALUES.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${val.color}`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-2">{val.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Partner Farms ─── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-[#1a7a3a] tracking-wider uppercase mb-2">
              <MapPin size={13} /> Mạng lưới nông trại tiêu biểu
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Đối Tác Canh Tác Chuẩn VietGAP & GlobalGAP
            </h2>
            <p className="mt-2 text-gray-600 text-sm">
              Những đối tác nông dân hàng đầu tiên phong ứng dụng mã QR truy xuất và mô hình chuỗi cung ứng thông minh.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PARTNERS.map((farm, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-emerald-300 shadow-xs transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                    <MapPin size={13} className="text-emerald-600" /> {farm.location}
                  </div>
                  <h4 className="font-bold text-gray-900 text-base mb-1.5">{farm.name}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">{farm.spec}</p>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {farm.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="py-14 bg-gradient-to-r from-[#156e34] to-[#25a854] text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Cùng Chúng Tôi Lan Tỏa Nông Sản Sạch Việt Nam
          </h2>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Dù bạn là người tiêu dùng muốn tìm bữa ăn an toàn, hay là nông dân mong muốn đưa thương hiệu nông sản vươn xa — AgriTrace AI luôn đồng hành cùng bạn.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-white text-[#1a7a3a] font-bold text-sm hover:bg-gray-100 shadow-md transition-all"
            >
              Đăng Ký Tài Khoản Miễn Phí
            </Link>
            <Link
              href="/chat"
              className="px-6 py-3 rounded-xl bg-emerald-800 text-white font-semibold text-sm hover:bg-emerald-900 border border-emerald-400/40 transition-all"
            >
              Liên Hệ Hợp Tác
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
