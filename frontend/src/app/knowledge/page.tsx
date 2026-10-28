"use client";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck,
  Globe2,
  HelpCircle,
  Leaf,
  Lightbulb,
  MapPin,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Thermometer,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function KnowledgeContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "tips" ? "tips" : "export";
  const [activeTab, setActiveTab] = useState<"export" | "tips">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  const EXPORT_TOPICS = [
    {
      id: "exp-1",
      title: "Mã Số Vùng Trồng (MSVT): Tấm Hộ Chiếu Vàng Xuất Khẩu Nông Sản",
      market: "Trung Quốc, EU, Mỹ",
      readTime: "7 phút đọc",
      badge: "Tiêu chuẩn bắt buộc",
      badgeColor: "bg-red-100 text-red-800",
      desc: "Tìm hiểu điều kiện cấp mã số vùng trồng cho sầu riêng, thanh long, xoài theo quy định của Cục Bảo vệ Thực vật và Nghị định thư xuất khẩu chính ngạch.",
      highlights: [
        "Quy định diện tích tối thiểu 10ha đối với vùng trồng cây ăn quả tập trung.",
        "Nhật ký canh tác điện tử bắt buộc ghi nhận thuốc BVTV trong danh mục cho phép.",
        "Liên kết định danh mã QR lô hàng trên AgriTrace AI phục vụ kiểm tra hải quan.",
      ],
    },
    {
      id: "exp-2",
      title: "Tiêu Chuẩn GlobalGAP & HACCP Trong Chuỗi Đóng Gói Xuất Khẩu Sang EU",
      market: "Thị trường Châu Âu (EU)",
      readTime: "8 phút đọc",
      badge: "Chứng nhận quốc tế",
      badgeColor: "bg-blue-100 text-blue-800",
      desc: "Hướng dẫn thực hành sản xuất nông nghiệp tốt toàn cầu GlobalGAP. Giới hạn dư lượng tối đa (MRL) và các chỉ tiêu an toàn sinh học gắt gao của Liên minh Châu Âu.",
      highlights: [
        "Kiểm soát nguồn nước tưới và nguồn đất không nhiễm kim loại nặng (Chì, Cadimi).",
        "Trang bị nhà đóng gói đạt chuẩn vệ sinh HACCP, khử trùng bằng Ozone sinh học.",
        "Bảo quản chuỗi lạnh liên tục (Cold Chain) từ lúc cắt cuống đến cảng hàng không.",
      ],
    },
    {
      id: "exp-3",
      title: "Chiếu Xạ Thực Phẩm & Kiểm Dịch Thực Vật Đi Mỹ, Úc, Nhật Bản",
      market: "Hoa Kỳ, Nhật Bản, Úc",
      readTime: "6 phút đọc",
      badge: "Công nghệ xử lý",
      badgeColor: "bg-purple-100 text-purple-800",
      desc: "Quy trình xử lý nhiệt hơi nước nóng (VHT) và chiếu xạ gamma diệt trừ triệt để ruồi đục quả trước khi thông quan vào các thị trường khó tính nhất thế giới.",
      highlights: [
        "Chuyên gia kiểm dịch USDA / MAFF trực tiếp giám sát tại cơ sở chiếu xạ Việt Nam.",
        "Tem kiểm dịch chống giả tích hợp mã QR xác nhận lô hàng đã xử lý an toàn.",
        "Độ brix và mẫu mã vỏ quả không bị ảnh hưởng sau quá trình xử lý nhiệt.",
      ],
    },
    {
      id: "exp-4",
      title: "Quản Trị Chuỗi Cung Ứng Lạnh (Cold Chain) Container Nông Sản Đường Biển",
      market: "Toàn cầu",
      readTime: "5 phút đọc",
      badge: "Logistics",
      badgeColor: "bg-amber-100 text-amber-800",
      desc: "Kiểm soát nhiệt độ, độ ẩm và nồng độ khí Ethylene trong container lạnh suốt hành trình 15 - 25 ngày trên biển để trái cây vẫn tươi ngon khi cập cảng đích.",
      highlights: [
        "Sử dụng cảm biến IoT truyền dữ liệu nhiệt độ về hệ thống AgriTrace AI thời gian thực.",
        "Túi hút Ethylene và màng điều biến khí MAP kéo dài tuổi thọ quả sau thu hoạch.",
        "Quy trình xử lý rủi ro khi phát hiện dao động nhiệt độ bất thường trên biển.",
      ],
    },
  ];

  const TIPS_TOPICS = [
    {
      id: "tip-1",
      title: "Mẹo Phân Biệt Trái Cây Chín Tự Nhiên Và Trái Cây Dùng Thuốc Ép Chín",
      category: "Cẩm nang gia đình",
      badge: "Mẹo nhà nông",
      badgeColor: "bg-emerald-100 text-emerald-800",
      desc: "Cách quan sát cuống trái, màu vỏ, mùi thơm tự nhiên và độ đàn hồi khi sờ tay để không bao giờ mua nhầm hoa quả ngâm thuốc kích chín.",
      tipsList: [
        "Cuống quả: Quả chín cây cuống còn tươi, chảy mủ thơm; quả ngâm thuốc cuống khô héo hoặc thâm đen.",
        "Mùi hương: Trái chín tự nhiên tỏa hương thơm dịu ngào ngạt ở cuống và đáy quả.",
        "Màu sắc: Chín cây màu sắc loang tự nhiên theo vệt nắng; chín ép màu vàng đồng đều bất thường nhưng ruột sượng.",
      ],
    },
    {
      id: "tip-2",
      title: "Bí Quyết Giữ Rau Ăn Lá Tươi Giòn Đến 10 Ngày Mà Không Bị Nhũn Cuống",
      category: "Bảo quản thực phẩm",
      badge: "Mẹo bảo quản",
      badgeColor: "bg-blue-100 text-blue-800",
      desc: "Nguyên nhân khiến rau nhanh thối trong tủ lạnh là do độ ẩm dư thừa đọng trên bề mặt lá. Hướng dẫn kỹ thuật bọc giấy thấm và hộp kín chuyên dụng.",
      tipsList: [
        "Không rửa rau trước khi cất tủ lạnh, nhặt bỏ các lá dập nát trước khi đóng gói.",
        "Lót một lớp khăn giấy ăn ở đáy hộp và trên mặt rau để hút ẩm dư thừa.",
        "Duy trì nhiệt độ ngăn mát từ 4°C – 8°C, tránh để sát họng gió lạnh làm đông đá lá rau.",
      ],
    },
    {
      id: "tip-3",
      title: "Cách Tra Cứu Thông Tin Tem QR Nông Sản Trong 3 Giây Bằng Smartphone",
      category: "Công nghệ AgriTrace",
      badge: "Tính năng app",
      badgeColor: "bg-purple-100 text-purple-800",
      desc: "Tận dụng tối đa mã QR dán trên sản phẩm để kiểm tra nguồn gốc, ngày hái và giấy kiểm định VietGAP nhằm bảo vệ sức khỏe gia đình.",
      tipsList: [
        "Mở camera mặc định trên iOS / Android hoặc truy cập tính năng Quét QR trên web AgriTrace.",
        "Kiểm tra dấu tick xanh 'Chứng nhận đã xác minh' do Quản trị viên Admin duyệt.",
        "Xem ngày thu hoạch: Không nên chọn rau ăn lá đã thu hoạch quá 4 ngày dù được bảo quản mát.",
      ],
    },
    {
      id: "tip-4",
      title: "Mẹo Săn Voucher Giảm Giá 30% & Tận Dụng Điểm Thưởng Nông Sản AgriPoints",
      category: "Mua sắm thông minh",
      badge: "Tiết kiệm chi tiêu",
      badgeColor: "bg-amber-100 text-amber-800",
      desc: "Chiến thuật tích điểm sau mỗi đơn hàng để nhanh chóng thăng hạng Bạc, Vàng, Kim Cương và đổi điểm lấy mã miễn phí vận chuyển trọn năm.",
      tipsList: [
        "Lưu trước các mã giảm giá vào ngày thứ Hai hàng tuần tại mục 'Kho Voucher Ưu Đãi'.",
        "Mua nông sản theo combo tuần hoặc rủ mua chung để đạt mốc đơn freeship.",
        "Đổi điểm AgriPoints vào dịp chính vụ để nhận thêm quà tặng nông sản đặc sản.",
      ],
    },
  ];

  return (
    <div className="bg-gray-50/50 min-h-screen py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <BookOpen size={14} /> CHUYÊN TRANG KIẾN THỨC & NÔNG SẢN
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Kiến Thức & Chia Sẻ
          </h1>
          <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed">
            Chuyên đề chuyên sâu về tiêu chuẩn xuất khẩu nông sản quốc tế, kỹ thuật chuỗi lạnh và bộ mẹo vặt hữu ích dành cho người tiêu dùng thông thái.
          </p>

          {/* Search box */}
          <div className="relative mt-6 max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo chủ đề, tiêu chuẩn, mẹo hay..."
              className="w-full pl-11 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* 2 Main Tabs: Chuyên đề xuất khẩu & Tips & Tricks */}
        <div className="flex justify-center mb-10">
          <div className="bg-white p-1.5 rounded-2xl border border-gray-200/90 shadow-xs inline-flex gap-2">
            <button
              onClick={() => setActiveTab("export")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "export"
                  ? "bg-[#1a7a3a] text-white shadow-sm shadow-emerald-700/20"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Globe2 size={16} />
              <span>Chuyên Đề Xuất Khẩu Nông Sản</span>
            </button>

            <button
              onClick={() => setActiveTab("tips")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "tips"
                  ? "bg-[#1a7a3a] text-white shadow-sm shadow-emerald-700/20"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Lightbulb size={16} />
              <span>Tips & Tricks (Mẹo Hay)</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Chuyên Đề Xuất Khẩu Nông Sản */}
        {activeTab === "export" && (
          <div className="space-y-6 mb-14">
            <div className="bg-gradient-to-r from-[#0c2415] to-[#1a572f] rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Nông sản Việt vươn ra biển lớn
                </span>
                <h2 className="text-xl sm:text-2xl font-bold">
                  Hệ Chuẩn Mực Xuất Khẩu Nông Sản Chính Ngạch 2026
                </h2>
                <p className="text-gray-300 text-xs sm:text-sm max-w-xl">
                  Để sầu riêng, thanh long, xoài và bơ Việt Nam thâm nhập vào các thị trường khắt khe (EU, Mỹ, Nhật Bản, Trung Quốc), toàn bộ chuỗi cung ứng phải số hóa minh bạch từ Mã số vùng trồng đến Tem QR truy xuất.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2 bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-800 text-center">
                <div>
                  <div className="text-2xl font-extrabold text-emerald-400">100%</div>
                  <div className="text-[11px] text-gray-300">Minh bạch mã vùng</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {EXPORT_TOPICS.filter(
                (item) =>
                  item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.market.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((topic) => (
                <div
                  key={topic.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${topic.badgeColor}`}>
                        {topic.badge}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">{topic.readTime}</span>
                    </div>

                    <div className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                      <Globe2 size={13} /> Thị trường: {topic.market}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug mb-2.5">
                      {topic.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                      {topic.desc}
                    </p>

                    <div className="space-y-1.5 pt-3 border-t border-gray-100">
                      {topic.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Tài liệu viện nghiên cứu</span>
                    <Link
                      href="/traceability"
                      className="text-xs font-bold text-[#1a7a3a] hover:underline flex items-center gap-1"
                    >
                      Xem mẫu tem xuất khẩu <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Tips & Tricks */}
        {activeTab === "tips" && (
          <div className="space-y-6 mb-14">
            <div className="bg-gradient-to-r from-[#144725] to-[#257540] rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Mẹo hay mỗi ngày
                </span>
                <h2 className="text-xl sm:text-2xl font-bold">
                  Bí Quyết Chọn Lựa & Bảo Quản Nông Sản Chuẩn Sạch
                </h2>
                <p className="text-gray-200 text-xs sm:text-sm max-w-xl">
                  Tổng hợp những kinh nghiệm thực tế từ các chuyên gia nông học và đầu bếp lành nghề giúp bạn giữ trọn vẹn vị tươi ngon của nông sản.
                </p>
              </div>
              <div className="shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <Lightbulb size={28} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {TIPS_TOPICS.filter(
                (item) =>
                  item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.category.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((tip) => (
                <div
                  key={tip.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${tip.badgeColor}`}>
                        {tip.badge}
                      </span>
                      <span className="text-xs text-gray-400">{tip.category}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug mb-2.5">
                      {tip.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                      {tip.desc}
                    </p>

                    <div className="space-y-2 pt-3 border-t border-gray-100 bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/60">
                      {tip.tipsList.map((t, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-800">
                          <Lightbulb className="w-3.5 h-3.5 text-[#1a7a3a] shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Kiến thức tiêu dùng an toàn</span>
                    <Link
                      href="/products"
                      className="text-xs font-bold text-[#1a7a3a] hover:underline flex items-center gap-1"
                    >
                      Áp dụng chọn nông sản ngay <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA Box */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 text-center max-w-2xl mx-auto shadow-xs">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
            Bạn Muốn Chia Sẻ Kinh Nghiệm Canh Tác Hoặc Có Câu Hỏi?
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 mb-5">
            Đội ngũ kỹ sư nông học và cộng đồng đối tác nông dân AgriTrace AI luôn sẵn lòng trao đổi và hỗ trợ giải đáp 24/7.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/farming-techniques"
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
            >
              Xem Kỹ Thuật Canh Tác
            </Link>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-xl bg-[#1a7a3a] hover:bg-[#156e34] text-white text-xs font-bold transition-colors shadow-xs"
            >
              Gửi Tin Nhắn Cho Chúng Tôi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-20 text-center text-gray-500">Đang tải kiến thức...</div>}>
      <KnowledgeContent />
    </Suspense>
  );
}
