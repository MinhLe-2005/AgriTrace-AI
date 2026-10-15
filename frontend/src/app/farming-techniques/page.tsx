"use client";

import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Droplet,
  FileText,
  Filter,
  Leaf,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Thermometer,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface FarmingGuide {
  id: string;
  cropName: string;
  category: "vegetable" | "fruit" | "hydroponic" | "tuber";
  categoryLabel: string;
  growthDuration: string;
  idealTemp: string;
  watering: string;
  standard: string;
  farmExample: string;
  summary: string;
  stages: { stage: string; days: string; action: string; note: string }[];
}

const FARMING_DATA: FarmingGuide[] = [
  {
    id: "technique-1",
    cropName: "Kỹ Thuật Trồng Xà Lách & Cải Kale Thủy Canh Hồi Lưu",
    category: "hydroponic",
    categoryLabel: "Rau Thủy Canh",
    growthDuration: "35 - 45 ngày",
    idealTemp: "18°C - 25°C",
    watering: "Hồi lưu tự động 15p/lần",
    standard: "VietGAP & Hữu cơ",
    farmExample: "Nông Trại Xanh Đà Lạt (Lâm Đồng)",
    summary:
      "Quy trình canh tác rau ăn lá trên giàn thủy canh màng mỏng dinh dưỡng (NFT), kiểm soát nồng độ EC (1.2 - 1.6 mS/cm) và pH (5.8 - 6.5) chuẩn khoa học không tồn dư kim loại nặng hay nitrat.",
    stages: [
      { stage: "Ươm hạt & Nảy mầm", days: "Ngày 1 - 7", action: "Gieo hạt vào mút xốp giá thể xơ dừa, tưới ẩm 2 lần/ngày, che lưới đen tránh nắng gắt.", note: "Đảm bảo tỷ lệ nảy mầm trên 92%." },
      { stage: "Lên giàn dinh dưỡng", days: "Ngày 8 - 20", action: "Chuyển cây con ra máng thủy canh, cấp dinh dưỡng EC 1.0 - 1.2, duy trì chiếu sáng 10-12h/ngày.", note: "Kiểm tra sâu tơ bằng bẫy sinh học màu vàng." },
      { stage: "Chăm sóc phát triển", days: "Ngày 21 - 35", action: "Tăng nồng độ EC lên 1.4 - 1.6, đo pH hàng ngày vào 8h sáng, tỉa lá gốc thông thoáng.", note: "Ghi nhật ký hệ thống AgriTrace AI tự động." },
      { stage: "Cách ly & Thu hoạch", days: "Ngày 36 - 42", action: "Giảm EC, xả nước sạch 48 giờ trước thu hái để giảm nồng độ nitrat, cắt gốc sáng sớm.", note: "Dán tem mã QR truy xuất và chuyển kho mát 5°C." },
    ],
  },
  {
    id: "technique-2",
    cropName: "Quy Trình Chăm Sóc & Kỹ Thuật Nuôi Trái Cam Sành Chính Vụ",
    category: "fruit",
    categoryLabel: "Cây Ăn Trái Có Múi",
    growthDuration: "8 - 9 tháng",
    idealTemp: "23°C - 32°C",
    watering: "Tưới nhỏ giọt tiết kiệm",
    standard: "VietGAP #VG-2024-412",
    farmExample: "Vườn Cam Sành Hàm Yên (Tuyên Quang)",
    summary:
      "Kỹ thuật xử lý ra hoa nghịch vụ, tỉa cành tạo tán hình nấm, phòng trừ rầy chổng cánh và kỹ thuật bọc trái bảo vệ mẫu mã quả vàng óng tự nhiên đạt chuẩn thu mua xuất khẩu.",
    stages: [
      { stage: "Tỉa cành & Xiết nước", days: "Tháng 1 - 2", action: "Tỉa bỏ cành tăm, cành sâu bệnh, làm sạch cỏ quanh gốc, xiết nước 20 ngày kích thích phân hóa mầm hoa.", note: "Bón lót phân chuồng hoai mục ủ nấm Trichoderma." },
      { stage: "Đậu trái & Tỉa quả non", days: "Tháng 3 - 4", action: "Phun dung dịch vi lượng Bo-Canxi chống rụng trái non, tỉa bỏ các quả dị hình, giữ lại 150-200 quả/cây.", note: "Sử dụng chế phẩm thảo mộc xua đuổi côn trùng." },
      { stage: "Nuôi trái & Bọc màng", days: "Tháng 5 - 7", action: "Bón bổ sung Kali hữu cơ và đạm cá thủy phân giúp quả mọng nước, tép cam giòn ngọt, bọc túi chuyên dụng.", note: "Cập nhật nhật ký canh tác lên cổng Farmer Portal." },
      { stage: "Thu hoạch & Kiểm định", days: "Tháng 8 - 9", action: "Đo độ brix đạt trên 10.5%, dùng kéo chuyên dụng cắt cuống ngắn 0.5cm, lau sạch bằng cồn sinh học.", note: "In mã QR gắn liền với lô thu hoạch xuất kho." },
    ],
  },
  {
    id: "technique-3",
    cropName: "Kỹ Thuật Trồng Bơ Sáp 034 & Bơ Booth Đạt Chuẩn GlobalGAP",
    category: "fruit",
    categoryLabel: "Trái Cây Xuất Khẩu",
    growthDuration: "6 - 7 tháng",
    idealTemp: "20°C - 30°C",
    watering: "Hệ thống phun mưa gốc",
    standard: "GlobalGAP #GG-2025-102",
    farmExample: "Nông Trại Bơ Tây Nguyên (Đắk Lắk)",
    summary:
      "Mô hình trồng bơ ghép năng suất cao, quản lý thảm cỏ giữ ẩm đất Bazan, phòng trừ nấm Phytophthora gây thối rễ bằng chế phẩm sinh học và tiêu chuẩn hái quả già độ sáp béo chuẩn.",
    stages: [
      { stage: "Phục hồi cây sau vụ", days: "Tháng 1", action: "Rửa vườn bằng tinh vôi sinh học, bón phân hữu cơ vi sinh 10kg/gốc, quét keo liền sẹo vết cắt tỉa.", note: "Kiểm tra độ ẩm đất qua cảm biến IoT nông trại." },
      { stage: "Xử lý ra hoa đồng loạt", days: "Tháng 2 - 3", action: "Cân đối N-P-K tỷ lệ 1:2:1, điều tiết tưới nước cách nhật, thả ong thụ phấn tự nhiên trong vườn.", note: "Tuyệt đối không phun thuốc hóa học giai đoạn nở hoa." },
      { stage: "Chăm sóc nuôi quả béo", days: "Tháng 4 - 6", action: "Bón phân hữu cơ khoáng giàu Magie và Kẽm giúp cơm bơ vàng dẻo, quét gốc vôi trắng chống mọt đục thân.", note: "Ghi chép mã lô sản xuất vào hệ thống AgriTrace." },
      { stage: "Thu hoạch quả già", days: "Tháng 7", action: "Hái khi vỏ quả chuyển sang xanh sẫm, cuống hơi teo, quả đốm sao vàng. Phân loại size A (3 quả/kg).", note: "Bọc xốp lưới chống trầy xước khi vận chuyển." },
    ],
  },
];

export default function FarmingTechniquesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<string>("technique-1");

  const filteredGuides = FARMING_DATA.filter((guide) => {
    const matchCat = activeCategory === "all" || guide.category === activeCategory;
    const matchSearch =
      guide.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.farmExample.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.standard.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeData = FARMING_DATA.find((g) => g.id === selectedGuide) || FARMING_DATA[0];

  return (
    <div className="bg-gray-50/50 min-h-screen py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <Leaf size={14} /> HỒ SƠ CANH TÁC & KỸ THUẬT NÔNG NGHIỆP
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Kỹ Thuật Chăm Sóc Cây Trồng
          </h1>
          <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed">
            Quy trình canh tác chuẩn VietGAP & GlobalGAP từ các nông trại liên kết AgriTrace AI — Hướng dẫn chi tiết từng giai đoạn sinh trưởng, dinh dưỡng và thu hoạch an toàn.
          </p>

          {/* Search bar */}
          <div className="relative mt-6 max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo giống cây, nông trại, chứng chỉ (ví dụ: xà lách, cam sành, VietGAP...)"
              className="w-full pl-11 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar justify-start sm:justify-center">
          {[
            { key: "all", label: "Tất cả quy trình" },
            { key: "hydroponic", label: "Rau Thủy Canh" },
            { key: "fruit", label: "Cây Ăn Trái" },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.key
                  ? "bg-[#1a7a3a] text-white shadow-xs font-semibold"
                  : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Guide Selection Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {filteredGuides.map((guide) => {
            const isSelected = selectedGuide === guide.id;
            return (
              <div
                key={guide.id}
                onClick={() => setSelectedGuide(guide.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-white border-[#1a7a3a] ring-2 ring-emerald-500/20 shadow-md"
                    : "bg-white/80 border-gray-200 hover:bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                    {guide.categoryLabel}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">{guide.growthDuration}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-2">
                  {guide.cropName}
                </h3>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin size={12} className="text-emerald-600 shrink-0" />
                  <span className="truncate">{guide.farmExample}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Guide Presentation */}
        {activeData && (
          <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-9 shadow-sm mb-12">
            {/* Guide Header */}
            <div className="border-b border-gray-100 pb-6 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full">
                  {activeData.standard}
                </span>
                <span className="text-xs text-gray-500">
                  Nông trại áp dụng: <strong className="text-gray-800">{activeData.farmExample}</strong>
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 leading-snug">
                {activeData.cropName}
              </h2>
              <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                {activeData.summary}
              </p>

              {/* Quick specs pill */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2.5">
                  <Clock size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-[11px] text-gray-400">Chu kỳ canh tác</div>
                    <div className="text-xs font-bold text-gray-800">{activeData.growthDuration}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2.5">
                  <Thermometer size={18} className="text-amber-500 shrink-0" />
                  <div>
                    <div className="text-[11px] text-gray-400">Nhiệt độ thích hợp</div>
                    <div className="text-xs font-bold text-gray-800">{activeData.idealTemp}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2.5">
                  <Droplet size={18} className="text-blue-500 shrink-0" />
                  <div>
                    <div className="text-[11px] text-gray-400">Chế độ tưới nước</div>
                    <div className="text-xs font-bold text-gray-800 truncate">{activeData.watering}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2.5">
                  <ShieldCheck size={18} className="text-purple-600 shrink-0" />
                  <div>
                    <div className="text-[11px] text-gray-400">Tiêu chuẩn kiểm định</div>
                    <div className="text-xs font-bold text-gray-800 truncate">{activeData.standard}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stages Timeline */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-600" />
                Lộ Trình Chăm Sóc Từng Giai Đoạn
              </h3>

              <div className="space-y-6">
                {activeData.stages.map((stg, i) => (
                  <div key={i} className="flex gap-4 sm:gap-5 items-start">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-100">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">{stg.stage}</h4>
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                          {stg.days}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-2">
                        {stg.action}
                      </p>
                      <div className="text-[11.5px] text-emerald-900 bg-white p-2.5 rounded-xl border border-gray-200/80 flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span><strong>Yêu cầu kỹ thuật:</strong> {stg.note}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Link to Farmer Portal */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-500 text-center sm:text-left">
                Bạn là nông dân muốn đưa hồ sơ canh tác của nông trại mình lên hệ thống AgriTrace AI?
              </div>
              <Link
                href="/dashboard/farmer"
                className="px-5 py-2.5 rounded-xl bg-[#1a7a3a] text-white font-semibold text-xs hover:bg-[#156e34] transition-colors whitespace-nowrap shadow-xs"
              >
                Vào Cổng Nông Dân (Farmer Portal)
              </Link>
            </div>
          </div>
        )}

        {/* AI Diagnostic CTA Box */}
        <div className="bg-gradient-to-r from-[#0f341d] to-[#1c5c32] rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-1 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} /> Trợ lý AI nông nghiệp
            </div>
            <h3 className="text-lg sm:text-xl font-bold">
              Cần Tư Vấn Kỹ Thuật Canh Tác Hoặc Chẩn Đoán Sâu Bệnh?
            </h3>
            <p className="text-gray-300 text-xs sm:text-sm max-w-lg">
              Trợ lý AgriTrace AI Chatbot được huấn luyện trên kho tri thức nông học chuẩn VietGAP, sẵn sàng hỗ trợ giải đáp thắc mắc về phân bón, tưới tiêu và cách ly thuốc.
            </p>
          </div>

          <Link
            href="/ai-hub#chatbot"
            className="px-5 py-3 rounded-xl bg-white text-[#1a7a3a] font-bold text-sm hover:bg-gray-100 transition-colors shadow-sm shrink-0"
          >
            Hỏi Trợ Lý AI Ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
