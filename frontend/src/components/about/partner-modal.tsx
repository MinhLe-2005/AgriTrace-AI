"use client";

import { useEffect, useState } from "react";
import {
  X,
  Truck,
  Sprout,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Send,
  Sparkles,
  PhoneCall,
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";

export type PartnerType = "distributor" | "farmer" | "b2b";

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: PartnerType;
}

export function PartnerModal({ isOpen, onClose, initialType = "distributor" }: PartnerModalProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<PartnerType>(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    // Common
    fullName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",

    // Distributor specific
    fleetName: "",
    fleetSize: "1 - 3 xe",
    vehicleType: "Xe tải lạnh 1 - 2.5 tấn",
    tempRange: "Thùng mát 2°C - 5°C",
    coverageZone: "Nội thành & Vùng phụ cận",

    // Farmer specific
    farmName: "",
    farmLocation: "",
    farmAcreage: "",
    primaryCrops: "",
    certification: "VietGAP",
    monthlyCapacity: "",

    // B2B specific
    companyName: "",
    businessType: "Nhà hàng / Khách sạn",
    weeklyVolume: "",
    vatRequired: true,
  });

  // Pre-fill user information when modal opens or user changes
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
        address: prev.address || user.address || "",
      }));
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (initialType) {
      setActiveTab(initialType);
    }
    setSubmittedCode(null);
  }, [initialType, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error("Vui lòng nhập họ và tên người đại diện");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 9) {
      toast.error("Vui lòng nhập số điện thoại liên hệ hợp lệ");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const code = `AGRI-B2B-${Math.floor(100000 + Math.random() * 900000)}`;
      
      try {
        const existing = JSON.parse(localStorage.getItem("agritrace_partner_applications") || "[]");
        existing.unshift({
          code,
          type: activeTab,
          data: formData,
          submittedAt: new Date().toISOString(),
          status: "PENDING_REVIEW",
          applicantUserId: user?.id || null,
        });
        localStorage.setItem("agritrace_partner_applications", JSON.stringify(existing));
      } catch {
        // fallback
      }

      setIsSubmitting(false);
      setSubmittedCode(code);
      toast.success("Gửi hồ sơ đăng ký đối tác thành công! Chúng tôi sẽ liên hệ trong 24h.");
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 transition-colors"
            title="Đóng"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-200 mb-1">
            <Sparkles size={14} /> Mở Rộng Hệ Sinh Thái AgriTrace
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">Đăng Ký Trở Thành Đối Tác</h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-lg">
            Hợp tác cùng phát triển chuỗi cung ứng nông sản sạch khép kín, minh bạch và ứng dụng công nghệ truy xuất QR.
          </p>

          {/* Quick Tab switcher */}
          {!submittedCode && (
            <div className="mt-5 grid grid-cols-3 gap-1.5 p-1 bg-black/20 rounded-2xl backdrop-blur-xs text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("distributor")}
                className={`py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "distributor"
                    ? "bg-white text-emerald-900 font-bold shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <Truck size={14} />
                <span className="truncate">Nhà Phân Phối</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("farmer")}
                className={`py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "farmer"
                    ? "bg-white text-emerald-900 font-bold shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <Sprout size={14} />
                <span className="truncate">Nông Trại / HTX</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("b2b")}
                className={`py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "b2b"
                    ? "bg-white text-emerald-900 font-bold shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <Building2 size={14} />
                <span className="truncate">Doanh Nghiệp B2B</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 max-h-[72vh] overflow-y-auto">
          {submittedCode ? (
            /* Success confirmation screen */
            <div className="py-6 px-2 text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-mono font-bold rounded-full border border-emerald-200 mb-2">
                  Mã tiếp nhận: {submittedCode}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  Gửi Hồ Sơ Đối Tác Thành Công!
                </h3>
                <p className="text-gray-600 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                  Cảm ơn <strong className="text-gray-900">{formData.fullName}</strong>. Ban Phát triển Đối tác AgriTrace đã nhận thông tin đăng ký cho mục{" "}
                  <strong className="text-emerald-700">
                    {activeTab === "distributor"
                      ? "Đội Xe Lạnh & Nhà Phân Phối"
                      : activeTab === "farmer"
                      ? "Nông Trại / Hợp Tác Xã Canh Tác"
                      : "Doanh Nghiệp Tiêu Thụ Sỉ"}
                  </strong>.
                </p>
              </div>

              {/* Next steps card */}
              <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 text-left space-y-2.5 max-w-md mx-auto text-xs sm:text-sm text-gray-700">
                <div className="font-bold text-gray-900 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <Clock size={14} className="text-emerald-600" /> Quy trình thẩm định tiếp theo (24h)
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Chuyên viên phụ trách sẽ gọi điện trực tiếp qua số <strong className="text-emerald-800 font-mono">{formData.phone}</strong> để xác thực thông tin.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Khảo sát kỹ thuật thùng xe lạnh hoặc giấy chứng nhận VietGAP / năng lực cung ứng.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Ký thỏa thuận nguyên tắc và cấp tài khoản hệ thống phân quyền chuyên biệt.</span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md transition-all"
                >
                  Hoàn Tất & Đóng
                </button>
              </div>
            </div>
          ) : (
            /* Active Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Context Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3 text-xs text-emerald-900">
                <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  {activeTab === "distributor" && (
                    <p>
                      <strong>Đội Xe Vận Tải Lạnh:</strong> Hưởng chính sách hoa hồng vận chuyển cố định, đối soát thanh toán hàng tuần, hỗ trợ thiết bị giám sát nhiệt độ thùng xe 2°C - 5°C.
                    </p>
                  )}
                  {activeTab === "farmer" && (
                    <p>
                      <strong>Hợp Tác Xã & Trang Trại:</strong> Bao tiêu sản lượng theo hợp đồng mùa vụ, miễn phí khởi tạo mã QR GS1 và hệ thống số hóa nhật ký gieo trồng thu hoạch.
                    </p>
                  )}
                  {activeTab === "b2b" && (
                    <p>
                      <strong>Khách Hàng Doanh Nghiệp:</strong> Cung ứng nông sản VietGAP sỉ định kỳ cho chuỗi nhà hàng, khách sạn, bếp ăn trường học với chiết khấu lên đến 25% kèm hóa đơn VAT đỏ.
                    </p>
                  )}
                </div>
              </div>

              {/* Personal Info Group */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <PhoneCall size={13} /> Thông tin người liên hệ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Họ và tên người đại diện <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Ví dụ: Lê Quang Minh"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Số điện thoại liên hệ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0988 776 655"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email nhận thông báo / đối soát
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="doitac@agritrace.vn"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Địa chỉ / Trụ sở chính
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Quận / Huyện, Tỉnh / Thành phố"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Tab specific fields */}
              {activeTab === "distributor" && (
                <div className="pt-2 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Truck size={13} /> Năng lực phương tiện & Vận chuyển
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tên đội xe / Công ty vận tải
                      </label>
                      <input
                        type="text"
                        value={formData.fleetName}
                        onChange={(e) => setFormData({ ...formData, fleetName: e.target.value })}
                        placeholder="VD: Đội xe Lạnh AgriTrans Express"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Quy mô số lượng xe
                      </label>
                      <select
                        value={formData.fleetSize}
                        onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="1 - 3 xe">1 - 3 xe chuyên dụng</option>
                        <option value="4 - 10 xe">4 - 10 xe tải</option>
                        <option value="Trên 10 xe">Đội xe lớn (Trên 10 xe)</option>
                        <option value="Cá nhân tự do">Tài xế cá nhân có xe thùng bảo ôn</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Loại phương tiện chủ lực
                      </label>
                      <select
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Xe tải lạnh 1 - 2.5 tấn">Xe tải lạnh 1 - 2.5 tấn (vào phố)</option>
                        <option value="Xe tải lạnh 3 - 5 tấn">Xe tải lạnh 3 - 5 tấn</option>
                        <option value="Xe tải nặng trên 8 tấn">Xe tải nặng trên 8 tấn (tuyến dài)</option>
                        <option value="Xe van thùng kín bảo ôn">Xe van thùng kín bảo ôn</option>
                        <option value="Xe máy thùng lạnh mini">Xe máy gắn thùng lạnh mini (giao chặng cuối)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Dải nhiệt độ thùng xe duy trì
                      </label>
                      <select
                        value={formData.tempRange}
                        onChange={(e) => setFormData({ ...formData, tempRange: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Thùng mát 2°C - 5°C">Thùng mát chuyên rau củ (2°C - 5°C)</option>
                        <option value="Thùng đông lạnh -18°C">Thùng đông lạnh âm sâu (-18°C)</option>
                        <option value="Đa dải nhiệt kép">Thùng 2 ngăn đa dải nhiệt</option>
                        <option value="Thùng kín cách nhiệt">Thùng kín bảo ôn cách nhiệt</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tuyến đường / Khu vực vận chuyển thế mạnh
                      </label>
                      <input
                        type="text"
                        value={formData.coverageZone}
                        onChange={(e) => setFormData({ ...formData, coverageZone: e.target.value })}
                        placeholder="VD: Nội thành Hà Nội, Tuyến Lâm Đồng - TP.HCM, Tây Bắc - Hà Nội..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "farmer" && (
                <div className="pt-2 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sprout size={13} /> Thông tin nông trại & Tiêu chuẩn canh tác
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tên Nông Trại / Hợp Tác Xã
                      </label>
                      <input
                        type="text"
                        value={formData.farmName}
                        onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                        placeholder="VD: Nông Trại Xanh Mộc Châu"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tỉnh / Vùng canh tác
                      </label>
                      <input
                        type="text"
                        value={formData.farmLocation}
                        onChange={(e) => setFormData({ ...formData, farmLocation: e.target.value })}
                        placeholder="VD: Đà Lạt (Lâm Đồng), Mộc Châu (Sơn La)..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Chứng nhận tiêu chuẩn hiện có
                      </label>
                      <select
                        value={formData.certification}
                        onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="VietGAP">Đã đạt chứng nhận VietGAP</option>
                        <option value="GlobalGAP">Đạt chứng nhận GlobalGAP</option>
                        <option value="Organic">Hữu cơ Organic (USDA/EU/VN)</option>
                        <option value="Canh tác an toàn">Canh tác an toàn đang chuẩn bị cấp VietGAP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Diện tích canh tác & Sản lượng
                      </label>
                      <input
                        type="text"
                        value={formData.farmAcreage}
                        onChange={(e) => setFormData({ ...formData, farmAcreage: e.target.value })}
                        placeholder="VD: 3.5 ha (~15 tấn/tháng)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Nông sản chủ lực đăng ký bao tiêu
                      </label>
                      <input
                        type="text"
                        value={formData.primaryCrops}
                        onChange={(e) => setFormData({ ...formData, primaryCrops: e.target.value })}
                        placeholder="VD: Xà lách thủy canh, Dâu tây New Zealand, Cam sành chính vụ, Cà chua bi..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "b2b" && (
                <div className="pt-2 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Building2 size={13} /> Nhu cầu cung ứng sỉ định kỳ
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tên doanh nghiệp / Đơn vị
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="VD: Nhà hàng Sen Xanh / Bếp ăn Vinschool"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Mô hình kinh doanh
                      </label>
                      <select
                        value={formData.businessType}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Nhà hàng / Chuỗi F&B">Nhà hàng / Chuỗi F&B</option>
                        <option value="Bếp ăn công nghiệp / Trường học">Bếp ăn công nghiệp / Trường học</option>
                        <option value="Cửa hàng tiện lợi / Siêu thị mini">Cửa hàng tiện lợi / Siêu thị mini</option>
                        <option value="Khách sạn & Resort">Khách sạn & Resort</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Khối lượng tiêu thụ định kỳ dự kiến
                      </label>
                      <input
                        type="text"
                        value={formData.weeklyVolume}
                        onChange={(e) => setFormData({ ...formData, weeklyVolume: e.target.value })}
                        placeholder="VD: 300 - 500 kg rau củ / tuần, giao 3 lần vào sáng sớm"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Ghi chú bổ sung / Đề xuất hợp tác
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ví dụ: Mong muốn ký hợp đồng thử nghiệm 3 tháng, cần mẫu kiểm nghiệm..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold text-xs sm:text-sm transition-all"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 flex items-center gap-2 transition-all disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang gửi hồ sơ...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Gửi Hồ Sơ Đăng Ký Đối Tác</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}