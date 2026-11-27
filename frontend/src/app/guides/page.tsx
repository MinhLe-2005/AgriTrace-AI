"use client";

import {
  ArrowRight,
  Award,
  Bot,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Gift,
  HelpCircle,
  Leaf,
  MessageSquare,
  Package,
  QrCode,
  ShieldCheck,
  Sparkles,
  Truck,
  UserCheck,
  Users,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function GuidesPage() {
  const [activeRole, setActiveRole] = useState<"customer" | "farmer" | "warehouse" | "distributor">("customer");

  const ROLES_TABS = [
    { key: "customer" as const, label: "Khách Hàng (Customer)", icon: Users, color: "text-purple-600", desc: "Mua sắm, quét QR, dùng voucher & tích điểm" },
    { key: "farmer" as const, label: "Nông Dân (Farmer)", icon: Leaf, color: "text-emerald-600", desc: "Quản lý nông trại, lô gieo trồng & tạo mã QR" },
    { key: "warehouse" as const, label: "Thủ Kho (Warehouse)", icon: Warehouse, color: "text-blue-600", desc: "Nhập xuất kho FEFO, bảo quản & kiểm kê" },
    { key: "distributor" as const, label: "Vận Chuyển (Distributor)", icon: Truck, color: "text-amber-600", desc: "Tiếp nhận hàng, quét lộ trình & giao nhận" },
  ];

  const CUSTOMER_STEPS = [
    {
      step: 1,
      title: "Tìm kiếm nông sản & Xem trạng thái mùa vụ",
      desc: "Truy cập mục 'Nông sản & Trái cây' để lọc theo danh mục (rau ăn lá, củ quả, trái cây mùa vụ). Chú ý nhãn 'Đang vào mùa' để chọn nông sản ngon nhất với giá tốt nhất.",
      icon: Package,
      tip: "Mẹo: Nông sản chính vụ luôn có chứng nhận VietGAP kèm theo và thường có voucher giảm giá từ 10%–20%.",
    },
    {
      step: 2,
      title: "Quét mã QR truy xuất nguồn gốc minh bạch",
      desc: "Mỗi sản phẩm đều có mã QR riêng. Bạn có thể mở camera điện thoại hoặc dùng trang 'Truy Xuất QR' trên website để quét xem nhật ký gieo trồng, ngày thu hoạch và chứng chỉ chất lượng.",
      icon: QrCode,
      tip: "Mẹo: Đối chiếu số hiệu chứng nhận trên màn hình với tem dán trên bao bì để đảm bảo 100% hàng thật.",
    },
    {
      step: 3,
      title: "Áp dụng Voucher & Đặt hàng nhanh chóng",
      desc: "Thêm sản phẩm vào giỏ hàng. Tại trang thanh toán, hệ thống sẽ tự động gợi ý các mã giảm giá phần trăm, tiền mặt hoặc miễn phí vận chuyển trong 'Kho Voucher' của bạn.",
      icon: Gift,
      tip: "Mẹo: Thành viên hạng Bạc, Vàng và Kim Cương được nhận voucher độc quyền mỗi tháng.",
    },
    {
      step: 4,
      title: "Tích điểm Nông Sản (AgriPoints) & Thăng hạng",
      desc: "Mỗi 10,000 VNĐ thanh toán thành công được tích lũy 1 điểm. Điểm tích lũy giúp bạn tự động thăng hạng từ Đồng → Bạc → Vàng → Kim Cương và đổi lấy voucher giá trị cao.",
      icon: Award,
      tip: "Mẹo: Kiểm tra điểm thưởng hiện có tại trang 'Tích Điểm & Hạng Thành Viên'.",
    },
    {
      step: 5,
      title: "Tương tác trực tiếp: Chat chủ hàng & Hỏi AI",
      desc: "Nếu có bất kỳ thắc mắc nào về cách chế biến hay nguồn gốc nông sản, bạn có thể nhắn tin trực tiếp với chủ nông trại qua cổng Chat hoặc hỏi nhanh Trợ lý Trí tuệ Nhân tạo 24/7.",
      icon: MessageSquare,
      tip: "Mẹo: Nút trợ lý AI luôn xuất hiện ở góc dưới bên phải màn hình để bạn hỏi đáp bất cứ lúc nào.",
    },
  ];

  const FARMER_STEPS = [
    {
      step: 1,
      title: "Đăng ký hồ sơ Nông Trại & Chứng nhận",
      desc: "Vào Cổng Nông Dân (Farmer Portal) để khai báo tên trang trại, địa chỉ, diện tích canh tác và tải ảnh chụp giấy chứng nhận VietGAP/GlobalGAP lên để Admin phê duyệt.",
      icon: Leaf,
      tip: "Lưu ý: Giấy chứng nhận còn hạn sẽ được hệ thống gắn dấu tick xanh xác minh tự động.",
    },
    {
      step: 2,
      title: "Khai báo Lô Thu Hoạch & Mùa Vụ",
      desc: "Nhập thông tin giống cây trồng, ngày xuống giống, ngày dự kiến thu hoạch và sản lượng ước tính. Hệ thống sẽ tính toán vòng đời mùa vụ để hiển thị lịch cho người mua.",
      icon: Calendar,
      tip: "Lưu ý: Khai báo chính xác ngày thu hoạch giúp AI dự đoán nhu cầu tiêu thụ chuẩn xác hơn.",
    },
    {
      step: 3,
      title: "Khởi tạo Mã QR Độc Bản cho Lô Nông Sản",
      desc: "Sau khi tạo lô thu hoạch thành công, hệ thống tự động sinh mã QR định danh kèm mã UUID. Nông dân có thể tải về và in tem dán trực tiếp lên bao bì đóng gói nông sản.",
      icon: QrCode,
      tip: "Mẹo: Tem QR chứa đường link dẫn thẳng tới hồ sơ minh bạch của chính lô hàng đó.",
    },
    {
      step: 4,
      title: "Tạo Voucher Riêng & Phản Hồi Khách Hàng",
      desc: "Chủ hàng có thể tạo voucher giảm giá riêng để kích cầu tiêu thụ khi nông sản vào mùa rộ, đồng thời phản hồi tin nhắn của khách hàng qua kênh chat nội bộ.",
      icon: Gift,
      tip: "Mẹo: Phản hồi nhanh giúp tăng uy tín nông trại và giữ chân khách hàng thân thiết.",
    },
  ];

  const WAREHOUSE_STEPS = [
    {
      step: 1,
      title: "Quét mã QR Tiếp Nhận Nông Sản Nhập Kho",
      desc: "Thủ kho quét mã QR trên kiện hàng nông sản chuyển từ nông trại đến. Hệ thống kiểm tra tính hợp lệ của lô hàng và ghi nhận số lượng thực nhập vào kho.",
      icon: Warehouse,
      tip: "Quy tắc: Không tiếp nhận các lô hàng không có mã QR hoặc chứng nhận bị Admin từ chối.",
    },
    {
      step: 2,
      title: "Kiểm Soát Tồn Kho Theo Chuẩn FEFO",
      desc: "Hệ thống tự động sắp xếp hàng hóa theo nguyên tắc First Expired, First Out (hạn dùng ngắn nhất xuất trước). Bảng dashboard hiển thị cảnh báo đỏ với các lô hàng sắp hết hạn.",
      icon: Clock,
      tip: "Mẹo: AI Risk Alert sẽ gửi thông báo ưu tiên xuất kho cho các lô rau ăn lá có hạn dùng dưới 3 ngày.",
    },
    {
      step: 3,
      title: "Xuất Kho & Bàn Giao Cho Nhà Phân Phối",
      desc: "Khi có đơn hàng mới, thủ kho in phiếu xuất, quét mã QR bàn giao cho đối tác vận chuyển và cập nhật trạng thái 'Đã xuất kho - Sẵn sàng vận chuyển'.",
      icon: Truck,
      tip: "Lưu ý: Đối soát đúng mã QR của thùng hàng với mã đơn hàng trên ứng dụng.",
    },
  ];

  const DISTRIBUTOR_STEPS = [
    {
      step: 1,
      title: "Tiếp Nhận Hàng Hóa Tại Kho",
      desc: "Nhân viên giao nhận đăng nhập Cổng Vận Chuyển (Distributor Portal), quét mã QR trên gói hàng để xác nhận tiếp nhận đơn hàng thành công từ kho trung chuyển.",
      icon: Package,
      tip: "Hệ thống tự động cập nhật mốc thời gian và vị trí kho nhận hàng.",
    },
    {
      step: 2,
      title: "Cập Nhật Trạng Thái Giao Nhận Thời Gian Thực",
      desc: "Trong quá trình vận chuyển, tài xế cập nhật các chặng: 'Đang trung chuyển' → 'Đang giao hàng đến người nhận' để khách hàng dễ dàng theo dõi trên bản đồ.",
      icon: Truck,
      tip: "Mẹo: Khách hàng có thể quét lại mã QR bất cứ lúc nào để biết hàng đang ở đâu.",
    },
    {
      step: 3,
      title: "Giao Hàng & Xác Nhận Thành Công",
      desc: "Khi giao hàng đến tận tay người nhận, nhân viên quét mã QR xác nhận hoàn tất giao hàng và thu tiền COD (nếu có). Điểm thưởng sẽ tự động tích cho khách ngay sau đó.",
      icon: CheckCircle2,
      tip: "Hoàn tất đơn hàng kích hoạt chương trình cộng điểm Loyalty và gửi yêu cầu đánh giá sản phẩm.",
    },
  ];

  const currentSteps =
    activeRole === "customer"
      ? CUSTOMER_STEPS
      : activeRole === "farmer"
      ? FARMER_STEPS
      : activeRole === "warehouse"
      ? WAREHOUSE_STEPS
      : DISTRIBUTOR_STEPS;

  return (
    <div className="bg-gray-50/50 min-h-screen py-10 sm:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <Compass size={14} /> CẨM NANG HƯỚNG DẪN SỬ DỤNG HỆ THỐNG
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Hướng Dẫn Từng Bước Vận Hành
          </h1>
          <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed">
            Tài liệu hướng dẫn trực quan dành riêng cho từng vai trò trong chuỗi cung ứng nông sản sạch AgriTrace AI.
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {ROLES_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeRole === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveRole(tab.key)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isActive
                    ? "bg-white border-[#1a7a3a] ring-2 ring-emerald-500/20 shadow-sm"
                    : "bg-white/70 border-gray-200/80 hover:bg-white hover:border-gray-300"
                }`}
              >
                <div className={`p-2 rounded-xl inline-block mb-2 ${isActive ? "bg-emerald-50 text-[#1a7a3a]" : "bg-gray-100 text-gray-600"}`}>
                  <Icon size={18} />
                </div>
                <div className="font-bold text-gray-900 text-xs sm:text-sm">{tab.label}</div>
                <div className="text-[11px] text-gray-500 mt-1 line-clamp-1">{tab.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Steps Timeline Card */}
        <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-10 shadow-xs mb-10">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Quy trình {ROLES_TABS.find((r) => r.key === activeRole)?.label}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Các bước thực hiện chuẩn trên hệ thống AgriTrace AI
              </p>
            </div>

            <Link
              href={
                activeRole === "customer"
                  ? "/products"
                  : activeRole === "farmer"
                  ? "/dashboard/farmer"
                  : activeRole === "warehouse"
                  ? "/dashboard/warehouse"
                  : "/dashboard/distributor"
              }
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-[#1a7a3a] text-xs font-bold hover:bg-emerald-100 transition-colors"
            >
              <span>Vào Cổng Thực Hành</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-8">
            {currentSteps.map((stepItem) => {
              const StepIcon = stepItem.icon;
              return (
                <div key={stepItem.step} className="flex gap-4 sm:gap-6 items-start">
                  {/* Step badge */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#156e34] to-[#25a854] text-white flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0">
                      {stepItem.step}
                    </div>
                  </div>

                  {/* Step content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <StepIcon size={17} className="text-emerald-700" />
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                        {stepItem.title}
                      </h3>
                    </div>

                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                      {stepItem.desc}
                    </p>

                    <div className="bg-emerald-50/70 border border-emerald-100 text-emerald-900 text-xs p-3 rounded-xl flex items-start gap-2">
                      <Sparkles size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{stepItem.tip}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Help Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/faq"
            className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-emerald-300 shadow-xs transition-all flex items-center gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-50 text-[#1a7a3a] group-hover:bg-[#1a7a3a] group-hover:text-white transition-colors">
              <HelpCircle size={20} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">Câu Hỏi FAQ</div>
              <div className="text-xs text-gray-500">Xem giải đáp thắc mắc</div>
            </div>
          </Link>

          <Link
            href="/traceability"
            className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 shadow-xs transition-all flex items-center gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <QrCode size={20} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">Thử Quét Mã QR</div>
              <div className="text-xs text-gray-500">Xem mẫu hồ sơ lô hàng</div>
            </div>
          </Link>

          <Link
            href="/chat"
            className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-amber-300 shadow-xs transition-all flex items-center gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <MessageSquare size={20} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">Kênh Chat Hỗ Trợ</div>
              <div className="text-xs text-gray-500">Nhân viên & Chủ nông trại</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
