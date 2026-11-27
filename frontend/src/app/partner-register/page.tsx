"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  HelpCircle,
  ImageIcon,
  Info,
  Leaf,
  Loader2,
  Package,
  QrCode,
  Shield,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
  Truck,
  UploadCloud,
  User,
  AlertCircle
} from "lucide-react";

import { AuthForm } from "@/features/auth/auth-form";
import { verificationsService } from "@/services/verifications.service";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";
import type { VerificationType } from "@/types/verification";
import { cn } from "@/utils/cn";
import { compressImageFile } from "@/utils/image-compress";

const PARTNER_OPTIONS = [
  {
    type: "FARMER" as VerificationType,
    title: "Nông Dân / Trang Trại Canh Tác",
    tagline: "Sản xuất & Cung ứng nông sản sạch tại vườn",
    badge: "Thẩm định VietGAP / GlobalGAP",
    desc: "Canh tác nông sản an toàn, cấp mã định danh QR cho từng lô thu hoạch, kết nối phân phối thẳng đến bàn ăn người tiêu dùng không qua trung gian ép giá.",
    icon: Sprout,
    benefits: [
      "Bao tiêu đầu ra minh bạch, trợ giá trực tiếp tại vườn",
      "Cấp mã QR định danh số GS1 truy xuất nguồn gốc từng luống",
      "Hỗ trợ số hóa nhật ký canh tác & kết nối phân phối toàn quốc"
    ],
    orgLabel: "Tên Nông trại / Hợp tác xã nông nghiệp",
    orgPlaceholder: "VD: Nông Trại Xanh Đà Lạt / HTX Nông Nghiệp Mộc Châu",
    docOptions: [
      "Chứng nhận VietGAP Trồng trọt",
      "Chứng nhận GlobalGAP Tiêu chuẩn Quốc tế",
      "Chứng nhận Hữu cơ (Organic PGS / USDA)",
      "Giấy phép Kinh doanh Hợp tác xã / Hộ nông nghiệp"
    ],
    noteLabel: "Năng lực canh tác, diện tích & danh mục nông sản chủ lực",
    notePlaceholder: "VD: Diện tích canh tác 3.5ha tại Đơn Dương - Lâm Đồng. Sản lượng bình quân 12 tấn/tháng với các loại rau ăn lá thủy canh, Cà chua bi Cherry và Dâu tây New Zealand..."
  },
  {
    type: "DISTRIBUTOR" as VerificationType,
    title: "Nhà Phân Phối / Đội Xe Lạnh",
    tagline: "Vận chuyển nông sản dải nhiệt chuẩn 2°C – 5°C",
    badge: "Thẩm định Xe Lạnh IoT",
    desc: "Vận hành chuỗi logistics xe tải lạnh, tiếp nhận các lô hàng từ tổng kho lạnh và thực hiện điều phối phân phối nông sản tươi nhanh chóng.",
    icon: Truck,
    benefits: [
      "Đơn hàng vận chuyển ổn định liên tục từ hệ thống kho trung tâm",
      "Tích hợp cảm biến IoT giám sát nhiệt độ & độ ẩm tự động theo thời gian thực",
      "Quyết toán cước phí tự động, minh bạch theo từng chuyến giao hàng"
    ],
    orgLabel: "Tên Đội xe lạnh / Doanh nghiệp vận tải",
    orgPlaceholder: "VD: Đội Xe Lạnh AgriTrans Express / Công ty CP Vận tải Chuỗi Lạnh",
    docOptions: [
      "Giấy phép Kinh doanh Vận tải Hàng hóa",
      "Giấy Chứng nhận Đăng kiểm Xe tải Thùng lạnh",
      "Chứng nhận Hiệu chuẩn Thiết bị Đo dải nhiệt IoT",
      "Bằng lái xe & Hồ sơ tài xế vận hành xe lạnh"
    ],
    noteLabel: "Thông tin đội xe, tải trọng thùng lạnh & tuyến đường phụ trách",
    notePlaceholder: "VD: Đội xe 3 chiếc tải trọng 1.5 - 2.5 tấn có trang bị thùng lạnh chuyên dụng (2°C - 5°C), chuyên nhận tuyến Đà Lạt - TP.HCM và giao chặng cuối trong nội thành..."
  }
];

export default function PartnerRegisterPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [selectedType, setSelectedType] = useState<VerificationType>("FARMER");
  const [organizationName, setOrganizationName] = useState("");
  const [documentType, setDocumentType] = useState("Chứng nhận VietGAP Trồng trọt");
  const [docCode, setDocCode] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [uploadedDocSize, setUploadedDocSize] = useState<string | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const docFileInputRef = useRef<HTMLInputElement | null>(null);

  const activeConfig = PARTNER_OPTIONS.find((p) => p.type === selectedType) || PARTNER_OPTIONS[0];

  const hasRole = (role: string) =>
    Boolean(user?.roles?.some((r) => r === role || r === `ROLE_${role}`));

  const isAlreadyPartner =
    hasRole("ADMIN") ||
    hasRole("FARMER") ||
    hasRole("DISTRIBUTOR") ||
    hasRole("WAREHOUSE") ||
    hasRole("WAREHOUSE_STAFF");

  async function handleDocFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh định dạng JPG, PNG hoặc WebP.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Kích thước tệp quá lớn (tối đa 15MB).");
      return;
    }

    setIsUploadingDoc(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 1200, 0.82);
      setDocumentUrl(compressedDataUrl);
      setUploadedDocName(file.name);
      const sizeInKb = Math.round(file.size / 1024);
      setUploadedDocSize(sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`);
      setFormError(null);
      toast.success(`Đã đính kèm ảnh minh chứng: ${file.name}`);
    } catch {
      toast.error("Không thể xử lý tệp ảnh. Vui lòng thử lại với ảnh khác.");
    } finally {
      setIsUploadingDoc(false);
    }
  }

  function handleRemoveUploadedFile() {
    setDocumentUrl("");
    setUploadedDocName(null);
    setUploadedDocSize(null);
    if (docFileInputRef.current) {
      docFileInputRef.current.value = "";
    }
  }

  async function handleSubmitUpgrade(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!organizationName.trim() || organizationName.trim().length < 3) {
      const msg = "Vui lòng nhập tên đơn vị / nông trại / đội xe hợp tác (tối thiểu 3 ký tự).";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    const finalDoc = documentUrl.trim() || docCode.trim();
    if (!finalDoc) {
      const msg = "Vui lòng nhập mã số chứng nhận / link tra cứu hoặc tải lên ảnh chụp giấy chứng nhận.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    if (!note.trim() || note.trim().length < 10) {
      const msg = "Vui lòng nhập mô tả năng lực canh tác, sản lượng hoặc phương tiện (tối thiểu 10 ký tự).";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const combinedNote = docCode.trim() && documentUrl.startsWith("data:image/")
        ? `[Mã chứng chỉ/Hồ sơ: ${docCode.trim()}] [Tài khoản: ${user.name}] ${note.trim()}`
        : `[Tài khoản: ${user.name}] ${note.trim()}`;

      await verificationsService.submit({
        type: selectedType,
        organizationName: organizationName.trim(),
        documentType: documentType.trim(),
        documentUrl: finalDoc,
        note: combinedNote,
        subjectEmail: user.email
      });

      toast.success(
        `Nộp hồ sơ "${activeConfig.title}" thành công! Ban Quản Trị AgriTrace sẽ thẩm định trong vòng 24 giờ.`
      );
      router.replace("/dashboard");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Gửi hồ sơ thất bại. Vui lòng kiểm tra lại kết nối mạng!";
      setFormError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-[#FBF9F5] min-h-screen py-8 sm:py-14 antialiased text-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-emerald-800 transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Trang chủ</span>
            <span className="text-gray-300">/</span>
            <span className="text-emerald-800 font-bold">Cổng Đăng Ký Đối Tác B2B</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-emerald-800/80 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Tiêu chuẩn thẩm định VietGAP & Chuỗi lạnh IoT</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#16261E] text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-3 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" /> CỔNG HỢP TÁC DOANH NGHIỆP NÔNG NGHIỆP SỐ
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#16261E] tracking-tight leading-tight">
            Đăng Ký Đối Tác Cung Ứng & Vận Chuyển
          </h1>
          <p className="text-sm sm:text-base text-stone-600 mt-3 leading-relaxed">
            Hợp tác cùng AgriTrace để đưa nông sản tươi sạch trực tiếp từ nông trại đến bàn ăn người tiêu dùng, kết nối hệ thống truy xuất QR nguồn gốc và đội xe lạnh kiểm soát dải nhiệt 2°C – 5°C.
          </p>
        </div>

        {/* 3 Steps Process Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-10">
          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs flex items-start gap-3.5 transition-all hover:border-emerald-200">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white font-black text-sm shadow-xs">
              1
            </span>
            <div>
              <p className="text-xs font-bold text-gray-900">Điền Hồ Sơ Năng Lực</p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Khai báo thông tin Nông trại hoặc Đội xe lạnh, đính kèm giấy chứng nhận VietGAP / Đăng kiểm xe.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs flex items-start gap-3.5 transition-all hover:border-emerald-200">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm">
              2
            </span>
            <div>
              <p className="text-xs font-bold text-gray-900">Thẩm Định Trong 24H</p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Bộ phận KCS & Logistics của AgriTrace đối soát chứng từ và kích hoạt quyền vận hành số.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs flex items-start gap-3.5 transition-all hover:border-emerald-200">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm">
              3
            </span>
            <div>
              <p className="text-xs font-bold text-gray-900">Mở Cổng Vận Hành</p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Truy cập Dashboard riêng biệt: Quản lý vụ mùa, xuất mã QR lô hàng hoặc nhận chuyến xe lạnh.
              </p>
            </div>
          </div>
        </div>

        {/* CONDITION 1: User already has partner or admin role */}
        {user && isAlreadyPartner ? (
          <div className="max-w-xl mx-auto p-8 rounded-3xl bg-white border border-emerald-200/90 shadow-md text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold mb-2">
                Đối tác chính thức của AgriTrace
              </span>
              <h2 className="text-xl font-extrabold text-[#16261E]">Tài khoản của bạn đã có quyền Đối tác</h2>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Xin chào <strong>{user.name}</strong>, tài khoản của bạn đang có vai trò:{" "}
                <span className="font-bold text-emerald-800">{user.roles?.join(", ")}</span>. Bạn có thể truy cập ngay vào hệ thống quản trị chuyên sâu.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all"
              >
                Vào Trang Quản Trị Vận Hành
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
              >
                Về Trang Mua Sắm
              </Link>
            </div>
          </div>
        ) : user ? (
          /* CONDITION 2: Logged in Customer -> Professional Enterprise Dossier Form */
          <div className="rounded-3xl bg-white border border-gray-200/90 shadow-sm overflow-hidden">
            {/* Verified Account Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 to-[#16261E] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-emerald-300 font-extrabold text-base border border-white/20">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white tracking-wide">{user.name}</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                      <CheckCircle2 size={10} /> Đã đăng nhập
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/80 mt-0.5 font-mono">{user.email}</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-emerald-200/90 block">Loại hồ sơ đăng ký</span>
                <span className="text-xs font-bold text-white">Nâng cấp tài khoản Đối tác B2B</span>
              </div>
            </div>

            <form onSubmit={handleSubmitUpgrade} className="p-6 sm:p-9 space-y-8">
              {/* STEP 1: MODEL SELECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                      1
                    </span>
                    <h2 className="text-sm sm:text-base font-extrabold text-[#16261E] uppercase tracking-wider">
                      Chọn Mô Hình Hợp Tác Cung Ứng
                    </h2>
                  </div>
                  <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                    Chọn 1 trong 2 mô hình vận hành
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PARTNER_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedType === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => {
                          setSelectedType(opt.type);
                          setDocumentType(opt.docOptions[0]);
                          setFormError(null);
                        }}
                        className={cn(
                          "relative p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group",
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-500/20"
                            : "border-gray-200/90 bg-white hover:border-emerald-300 hover:bg-gray-50/50"
                        )}
                      >
                        {/* Radio Checkmark Top Right */}
                        <div className="absolute top-4 right-4">
                          <span
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center border transition-all",
                              isSelected
                                ? "bg-emerald-700 border-emerald-700 text-white shadow-xs"
                                : "border-gray-300 bg-white group-hover:border-emerald-400"
                            )}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </span>
                        </div>

                        <div>
                          {/* Icon & Category Pill */}
                          <div className="flex items-center gap-3 mb-3">
                            <span
                              className={cn(
                                "flex h-11 w-11 items-center justify-center rounded-2xl transition-colors shadow-2xs",
                                isSelected
                                  ? "bg-emerald-700 text-white"
                                  : "bg-gray-100 text-gray-700 group-hover:bg-emerald-100 group-hover:text-emerald-800"
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            <div>
                              <span
                                className={cn(
                                  "text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-block mb-1",
                                  isSelected
                                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                )}
                              >
                                {opt.badge}
                              </span>
                              <h3 className="text-sm font-bold text-gray-900 leading-snug">
                                {opt.title}
                              </h3>
                            </div>
                          </div>

                          <p className="text-xs text-gray-500 leading-relaxed mb-4">
                            {opt.desc}
                          </p>

                          {/* Bullet Benefits */}
                          <div className="pt-3 border-t border-gray-100 space-y-2">
                            {opt.benefits.map((benefit, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-[11px] text-gray-600">
                                <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                                <span className="leading-tight">{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: DOSSIER & CERTIFICATE VERIFICATION FORM */}
              <div className="rounded-2xl border border-gray-200/90 bg-[#FBF9F5]/70 p-6 sm:p-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200/70 gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-700 text-white text-xs font-extrabold shadow-2xs">
                      2
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-[#16261E] uppercase tracking-wider">
                        Hồ Sơ Năng Lực & Minh Chứng Thẩm Định
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Vai trò được chọn: <span className="font-bold text-emerald-800">{activeConfig.title}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full self-start sm:self-auto border border-emerald-200/70">
                    Bảo mật dữ liệu 100%
                  </span>
                </div>

                {/* Organization Name Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    {activeConfig.orgLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => {
                        setOrganizationName(e.target.value);
                        setFormError(null);
                      }}
                      placeholder={activeConfig.orgPlaceholder}
                      className="w-full h-11 pl-10 pr-3.5 text-xs sm:text-sm rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 shadow-2xs"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Nhập đúng tên nông trại / HTX hoặc tên doanh nghiệp vận tải đã đăng ký giấy phép.
                  </p>
                </div>

                {/* Certificate Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    Loại chứng chỉ / Giấy chứng nhận tiêu chuẩn <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Award className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-emerald-700" />
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm rounded-xl border border-gray-300 bg-white text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 shadow-2xs cursor-pointer"
                    >
                      {activeConfig.docOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Two Verification Methods: Code / Link & Photo Upload */}
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      Mã số chứng nhận / Số hiệu hồ sơ pháp lý
                    </label>
                    <div className="relative">
                      <FileCheck2 className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={docCode}
                        onChange={(e) => {
                          setDocCode(e.target.value);
                          setFormError(null);
                        }}
                        placeholder="VD: VG-2026-ĐL-0899 hoặc số đăng kiểm xe 49C-123.45"
                        className="w-full h-11 pl-10 pr-3.5 text-xs sm:text-sm rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* File Upload Dropzone & Live Preview */}
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      Bản chụp chứng chỉ / Giấy chứng nhận hợp chuẩn (Khuyến nghị để duyệt nhanh) <span className="text-rose-500">*</span>
                    </label>

                    <input
                      ref={docFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleDocFileChange}
                      className="hidden"
                    />

                    {documentUrl.startsWith("data:image/") ? (
                      /* File Uploaded Preview Card */
                      <div className="p-4 rounded-2xl border-2 border-emerald-500/50 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                            {/* Live thumbnail */}
                            <Image
                              src={documentUrl}
                              alt="Minh chứng tải lên"
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <BadgeCheck size={15} className="text-emerald-600 shrink-0" />
                              <p className="text-xs font-bold text-gray-900 truncate">
                                {uploadedDocName || "Ảnh minh chứng tiêu chuẩn"}
                              </p>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Dung lượng: <span className="font-medium text-emerald-800">{uploadedDocSize || "Đã tối ưu"}</span> • Định dạng hợp lệ
                            </p>
                            <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Sẵn sàng gửi thẩm định
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => docFileInputRef.current?.click()}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-emerald-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Đổi ảnh khác
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveUploadedFile}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa tệp đính kèm"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Drag & Drop Upload Zone */
                      <div
                        onClick={() => docFileInputRef.current?.click()}
                        className="p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-emerald-600 bg-white hover:bg-emerald-50/20 text-center transition-all cursor-pointer group shadow-2xs"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                          {isUploadingDoc ? (
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
                          ) : (
                            <UploadCloud className="h-6 w-6 text-emerald-700" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900">
                          {isUploadingDoc ? "Đang xử lý và nén ảnh..." : "Bấm vào đây để tải ảnh giấy chứng nhận / đăng kiểm"}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          Hỗ trợ định dạng JPG, PNG, WebP (Tối đa 15MB). Hệ thống tự động nén tối ưu hiển thị.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Capacity & Notes Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    {activeConfig.noteLabel} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value);
                      setFormError(null);
                    }}
                    placeholder={activeConfig.notePlaceholder}
                    className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 shadow-2xs leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                    <span>Mô tả càng chi tiết giúp thời gian duyệt diễn ra nhanh hơn.</span>
                    <span className={cn(note.trim().length >= 10 ? "text-emerald-700 font-semibold" : "text-gray-400")}>
                      {note.trim().length} ký tự (tối thiểu 10)
                    </span>
                  </div>
                </div>

                {formError && (
                  <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}
              </div>

              {/* Trust & Commitment Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-gray-600 leading-relaxed">
                  <p className="font-bold text-emerald-950">
                    Cam kết chuẩn hóa minh bạch chuỗi cung ứng AgriTrace
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Mọi dữ liệu chứng nhận và năng lực sản xuất được đối soát thực địa. Sau khi được duyệt, nông trại có quyền tạo lô thu hoạch và in tem QR truy xuất nguồn gốc theo tiêu chuẩn VietGAP.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isUploadingDoc}
                className={cn(
                  "w-full h-12 rounded-2xl text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer",
                  "bg-gradient-to-r from-emerald-700 via-emerald-800 to-[#16261E] hover:from-emerald-800 hover:to-[#0f1d16] shadow-md shadow-emerald-900/20 active:scale-[0.99]",
                  (isSubmitting || isUploadingDoc) && "opacity-75 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Đang nộp hồ sơ thẩm định lên hệ thống...</span>
                  </>
                ) : (
                  <>
                    <span>Nộp Hồ Sơ Xét Duyệt Đối Tác</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* CONDITION 3: Guest not logged in -> Register Partner Account with Dossier */
          <div className="max-w-lg mx-auto bg-white p-6 sm:p-9 rounded-3xl border border-gray-200 shadow-sm">
            <div className="mb-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Đăng ký mới
                </span>
                <h2 className="text-base font-extrabold text-[#16261E]">Tạo Tài Khoản & Nộp Hồ Sơ</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Đăng ký tài khoản đối tác để quản lý nông trại hoặc đội xe lạnh.
                </p>
              </div>
              <Link
                href="/login"
                className="text-xs font-bold text-emerald-700 hover:underline shrink-0"
              >
                Đã có tài khoản?
              </Link>
            </div>

            <AuthForm mode="register" isPartnerFlow={true} defaultPartnerRole="FARMER" />
          </div>
        )}
      </div>
    </div>
  );
}
