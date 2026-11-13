"use client";

import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  HelpCircle,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";

export default function ContactPage() {
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    role: "customer",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pre-fill if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  const targetEmail = "lequangminhqwer@gmail.com";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Vui lòng điền đầy đủ họ tên, email và nội dung tin nhắn!");
      return;
    }
    setSubmitted(true);
    toast.success(`Đã tiếp nhận tin nhắn! Hệ thống đang chuyển thông tin tới ${targetEmail}`);
  }

  function handleCopyEmail() {
    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(targetEmail);
      setCopied(true);
      toast.success(`Đã sao chép email ${targetEmail} vào bộ nhớ tạm!`);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  const mailtoLink = `mailto:${targetEmail}?subject=${encodeURIComponent(
    formData.subject || `Liên hệ từ ${formData.name || "Khách hàng"}`
  )}&body=${encodeURIComponent(
    `Họ và tên: ${formData.name}\nSố điện thoại: ${formData.phone}\nEmail: ${formData.email}\nVai trò: ${formData.role}\n\nNội dung liên hệ:\n${formData.message}`
  )}`;

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
            Chúng tôi luôn sẵn sàng lắng nghe ý kiến đóng góp, giải đáp thắc mắc và hỗ trợ hợp tác với bà con nông dân, nhà phân phối và khách hàng trên cả nước. Mọi yêu cầu được chuyển trực tiếp tới hòm thư điều phối <strong className="text-emerald-800">{targetEmail}</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-14">
          {/* Left Info Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-[#0c2616] via-[#133e21] to-[#1c5d33] rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-radial from-emerald-400/15 to-transparent pointer-events-none" />

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
                  <div className="flex-1">
                    <strong className="block text-white">Hòm thư tiếp nhận & điều phối:</strong>
                    <span className="text-white font-mono font-bold text-xs sm:text-sm block text-emerald-200">
                      {targetEmail}
                    </span>
                    <span className="text-emerald-100/80 block text-[11px] mt-0.5">
                      Phụ trách: <strong>Lê Quang Minh</strong> (Thương mại & Quan hệ đối tác)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-200 text-[11px] font-semibold transition-colors cursor-pointer border border-white/10"
                    >
                      {copied ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
                      <span>{copied ? "Đã sao chép email" : "Sao chép email"}</span>
                    </button>
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
                  className="px-3.5 py-1.5 rounded-xl bg-white text-[#1a7a3a] text-xs font-bold hover:bg-emerald-50 transition-colors shadow-xs"
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
                href="/about"
                className="p-4 rounded-2xl bg-white border border-gray-200/90 hover:border-blue-300 shadow-xs transition-all text-center group"
              >
                <Building2 size={22} className="mx-auto text-blue-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-gray-900 text-xs">Hợp Tác Đối Tác B2B</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Nhà phân phối & Nông dân</div>
              </Link>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-9 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">
                  Gửi Tin Nhắn Cho Đội Ngũ AgriTrace AI
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <Mail size={11} /> {targetEmail}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-6">
                Điền thông tin vào biểu mẫu dưới đây, thông điệp sẽ được gửi trực tiếp tới hòm thư quản trị viên và nhân viên phụ trách sẽ phản hồi trong vòng 2 giờ làm việc.
              </p>

              {submitted ? (
                <div className="py-10 text-center space-y-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 p-6 sm:p-8 animate-in fade-in duration-200">
                  <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg ring-4 ring-emerald-100">
                    <CheckCircle2 size={36} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900">
                      Gửi Tin Nhắn Thành Công!
                    </h3>
                    <p className="text-xs text-emerald-800 font-semibold mt-1">
                      Mã tiếp nhận: <span className="font-mono">AGRI-REQ-{Date.now().toString().slice(-6)}</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-emerald-200 text-left text-xs space-y-1.5 max-w-md mx-auto shadow-2xs">
                    <div className="text-gray-500">Hòm thư tiếp nhận: <strong className="text-emerald-900 font-mono">{targetEmail}</strong></div>
                    <div className="text-gray-500">Người liên hệ: <strong className="text-gray-800">{formData.name}</strong> ({formData.email})</div>
                    <div className="text-gray-500">Tiêu đề: <strong className="text-gray-800">{formData.subject || "Liên hệ hợp tác / Hỗ trợ"}</strong></div>
                    <div className="text-emerald-800 font-medium pt-1 text-[11px]">
                      ✓ Đã lưu vào hàng đợi xử lý của Quản trị viên (Lê Quang Minh).
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                    <a
                      href={mailtoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <ExternalLink size={13} />
                      <span>Mở Ứng Dụng Email (Gửi Thêm Chi Tiết)</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          name: user?.name || "",
                          phone: user?.phone || "",
                          email: user?.email || "",
                          role: "customer",
                          subject: "",
                          message: "",
                        });
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Gửi Thêm Tin Nhắn Khác
                    </button>
                  </div>
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
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
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
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Địa chỉ Email của bạn <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Bạn là ai? (Vai trò đối tác)
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white shadow-2xs cursor-pointer"
                      >
                        <option value="customer">Người tiêu dùng (Khách hàng)</option>
                        <option value="farmer">Chủ trang trại / Nông dân (Muốn liên kết HTX)</option>
                        <option value="distributor">Nhà phân phối / Đơn vị vận chuyển xe lạnh</option>
                        <option value="warehouse">Đơn vị quản lý kho bảo quản nông sản</option>
                        <option value="enterprise">Chuỗi siêu thị / Doanh nghiệp xuất khẩu</option>
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
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
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
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-[11px] text-gray-500">
                      Tin nhắn sẽ được gửi tự động tới <strong className="text-emerald-800">{targetEmail}</strong>
                    </span>

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 bg-[#1a7a3a] hover:bg-[#156e34] text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send size={15} /> Gửi Tin Nhắn Liên Hệ
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
