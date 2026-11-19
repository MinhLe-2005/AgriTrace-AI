"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  ShieldCheck,
  Sprout,
  Truck,
  Package,
  AlertTriangle,
  XCircle,
  Send,
  Upload,
  Building2,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

import { useAuthStore } from "@/stores/auth-store";
import { authService } from "@/services/auth.service";
import { verificationsService } from "@/services/verifications.service";
import { LoadingSkeleton } from "@/components/ui/states";
import { toast } from "@/stores/toast-store";
import { getApiErrorMessage } from "@/lib/api";
import { compressImageFile } from "@/utils/image-compress";
import type { VerificationRequest, VerificationType } from "@/types/verification";

const ROLE_CONFIGS: Record<
  VerificationType,
  {
    label: string;
    badgeColor: string;
    icon: typeof Sprout;
    dashboardHref: string;
    orgLabel: string;
    orgPlaceholder: string;
    docOptions: string[];
    notePlaceholder: string;
  }
> = {
  FARMER: {
    label: "Nông dân / Chủ trang trại",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: Sprout,
    dashboardHref: "/dashboard/farmer",
    orgLabel: "Tên Nông trại / Hợp tác xã canh tác",
    orgPlaceholder: "VD: Nông trại Xanh Đà Lạt / HTX Rau Sạch Mộc Châu",
    docOptions: [
      "Chứng nhận VietGAP",
      "Chứng nhận GlobalGAP",
      "Chứng nhận Hữu cơ (Organic)",
      "Giấy phép Hợp tác xã / Hộ nông nghiệp",
    ],
    notePlaceholder:
      "VD: Diện tích 2.5ha tại Đà Lạt, sản lượng 10 tấn/tháng (Xà lách thủy canh, Dâu tây, Cà chua bi)...",
  },
  WAREHOUSE: {
    label: "Nhân viên Kho lạnh (QC & FEFO)",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    icon: Package,
    dashboardHref: "/dashboard/warehouse",
    orgLabel: "Kho lạnh đăng ký công tác / Bộ phận",
    orgPlaceholder: "VD: Kho Lạnh Trung Tâm Đà Lạt - Bộ phận Kiểm định QC",
    docOptions: [
      "Chứng chỉ Vận hành Kho lạnh & Bảo quản FEFO",
      "Hồ sơ Nhân sự / CCCD & Hợp đồng lao động",
      "Chứng nhận An toàn Vệ sinh Thực phẩm",
    ],
    notePlaceholder:
      "VD: 2 năm kinh nghiệm vận hành kho lạnh nông sản 2°C - 5°C, kiểm soát cảm biến IoT & quy trình FEFO...",
  },
  DISTRIBUTOR: {
    label: "Nhà phân phối / Đội xe lạnh",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Truck,
    dashboardHref: "/dashboard/distributor",
    orgLabel: "Tên Đội xe lạnh / Đơn vị vận chuyển",
    orgPlaceholder: "VD: Đội Xe Lạnh AgriTrans Express / Hợp tác xã Vận tải",
    docOptions: [
      "Giấy phép Kinh doanh Vận tải bằng xe ô tô",
      "Giấy Đăng kiểm Xe tải lạnh & Thiết bị giám sát nhiệt độ IoT",
      "Bằng lái xe & Hồ sơ đối tác giao nhận chặng cuối",
    ],
    notePlaceholder:
      "VD: Sở hữu 2 xe tải lạnh 1.5 - 2.5 tấn (thùng mát 2°C - 5°C), chuyên tuyến Đà Lạt - TP.HCM & nội thành...",
  },
};

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, hasHydrated, updateUser } = useAuthStore();

  const [checking, setChecking] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [showEditForm, setShowEditForm] = useState(false);

  // Form states for submitting / updating verification request
  const [selectedType, setSelectedType] = useState<VerificationType>("FARMER");
  const [organizationName, setOrganizationName] = useState("");
  const [documentType, setDocumentType] = useState(ROLE_CONFIGS.FARMER.docOptions[0]);
  const [documentUrl, setDocumentUrl] = useState("");
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const routeByRoles = (roles: string[]) => {
    if (roles.includes("ADMIN")) {
      router.replace("/dashboard/admin");
      return true;
    }
    if (roles.includes("FARMER")) {
      router.replace("/dashboard/farmer");
      return true;
    }
    if (roles.includes("WAREHOUSE") || roles.includes("WAREHOUSE_STAFF")) {
      router.replace("/dashboard/warehouse");
      return true;
    }
    if (roles.includes("DISTRIBUTOR")) {
      router.replace("/dashboard/distributor");
      return true;
    }
    return false;
  };

  async function syncStatus(showToast = false) {
    if (!user) return;
    if (showToast) setRefreshing(true);
    try {
      // 1. Kiểm tra hồ sơ người dùng mới nhất từ Backend (nếu Admin vừa duyệt thì roles đã có quyền mới)
      const latestProfile = await authService.getMe().catch(() => null);
      if (latestProfile && latestProfile.roles) {
        updateUser({
          roles: latestProfile.roles,
          companyName: latestProfile.companyName,
          phone: latestProfile.phone,
        });
        if (routeByRoles(latestProfile.roles)) {
          if (showToast) {
            toast.success("Hồ sơ của bạn đã được phê duyệt! Đang chuyển vào bảng điều khiển vị trí...");
          }
          return;
        }
      }

      // 2. Lấy danh sách hồ sơ xác minh vị trí của người dùng
      const myReqs = await verificationsService.myRequests(user.email);
      setRequests(myReqs || []);
      if (myReqs && myReqs.length > 0) {
        const latest = myReqs[0];
        setSelectedType(latest.type);
        setOrganizationName(latest.organizationName || "");
        setDocumentType(latest.documentType || ROLE_CONFIGS[latest.type]?.docOptions[0] || "");
        setDocumentUrl(latest.documentUrl || "");
        setNote(latest.note || "");
        if (showToast) {
          if (latest.status === "PENDING" || latest.status === "UNDER_REVIEW") {
            toast.info("Hồ sơ của bạn vẫn đang trong quá trình thẩm định bởi Ban Quản Trị.");
          } else if (latest.status === "REJECTED" || latest.status === "CHANGES_REQUESTED") {
            toast.info("Ban Quản Trị đã phản hồi hồ sơ của bạn. Vui lòng xem lý do bên dưới.");
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setChecking(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (routeByRoles(user.roles || [])) {
      return;
    }
    void syncStatus(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, user?.id]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 900, 0.78);
      setDocumentUrl(dataUrl);
      setUploadedDocName(file.name);
      toast.success(`Đã đính kèm ảnh minh chứng: ${file.name}`);
    } catch {
      toast.error("Không thể tải ảnh. Vui lòng chọn tệp JPG/PNG hợp lệ.");
    }
  }

  async function handleSubmitDossier(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!organizationName.trim()) {
      toast.error("Vui lòng nhập tên đơn vị / nông trại / kho lạnh / đội xe.");
      return;
    }
    if (!documentUrl.trim()) {
      toast.error("Vui lòng nhập mã số chứng chỉ / link tài liệu hoặc tải ảnh hồ sơ.");
      return;
    }
    if (!note.trim()) {
      toast.error("Vui lòng nhập mô tả năng lực / kinh nghiệm.");
      return;
    }

    setSubmitting(true);
    try {
      const submitted = await verificationsService.submit({
        type: selectedType,
        organizationName: organizationName.trim(),
        documentType: documentType.trim(),
        documentUrl: documentUrl.trim(),
        note: note.trim(),
        subjectEmail: user.email,
      });
      setRequests((prev) => [submitted, ...prev.filter((r) => r.id !== submitted.id)]);
      setShowEditForm(false);
      toast.success("Đã gửi hồ sơ xác minh vị trí tới Ban Quản Trị thành công!");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasHydrated || checking) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <LoadingSkeleton rows={4} />
        <p className="text-xs text-gray-400 mt-4">
          Đang kiểm tra phân quyền vị trí và trạng thái phê duyệt hồ sơ của bạn...
        </p>
      </div>
    );
  }

  const latestRequest = requests[0] || null;
  const activeRoleCfg = ROLE_CONFIGS[latestRequest?.type || selectedType] || ROLE_CONFIGS.FARMER;
  const RoleIcon = activeRoleCfg.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              <ShieldCheck size={14} /> Cổng Xác Minh & Phân Quyền Vị Trí Chuỗi Cung Ứng
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold">
              {latestRequest
                ? `Hồ Sơ Vị Trí: ${ROLE_CONFIGS[latestRequest.type]?.label || latestRequest.type}`
                : "Đăng Ký & Xét Duyệt Vị Trí Công Việc"}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl">
              Để đảm bảo tính minh bạch của chuỗi truy xuất nguồn gốc QR, các vị trí{" "}
              <strong>Nông dân, Nhân viên Kho lạnh, Nhà phân phối</strong> chỉ được mở khóa sau khi Ban Quản Trị thẩm định và phê duyệt hồ sơ năng lực.
            </p>
          </div>

          {latestRequest && (
            <button
              type="button"
              disabled={refreshing}
              onClick={() => void syncStatus(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-900 shadow-sm hover:bg-emerald-50 transition-all shrink-0 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin text-emerald-700" : "text-emerald-700"} />
              <span>{refreshing ? "Đang kiểm tra..." : "Kiểm tra kết quả duyệt"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Stepper */}
      {latestRequest && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
            Tiến trình phê duyệt vào vị trí công việc
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-[10px] font-bold uppercase text-emerald-700">Bước 1</div>
                <div className="text-xs font-bold text-gray-900">Xác thực OTP</div>
                <div className="text-[11px] text-emerald-700">Đã hoàn tất</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-[10px] font-bold uppercase text-emerald-700">Bước 2</div>
                <div className="text-xs font-bold text-gray-900">Gửi hồ sơ vị trí</div>
                <div className="text-[11px] text-emerald-700">Đã tiếp nhận</div>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                latestRequest.status === "APPROVED"
                  ? "border-emerald-200 bg-emerald-50/60"
                  : latestRequest.status === "REJECTED" || latestRequest.status === "CHANGES_REQUESTED"
                  ? "border-rose-300 bg-rose-50/70"
                  : "border-amber-300 bg-amber-50/80 ring-2 ring-amber-400/20"
              }`}
            >
              {latestRequest.status === "APPROVED" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : latestRequest.status === "REJECTED" ? (
                <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
              ) : latestRequest.status === "CHANGES_REQUESTED" ? (
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600 animate-pulse shrink-0" />
              )}
              <div>
                <div className="text-[10px] font-bold uppercase text-gray-500">Bước 3</div>
                <div className="text-xs font-bold text-gray-900">Admin thẩm định</div>
                <div className="text-[11px] font-semibold">
                  {latestRequest.status === "APPROVED"
                    ? "Đã phê duyệt"
                    : latestRequest.status === "REJECTED"
                    ? "Từ chối hồ sơ"
                    : latestRequest.status === "CHANGES_REQUESTED"
                    ? "Cần bổ sung hồ sơ"
                    : "Đang chờ xét duyệt"}
                </div>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                latestRequest.status === "APPROVED"
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-gray-200 bg-gray-50 opacity-75"
              }`}
            >
              <RoleIcon className="h-5 w-5 text-gray-500 shrink-0" />
              <div>
                <div className="text-[10px] font-bold uppercase text-gray-500">Bước 4</div>
                <div className="text-xs font-bold text-gray-900">Vào vị trí làm việc</div>
                <div className="text-[11px] text-gray-500">
                  {latestRequest.status === "APPROVED" ? "Đã mở khóa" : "Chờ duyệt bước 3"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Dossier Details Card */}
      {latestRequest && !showEditForm ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <RoleIcon size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-gray-900">
                    {ROLE_CONFIGS[latestRequest.type]?.label || latestRequest.type}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-bold border ${
                      latestRequest.status === "PENDING" || latestRequest.status === "UNDER_REVIEW"
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : latestRequest.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-rose-50 text-rose-700 border-rose-300"
                    }`}
                  >
                    {latestRequest.status === "PENDING" || latestRequest.status === "UNDER_REVIEW"
                      ? "⏳ Đang chờ Ban Quản Trị phê duyệt"
                      : latestRequest.status === "APPROVED"
                      ? "✅ Đã phê duyệt"
                      : latestRequest.status === "CHANGES_REQUESTED"
                      ? "⚠️ Yêu cầu bổ sung hồ sơ"
                      : "❌ Đã từ chối"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Ngày gửi hồ sơ: {new Date(latestRequest.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowEditForm(true)}
              className="rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
            >
              {latestRequest.status === "REJECTED" || latestRequest.status === "CHANGES_REQUESTED"
                ? "Chỉnh sửa & Nộp lại hồ sơ"
                : "Cập nhật thông tin hồ sơ"}
            </button>
          </div>

          {/* Decision Feedback from Admin if any */}
          {latestRequest.decisionReason && (
            <div
              className={`rounded-xl border p-4 text-xs ${
                latestRequest.status === "APPROVED"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-rose-200 bg-rose-50 text-rose-900"
              }`}
            >
              <div className="font-bold uppercase tracking-wider mb-1">
                Phản hồi từ Ban Quản Trị AgriTrace:
              </div>
              <p className="text-sm font-medium">{latestRequest.decisionReason}</p>
            </div>
          )}

          {/* Dossier Fields Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-100">
              <div className="text-gray-400 font-semibold uppercase text-[10px]">
                Đơn vị / Nông trại / Kho / Đội xe
              </div>
              <div className="text-gray-900 font-bold text-sm mt-1">{latestRequest.organizationName}</div>
            </div>

            <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-100">
              <div className="text-gray-400 font-semibold uppercase text-[10px]">
                Loại giấy tờ / Chứng chỉ xác minh
              </div>
              <div className="text-gray-900 font-bold text-sm mt-1">{latestRequest.documentType}</div>
            </div>

            <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-100 sm:col-span-2">
              <div className="text-gray-400 font-semibold uppercase text-[10px] mb-1.5">
                Tài liệu / Hình ảnh minh chứng đã đính kèm
              </div>
              {latestRequest.documentUrl.startsWith("data:image/") ? (
                <div className="mt-2">
                  <img
                    src={latestRequest.documentUrl}
                    alt="Chứng chỉ xác minh"
                    className="max-h-56 rounded-xl border border-gray-200 object-contain bg-white p-1"
                  />
                </div>
              ) : (
                <div className="text-emerald-800 font-semibold break-all">{latestRequest.documentUrl}</div>
              )}
            </div>

            {latestRequest.note && (
              <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-100 sm:col-span-2">
                <div className="text-gray-400 font-semibold uppercase text-[10px]">
                  Mô tả năng lực & Kinh nghiệm
                </div>
                <div className="text-gray-700 mt-1 whitespace-pre-line leading-relaxed">
                  {latestRequest.note}
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Trong thời gian chờ Ban Quản Trị duyệt hồ sơ, bạn vẫn có thể mua sắm nông sản và tra cứu QR như Khách hàng.
            </p>
            <div className="flex items-center gap-2.5">
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <ShoppingBag size={14} />
                <span>Khám phá Cửa hàng</span>
              </Link>
              <button
                type="button"
                disabled={refreshing}
                onClick={() => void syncStatus(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
              >
                <span>Vào vị trí công việc (Nếu đã duyệt)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Form gửi mới hoặc cập nhật hồ sơ vị trí */
        <form
          onSubmit={handleSubmitDossier}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-5"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-700" />
              <h2 className="text-base font-extrabold text-gray-900">
                {latestRequest ? "Cập Nhật & Gửi Lại Hồ Sơ Vị Trí" : "Chọn Vai Trò & Gửi Hồ Sơ Xét Duyệt"}
              </h2>
            </div>
            {latestRequest && (
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-800"
              >
                Hủy chỉnh sửa
              </button>
            )}
          </div>

          {/* Chọn vai trò muốn ứng tuyển */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["FARMER", "WAREHOUSE", "DISTRIBUTOR"] as VerificationType[]).map((typeKey) => {
              const cfg = ROLE_CONFIGS[typeKey];
              const Icon = cfg.icon;
              const active = selectedType === typeKey;
              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => {
                    setSelectedType(typeKey);
                    setDocumentType(cfg.docOptions[0]);
                  }}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      active ? "bg-emerald-700 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">{cfg.label}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Yêu cầu duyệt hồ sơ</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {ROLE_CONFIGS[selectedType].orgLabel} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder={ROLE_CONFIGS[selectedType].orgPlaceholder}
                  className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-gray-200 text-xs sm:text-sm outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Loại chứng chỉ / Giấy tờ xác minh <span className="text-rose-500">*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-white outline-none focus:border-emerald-600"
              >
                {ROLE_CONFIGS[selectedType].docOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Mã số giấy phép / Link hồ sơ hoặc Ảnh chụp minh chứng <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={
                    documentUrl.startsWith("data:image/")
                      ? `[Đã đính kèm ảnh: ${uploadedDocName || "Chứng chỉ xác minh"}]`
                      : documentUrl
                  }
                  onChange={(e) => {
                    setUploadedDocName(null);
                    setDocumentUrl(e.target.value);
                  }}
                  placeholder="Nhập số hiệu chứng nhận VietGAP / Giấy phép hoặc bấm Tải ảnh..."
                  className="flex-1 h-10 px-3.5 rounded-xl border border-gray-200 text-xs sm:text-sm outline-none focus:border-emerald-600"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Upload size={14} />
                  <span>Tải ảnh</span>
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Mô tả năng lực / Kinh nghiệm / Khu vực hoạt động <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={ROLE_CONFIGS[selectedType].notePlaceholder}
                className="w-full p-3 rounded-xl border border-gray-200 text-xs sm:text-sm outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              <Send size={15} />
              <span>{submitting ? "Đang gửi hồ sơ..." : "Gửi Hồ Sơ Xét Duyệt Vị Trí"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
