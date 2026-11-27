"use client";

import {
  Building2,
  CheckCircle2,
  Clock,
  HelpCircle,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    role: "customer",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;
    setSubmitted(true);
  }

  return (
    <div className="bg-gray-50/50 min-h-screen py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <Mail size={14} /> LIÊN HỆ & HỢP TÁC NÔNG NGHIỆP
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Liên Hệ Với AgriTrace AI
          </h1>
          <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed">
            Chúng tôi luôn sẵn sàng lắng nghe ý kiến đóng góp, giải đáp thắc mắc và hỗ trợ hợp tác với bà con nông dân, nhà phân phối và khách hàng trên cả nước.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-14">
          {/* Left Info Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-[#0c2616] to-[#1c5d33] rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
              <div>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Trụ sở điều hành
                </span>
                <h3 className="text-xl font-bold mt-1 text-white">
                  Trung Tâm Công Nghệ Chuỗi Nông Sản
                </h3>
                <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
                  Dự án AgriTrace AI — Hệ thống Quản trị Chuỗi Cung Ứng Nông Sản Sạch & Truy Xuất QR Code 2026.
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <strong className="block text-white">Địa chỉ văn phòng:</strong>
                    <span className="text-emerald-100/80">Khu Công nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                    <Phone size={18} />
                  </div>
                  <div>
                    <strong className="block text-white">Hotline tư vấn & đặt hàng:</strong>
                    <span className="text-emerald-200 font-bold">1900 1234</span>
                    <span className="text-emerald-100/70 block text-[11px]">(8:00 - 21:00 hàng ngày)</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                    <Mail size={18} />
                  </div>
                  <div>
                    <strong className="block text-white">Hòm thư điện tử:</strong>
                    <span className="text-emerald-100/80">contact@agritrace.ai</span>
                    <span className="text-emerald-100/70 block text-[11px]">support@agritrace.ai</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                    <Clock size={18} />
                  </div>
                  <div>
                    <strong className="block text-white">Kênh hỗ trợ trực tuyến:</strong>
                    <span className="text-emerald-100/80">Chat trực tuyến & Trợ lý AI hoạt động 24/7</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-emerald-800/80 flex items-center justify-between">
                <span className="text-[11px] text-emerald-200">Kênh giải đáp nhanh:</span>
                <Link
                  href="/chat"
                  className="px-3 py-1.5 rounded-xl bg-white text-[#1a7a3a] text-xs font-bold hover:bg-emerald-50 transition-colors shadow-xs"
                >
                  Mở Kênh Chat Live
                </Link>
              </div>
            </div>

            {/* Quick Link Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/faq"
                className="p-4 rounded-2xl bg-white border border-gray-200/90 hover:border-emerald-300 shadow-xs transition-all text-center group"
              >
                <HelpCircle size={22} className="mx-auto text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-gray-900 text-xs">Câu Hỏi FAQ</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Giải đáp ngay tức thì</div>
              </Link>

              <Link
                href="/guides"
                className="p-4 rounded-2xl bg-white border border-gray-200/90 hover:border-blue-300 shadow-xs transition-all text-center group"
              >
                <Building2 size={22} className="mx-auto text-blue-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-gray-900 text-xs">Hợp Tác Nông Dân</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Đăng ký chuỗi liên kết</div>
              </Link>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-9 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Gửi Tin Nhắn Cho Đội Ngũ AgriTrace AI
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mb-6">
                Điền thông tin vào biểu mẫu dưới đây, nhân viên phụ trách sẽ phản hồi trong vòng 2 giờ làm việc.
              </p>

              {submitted ? (
                <div className="py-12 text-center space-y-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 p-6">
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 size={30} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Gửi Tin Nhắn Thành Công!
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                    Cảm ơn bạn <strong className="text-gray-900">{formData.name}</strong> đã liên hệ với AgriTrace AI. Chúng tôi đã nhận được thông điệp và sẽ phản hồi qua email <strong className="text-gray-900">{formData.email}</strong> sớm nhất.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", phone: "", email: "", role: "customer", subject: "", message: "" });
                    }}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-[#1a7a3a] text-white text-xs font-bold hover:bg-[#156e34] transition-colors"
                  >
                    Gửi Thêm Tin Nhắn Khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ví dụ: Nguyễn Văn An"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Ví dụ: 0912 345 678"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Địa chỉ Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Bạn là ai? (Vai trò)
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                      >
                        <option value="customer">Người tiêu dùng (Khách hàng)</option>
                        <option value="farmer">Chủ trang trại / Nông dân (Muốn hợp tác)</option>
                        <option value="warehouse">Đơn vị quản lý kho bảo quản</option>
                        <option value="distributor">Nhà xe / Đơn vị vận chuyển logistics</option>
                        <option value="enterprise">Doanh nghiệp xuất khẩu thu mua</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Tiêu đề liên hệ
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Ví dụ: Đăng ký liên kết đưa nông trại vào hệ thống truy xuất QR"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Nội dung tin nhắn <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Chi tiết câu hỏi, nhu cầu hợp tác hoặc thông tin nông sản..."
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1a7a3a] hover:bg-[#156e34] text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Send size={16} /> Gửi Tin Nhắn Liên Hệ
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
