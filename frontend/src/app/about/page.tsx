"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  Building2,
  CheckCircle2,
  Cpu,
  HeartHandshake,
  Leaf,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  Sprout,
  ThermometerSnowflake,
  Truck,
  UserCheck,
  Users,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { PartnerModal, type PartnerType } from "@/components/about/partner-modal";

export default function AboutPage() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [partnerModalType, setPartnerModalType] = useState<PartnerType>("distributor");

  useEffect(() => {
    setMounted(true);
  }, []);

  const openPartnerModal = (type: PartnerType) => {
    setPartnerModalType(type);
    setPartnerModalOpen(true);
  };

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
              <button
                type="button"
                onClick={() => openPartnerModal("distributor")}
                className="px-6 py-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-sm hover:bg-emerald-100 transition-all flex items-center gap-2"
              >
                <Truck size={16} className="text-emerald-700" /> Đăng Ký Đối Tác
              </button>
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

      {/* ─── Dedicated Cold Chain Section (Anchor: #coldchain) ─── */}
      <section id="coldchain" className="scroll-mt-24 py-16 sm:py-20 bg-gradient-to-b from-blue-50/40 via-white to-gray-50/50 border-t border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3 tracking-wide">
              <ThermometerSnowflake size={15} /> TIÊU CHUẨN CHUỖI CUNG ỨNG LẠNH 2°C - 5°C
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Giữ Trọn Độ Tươi Giòn & Hàm Lượng Dinh Dưỡng
            </h2>
            <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed">
              Khác biệt cốt lõi của AgriTrace AI là cam kết duy trì nhiệt độ ổn định xuyên suốt từ lúc thu hái tại nông trại đến tận cửa nhà khách hàng, triệt tiêu nguy cơ úa hỏng và vi khuẩn sinh sôi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <ThermometerSnowflake size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Cảm Biến IoT Giám Sát 24/7</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Từng thùng xe lạnh đều lắp đặt cảm biến nhiệt độ & độ ẩm tự động gửi dữ liệu về hệ thống. Cảnh báo rung tức thì nếu nhiệt độ vượt ngưỡng an toàn.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Truck size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Đội Xe Chuyên Dụng & Màng Thở</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Đội ngũ đối tác vận tải xe lạnh cam kết không chở chung hàng tạp hóa. Nông sản được bọc màng thở sinh học ngăn đọng sương và giữ nguyên vị ngọt ngào.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Quy Trình Kho Lạnh Chuẩn FEFO</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Kho trung chuyển vận hành theo nguyên tắc First-Expired, First-Out kết hợp thuật toán AI gợi ý xuất kho trước các lô có hạn dùng ngắn nhất.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Core Values ─── */}
      <section className="py-16 sm:py-20 bg-gray-50/60 border-b border-gray-100">
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
      <section className="py-16 sm:py-20 bg-white border-b border-gray-100">
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

      {/* ─── Brand New: B2B Partnership Section (Anchor: #partnership) ─── */}
      <section id="partnership" className="scroll-mt-24 py-16 sm:py-24 bg-gradient-to-b from-gray-50/50 via-white to-emerald-50/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-[#156e34] text-xs font-bold mb-3 tracking-wide">
              <Users size={14} /> MỞ RỘNG HỢP TÁC DOANH NGHIỆP & B2B
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Cùng Xây Dựng Hệ Sinh Thái Nông Nghiệp Bền Vững
            </h2>
            <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed">
              AgriTrace AI chào đón các đối tác đội xe vận tải lạnh, chủ nông trường canh tác an toàn và các đơn vị tiêu thụ sỉ đồng hành cùng mở rộng quy mô toàn quốc.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {/* Distributor Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-200/90 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between relative group">
              <div className="absolute top-5 right-5 text-emerald-100 group-hover:text-emerald-200 transition-colors">
                <Truck size={40} />
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-3">
                  Đối Tác Vận Tải Lạnh
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Đội Xe & Nhà Phân Phối</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-5 leading-relaxed">
                  Gia nhập mạng lưới vận chuyển chuyên nghiệp nhận phân phối đơn hàng nông sản VietGAP với nguồn doanh thu ổn định.
                </p>

                <div className="space-y-2.5 text-xs text-gray-700 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Tiếp nhận đơn giao hàng liên tục theo tuyến đường đã đăng ký</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Đối soát tự động, hoa hồng chiết khấu hấp dẫn thanh toán hàng tuần</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Cấp tài khoản Distributor quản lý giao nhận và quét mã QR</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Hỗ trợ thiết bị kiểm soát nhiệt độ thùng xe 2°C - 5°C</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openPartnerModal("distributor")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Đăng Ký Làm Nhà Phân Phối</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Farmer Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-200/90 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between relative group">
              <div className="absolute top-5 right-5 text-emerald-100 group-hover:text-emerald-200 transition-colors">
                <Sprout size={40} />
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3">
                  Đối Tác Canh Tác
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nông Trại & Hợp Tác Xã</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-5 leading-relaxed">
                  Bao tiêu đầu ra bền vững cho rau củ quả đạt chuẩn VietGAP, GlobalGAP, Organic mà không qua thương lái ép giá.
                </p>

                <div className="space-y-2.5 text-xs text-gray-700 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Bao tiêu sản lượng mùa vụ với giá bán công khai minh bạch</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Miễn phí cấp hệ thống tem QR định danh GS1 và nhật ký điện tử</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Tiếp cận trực tiếp hơn 15.000 khách hàng tiêu dùng thông minh</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Trợ lý AI dự báo nhu cầu thị trường trước 7 ngày gieo trồng</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openPartnerModal("farmer")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-800 to-green-800 hover:from-emerald-900 hover:to-green-900 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Đăng Ký Nông Trại Đối Tác</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* B2B Wholesale Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-200/90 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between relative group">
              <div className="absolute top-5 right-5 text-emerald-100 group-hover:text-emerald-200 transition-colors">
                <Building2 size={40} />
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold mb-3">
                  Tiêu Thụ Sỉ & Doanh Nghiệp
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Bếp Ăn, Nhà Hàng & Siêu Thị</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-5 leading-relaxed">
                  Cung ứng số lượng lớn nông sản sạch ổn định quanh năm, kiểm nghiệm dư lượng BVTV = 0 kèm hóa đơn VAT.
                </p>

                <div className="space-y-2.5 text-xs text-gray-700 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Nguồn hàng dồi dào, ổn định giá cả không biến động theo mùa</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Xuất hóa đơn VAT đỏ đầy đủ và phiếu kiểm nghiệm an toàn</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Giao hàng bằng xe lạnh tận nơi đúng giờ sáng sớm</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Chiết khấu B2B lên đến 25% cho hợp đồng dài hạn</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openPartnerModal("b2b")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-700 to-emerald-700 hover:from-amber-800 hover:to-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Liên Hệ Báo Giá Sỉ B2B</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Smart Context-Aware Bottom CTA ─── */}
      <section className="py-14 sm:py-18 bg-gradient-to-r from-[#115e2b] via-[#1a7a3a] to-[#25a854] text-white text-center relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-4">
          {mounted && user ? (
            /* Logged-In User Experience */
            <div className="space-y-4 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold border border-white/30">
                <UserCheck size={14} className="text-emerald-200" />
                <span>
                  Xin chào, <strong className="underline decoration-emerald-300">{user.name}</strong> • Tài khoản:{" "}
                  {user.roles?.includes("DISTRIBUTOR")
                    ? "Nhà Phân Phối"
                    : user.roles?.includes("FARMER")
                    ? "Nông Trại Đối Tác"
                    : user.roles?.includes("ADMIN")
                    ? "Quản Trị Viên"
                    : "Khách Hàng Thân Thiết"}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Cùng AgriTrace Mở Rộng Chuỗi Nông Sản Sạch
              </h2>
              <p className="text-emerald-100 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                Bạn đã đăng nhập tài khoản hệ thống. Hãy tiếp tục chọn mua rau củ quả chuẩn VietGAP hôm nay hoặc đăng ký nâng cấp trở thành Nhà Phân Phối / Nông Trại đối tác của chúng tôi.
              </p>

              <div className="pt-3 flex flex-wrap justify-center items-center gap-3">
                <Link
                  href="/products"
                  className="px-6 py-3 rounded-xl bg-white text-[#1a7a3a] font-bold text-sm hover:bg-gray-100 shadow-lg shadow-black/10 transition-all flex items-center gap-2"
                >
                  <span>🛒 Khám Phá Nông Sản Hôm Nay</span>
                </Link>

                <button
                  type="button"
                  onClick={() => openPartnerModal("distributor")}
                  className="px-6 py-3 rounded-xl bg-emerald-900/80 hover:bg-emerald-950 text-white font-semibold text-sm border border-emerald-300/40 shadow-sm transition-all flex items-center gap-2"
                >
                  <Truck size={15} className="text-emerald-300" />
                  <span>Đăng Ký Làm Nhà Phân Phối</span>
                </button>

                <button
                  type="button"
                  onClick={() => openPartnerModal("farmer")}
                  className="px-6 py-3 rounded-xl bg-emerald-900/80 hover:bg-emerald-950 text-white font-semibold text-sm border border-emerald-300/40 shadow-sm transition-all flex items-center gap-2"
                >
                  <Sprout size={15} className="text-emerald-300" />
                  <span>Đăng Ký Đối Tác Nông Trại</span>
                </button>

                <Link
                  href="/dashboard/customer"
                  className="px-4 py-3 rounded-xl text-emerald-100 hover:text-white text-xs font-semibold underline underline-offset-4 transition-all"
                >
                  Xem đơn mua & ví voucher →
                </Link>
              </div>
            </div>
          ) : (
            /* Guest (Not Logged In) Experience */
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Cùng Chúng Tôi Lan Tỏa Nông Sản Sạch Việt Nam
              </h2>
              <p className="text-emerald-100 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                Dù bạn là người tiêu dùng muốn tìm bữa ăn an toàn, hay là nông dân, nhà phân phối mong muốn đưa thương hiệu nông sản vươn xa — AgriTrace AI luôn đồng hành cùng bạn.
              </p>
              <div className="pt-3 flex flex-wrap justify-center items-center gap-3">
                <Link
                  href="/register"
                  className="px-6 py-3 rounded-xl bg-white text-[#1a7a3a] font-bold text-sm hover:bg-gray-100 shadow-md transition-all"
                >
                  Đăng Ký Tài Khoản Miễn Phí
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-xl bg-emerald-800 text-white font-semibold text-sm hover:bg-emerald-900 border border-emerald-400/40 transition-all"
                >
                  Đăng Nhập
                </Link>
                <button
                  type="button"
                  onClick={() => openPartnerModal("distributor")}
                  className="px-6 py-3 rounded-xl bg-teal-800/90 text-white font-semibold text-sm hover:bg-teal-900 border border-teal-300/40 transition-all flex items-center gap-2"
                >
                  <Truck size={15} />
                  <span>Đăng Ký Đối Tác B2B</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Interactive Partner Registration Modal ─── */}
      <PartnerModal
        isOpen={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
        initialType={partnerModalType}
      />
    </div>
  );
}