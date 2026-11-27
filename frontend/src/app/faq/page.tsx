"use client";

import {
  ChevronDown,
  HelpCircle,
  MessageCircle,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface FAQItem {
  id: string;
  category: "all" | "qr" | "order" | "loyalty" | "ai" | "partner";
  question: string;
  answer: string;
  tag: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "faq-1",
    category: "qr",
    question: "Mã QR truy xuất nguồn gốc hoạt động như thế nào?",
    answer:
      "Mỗi lô nông sản khi thu hoạch được cấp một mã QR định danh duy nhất (UUID). Khi quét mã bằng camera điện thoại hoặc ứng dụng AgriTrace, bạn sẽ xem được toàn bộ thông tin minh bạch gồm: Tên nông trại canh tác, ngày gieo trồng & thu hoạch, giấy chứng nhận VietGAP/GlobalGAP kèm ảnh scan, nhiệt độ lưu kho và lộ trình giao nhận của nhà phân phối.",
    tag: "Truy xuất QR",
  },
  {
    id: "faq-2",
    category: "qr",
    question: "Làm thế nào để xác minh chứng nhận VietGAP của sản phẩm có thật hay không?",
    answer:
      "Trên trang chi tiết truy xuất nguồn gốc của mỗi lô hàng, hệ thống hiển thị số hiệu chứng nhận, cơ quan thẩm quyền cấp phép, ngày cấp và ngày hết hạn. Bạn có thể nhấn vào xem chứng chỉ gốc đã được bộ phận kiểm định Admin đối soát và đóng dấu xác thực trên hệ thống AgriTrace AI.",
    tag: "Chứng nhận chất lượng",
  },
  {
    id: "faq-3",
    category: "ai",
    question: "Trợ lý Trí tuệ Nhân tạo (AI Chatbot) trả lời dựa trên nguồn dữ liệu nào?",
    answer:
      "AgriTrace AI Chatbot được huấn luyện trên cơ sở dữ liệu thời gian thực của toàn bộ hệ thống: danh mục sản phẩm, thông tin mùa vụ, dữ liệu kiểm định VietGAP, lượng tồn kho và nhật ký canh tác. Chatbot giúp giải đáp thắc mắc về nguồn gốc, gợi ý cách bảo quản rau củ, tư vấn món ăn dinh dưỡng và giải đáp câu hỏi của người mua ngay lập tức.",
    tag: "Trí tuệ nhân tạo AI",
  },
  {
    id: "faq-4",
    category: "ai",
    question: "Hệ thống AI dự đoán nhu cầu tiêu thụ và cảnh báo rủi ro giúp ích gì cho nông dân và chủ hàng?",
    answer:
      "Module AI Demand Forecasting phân tích lịch sử bán hàng, xu hướng theo mùa vụ và ngày trong tuần để dự báo sản lượng cần tiêu thụ trong 7 ngày tới. Nhờ đó, người nông dân và chủ kho chủ động lên kế hoạch thu hoạch và nhập hàng, tránh ứ đọng nông sản quá hạn hoặc thiếu hụt nguồn cung cục bộ.",
    tag: "AI Dự đoán",
  },
  {
    id: "faq-5",
    category: "order",
    question: "Tôi có thể mua nông sản trực tiếp trên AgriTrace AI như thế nào?",
    answer:
      "Bạn chỉ cần chọn sản phẩm từ danh mục 'Nông sản & Trái cây mùa vụ', thêm vào giỏ hàng, áp mã giảm giá (voucher) nếu có và tiến hành đặt hàng. Hệ thống hỗ trợ thanh toán trực tuyến thử nghiệm hoặc thanh toán khi nhận hàng (COD). Bạn có thể theo dõi hành trình đơn hàng từng chặng từ kho đến địa chỉ nhận.",
    tag: "Đặt hàng & Giao nhận",
  },
  {
    id: "faq-6",
    category: "loyalty",
    question: "Chương trình tích điểm và thăng hạng thành viên hoạt động ra sao?",
    answer:
      "Mỗi 10,000 VNĐ chi tiêu thành công trên hệ thống, bạn tích lũy được 1 Điểm Nông Sản (AgriPoint). Hệ thống có 4 hạng thành viên: Hạng Đồng (mặc định), Hạng Bạc (từ 500 điểm), Hạng Vàng (từ 2,000 điểm) và Hạng Kim Cương (từ 5,000 điểm). Hạng càng cao bạn càng nhận được nhiều voucher độc quyền và tỷ lệ tích điểm nhân đôi.",
    tag: "Tích điểm & Hạng",
  },
  {
    id: "faq-7",
    category: "loyalty",
    question: "Làm sao để sử dụng mã giảm giá (Voucher)?",
    answer:
      "Bạn truy cập trang 'Kho Voucher Ưu Đãi' để lưu các mã giảm theo phần trăm, giảm tiền cố định hoặc miễn phí vận chuyển. Khi đến bước thanh toán trong giỏ hàng, hệ thống sẽ gợi ý danh sách voucher hợp lệ để bạn áp dụng chỉ bằng 1 thao tác nhấn chuột.",
    tag: "Voucher ưu đãi",
  },
  {
    id: "faq-8",
    category: "order",
    question: "Nông sản có được đảm bảo độ tươi ngon khi giao đến nhà không?",
    answer:
      "100% nông sản trên AgriTrace AI được thu hoạch trong ngày và đóng gói theo tiêu chuẩn bảo quản lạnh chuỗi cung ứng khép kín. Nếu sản phẩm bị hư hỏng, dập nát hoặc không đúng thông tin truy xuất nguồn gốc, bạn có thể gửi yêu cầu đổi trả hoặc hoàn tiền trong vòng 24 giờ kể từ khi nhận hàng.",
    tag: "Chính sách đổi trả",
  },
  {
    id: "faq-9",
    category: "partner",
    question: "Tôi là nông dân / chủ trang trại, làm sao để đăng ký bán hàng trên AgriTrace AI?",
    answer:
      "Bạn có thể đăng ký tài khoản với vai trò 'Nông dân (Farmer)', sau đó hoàn tất hồ sơ pháp lý nông trại và giấy chứng nhận kiểm định (VietGAP/GlobalGAP/Hữu cơ). Quản trị viên hệ thống sẽ kiểm duyệt hồ sơ trong vòng 24–48 giờ trước khi kích hoạt quyền tạo lô hàng và sinh mã QR.",
    tag: "Dành cho Nông dân",
  },
  {
    id: "faq-10",
    category: "partner",
    question: "Nhà phân phối hoặc đối tác vận chuyển cập nhật trạng thái đơn hàng như thế nào?",
    answer:
      "Đối tác vận chuyển đăng nhập vào Cổng Nhà Phân Phối (Distributor Portal), quét mã QR trên thùng hàng khi tiếp nhận tại kho và cập nhật lộ trình di chuyển (Đã lấy hàng -> Đang trung chuyển -> Đang giao hàng -> Đã giao thành công). Mọi dữ liệu được đồng bộ hóa tức thì lên lịch sử truy xuất của khách hàng.",
    tag: "Dành cho Vận chuyển",
  },
];

const CATEGORIES = [
  { key: "all", label: "Tất cả câu hỏi", icon: HelpCircle },
  { key: "qr", label: "Truy xuất QR & Nguồn gốc", icon: QrCode },
  { key: "ai", label: "Trí tuệ nhân tạo AI", icon: Sparkles },
  { key: "order", label: "Đặt hàng & Giao nhận", icon: Truck },
  { key: "loyalty", label: "Voucher & Tích điểm", icon: Wallet },
  { key: "partner", label: "Nông trại & Đối tác", icon: Users },
];

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "faq-1": true,
    "faq-3": true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesTab = activeTab === "all" || item.category === activeTab;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="bg-gray-50/50 min-h-screen py-10 sm:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <HelpCircle size={14} /> Trung Tâm Hỗ Trợ Khách Hàng
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Câu Hỏi Thường Gặp (FAQ)
          </h1>
          <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed">
            Giải đáp mọi thắc mắc về quy trình truy xuất nguồn gốc nông sản bằng mã QR, tính năng AI hỗ trợ, chính sách mua hàng và chương trình hội viên.
          </p>

          {/* Search Box */}
          <div className="relative mt-6 max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm câu hỏi (ví dụ: mã QR, VietGAP, voucher, AI chatbot...)"
              className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-200 shadow-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm text-gray-800"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar justify-start sm:justify-center">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#1a7a3a] text-white shadow-sm shadow-emerald-700/20 font-semibold"
                    : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200/80"
                }`}
              >
                <Icon size={15} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3.5 mb-14">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = !!openItems[faq.id];
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition-all hover:border-emerald-300"
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs shrink-0 mt-0.5 sm:mt-0">
                        {faq.tag}
                      </span>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base leading-snug">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-emerald-600" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-gray-600 text-sm leading-relaxed border-t border-gray-100 bg-emerald-50/20">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-8">
              <HelpCircle size={40} className="mx-auto text-gray-300 mb-3" />
              <h3 className="font-semibold text-gray-800 text-base">Không tìm thấy câu hỏi phù hợp</h3>
              <p className="text-gray-500 text-sm mt-1">
                Thử thay đổi từ khóa tìm kiếm hoặc bấm &quot;Tất cả câu hỏi&quot; để xem đầy đủ danh mục.
              </p>
            </div>
          )}
        </div>

        {/* CTA Contact Box */}
        <div className="bg-gradient-to-r from-[#0f341d] to-[#1c5c32] rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold flex items-center justify-center sm:justify-start gap-2">
              <MessageCircle size={20} className="text-emerald-400" /> Vẫn còn thắc mắc cần giải đáp?
            </h3>
            <p className="text-gray-300 text-xs sm:text-sm max-w-lg">
              Đội ngũ kỹ thuật AgriTrace AI và nhân viên tư vấn nông trại luôn sẵn sàng giải đáp 24/7 qua cổng chat trực tiếp.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/chat"
              className="px-4 py-2.5 rounded-xl bg-white text-[#1a7a3a] font-semibold text-sm hover:bg-gray-100 transition-colors shadow-sm"
            >
              Chat Với Nhân Viên
            </Link>
            <Link
              href="/ai-hub#chatbot"
              className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-600 border border-emerald-500/50 transition-colors"
            >
              Hỏi Trợ Lý AI
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
