"use client";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  DollarSign,
  Edit,
  Eye,
  FileCheck,
  LayoutGrid,
  List,
  Package,
  Plus,
  Power,
  QrCode,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  ShoppingBag,
  CalendarDays,
  Ticket,
  Trash2,
  Truck,
  UserCheck,
  Users,
  X,
  ArrowRight,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { AdminPageHeader, AdminStatCard } from "@/features/admin/admin-ui";
import { useUsers } from "@/hooks/use-users";
import { useVerificationMutations, useVerifications } from "@/hooks/use-verifications";
import { getApiErrorMessage } from "@/lib/api";
import { catalogService, type ApiOrder, type ApiVoucher } from "@/services/catalog.service";
import { farmerService, type ApiFarmCertificate, type ApiHarvestLot } from "@/services/farmer.service";
import { loyaltyService, type LoyaltyMemberAdmin } from "@/services/loyalty.service";
import {
  useCampaignStore,
  type CampaignItem,
  type AdminBlogPost,
  type CampaignType,
} from "@/stores/campaign-store";
import { useNotificationStore } from "@/stores/notification-store";
import { toast } from "@/stores/toast-store";
import type { VerificationRequest } from "@/types/verification";
import { cn } from "@/utils/cn";

function documentHref(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function submittedAt(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

type AdminTab = "verifications" | "batches" | "certs" | "orders" | "vouchers" | "loyalty" | "events" | "blog";
const ADMIN_TABS: AdminTab[] = ["verifications", "batches", "certs", "orders", "vouchers", "loyalty", "events", "blog"];

function AdminPortalContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as AdminTab | null;
  const activeTab: AdminTab = tabParam && ADMIN_TABS.includes(tabParam) ? tabParam : "verifications";

  // Member 1: Users & Verifications Hooks
  const users = useUsers();
  const verifications = useVerifications();
  const verificationMutations = useVerificationMutations();
  const pendingRequests = useMemo(
    () => verifications.data?.filter((request) => request.status === "PENDING" || request.status === "UNDER_REVIEW") ?? [],
    [verifications.data]
  );
  const busy =
    verificationMutations.approve.isPending ||
    verificationMutations.reject.isPending ||
    verificationMutations.requestChanges.isPending;

  const [verificationFilterStatus, setVerificationFilterStatus] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [verificationFilterType, setVerificationFilterType] = useState<"ALL" | "FARMER" | "WAREHOUSE" | "DISTRIBUTOR">("ALL");
  const [decisionTarget, setDecisionTarget] = useState<{
    request: VerificationRequest;
    action: "approve" | "reject" | "changes";
  } | null>(null);
  const [decisionReason, setDecisionReason] = useState("");

  const filteredVerificationRequests = useMemo(() => {
    const all = verifications.data ?? [];
    return all.filter((req) => {
      const matchStatus =
        verificationFilterStatus === "ALL" ||
        (verificationFilterStatus === "PENDING" && (req.status === "PENDING" || req.status === "UNDER_REVIEW")) ||
        (verificationFilterStatus === "APPROVED" && req.status === "APPROVED") ||
        (verificationFilterStatus === "REJECTED" && (req.status === "REJECTED" || req.status === "CHANGES_REQUESTED"));
      const matchType = verificationFilterType === "ALL" || req.type === verificationFilterType;
      return matchStatus && matchType;
    });
  }, [verifications.data, verificationFilterStatus, verificationFilterType]);

  // Admin: Xét Duyệt Lô Thu Hoạch & Cấp Lệnh Xuất Kho
  const [adminBatches, setAdminBatches] = useState<ApiHarvestLot[]>([]);
  const [adminBatchesLoading, setAdminBatchesLoading] = useState(false);
  const [adminBatchSearch, setAdminBatchSearch] = useState("");
  const [adminBatchFilter, setAdminBatchFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [batchDecisionTarget, setBatchDecisionTarget] = useState<{
    batch: ApiHarvestLot;
    action: "approve" | "reject";
  } | null>(null);
  const [batchDecisionReason, setBatchDecisionReason] = useState("");
  const [isSubmittingBatchDecision, setIsSubmittingBatchDecision] = useState(false);

  const fetchAdminBatches = async () => {
    setAdminBatchesLoading(true);
    try {
      const data = await farmerService.getBatches();
      setAdminBatches(data || []);
    } catch (err: unknown) {
      console.warn("Lỗi tải danh sách lô thu hoạch phía Admin:", err);
    } finally {
      setAdminBatchesLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminBatches();
  }, []);

  useEffect(() => {
    if (activeTab === "batches") {
      fetchAdminBatches();
    }
  }, [activeTab]);

  const pendingBatchesCount = useMemo(() => {
    return adminBatches.filter((b) => b.status === "Chờ duyệt xuất kho").length;
  }, [adminBatches]);

  const filteredAdminBatches = useMemo(() => {
    return adminBatches.filter((b) => {
      const matchesSearch =
        adminBatchSearch.trim() === "" ||
        b.code.toLowerCase().includes(adminBatchSearch.toLowerCase()) ||
        b.product.toLowerCase().includes(adminBatchSearch.toLowerCase()) ||
        (b.farmName && b.farmName.toLowerCase().includes(adminBatchSearch.toLowerCase()));

      const matchesFilter =
        adminBatchFilter === "ALL" ||
        (adminBatchFilter === "PENDING" && b.status === "Chờ duyệt xuất kho") ||
        (adminBatchFilter === "APPROVED" && b.status === "Đã duyệt xuất kho") ||
        (adminBatchFilter === "REJECTED" && b.status === "Từ chối xuất kho");

      return matchesSearch && matchesFilter;
    });
  }, [adminBatches, adminBatchSearch, adminBatchFilter]);

  const handleConfirmBatchDecision = async () => {
    if (!batchDecisionTarget) return;
    setIsSubmittingBatchDecision(true);
    const { batch, action } = batchDecisionTarget;
    const isApprove = action === "approve";
    const newStatus = isApprove ? "Đã duyệt xuất kho" : "Từ chối xuất kho";
    const newColor = isApprove ? "#10b981" : "#ef4444";
    const note =
      batchDecisionReason.trim() ||
      (isApprove
        ? "Admin đã thẩm định hồ sơ KCS và phê duyệt đủ điều kiện xuất kho nông sản."
        : "Admin từ chối cấp lệnh xuất kho. Yêu cầu tái kiểm định tiêu chuẩn an toàn thực phẩm.");

    try {
      const updated = await farmerService.updateBatchStatus(batch.code, {
        status: newStatus,
        statusColor: newColor,
        adminNote: note,
        actorRole: "ADMIN",
      });

      setAdminBatches((prev) =>
        prev.map((item) => (item.code === updated.code ? updated : item))
      );

      toast.success(
        isApprove
          ? `Đã phê duyệt xuất kho thành công cho lô ${batch.code}!`
          : `Đã từ chối cấp lệnh xuất kho cho lô ${batch.code}!`
      );
      setBatchDecisionTarget(null);
      setBatchDecisionReason("");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmittingBatchDecision(false);
    }
  };

  // Admin: Duyệt Chứng Nhận & Gia Hạn Nông Trại
  const [adminCerts, setAdminCerts] = useState<ApiFarmCertificate[]>([]);
  const [adminCertsLoading, setAdminCertsLoading] = useState(false);
  const [adminCertSearch, setAdminCertSearch] = useState("");
  const [adminCertFilter, setAdminCertFilter] = useState<"ALL" | "PENDING" | "VALID" | "EXPIRED">("PENDING");
  const [certDecisionTarget, setCertDecisionTarget] = useState<{
    cert: ApiFarmCertificate;
    action: "approve" | "reject";
  } | null>(null);
  const [certDecisionNote, setCertDecisionNote] = useState("");
  const [certApprovedExpiryDate, setCertApprovedExpiryDate] = useState("");
  const [certApprovedNumber, setCertApprovedNumber] = useState("");
  const [isSubmittingCertDecision, setIsSubmittingCertDecision] = useState(false);
  const [viewingProofImage, setViewingProofImage] = useState<string | null>(null);

  const fetchAdminCerts = async () => {
    setAdminCertsLoading(true);
    try {
      const data = await farmerService.getCertificates();
      setAdminCerts(data || []);
    } catch (err: unknown) {
      console.warn("Lỗi tải danh sách chứng nhận phía Admin:", err);
    } finally {
      setAdminCertsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminCerts();
  }, []);

  useEffect(() => {
    if (activeTab === "certs") {
      fetchAdminCerts();
    }
  }, [activeTab]);

  const pendingCertsCount = useMemo(() => {
    return adminCerts.filter((c) => c.approvalStatus === "PENDING" || c.status === "PENDING").length;
  }, [adminCerts]);

  const filteredAdminCerts = useMemo(() => {
    return adminCerts.filter((c) => {
      const matchesSearch =
        adminCertSearch.trim() === "" ||
        (c.certNumber && c.certNumber.toLowerCase().includes(adminCertSearch.toLowerCase())) ||
        (c.name && c.name.toLowerCase().includes(adminCertSearch.toLowerCase())) ||
        (c.farmName && c.farmName.toLowerCase().includes(adminCertSearch.toLowerCase()));

      const isPending = c.approvalStatus === "PENDING" || c.status === "PENDING";
      const isValid = c.status === "VALID" && !isPending;
      const isExpired = c.status === "EXPIRED" || c.status === "EXPIRING_SOON" || c.approvalStatus === "REJECTED";

      const matchesFilter =
        adminCertFilter === "ALL" ||
        (adminCertFilter === "PENDING" && isPending) ||
        (adminCertFilter === "VALID" && isValid) ||
        (adminCertFilter === "EXPIRED" && isExpired);

      return matchesSearch && matchesFilter;
    });
  }, [adminCerts, adminCertSearch, adminCertFilter]);

  const handleConfirmCertDecision = async () => {
    if (!certDecisionTarget) return;
    setIsSubmittingCertDecision(true);
    const { cert, action } = certDecisionTarget;
    const isApprove = action === "approve";

    try {
      const updated = await farmerService.decideCertificate(cert.certNumber, {
        action,
        adminNote: certDecisionNote.trim() || (isApprove ? "Admin đã phê duyệt gia hạn chứng chỉ thành công" : "Admin từ chối gia hạn"),
        approvedExpiryDate: certApprovedExpiryDate.trim() || undefined,
        newCertNumber: certApprovedNumber.trim() || undefined,
      });

      setAdminCerts((prev) =>
        prev.map((item) => (item.certNumber === cert.certNumber ? updated : item))
      );

      toast.success(
        isApprove
          ? `Đã phê duyệt gia hạn chứng chỉ ${cert.certNumber} thành công!`
          : `Đã từ chối hồ sơ chứng chỉ ${cert.certNumber}!`
      );
      setCertDecisionTarget(null);
      setCertDecisionNote("");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmittingCertDecision(false);
    }
  };

  const handleDeleteAdminCert = async (certNumber: string, name: string) => {
    if (confirm(`Admin xác nhận xóa chứng nhận "${name}" (${certNumber}) khỏi hệ thống?`)) {
      try {
        await farmerService.deleteCertificate(certNumber);
        setAdminCerts((prev) => prev.filter((c) => c.certNumber !== certNumber));
        toast.success(`Đã xóa vĩnh viễn chứng nhận "${name}" thành công!`);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err));
      }
    }
  };

  // Member 4: Orders, Vouchers, and Loyalty States
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);

  const [vouchers, setVouchers] = useState<ApiVoucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [showCreateVoucherModal, setShowCreateVoucherModal] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    title: "",
    discount: "30000",
    minOrder: "150000",
    exp: "31/12/2026",
    badge: "GIẢM 30K",
    description: "Mã ưu đãi áp dụng toàn hệ thống AgriTrace AI",
  });

  const [members, setMembers] = useState<LoyaltyMemberAdmin[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<LoyaltyMemberAdmin | null>(null);
  const [bonusPoints, setBonusPoints] = useState<number>(100);
  const [bonusReason, setBonusReason] = useState<string>("Tặng điểm thưởng tri ân từ Quản trị viên");

  // ── Member 4: Events & Seasonal Campaigns Store ──
  const {
    campaigns,
    blogPosts,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    toggleCampaign,
    getCampaignStatus,
    addBlogPost,
    updateBlogPost,
    toggleBlogPost,
    deleteBlogPost,
    loadCampaigns,
    loadBlogPosts,
  } = useCampaignStore();

  useEffect(() => {
    // Admin luôn tải bản mới nhất, kể cả bài viết đang ẩn
    loadCampaigns(true);
    loadBlogPosts(true);
  }, [loadCampaigns, loadBlogPosts]);

  const [eventSearch, setEventSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<"all" | "active" | "upcoming" | "expired">("all");
  const [eventView, setEventView] = useState<"table" | "cards">("table");
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    slug: "",
    type: "harvest" as CampaignType,
    typeLabel: "Chính Vụ Thu Hoạch",
    typeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    startDate: "2026-11-01",
    endDate: "2026-12-31",
    discountPercent: 15,
    discountAmount: 15000,
    targetType: "product" as "all" | "category" | "product",
    targetCategoryCodes: "rau_la",
    targetProductNames: "Cải Xoăn Kale, Xà Lách Lô Lô",
    voucherCode: "AGRI30",
    bannerIcon: "🥗",
    badgeText: "Vụ mùa -15%",
    description: "",
    fullContent: "",
    active: true,
  });

  // ── Member 4: Blog Management State ──
  const [blogSearch, setBlogSearch] = useState("");
  const [blogFilter, setBlogFilter] = useState("all");
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState({
    title: "",
    slug: "",
    category: "season" as "all" | "ai" | "season" | "standard" | "guide",
    categoryLabel: "Quyết định & Mùa vụ",
    author: "Lê Quang Minh",
    authorRole: "Quản trị viên Hệ thống AgriTrace AI",
    date: "11/11/2026",
    readTime: "5 phút đọc",
    excerpt: "",
    content: "",
    coverImage: "",
    featured: false,
    relatedProductName: "Dâu Tây New Zealand Mộc Châu",
    active: true,
  });

  useEffect(() => {
    // Luôn tải danh sách đơn hàng từ lúc vào Admin để KPI Doanh thu ở tab Tổng quan hiện đúng ngay
    fetchOrders();
  }, []);

  // Load Member 4 data on tab change
  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    } else if (activeTab === "vouchers") {
      fetchVouchers();
    } else if (activeTab === "loyalty") {
      fetchMembers();
    }
  }, [activeTab]);

  async function fetchOrders() {
    setOrdersLoading(true);
    setOrdersError(false);
    try {
      const data = await catalogService.getOrders();
      const sorted = [...(data || [])].sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (tA !== tB) return tB - tA;
        return (b.id || 0) - (a.id || 0);
      });
      setOrders(sorted);
    } catch {
      setOrdersError(true);
      toast.error("Không tải được danh sách đơn hàng.");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function fetchVouchers() {
    setVouchersLoading(true);
    try {
      const data = await loyaltyService.adminGetAllVouchers();
      setVouchers(data || []);
    } catch {
      toast.error("Không tải được danh sách voucher.");
    } finally {
      setVouchersLoading(false);
    }
  }

  async function fetchMembers() {
    setMembersLoading(true);
    try {
      const data = await loyaltyService.getAdminMembers();
      setMembers(data || []);
    } catch {
      toast.error("Không tải được danh sách hội viên AgriClub.");
    } finally {
      setMembersLoading(false);
    }
  }

  // --- Handlers: Verification ---
  function openDecisionModal(request: VerificationRequest, action: "approve" | "reject" | "changes") {
    const defaultReason =
      action === "approve"
        ? `Hồ sơ năng lực hợp lệ. Đồng ý phê duyệt và cấp quyền truy cập vị trí ${
            request.type === "FARMER"
              ? "Nông dân / Trang trại"
              : request.type === "WAREHOUSE"
              ? "Nhân viên Kho lạnh"
              : "Nhà phân phối / Đội xe lạnh"
          }.`
        : action === "changes"
        ? "Vui lòng bổ sung rõ hơn mã số chứng chỉ hoặc hình ảnh giấy phép xác minh năng lực."
        : "Hồ sơ minh chứng chưa đáp ứng tiêu chuẩn vận hành chuỗi cung ứng AgriTrace.";
    setDecisionReason(defaultReason);
    setDecisionTarget({ request, action });
  }

  async function handleConfirmDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!decisionTarget) return;
    if (!decisionReason.trim()) {
      toast.error("Vui lòng nhập nhận xét / lý do xử lý hồ sơ.");
      return;
    }

    const { request, action } = decisionTarget;
    try {
      const input = { id: request.id, reason: decisionReason.trim() };
      if (action === "approve") {
        await verificationMutations.approve.mutateAsync(input);
        toast.success(`Đã phê duyệt & cấp quyền ${request.type} cho tài khoản ${request.subjectName}!`);
      } else if (action === "changes") {
        await verificationMutations.requestChanges.mutateAsync(input);
        toast.success(`Đã gửi yêu cầu bổ sung hồ sơ cho ${request.subjectName}.`);
      } else {
        await verificationMutations.reject.mutateAsync(input);
        toast.success(`Đã từ chối hồ sơ của ${request.subjectName}.`);
      }
      setDecisionTarget(null);
      void verifications.refetch();
      void users.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  // --- Handlers: Orders ---
  async function handleUpdateOrderStatus(orderCode: string, newStatus: string) {
    try {
      // Dùng đơn backend trả về để cập nhật cả status lẫn allowedNextStatuses
      const updated = await catalogService.updateOrderStatus(orderCode, newStatus);
      toast.success(`Đã cập nhật trạng thái đơn #${orderCode} sang ${newStatus}!`);
      setOrders((prev) => prev.map((o) => (o.orderCode === orderCode ? updated : o)));
      if (selectedOrder?.orderCode === orderCode) {
        setSelectedOrder(updated);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleApproveTransfer(orderCode: string) {
    try {
      const updated = await catalogService.updateOrderStatus(orderCode, "PAID");
      toast.success(`Đã duyệt thanh toán VietQR thành công cho đơn #${orderCode}!`);
      setOrders((prev) => prev.map((o) => (o.orderCode === orderCode ? updated : o)));
      if (selectedOrder?.orderCode === orderCode) {
        setSelectedOrder(updated);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleRejectTransfer(orderCode: string) {
    if (!window.confirm(`Xác nhận chưa nhận được tiền cho đơn #${orderCode}? Đơn hàng sẽ giữ trạng thái Chưa thanh toán và thông báo cho khách kiểm tra lại.`)) return;
    try {
      const updated = await catalogService.rejectTransfer(orderCode, "Chưa nhận được giao dịch sao kê VietQR");
      toast.info(`Đã từ chối xác nhận thanh toán đơn #${orderCode}.`);
      setOrders((prev) => prev.map((o) => (o.orderCode === orderCode ? updated : o)));
      if (selectedOrder?.orderCode === orderCode) {
        setSelectedOrder(updated);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  // --- Handlers: Vouchers ---
  async function handleCreateVoucher(e: React.FormEvent) {
    e.preventDefault();
    if (!newVoucher.code.trim() || !newVoucher.title.trim()) {
      toast.error("Vui lòng nhập đầy đủ Mã code và Tiêu đề voucher.");
      return;
    }

    try {
      const created = await loyaltyService.adminCreateVoucher({
        code: newVoucher.code.trim().toUpperCase(),
        title: newVoucher.title.trim(),
        discount: newVoucher.discount.trim(),
        minOrder: newVoucher.minOrder.trim(),
        exp: newVoucher.exp.trim(),
        badge: newVoucher.badge.trim() || "-ƯU ĐÃI",
        badgeColor: "bg-emerald-600 text-white",
        description: newVoucher.description.trim(),
        active: true,
      });
      toast.success(`Tạo thành công voucher [${created.code}]!`);
      useNotificationStore.getState().addNotification({
        id: `notif-voucher-${created.code}`,
        title: `🎟️ Voucher Mới: ${created.code} (${created.badge || "Ưu đãi"})`,
        message: `Hệ thống vừa phát hành ưu đãi "${created.title}". Giảm ${created.discount}đ cho đơn từ ${created.minOrder}đ. Hạn dùng: ${created.exp}!`,
        type: "voucher",
        link: "/vouchers",
        badge: created.badge || "Voucher",
      });
      setShowCreateVoucherModal(false);
      setNewVoucher({
        code: "",
        title: "",
        discount: "30000",
        minOrder: "150000",
        exp: "31/12/2026",
        badge: "GIẢM 30K",
        description: "Mã ưu đãi áp dụng toàn hệ thống AgriTrace AI",
      });
      fetchVouchers();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleToggleVoucher(id: number) {
    try {
      const updated = await loyaltyService.adminToggleVoucher(id);
      toast.success(`Đã ${updated.active ? "kích hoạt" : "tạm dừng"} voucher [${updated.code}]!`);
      setVouchers((prev) => prev.map((v) => (v.id === id ? updated : v)));
    } catch {
      toast.error("Không thể đổi trạng thái voucher.");
    }
  }

  async function handleDeleteVoucher(id: number, code: string) {
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn voucher [${code}]?`)) return;
    try {
      const ok = await loyaltyService.adminDeleteVoucher(id);
      if (ok) {
        toast.success(`Đã xóa voucher [${code}]!`);
        setVouchers((prev) => prev.filter((v) => v.id !== id));
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  // --- Handlers: Loyalty Bonus ---
  async function handleSendBonus(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMember) return;
    if (!Number.isInteger(bonusPoints) || bonusPoints === 0) {
      toast.error("Số điểm điều chỉnh phải là số nguyên khác 0.");
      return;
    }
    if (bonusPoints < 0 && selectedMember.currentPoints + bonusPoints < 0) {
      toast.error(`Hội viên chỉ còn ${selectedMember.currentPoints} điểm, không thể trừ ${Math.abs(bonusPoints)} điểm.`);
      return;
    }
    try {
      const ok = await loyaltyService.adminAddBonus(
        selectedMember.user.id,
        bonusPoints,
        bonusReason.trim()
      );
      if (ok) {
        toast.success(
          `Đã ${bonusPoints >= 0 ? "cộng" : "trừ"} ${Math.abs(bonusPoints)} điểm cho ${selectedMember.user.fullName}!`
        );
        setShowBonusModal(false);
        fetchMembers();
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  // --- Handlers: Events & Campaigns ---
  const handleOpenAddEvent = () => {
    setEditingEventId(null);
    setEventForm({
      title: "",
      slug: "",
      type: "harvest",
      typeLabel: "Chính Vụ Thu Hoạch",
      typeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "2026-12-31",
      discountPercent: 15,
      discountAmount: 15000,
      targetType: "product",
      targetCategoryCodes: "rau_la",
      targetProductNames: "",
      voucherCode: "",
      bannerIcon: "🌿",
      badgeText: "Vụ mùa -15%",
      description: "",
      fullContent: "",
      active: true,
    });
    setShowEventModal(true);
  };

  const handleOpenEditEvent = (c: CampaignItem) => {
    setEditingEventId(c.id);
    setEventForm({
      title: c.title,
      slug: c.slug,
      type: c.type,
      typeLabel: c.typeLabel,
      typeColor: c.typeColor,
      startDate: c.startDate,
      endDate: c.endDate,
      discountPercent: c.discountPercent,
      discountAmount: c.discountAmount || 0,
      targetType: c.targetType,
      targetCategoryCodes: (c.targetCategoryCodes || []).join(", "),
      targetProductNames: (c.targetProductNames || []).join(", "),
      voucherCode: c.voucherCode || "",
      bannerIcon: c.bannerIcon || "🌿",
      badgeText: c.badgeText || `Vụ mùa -${c.discountPercent}%`,
      description: c.description || "",
      fullContent: c.fullContent || "",
      active: c.active,
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim()) {
      toast.error("Vui lòng nhập tên sự kiện!");
      return;
    }
    const catCodes =
      eventForm.targetType === "category"
        ? eventForm.targetCategoryCodes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    const prodNames =
      eventForm.targetType === "product"
        ? eventForm.targetProductNames
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    try {
    if (editingEventId) {
      await updateCampaign(editingEventId, {
        title: eventForm.title.trim(),
        slug: eventForm.slug.trim(),
        type: eventForm.type,
        typeLabel: eventForm.typeLabel,
        typeColor: eventForm.typeColor,
        startDate: eventForm.startDate,
        endDate: eventForm.endDate,
        discountPercent: Number(eventForm.discountPercent) || 0,
        discountAmount: Number(eventForm.discountAmount) || 0,
        targetType: eventForm.targetType,
        targetCategoryCodes: catCodes,
        targetProductNames: prodNames,
        // Form không quản lý targetProductIds → xóa để seed ID cũ không còn áp giảm giá ngầm
        targetProductIds: [],
        voucherCode: eventForm.voucherCode.trim() || undefined,
        bannerIcon: eventForm.bannerIcon.trim() || "🌿",
        badgeText: eventForm.badgeText.trim() || `Vụ mùa -${eventForm.discountPercent}%`,
        description: eventForm.description.trim(),
        fullContent: eventForm.fullContent.trim(),
        active: eventForm.active,
      });
      toast.success(`Đã cập nhật sự kiện: ${eventForm.title}!`);
    } else {
      await addCampaign({
        title: eventForm.title.trim(),
        slug: eventForm.slug.trim(),
        type: eventForm.type,
        typeLabel: eventForm.typeLabel,
        typeColor: eventForm.typeColor,
        startDate: eventForm.startDate,
        endDate: eventForm.endDate,
        discountPercent: Number(eventForm.discountPercent) || 0,
        discountAmount: Number(eventForm.discountAmount) || 0,
        targetType: eventForm.targetType,
        targetCategoryCodes: catCodes,
        targetProductNames: prodNames,
        voucherCode: eventForm.voucherCode.trim() || undefined,
        bannerIcon: eventForm.bannerIcon.trim() || "🌿",
        badgeText: eventForm.badgeText.trim() || `Vụ mùa -${eventForm.discountPercent}%`,
        description: eventForm.description.trim(),
        fullContent: eventForm.fullContent.trim(),
        active: eventForm.active,
      });
      toast.success(`Đã tạo sự kiện khuyến mãi mới: ${eventForm.title}!`);
    }
    setShowEventModal(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa sự kiện [${title}]? Sau khi xóa, các sản phẩm áp dụng sự kiện này sẽ tự động trở về giá niêm yết ban đầu.`)) return;
    try {
      await deleteCampaign(id);
      toast.success(`Đã xóa sự kiện [${title}]!`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleToggleEvent = async (id: string) => {
    try {
      await toggleCampaign(id);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleToggleBlog = async (id: string) => {
    try {
      await toggleBlogPost(id);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  // --- Handlers: Blog ---
  const handleOpenAddBlog = () => {
    setEditingBlogId(null);
    setBlogForm({
      title: "",
      slug: "",
      category: "season",
      categoryLabel: "Quyết định & Mùa vụ",
      author: "Lê Quang Minh",
      authorRole: "Quản trị viên Hệ thống AgriTrace AI",
      date: new Date().toLocaleDateString("vi-VN"),
      readTime: "5 phút đọc",
      excerpt: "",
      content: "",
      coverImage: "",
      featured: false,
      relatedProductName: "",
      active: true,
    });
    setShowBlogModal(true);
  };

  const handleOpenEditBlog = (post: AdminBlogPost) => {
    setEditingBlogId(post.id);
    setBlogForm({
      title: post.title,
      slug: post.slug,
      category: post.category,
      categoryLabel: post.categoryLabel,
      author: post.author,
      authorRole: post.authorRole,
      date: post.date,
      readTime: post.readTime,
      excerpt: post.excerpt,
      content: post.content || "",
      coverImage: post.coverImage || "",
      featured: post.featured || false,
      relatedProductName: post.relatedProductName || "",
      active: post.active,
    });
    setShowBlogModal(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogForm.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết!");
      return;
    }

    try {
    if (editingBlogId) {
      await updateBlogPost(editingBlogId, {
        title: blogForm.title.trim(),
        slug: blogForm.slug.trim(),
        category: blogForm.category,
        categoryLabel: blogForm.categoryLabel,
        author: blogForm.author.trim(),
        authorRole: blogForm.authorRole.trim(),
        date: blogForm.date,
        readTime: blogForm.readTime,
        excerpt: blogForm.excerpt.trim(),
        content: blogForm.content.trim(),
        coverImage: blogForm.coverImage.trim() || undefined,
        featured: blogForm.featured,
        relatedProductName: blogForm.relatedProductName.trim() || undefined,
        active: blogForm.active,
      });
      toast.success(`Đã cập nhật bài viết blog: ${blogForm.title}!`);
    } else {
      await addBlogPost({
        title: blogForm.title.trim(),
        slug: blogForm.slug.trim(),
        category: blogForm.category,
        categoryLabel: blogForm.categoryLabel,
        author: blogForm.author.trim(),
        authorRole: blogForm.authorRole.trim(),
        date: blogForm.date,
        readTime: blogForm.readTime,
        excerpt: blogForm.excerpt.trim(),
        content: blogForm.content.trim(),
        coverImage: blogForm.coverImage.trim() || undefined,
        featured: blogForm.featured,
        relatedProductName: blogForm.relatedProductName.trim() || undefined,
        active: blogForm.active,
      });
      toast.success(`Đã đăng bài viết blog mới: ${blogForm.title}!`);
    }
    setShowBlogModal(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDeleteBlog = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bài viết [${title}]?`)) return;
    try {
      await deleteBlogPost(id);
      toast.success(`Đã xóa bài viết [${title}]!`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch =
        !eventSearch.trim() ||
        c.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
        c.slug.toLowerCase().includes(eventSearch.toLowerCase()) ||
        c.description?.toLowerCase().includes(eventSearch.toLowerCase()) ||
        c.voucherCode?.toLowerCase().includes(eventSearch.toLowerCase());

      const status = getCampaignStatus(c);
      const matchFilter = eventFilter === "all" || status === eventFilter;

      return matchSearch && matchFilter;
    });
  }, [campaigns, eventSearch, eventFilter, getCampaignStatus]);

  const campaignStats = useMemo(() => {
    let active = 0;
    let upcoming = 0;
    let expired = 0;
    campaigns.forEach((c) => {
      const st = getCampaignStatus(c);
      if (st === "active") active++;
      else if (st === "upcoming") upcoming++;
      else expired++;
    });
    return { total: campaigns.length, active, upcoming, expired };
  }, [campaigns, getCampaignStatus]);

  const filteredBlogPosts = useMemo(() => {
    return blogPosts.filter((p) => {
      const matchSearch =
        !blogSearch.trim() ||
        p.title.toLowerCase().includes(blogSearch.toLowerCase()) ||
        p.author.toLowerCase().includes(blogSearch.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(blogSearch.toLowerCase());
      const matchCat = blogFilter === "all" || p.category === blogFilter;
      return matchSearch && matchCat;
    });
  }, [blogPosts, blogSearch, blogFilter]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !orderSearch.trim() ||
        o.orderCode.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.receiverName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.receiverPhone?.includes(orderSearch) ||
        o.userEmail?.toLowerCase().includes(orderSearch.toLowerCase());
      const st = o.status?.toUpperCase() || "";
      const matchStatus =
        orderFilter === "ALL" ||
        (orderFilter === "PENDING_APPROVAL" && o.status === "PENDING_PAYMENT" && o.paymentRef === "PENDING_ADMIN_APPROVAL") ||
        (orderFilter === "CONFIRMED" && ["CONFIRMED", "PAID", "PREPARING", "PENDING_PAYMENT"].includes(st)) ||
        (orderFilter === "DELIVERED" && ["DELIVERED", "COMPLETED"].includes(st)) ||
        (orderFilter === "CANCELLED" && ["CANCELLED", "REFUNDED"].includes(st)) ||
        st === orderFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, orderSearch, orderFilter]);

  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => REVENUE_STATUSES.has(String(o.status).toUpperCase()))
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  const totalUsers = users.isPending ? "…" : users.isError ? "—" : (users.data?.length ?? 0).toLocaleString("vi-VN");
  const lockedUsers = users.isPending ? "…" : users.isError ? "—" : (users.data?.filter((user) => !user.active).length ?? 0).toLocaleString("vi-VN");
  const pendingCount = verifications.isPending ? "…" : verifications.isError ? "—" : pendingRequests.length.toLocaleString("vi-VN");
  const headerByTab = {
    verifications: { title: "Tổng quan & duyệt hồ sơ", description: "Theo dõi tài khoản hệ thống và xử lý hồ sơ xác minh của nông dân, nhà phân phối.", icon: Shield, tone: "forest" as const, meta: `${pendingCount} hồ sơ chờ` },
    batches: { title: "Duyệt lô thu hoạch & xuất kho", description: "Thẩm định hồ sơ kiểm nghiệm KCS và tiêu chuẩn VietGAP/GlobalGAP trước khi cấp lệnh xuất kho.", icon: Package, tone: "forest" as const, meta: `${pendingBatchesCount} lô chờ duyệt` },
    certs: { title: "Duyệt chứng nhận & gia hạn", description: "Thẩm định hồ sơ đăng ký cấp mới hoặc gia hạn chứng chỉ chất lượng nông trại.", icon: Award, tone: "amber" as const, meta: `${pendingCertsCount} chứng nhận chờ` },
    orders: { title: "Quản lý đơn hàng hệ thống", description: "Giám sát vòng đời đơn hàng và điều phối các bước chuyển trạng thái được phép.", icon: ShoppingBag, tone: "ocean" as const, meta: `${orders.length} đơn hàng` },
    vouchers: { title: "Kho voucher & ưu đãi", description: "Quản lý mã khuyến mãi, điều kiện áp dụng và trạng thái sử dụng trên toàn hệ thống.", icon: Ticket, tone: "violet" as const, meta: `${vouchers.length} voucher` },
    loyalty: { title: "Hội viên AgriClub", description: "Theo dõi hạng thành viên, điểm thưởng và lịch sử chi tiêu của khách hàng.", icon: Crown, tone: "amber" as const, meta: `${members.length} hội viên` },
    events: { title: "Sự kiện & mùa vụ", description: "Quản lý thời gian, ưu đãi và phạm vi nông sản áp dụng cho từng chiến dịch.", icon: CalendarDays, tone: "teal" as const, meta: `${campaigns.length} chiến dịch` },
    blog: { title: "Quản trị blog & cẩm nang", description: "Quản lý nội dung, chuyên mục, trạng thái xuất bản và thông tin tác giả.", icon: BookOpen, tone: "indigo" as const, meta: `${blogPosts.length} bài viết` },
  } satisfies Record<AdminTab, { title: string; description: string; icon: typeof Shield; tone: "forest" | "ocean" | "violet" | "amber" | "teal" | "indigo"; meta: string }>;
  const pageHeader = headerByTab[activeTab];

  const tabNavItems = [
    { key: "verifications" as const, label: "Duyệt Hồ Sơ Vị Trí", icon: Shield, badge: pendingRequests.length },
    { key: "batches" as const, label: "Duyệt Lô Xuất Kho", icon: Package, badge: pendingBatchesCount },
    { key: "certs" as const, label: "Duyệt Chứng Nhận", icon: Award, badge: pendingCertsCount },
    { key: "orders" as const, label: "Đơn Hàng", icon: ShoppingBag, badge: orders.length },
    { key: "vouchers" as const, label: "Voucher", icon: Ticket, badge: vouchers.length },
    { key: "loyalty" as const, label: "Hội Viên AgriClub", icon: Crown, badge: members.length },
    { key: "events" as const, label: "Sự Kiện & Mùa Vụ", icon: CalendarDays, badge: campaigns.length },
    { key: "blog" as const, label: "Blog & Cẩm Nang", icon: BookOpen, badge: blogPosts.length },
  ];

  return (
    <div className="space-y-6 [&_button]:touch-manipulation [&_button]:focus-visible:outline-none [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-primary [&_input]:focus-visible:ring-2 [&_input]:focus-visible:ring-primary/30 [&_select]:focus-visible:ring-2 [&_select]:focus-visible:ring-primary/30 [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-primary/30">
      <AdminPageHeader title={pageHeader.title} description={pageHeader.description} icon={pageHeader.icon} tone={pageHeader.tone} meta={pageHeader.meta} />

      {/* Warm Botanical Editorial Quick-Tab Switcher */}
      <nav aria-label="Điều hướng phân hệ quản trị" className="rounded-2xl border border-[#E4DFD5] bg-[#F6F3EC] p-1.5 flex items-center gap-1 overflow-x-auto">
        {tabNavItems.map((t) => {
          const Icon = t.icon;
          const isCurrent = activeTab === t.key;
          return (
            <Link
              key={t.key}
              href={`/dashboard/admin?tab=${t.key}`}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer",
                isCurrent
                  ? "bg-[#16261E] text-white shadow-xs"
                  : "text-stone-600 hover:text-[#16261E] hover:bg-white/80"
              )}
            >
              <Icon size={14} className={isCurrent ? "text-amber-300" : "text-[#166534]"} />
              <span>{t.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold",
                  isCurrent
                    ? "bg-amber-300 text-[#16261E]"
                    : "bg-white border border-[#E4DFD5] text-stone-700"
                )}
              >
                {t.badge}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ========================================================= */}
      {/* TAB 1: PHÊ DUYỆT HỒ SƠ & TỔNG QUAN TÀI KHOẢN (MEMBER 1)     */}
      {/* ========================================================= */}
      {activeTab === "verifications" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard label="Tổng tài khoản" value={totalUsers} helper={users.isError ? "Không tải được dữ liệu người dùng" : "Tất cả tài khoản trong hệ thống"} icon={Users} />
            <AdminStatCard label="Chờ duyệt xác minh" value={pendingCount} helper={verifications.isError ? "Không tải được hồ sơ xác minh" : "Hồ sơ cần quản trị viên xử lý"} icon={UserCheck} tone="warning" />
            <AdminStatCard label="Tài khoản bị khóa" value={lockedUsers} helper="Tài khoản hiện không thể truy cập" icon={AlertCircle} tone="danger" />
            <AdminStatCard label="Doanh thu hệ thống" value={`${totalRevenue.toLocaleString("vi-VN")} đ`} helper="Từ các đơn hàng đã xác nhận" icon={DollarSign} tone="success" />
          </div>

          <section className="bento-card overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4DFD5] bg-[#FBF9F5] p-5">
              <div>
                <h2 className="font-serif flex items-center gap-2 text-base font-bold text-[#16261E]">
                  <UserCheck size={19} className="text-[#166534]" />
                  <span>Xét Duyệt Hồ Sơ Vị Trí & Cấp Quyền Hệ Thống</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Khi bấm <strong>Phê duyệt</strong>, hệ thống sẽ tự động cấp quyền vào đúng vị trí (Nông dân / Thủ kho / Nhà phân phối) cho tài khoản ứng tuyển.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { key: "PENDING", label: `Chờ duyệt (${pendingRequests.length})` },
                    {
                      key: "APPROVED",
                      label: `Đã duyệt (${(verifications.data ?? []).filter((r) => r.status === "APPROVED").length})`,
                    },
                    {
                      key: "REJECTED",
                      label: `Từ chối / Bổ sung (${
                        (verifications.data ?? []).filter(
                          (r) => r.status === "REJECTED" || r.status === "CHANGES_REQUESTED"
                        ).length
                      })`,
                    },
                    { key: "ALL", label: `Tất cả (${(verifications.data ?? []).length})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setVerificationFilterStatus(tab.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                      verificationFilterStatus === tab.key
                        ? "bg-[#16261E] text-white shadow-xs"
                        : "bg-white border border-[#E4DFD5] text-stone-600 hover:bg-stone-100"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => void verifications.refetch()}
                  className="p-2 rounded-xl bg-white border border-[#E4DFD5] hover:bg-stone-100 text-[#166534] cursor-pointer"
                  title="Làm mới danh sách hồ sơ"
                >
                  <RefreshCw size={14} className={verifications.isFetching ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Filter by Role Type */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E4DFD5] bg-white px-5 py-3 text-xs">
              <span className="font-bold text-stone-500">Vị trí ứng tuyển:</span>
              {(
                [
                  { key: "ALL", label: "Tất cả vị trí" },
                  { key: "FARMER", label: "Nông dân / Trang trại" },
                  { key: "WAREHOUSE", label: "Nhân viên Kho lạnh" },
                  { key: "DISTRIBUTOR", label: "Nhà phân phối / Xe lạnh" },
                ] as const
              ).map((roleTab) => (
                <button
                  key={roleTab.key}
                  type="button"
                  onClick={() => setVerificationFilterType(roleTab.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer",
                    verificationFilterType === roleTab.key
                      ? "bg-[#F6F3EC] text-[#166534] border border-[#166534]/40 shadow-2xs"
                      : "text-stone-600 hover:bg-stone-100/70"
                  )}
                >
                  {roleTab.label}
                </button>
              ))}
            </div>

            {verifications.isPending ? (
              <div className="p-4"><LoadingSkeleton rows={3} /></div>
            ) : verifications.isError ? (
              <div className="p-4"><ErrorState onRetry={() => verifications.refetch()} /></div>
            ) : filteredVerificationRequests.length === 0 ? (
              <div className="p-10 text-center text-xs text-gray-400">
                Không có hồ sơ xác minh nào trong bộ lọc này.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredVerificationRequests.map((request) => {
                  const href = documentHref(request.documentUrl);
                  const isImageDoc = request.documentUrl?.startsWith("data:image/");
                  const roleBadge =
                    request.type === "FARMER"
                      ? { label: "Nông dân (FARMER)", cls: "bg-emerald-50 text-[#15803D] border-emerald-200" }
                      : request.type === "WAREHOUSE"
                      ? { label: "Nhân viên Kho (WAREHOUSE)", cls: "bg-blue-50 text-blue-800 border-blue-200" }
                      : { label: "Nhà phân phối (DISTRIBUTOR)", cls: "bg-amber-50 text-[#A16207] border-amber-200" };
                  const statusBadge =
                    request.status === "APPROVED"
                      ? { label: "Đã phê duyệt & Cấp quyền", cls: "bg-emerald-100 text-emerald-900" }
                      : request.status === "REJECTED"
                      ? { label: "Đã từ chối", cls: "bg-rose-100 text-rose-800" }
                      : request.status === "CHANGES_REQUESTED"
                      ? { label: "Yêu cầu bổ sung", cls: "bg-amber-100 text-amber-900" }
                      : { label: "Chờ xét duyệt", cls: "bg-amber-50 text-amber-800 border border-amber-300" };

                  return (
                    <article key={request.id} className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-start hover:bg-gray-50/40 transition-colors">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-gray-900">{request.subjectName}</span>
                          <span className="text-xs text-gray-500">({request.subjectEmail})</span>
                          <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold border", roleBadge.cls)}>
                            {roleBadge.label}
                          </span>
                          <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold", statusBadge.cls)}>
                            {statusBadge.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                          <div>
                            <span className="text-gray-400 font-semibold">Đơn vị / Nông trại / Kho / Đội xe: </span>
                            <strong className="text-gray-900">{request.organizationName}</strong>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold">Loại chứng chỉ / Giấy tờ: </span>
                            <strong className="text-gray-900">{request.documentType}</strong>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-gray-400 font-semibold">Thời gian gửi: </span>
                            <span className="text-gray-700">{submittedAt(request.createdAt)}</span>
                            {request.reviewedAt && (
                              <span className="text-gray-500 ml-3">
                                · Đã xử lý lúc: {submittedAt(request.reviewedAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        {request.note && (
                          <p className="break-words text-xs text-gray-700 bg-white p-2.5 rounded-lg border border-gray-100">
                            <strong className="text-gray-900">Năng lực & Kinh nghiệm:</strong> {request.note}
                          </p>
                        )}

                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">Minh chứng đính kèm: </span>
                          {isImageDoc ? (
                            <div className="mt-1.5">
                              <img
                                src={request.documentUrl}
                                alt="Hồ sơ đính kèm"
                                className="max-h-40 rounded-xl border border-gray-200 object-contain bg-white p-1"
                              />
                            </div>
                          ) : href ? (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="break-all text-emerald-700 font-semibold underline">
                              Mở tài liệu ({request.documentUrl})
                            </a>
                          ) : (
                            <span className="break-all font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                              {request.documentUrl}
                            </span>
                          )}
                        </div>

                        {request.decisionReason && (
                          <div className="text-xs text-gray-600 italic bg-gray-100/80 px-3 py-1.5 rounded-lg">
                            <strong>Nhận xét của Admin:</strong> {request.decisionReason}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {request.status !== "APPROVED" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => openDecisionModal(request, "approve")}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a7a3a] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#156e34] disabled:opacity-50 cursor-pointer"
                          >
                            <Check size={14} />
                            <span>Phê duyệt & Cấp quyền</span>
                          </button>
                        )}
                        {(request.status === "PENDING" || request.status === "UNDER_REVIEW") && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => openDecisionModal(request, "changes")}
                            className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50 cursor-pointer"
                          >
                            <span>Yêu cầu bổ sung</span>
                          </button>
                        )}
                        {request.status !== "REJECTED" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => openDecisionModal(request, "reject")}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
                          >
                            <X size={14} />
                            <span>Từ chối</span>
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Modal Xác Nhận Duyệt / Từ Chối Hồ Sơ Vị Trí */}
          {decisionTarget && (
            <div
              onClick={() => setDecisionTarget(null)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
            >
              <form
                onSubmit={handleConfirmDecision}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-fade-in"
              >
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      {decisionTarget.action === "approve"
                        ? "✅ Phê Duyệt Hồ Sơ & Mở Khóa Vị Trí"
                        : decisionTarget.action === "changes"
                        ? "⚠️ Yêu Cầu Ứng Viên Bổ Sung Hồ Sơ"
                        : "❌ Từ Chối Hồ Sơ Đăng Ký Vị Trí"}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Ứng viên: <strong>{decisionTarget.request.subjectName}</strong> ({decisionTarget.request.subjectEmail}) · Vị trí:{" "}
                      <strong>{decisionTarget.request.type}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDecisionTarget(null)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <X size={18} />
                  </button>
                </div>

                {decisionTarget.action === "approve" && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-900">
                    Khi xác nhận phê duyệt, tài khoản <strong>{decisionTarget.request.subjectEmail}</strong> sẽ được{" "}
                    <strong>cấp quyền {decisionTarget.request.type}</strong> tự động và có thể truy cập ngay vào Bảng điều khiển của vị trí này.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Nhận xét / Lý do phản hồi gửi tới ứng viên <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="Nhập nhận xét hoặc lý do phê duyệt / từ chối..."
                    className="w-full rounded-xl border border-gray-200 p-3 text-xs sm:text-sm outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setDecisionTarget(null)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className={cn(
                      "rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs cursor-pointer disabled:opacity-50",
                      decisionTarget.action === "approve"
                        ? "bg-emerald-700 hover:bg-emerald-800"
                        : decisionTarget.action === "changes"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-rose-600 hover:bg-rose-700"
                    )}
                  >
                    {busy
                      ? "Đang xử lý..."
                      : decisionTarget.action === "approve"
                      ? "Xác nhận Phê duyệt & Cấp quyền"
                      : decisionTarget.action === "changes"
                      ? "Gửi yêu cầu bổ sung"
                      : "Xác nhận Từ chối"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1.5: XÉT DUYỆT LÔ THU HOẠCH & XUẤT KHO                   */}
      {/* ========================================================= */}
      {activeTab === "batches" && (
        <div className="space-y-6 animate-fade-in">
          {/* Batch Approval KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard
              label="Tổng lô khai báo"
              value={adminBatches.length}
              helper="Từ các nông trại trực thuộc"
              icon={Package}
            />
            <AdminStatCard
              label="Chờ duyệt xuất kho"
              value={pendingBatchesCount}
              helper="Cần Admin thẩm định KCS"
              icon={Clock}
              tone="warning"
            />
            <AdminStatCard
              label="Đã duyệt xuất kho"
              value={adminBatches.filter((b) => b.status === "Đã duyệt xuất kho").length}
              helper="Đủ điều kiện lưu thông"
              icon={CheckCircle2}
              tone="success"
            />
            <AdminStatCard
              label="Đang vận chuyển / Giao"
              value={
                adminBatches.filter(
                  (b) => b.transportStatus === "Đang vận chuyển" || b.transportStatus === "Đã nhập kho đích"
                ).length
              }
              helper="Chuỗi logistics bảo quản lạnh"
              icon={Truck}
              tone="primary"
            />
          </div>

          <section className="bento-card overflow-hidden">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 p-4">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Package size={18} className="text-[#1a7a3a]" />
                  Xét Duyệt Lô Thu Hoạch & Cấp Lệnh Xuất Kho
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Admin thẩm định hồ sơ kiểm nghiệm KCS và tiêu chuẩn VietGAP/GlobalGAP trước khi phê duyệt cho phép nông dân xuất kho và điều phối vận chuyển.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { key: "PENDING", label: `Chờ duyệt (${pendingBatchesCount})` },
                    {
                      key: "APPROVED",
                      label: `Đã duyệt (${adminBatches.filter((b) => b.status === "Đã duyệt xuất kho").length})`,
                    },
                    {
                      key: "REJECTED",
                      label: `Từ chối (${adminBatches.filter((b) => b.status === "Từ chối xuất kho").length})`,
                    },
                    { key: "ALL", label: `Tất cả (${adminBatches.length})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setAdminBatchFilter(tab.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                      adminBatchFilter === tab.key
                        ? "bg-[#1a7a3a] text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={fetchAdminBatches}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  title="Tải lại danh sách lô"
                >
                  <RefreshCw size={14} className={adminBatchesLoading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={adminBatchSearch}
                  onChange={(e) => setAdminBatchSearch(e.target.value)}
                  placeholder="Tìm kiếm theo mã lô (XL-2026-08), tên nông sản, nông trại..."
                  className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-800 outline-none focus:border-emerald-600"
                />
              </div>
              {adminBatchSearch && (
                <button
                  onClick={() => setAdminBatchSearch("")}
                  className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded-lg"
                >
                  Xóa tìm kiếm
                </button>
              )}
            </div>

            {/* Harvest Lots Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Mã Lô & Nông Sản</th>
                    <th className="py-3 px-4">Nông Trại / Nơi Trồng</th>
                    <th className="py-3 px-4">Thu Hoạch & Sản Lượng</th>
                    <th className="py-3 px-4">Tiêu Chuẩn & KCS</th>
                    <th className="py-3 px-4">Trạng Thái Xét Duyệt</th>
                    <th className="py-3 px-4">Lưu Kho / Vận Chuyển</th>
                    <th className="py-3 px-4 text-right">Thao Tác Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {adminBatchesLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        <RefreshCw size={20} className="animate-spin mx-auto text-emerald-600 mb-2" />
                        Đang đồng bộ dữ liệu lô thu hoạch từ máy chủ...
                      </td>
                    </tr>
                  ) : filteredAdminBatches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <Package size={28} className="mx-auto text-gray-300 mb-2" />
                        Không tìm thấy lô thu hoạch nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredAdminBatches.map((b) => (
                      <tr key={b.code} className="hover:bg-gray-50/80 transition-colors">
                        {/* Mã Lô & Nông Sản */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block text-[11px]">
                            #{b.code}
                          </div>
                          <div className="font-bold text-gray-900 text-xs mt-1">{b.product}</div>
                          <div className="text-[10px] text-gray-400">
                            HSD: {b.expiryDate || "Chưa xác định"}
                          </div>
                        </td>

                        {/* Nông Trại */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-800 text-xs truncate max-w-[180px]" title={b.farmName}>
                            {b.farmName || "Nông Trại Xanh Đà Lạt"}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Quy trình: {b.cultivation || "Theo tiêu chuẩn an toàn"}
                          </div>
                        </td>

                        {/* Thu Hoạch & Sản Lượng */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">
                            {b.qty} {b.unit || "kg"}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                            <Clock size={10} className="text-gray-400" />
                            Ngày hái: {b.harvestDate}
                          </div>
                        </td>

                        {/* Tiêu Chuẩn & KCS */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                            {b.cert || "VietGAP"}
                          </span>
                          <div className="text-[10px] text-teal-700 font-medium mt-1 flex items-center gap-1">
                            <ShieldCheck size={11} className="text-teal-600" />
                            KCS: Đạt ISO/IEC 17025
                          </div>
                        </td>

                        {/* Trạng Thái Xét Duyệt */}
                        <td className="py-3.5 px-4">
                          {b.status === "Đã duyệt xuất kho" ? (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                              <Check size={11} className="text-emerald-700" /> Đã duyệt xuất kho
                            </span>
                          ) : b.status === "Từ chối xuất kho" ? (
                            <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                              <X size={11} className="text-rose-700" /> Từ chối xuất kho
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 animate-pulse">
                              <Clock size={11} className="text-amber-600" /> Chờ Admin duyệt
                            </span>
                          )}
                        </td>

                        {/* Lưu Kho & Vận Chuyển */}
                        <td className="py-3.5 px-4">
                          {b.transportStatus === "Đang vận chuyển" ? (
                            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold text-[10px] inline-flex items-center gap-1">
                              <Truck size={10} className="text-blue-600" /> Đang vận chuyển
                            </span>
                          ) : b.transportStatus === "Đã nhập kho đích" ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold text-[10px] inline-flex items-center gap-1">
                              <CheckCircle2 size={10} className="text-emerald-600" /> Đã nhập kho
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold text-[10px] inline-flex items-center gap-1">
                              🏡 Lưu kho vườn
                            </span>
                          )}
                          <div className="text-[10px] text-gray-500 mt-1 truncate max-w-[140px]" title={b.transportDestination}>
                            Đến: {b.transportDestination || "Kho phân phối"}
                          </div>
                        </td>

                        {/* Thao Tác Admin */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {b.status === "Chờ duyệt xuất kho" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBatchDecisionTarget({ batch: b, action: "approve" });
                                    setBatchDecisionReason("Hồ sơ kiểm nghiệm KCS đạt chuẩn an toàn thực phẩm ISO 17025. Đồng ý cấp lệnh xuất kho cho nông trại.");
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                  title="Phê duyệt xuất kho"
                                >
                                  <Check size={12} /> Duyệt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBatchDecisionTarget({ batch: b, action: "reject" });
                                    setBatchDecisionReason("Dư lượng chưa đạt tiêu chuẩn an toàn hoặc chứng chỉ VietGAP hết hiệu lực. Yêu cầu tái kiểm định.");
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Từ chối xuất kho"
                                >
                                  <X size={12} /> Từ chối
                                </button>
                              </>
                            ) : b.status === "Đã duyệt xuất kho" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setBatchDecisionTarget({ batch: b, action: "reject" });
                                  setBatchDecisionReason("Tạm dừng lệnh xuất kho để kiểm tra bổ sung hồ sơ.");
                                }}
                                className="px-2.5 py-1 text-amber-700 hover:text-amber-800 text-[11px] font-semibold underline cursor-pointer"
                              >
                                Thu hồi duyệt
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setBatchDecisionTarget({ batch: b, action: "approve" });
                                  setBatchDecisionReason("Hồ sơ đã được bổ sung đầy đủ, đồng ý cấp lệnh xuất kho.");
                                }}
                                className="px-2.5 py-1 text-emerald-700 hover:text-emerald-800 text-[11px] font-semibold underline cursor-pointer"
                              >
                                Duyệt lại
                              </button>
                            )}

                            <Link
                              href={`/traceability?batch=${b.code}`}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1"
                              title="Xem trang tra cứu QR"
                            >
                              <QrCode size={12} /> QR
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Modal Xác Nhận Phê Duyệt / Từ Chối Của Admin */}
          {batchDecisionTarget && (
            <div
              onClick={() => setBatchDecisionTarget(null)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs cursor-pointer animate-in fade-in duration-200"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden cursor-default"
              >
                <div
                  className={`px-5 py-4 flex items-center justify-between text-white ${
                    batchDecisionTarget.action === "approve" ? "bg-emerald-950" : "bg-rose-950"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {batchDecisionTarget.action === "approve" ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <AlertCircle size={18} className="text-rose-400" />
                    )}
                    <h3 className="text-sm font-bold">
                      {batchDecisionTarget.action === "approve"
                        ? "✅ Phê Duyệt & Cấp Lệnh Xuất Kho Nông Sản"
                        : "❌ Từ Chối Cấp Lệnh Xuất Kho"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setBatchDecisionTarget(null)}
                    className="text-gray-300 hover:text-white p-1 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  {/* Thông tin tóm tắt lô */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-800 text-xs">
                        #{batchDecisionTarget.batch.code}
                      </span>
                      <span className="font-bold text-gray-700">
                        {batchDecisionTarget.batch.qty} {batchDecisionTarget.batch.unit}
                      </span>
                    </div>
                    <div className="font-bold text-gray-900 text-xs">
                      {batchDecisionTarget.batch.product}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Nông trại: {batchDecisionTarget.batch.farmName} • Tiêu chuẩn: {batchDecisionTarget.batch.cert}
                    </div>
                  </div>

                  {batchDecisionTarget.action === "approve" ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] leading-relaxed">
                      Khi xác nhận phê duyệt, lô hàng sẽ chuyển sang trạng thái <strong>&ldquo;Đã duyệt xuất kho&rdquo;</strong>.
                      Nông dân sẽ được mở khóa quyền điều phối xe lạnh và bắt đầu vận chuyển nông sản đến kho đích.
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] leading-relaxed">
                      Lô hàng sẽ bị đánh dấu <strong>&ldquo;Từ chối xuất kho&rdquo;</strong>. Hệ thống sẽ khóa chức năng điều phối vận chuyển của nông dân cho đến khi có kết quả kiểm định mới.
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 text-xs">
                      Nhận xét thẩm định KCS & Ý kiến chỉ đạo của Admin: *
                    </label>
                    <textarea
                      rows={3}
                      value={batchDecisionReason}
                      onChange={(e) => setBatchDecisionReason(e.target.value)}
                      placeholder="Nhập nhận xét phê duyệt hoặc lý do từ chối..."
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-800 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setBatchDecisionTarget(null)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingBatchDecision}
                      onClick={handleConfirmBatchDecision}
                      className={`px-4 py-2 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 ${
                        batchDecisionTarget.action === "approve"
                          ? "bg-[#1a7a3a] hover:bg-[#14622e]"
                          : "bg-rose-600 hover:bg-rose-700"
                      }`}
                    >
                      {isSubmittingBatchDecision ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : batchDecisionTarget.action === "approve" ? (
                        <Check size={13} />
                      ) : (
                        <X size={13} />
                      )}
                      {batchDecisionTarget.action === "approve"
                        ? "Xác Nhận Phê Duyệt Xuất Kho"
                        : "Xác Nhận Từ Chối"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1.75: XÉT DUYỆT CHỨNG NHẬN & HỒ SƠ GIA HẠN              */}
      {/* ========================================================= */}
      {activeTab === "certs" && (
        <div className="space-y-6 animate-fade-in">
          {/* Certificate Approval KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard
              label="Tổng chứng nhận nông trại"
              value={adminCerts.length}
              helper="VietGAP, GlobalGAP, Organic"
              icon={Award}
            />
            <AdminStatCard
              label="Chờ duyệt gia hạn & cấp mới"
              value={pendingCertsCount}
              helper="Cần Admin thẩm định hồ sơ"
              icon={Clock}
              tone="warning"
            />
            <AdminStatCard
              label="Đang có hiệu lực"
              value={adminCerts.filter((c) => c.status === "VALID" && c.approvalStatus !== "PENDING").length}
              helper="Đạt chuẩn lưu hành nông sản"
              icon={ShieldCheck}
              tone="success"
            />
            <AdminStatCard
              label="Sắp hết hạn / Hết hạn"
              value={adminCerts.filter((c) => c.status === "EXPIRING_SOON" || c.status === "EXPIRED").length}
              helper="Cảnh báo tự động gửi email"
              icon={AlertTriangle}
              tone="danger"
            />
          </div>

          <section className="bento-card overflow-hidden">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 p-4">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Award size={18} className="text-[#1a7a3a]" />
                  Xét Duyệt Chứng Nhận Tiêu Chuẩn Nông Nghiệp & Gia Hạn
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Admin thẩm định hồ sơ đăng ký cấp mới hoặc gia hạn chứng chỉ chất lượng (VietGAP / GlobalGAP) từ các nông trại, kiểm tra ảnh minh chứng kiểm nghiệm và cấp hiệu lực mới.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { key: "PENDING", label: `Chờ duyệt (${pendingCertsCount})` },
                    {
                      key: "VALID",
                      label: `Có hiệu lực (${adminCerts.filter((c) => c.status === "VALID" && c.approvalStatus !== "PENDING").length})`,
                    },
                    {
                      key: "EXPIRED",
                      label: `Hết hạn / Cảnh báo (${adminCerts.filter((c) => c.status === "EXPIRED" || c.status === "EXPIRING_SOON" || c.approvalStatus === "REJECTED").length})`,
                    },
                    { key: "ALL", label: `Tất cả (${adminCerts.length})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setAdminCertFilter(tab.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                      adminCertFilter === tab.key
                        ? "bg-[#1a7a3a] text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={fetchAdminCerts}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  title="Tải lại danh sách chứng nhận"
                >
                  <RefreshCw size={14} className={adminCertsLoading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={adminCertSearch}
                  onChange={(e) => setAdminCertSearch(e.target.value)}
                  placeholder="Tìm kiếm theo số hiệu chứng chỉ (GG-VN-9942), tên tiêu chuẩn, nông trại..."
                  className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-800 outline-none focus:border-emerald-600"
                />
              </div>
              {adminCertSearch && (
                <button
                  onClick={() => setAdminCertSearch("")}
                  className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded-lg"
                >
                  Xóa tìm kiếm
                </button>
              )}
            </div>

            {/* Certificates Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Tên Chứng Nhận & Tiêu Chuẩn</th>
                    <th className="py-3 px-4">Nông Trại Trực Thuộc</th>
                    <th className="py-3 px-4">Số Hiệu & Đơn Vị Cấp</th>
                    <th className="py-3 px-4">Thời Hạn & Đề Xuất Mới</th>
                    <th className="py-3 px-4">Trạng Thái Xét Duyệt</th>
                    <th className="py-3 px-4">Tài Liệu Minh Chứng</th>
                    <th className="py-3 px-4 text-right">Thao Tác Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {adminCertsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        <RefreshCw size={20} className="animate-spin mx-auto text-emerald-600 mb-2" />
                        Đang tải danh sách chứng nhận nông trại...
                      </td>
                    </tr>
                  ) : filteredAdminCerts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <Award size={28} className="mx-auto text-gray-300 mb-2" />
                        Không tìm thấy chứng nhận nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredAdminCerts.map((c) => {
                      const isPending = c.approvalStatus === "PENDING" || c.status === "PENDING";
                      return (
                        <tr key={c.certNumber} className="hover:bg-gray-50/80 transition-colors">
                          {/* Tên Chứng Nhận */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 text-xs">{c.name}</div>
                            <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block text-[10px] mt-1 font-semibold">
                              Số hiệu: {c.certNumber}
                            </span>
                          </td>

                          {/* Nông Trại */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-800 text-xs truncate max-w-[180px]" title={c.farmName}>
                              {c.farmName || c.farmCode}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">Mã trại: {c.farmCode}</div>
                          </td>

                          {/* Đơn Vị Cấp */}
                          <td className="py-3.5 px-4">
                            <div className="text-gray-700 text-xs font-medium truncate max-w-[170px]" title={c.issuedBy}>
                              {c.issuedBy || "Tổ chức Kiểm định Quốc tế"}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">Ngày cấp: {c.issueDate || "01/01/2026"}</div>
                          </td>

                          {/* Thời Hạn & Đề Xuất Mới */}
                          <td className="py-3.5 px-4">
                            <div className="text-xs font-semibold text-gray-700">
                              Hạn cũ: <strong className="text-rose-600">{c.expiryDate}</strong>
                            </div>
                            {c.pendingRequestedExpiryDate && (
                              <div className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                                Xin gia hạn đến: {c.pendingRequestedExpiryDate}
                              </div>
                            )}
                            {c.pendingNewCertNumber && c.pendingNewCertNumber !== c.certNumber && (
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                Mã mới: <span className="font-mono font-bold text-gray-800">{c.pendingNewCertNumber}</span>
                              </div>
                            )}
                          </td>

                          {/* Trạng Thái Xét Duyệt */}
                          <td className="py-3.5 px-4">
                            {isPending ? (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 animate-pulse">
                                <Clock size={11} className="text-amber-600" />
                                {c.pendingRequestedExpiryDate ? "Chờ duyệt gia hạn" : "Chờ duyệt cấp mới"}
                              </span>
                            ) : c.approvalStatus === "REJECTED" ? (
                              <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                <X size={11} className="text-rose-700" /> Bị từ chối
                              </span>
                            ) : c.status === "EXPIRED" ? (
                              <span className="bg-rose-50 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                <AlertTriangle size={11} className="text-rose-600" /> Đã hết hạn
                              </span>
                            ) : c.status === "EXPIRING_SOON" ? (
                              <span className="bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                <AlertTriangle size={11} className="text-amber-600" /> Sắp hết hạn
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                <Check size={11} className="text-emerald-700" /> Đang có hiệu lực
                              </span>
                            )}
                          </td>

                          {/* Minh Chứng */}
                          <td className="py-3.5 px-4">
                            {c.pendingProofImage ? (
                              <button
                                type="button"
                                onClick={() => setViewingProofImage(c.pendingProofImage ?? null)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Eye size={11} /> Xem ảnh hồ sơ
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">Không có ảnh</span>
                            )}
                          </td>

                          {/* Thao Tác Admin */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCertDecisionTarget({ cert: c, action: "approve" });
                                      setCertApprovedExpiryDate(c.pendingRequestedExpiryDate || "");
                                      setCertApprovedNumber(c.pendingNewCertNumber || c.certNumber);
                                      setCertDecisionNote("Hồ sơ đánh giá lại đạt chuẩn VietGAP/GlobalGAP. Phê duyệt gia hạn hiệu lực thêm 1 năm.");
                                    }}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                    title="Phê duyệt gia hạn chứng chỉ"
                                  >
                                    <Check size={12} /> Duyệt
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCertDecisionTarget({ cert: c, action: "reject" });
                                      setCertDecisionNote("Hồ sơ kiểm định chưa đạt chuẩn an toàn hoặc thiếu chữ ký xác nhận của đơn vị đánh giá.");
                                    }}
                                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Từ chối gia hạn"
                                  >
                                    <X size={12} /> Từ chối
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCertDecisionTarget({ cert: c, action: "approve" });
                                    setCertApprovedExpiryDate("");
                                    setCertApprovedNumber(c.certNumber);
                                    setCertDecisionNote("Cập nhật gia hạn thủ công thời hạn hiệu lực mới.");
                                  }}
                                  className="px-2.5 py-1 text-emerald-700 hover:text-emerald-800 text-[11px] font-semibold underline cursor-pointer"
                                >
                                  Cấp hạn mới
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteAdminCert(c.certNumber, c.name)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                                title="Xóa chứng nhận này khỏi hệ thống"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Modal Phê Duyệt / Từ Chối Chứng Nhận Của Admin */}
          {certDecisionTarget && (
            <div
              onClick={() => setCertDecisionTarget(null)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs cursor-pointer animate-in fade-in duration-200"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden cursor-default"
              >
                <div
                  className={`px-5 py-4 flex items-center justify-between text-white ${
                    certDecisionTarget.action === "approve" ? "bg-emerald-950" : "bg-rose-950"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {certDecisionTarget.action === "approve" ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <AlertCircle size={18} className="text-rose-400" />
                    )}
                    <h3 className="text-sm font-bold">
                      {certDecisionTarget.action === "approve"
                        ? "✅ Phê Duyệt Hiệu Lực Chứng Nhận Nông Trại"
                        : "❌ Từ Chối Hồ Sơ Chứng Nhận"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setCertDecisionTarget(null)}
                    className="text-gray-300 hover:text-white p-1 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  {/* Tóm tắt chứng chỉ */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-800 text-xs">
                        #{certDecisionTarget.cert.certNumber}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Nông trại: <strong>{certDecisionTarget.cert.farmName}</strong>
                      </span>
                    </div>
                    <div className="font-bold text-gray-900 text-xs">
                      {certDecisionTarget.cert.name}
                    </div>
                    <div className="text-[11px] text-gray-600">
                      Hạn cũ: <span className="text-rose-600 font-bold">{certDecisionTarget.cert.expiryDate}</span>
                      {certDecisionTarget.cert.pendingRequestedExpiryDate && (
                        <span>
                          {" "}
                          → Đề xuất hạn mới:{" "}
                          <strong className="text-emerald-700 font-bold">
                            {certDecisionTarget.cert.pendingRequestedExpiryDate}
                          </strong>
                        </span>
                      )}
                    </div>
                    {certDecisionTarget.cert.pendingNote && (
                      <div className="text-[10px] text-gray-500 italic bg-white p-2 rounded border border-gray-100">
                        Lời nhắn của nông trại: &ldquo;{certDecisionTarget.cert.pendingNote}&rdquo;
                      </div>
                    )}
                  </div>

                  {certDecisionTarget.action === "approve" && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                          Số hiệu chứng chỉ mới:
                        </label>
                        <input
                          type="text"
                          value={certApprovedNumber}
                          onChange={(e) => setCertApprovedNumber(e.target.value)}
                          placeholder="Số hiệu chứng chỉ..."
                          className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-800 outline-none focus:border-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                          Ngày hết hạn hiệu lực mới:
                        </label>
                        <input
                          type="text"
                          value={certApprovedExpiryDate}
                          onChange={(e) => setCertApprovedExpiryDate(e.target.value)}
                          placeholder="dd/MM/yyyy (VD: 25/11/2027)"
                          className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-800 outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 text-xs">
                      Nhận xét thẩm định của Ban Quản Trị / Admin: *
                    </label>
                    <textarea
                      rows={3}
                      value={certDecisionNote}
                      onChange={(e) => setCertDecisionNote(e.target.value)}
                      placeholder="Nhập nhận xét phê duyệt gia hạn hoặc lý do từ chối..."
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-800 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setCertDecisionTarget(null)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingCertDecision}
                      onClick={handleConfirmCertDecision}
                      className={`px-4 py-2 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 ${
                        certDecisionTarget.action === "approve"
                          ? "bg-[#1a7a3a] hover:bg-[#14622e]"
                          : "bg-rose-600 hover:bg-rose-700"
                      }`}
                    >
                      {isSubmittingCertDecision ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : certDecisionTarget.action === "approve" ? (
                        <Check size={13} />
                      ) : (
                        <X size={13} />
                      )}
                      {certDecisionTarget.action === "approve"
                        ? "Xác Nhận Phê Duyệt Gia Hạn"
                        : "Xác Nhận Từ Chối"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Xem Ảnh Minh Chứng Đính Kèm */}
          {viewingProofImage && (
            <div
              onClick={() => setViewingProofImage(null)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs cursor-pointer animate-in fade-in"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl p-4 space-y-3 cursor-default"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <FileCheck size={14} className="text-[#1a7a3a]" /> Hồ Sơ Giấy Kiểm Định Minh Chứng
                  </span>
                  <button onClick={() => setViewingProofImage(null)} className="text-gray-400 hover:text-gray-700">
                    <X size={16} />
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-200 max-h-[70vh]">
                  <img
                    src={viewingProofImage}
                    alt="Hồ sơ chứng nhận"
                    className="w-full h-auto object-contain max-h-[65vh]"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setViewingProofImage(null)}
                    className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 font-bold text-xs rounded-xl text-gray-800"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: QUẢN LÝ ĐƠN HÀNG (MEMBER 4 - UC-21, UC-22)           */}
      {/* ========================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-6 animate-fade-in">
          {/* Order KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard label="Tổng đơn hàng" value={orders.length} helper="Tất cả đơn trên hệ thống" icon={Package} />
            <AdminStatCard label="Đang xử lý / giao" value={orders.filter((o) => ["PAID", "CONFIRMED", "SHIPPING"].includes(String(o.status).toUpperCase())).length} helper="Đơn đang trong quy trình vận hành" icon={Truck} tone="primary" />
            <AdminStatCard label="Đã đóng quy trình" value={orders.filter((o) => ["DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED"].includes(String(o.status).toUpperCase())).length} helper="Hoàn tất, hủy hoặc hoàn tiền" icon={CheckCircle2} tone="success" />
            <AdminStatCard label="Doanh thu ghi nhận" value={`${totalRevenue.toLocaleString("vi-VN")} đ`} helper="COD + VietQR 24/7" icon={DollarSign} tone="warning" />
          </div>

          {/* Filter & Search Bar */}
          <div className="bento-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white border border-stone-200/90 shadow-2xs rounded-2xl">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm mã đơn (#AGRI-...), tên khách, SĐT hoặc email…"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/60 py-2 pl-9 pr-4 text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15 transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  { key: "ALL", label: "Tất cả" },
                  {
                    key: "PENDING_APPROVAL",
                    label: `⚡ Chờ duyệt VietQR (${orders.filter((o) => o.status === "PENDING_PAYMENT" && o.paymentRef === "PENDING_ADMIN_APPROVAL").length})`,
                  },
                  { key: "CONFIRMED", label: "Chờ lấy hàng" },
                  { key: "SHIPPING", label: "Đang giao" },
                  { key: "DELIVERED", label: "Đã giao" },
                  { key: "CANCELLED", label: "Đã hủy" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setOrderFilter(f.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                    orderFilter === f.key
                      ? "bg-[#16261E] text-white shadow-2xs font-bold"
                      : f.key === "PENDING_APPROVAL" && orders.some((o) => o.status === "PENDING_PAYMENT" && o.paymentRef === "PENDING_ADMIN_APPROVAL")
                      ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold hover:bg-amber-200"
                      : "bg-[#F3EFE6] text-stone-600 hover:text-stone-900 hover:bg-[#EAE5D9]"
                  )}
                >
                  {f.label}
                </button>
              ))}
              <button
                onClick={fetchOrders}
                className="p-2 rounded-xl bg-[#F3EFE6] hover:bg-[#EAE5D9] text-stone-700 text-xs transition-colors shrink-0 cursor-pointer shadow-2xs"
                title="Làm mới danh sách đơn hàng"
                aria-label="Làm mới danh sách đơn hàng"
              >
                <RefreshCw size={14} className={ordersLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bento-card overflow-hidden border border-stone-200/90 shadow-2xs rounded-2xl bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-stone-200/80 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-2 font-bold">Mã đơn & Ngày</th>
                    <th className="py-2.5 px-2 font-bold">Khách hàng</th>
                    <th className="py-2.5 px-2 font-bold">Tổng tiền</th>
                    <th className="py-2.5 px-2 font-bold">Thanh toán</th>
                    <th className="py-2.5 px-2 font-bold">Trạng thái</th>
                    <th className="py-2.5 px-2 text-right font-bold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-stone-400">
                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-emerald-700" />
                        Đang đồng bộ danh sách đơn hàng từ hệ thống…
                      </td>
                    </tr>
                  ) : ordersError ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-red-600">
                        Không thể tải đơn hàng.{" "}
                        <button className="font-semibold underline cursor-pointer" onClick={fetchOrders}>
                          Thử lại
                        </button>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-stone-400">
                        <Package size={24} className="mx-auto mb-2 text-stone-300" />
                        Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isQR = (order.paymentMethod || "COD").toUpperCase() === "PAYOS";
                      const isPaid =
                        order.status === "DELIVERED" ||
                        order.status === "COMPLETED" ||
                        !!order.paidAt ||
                        (isQR && order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED");
                      const isPendingApproval =
                        order.status === "PENDING_PAYMENT" && order.paymentRef === "PENDING_ADMIN_APPROVAL";
                      const isCancelled = order.status === "CANCELLED";

                      return (
                        <tr key={order.orderCode} className="hover:bg-emerald-50/20 transition-colors">
                          {/* Mã đơn & Ngày đặt */}
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="font-mono font-bold text-xs text-stone-900">
                                #{order.orderCode}
                              </span>
                              {order.lotCode && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[9.5px] font-mono font-semibold border border-emerald-200/60">
                                  {order.lotCode}
                                </span>
                              )}
                            </div>
                            <div className="text-[10.5px] text-stone-400 font-medium mt-0.5 flex items-center gap-1 whitespace-nowrap">
                              <Clock size={10} className="text-stone-400 shrink-0" />
                              <span>{formatCompactDateTime(order.createdAt)}</span>
                            </div>
                          </td>

                          {/* Khách hàng */}
                          <td className="py-2 px-2">
                            <div className="font-bold text-xs text-stone-900 leading-tight truncate max-w-[130px]">
                              {order.receiverName || "Khách vãng lai"}
                            </div>
                            <div className="text-[10.5px] text-stone-500 mt-0.5 truncate max-w-[130px]" title={order.receiverAddress}>
                              <span className="font-mono text-stone-600">{order.receiverPhone}</span>
                            </div>
                          </td>

                          {/* Tổng tiền */}
                          <td className="py-2 px-2 whitespace-nowrap">
                            <div className="font-mono font-bold text-xs text-stone-900">
                              {(order.total || 0).toLocaleString("vi-VN")} đ
                            </div>
                            {order.discount ? (
                              <div className="text-[9.5px] font-semibold text-emerald-700 mt-0.5">
                                Giảm -{(order.discount).toLocaleString("vi-VN")}đ
                              </div>
                            ) : (
                              <div className="text-[9.5px] text-stone-400 mt-0.5">
                                {order.items?.length || 1} món nông sản
                              </div>
                            )}
                          </td>

                          {/* Thanh toán (Unified, Clean) */}
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1 flex-wrap">
                              {isCancelled ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-stone-100 text-stone-500 border border-stone-200">
                                  Đã hủy
                                </span>
                              ) : isPendingApproval ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                                  <Clock size={9} className="text-amber-600" />
                                  Chờ duyệt CK
                                </span>
                              ) : isPaid ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                                  <CheckCircle2 size={9} className="text-emerald-600" />
                                  {isQR ? "VietQR" : "COD"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                                  <Clock size={9} className="text-amber-600" />
                                  {isQR ? "Chưa TT" : "Thu COD"}
                                </span>
                              )}

                              {order.voucherUsed && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-mono font-bold whitespace-nowrap" title={`Mã voucher: ${order.voucherUsed}`}>
                                  🎟️ {order.voucherUsed.replace(/\s*\([^)]*\)/g, "").trim()}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Trạng thái đơn hàng */}
                          <td className="py-2 px-2 whitespace-nowrap">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 shadow-2xs",
                                order.status === "DELIVERED" || order.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : order.status === "SHIPPING"
                                  ? "bg-sky-50 text-sky-800 border-sky-200"
                                  : order.status === "CANCELLED" || order.status === "REFUNDED"
                                  ? "bg-stone-100 text-stone-600 border-stone-200"
                                  : order.status === "PAID"
                                  ? "bg-teal-50 text-teal-800 border-teal-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              )}
                            >
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  order.status === "DELIVERED" || order.status === "COMPLETED"
                                    ? "bg-emerald-600"
                                    : order.status === "SHIPPING"
                                    ? "bg-sky-600 animate-pulse"
                                    : order.status === "CANCELLED" || order.status === "REFUNDED"
                                    ? "bg-stone-400"
                                    : order.status === "PAID"
                                    ? "bg-teal-600"
                                    : "bg-amber-500"
                                )}
                              />
                              <span>{orderStatusLabel(order.status)}</span>
                            </span>
                          </td>

                          {/* Thao tác */}
                          <td className="py-2 px-2 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1">
                              {isPendingApproval && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => void handleApproveTransfer(order.orderCode)}
                                    className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] transition-colors shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                                    title="Duyệt đơn khách đã chuyển khoản"
                                  >
                                    <Check size={11} />
                                    <span>Duyệt</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleRejectTransfer(order.orderCode)}
                                    className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] transition-colors cursor-pointer"
                                    title="Từ chối vì chưa nhận được tiền"
                                  >
                                    <X size={11} />
                                  </button>
                                </>
                              )}

                              {!isPendingApproval &&
                                (order.allowedNextStatuses ?? [])
                                  .filter((status) => status !== "CANCELLED")
                                  .slice(0, 1)
                                  .map((status) => (
                                    <button
                                      key={status}
                                      type="button"
                                      onClick={() => void handleUpdateOrderStatus(order.orderCode, status)}
                                      className="px-2 py-1 rounded-lg bg-[#16261E] hover:bg-emerald-900 text-white font-bold text-[11px] transition-colors shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                                    >
                                      <span>{orderNextActionLabel(status)}</span>
                                      <ArrowRight size={10} />
                                    </button>
                                  ))}

                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="px-2 py-1 rounded-lg border border-stone-300 hover:border-emerald-600 hover:bg-emerald-50/50 bg-white text-stone-700 hover:text-emerald-950 font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Xem chi tiết đơn hàng"
                              >
                                <Eye size={11} />
                                <span>Chi tiết</span>
                              </button>

                              {(order.allowedNextStatuses ?? []).includes("CANCELLED") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Hủy đơn #${order.orderCode}? Tồn kho sẽ được hoàn và điểm thưởng của khách bị thu hồi.`
                                      )
                                    ) {
                                      void handleUpdateOrderStatus(order.orderCode, "CANCELLED");
                                    }
                                  }}
                                  className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Hủy đơn hàng này"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clean Order Detail Drawer */}
          {selectedOrder && (
            <div
              className="fixed inset-0 z-[60] flex justify-end bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200"
              role="presentation"
              onClick={() => setSelectedOrder(null)}
            >
              <aside
                role="dialog"
                aria-modal="true"
                aria-label="Chi tiết đơn hàng"
                onClick={(e) => e.stopPropagation()}
                className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-250"
              >
                {/* Drawer Header */}
                <div className="p-5 bg-gradient-to-r from-[#0B251B] to-[#123E2F] text-white flex items-center justify-between shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        VẬN HÀNH ĐƠN HÀNG
                      </span>
                      <span className="text-xs text-emerald-200/80">
                        {formatCompactDateTime(selectedOrder.createdAt)}
                      </span>
                    </div>
                    <h3 className="mt-1 font-mono text-xl font-extrabold text-white">
                      #{selectedOrder.orderCode}
                    </h3>
                  </div>
                  <button
                    aria-label="Đóng chi tiết đơn hàng"
                    onClick={() => setSelectedOrder(null)}
                    className="rounded-xl p-2 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="p-6 space-y-6 flex-1 text-xs">
                  {/* Status & Payment Banner */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-stone-400">Trạng thái hiện tại</div>
                      <div className="mt-1 font-bold text-sm text-[#16261E] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        {orderStatusLabel(selectedOrder.status)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-stone-400">Hình thức thanh toán</div>
                      <div className="mt-1 font-bold text-xs text-stone-800">
                        {(selectedOrder.paymentMethod || "COD").toUpperCase() === "PAYOS" ? "VietQR 24/7" : "Tiền mặt (COD)"}
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <Users size={14} className="text-emerald-700" />
                      <span>Thông tin người nhận</span>
                    </h4>
                    <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Họ và tên:</span>
                        <span className="font-bold text-stone-900">{selectedOrder.receiverName || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Số điện thoại:</span>
                        <span className="font-mono font-bold text-stone-900">{selectedOrder.receiverPhone || "—"}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-stone-500 shrink-0">Địa chỉ giao:</span>
                        <span className="font-medium text-stone-800 text-right">{selectedOrder.receiverAddress || "—"}</span>
                      </div>
                      {selectedOrder.deliverySlot && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Khung giờ:</span>
                          <span className="font-semibold text-emerald-800">{selectedOrder.deliverySlot}</span>
                        </div>
                      )}
                      {selectedOrder.deliveryNote && (
                        <div className="flex items-start justify-between gap-4 pt-1.5 border-t border-stone-100">
                          <span className="text-stone-500 shrink-0">Ghi chú giao:</span>
                          <span className="italic text-stone-600 text-right">{selectedOrder.deliveryNote}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Products In Order */}
                  {selectedOrder.items && selectedOrder.items.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                        <Package size={14} className="text-emerald-700" />
                        <span>Danh sách nông sản ({selectedOrder.items.length})</span>
                      </h4>
                      <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white overflow-hidden">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-bold text-stone-900 text-xs">{item.name}</div>
                              <div className="text-[10px] text-stone-500 mt-0.5">
                                {item.origin && <span>{item.origin} · </span>}
                                {item.cert && <span className="text-emerald-700 font-semibold">{item.cert} · </span>}
                                <span>SL: {item.qty}</span>
                              </div>
                            </div>
                            <div className="font-mono font-bold text-stone-900 shrink-0">
                              {(item.price || 0).toLocaleString("vi-VN")} đ
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Financial Breakdown */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <DollarSign size={14} className="text-emerald-700" />
                      <span>Chi tiết thanh toán</span>
                    </h4>
                    <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between text-stone-500">
                        <span>Tạm tính tiền hàng:</span>
                        <span className="font-mono">{((selectedOrder.subtotal || selectedOrder.total || 0)).toLocaleString("vi-VN")} đ</span>
                      </div>
                      {selectedOrder.shippingFee ? (
                        <div className="flex items-center justify-between text-stone-500">
                          <span>Phí ship xe lạnh:</span>
                          <span className="font-mono">{selectedOrder.shippingFee.toLocaleString("vi-VN")} đ</span>
                        </div>
                      ) : null}
                      {selectedOrder.discount ? (
                        <div className="flex items-center justify-between text-emerald-700 font-semibold">
                          <span>Voucher giảm giá {selectedOrder.voucherUsed ? `(${selectedOrder.voucherUsed})` : ""}:</span>
                          <span className="font-mono">-{(selectedOrder.discount).toLocaleString("vi-VN")} đ</span>
                        </div>
                      ) : null}
                      <div className="pt-2 border-t border-stone-100 flex items-baseline justify-between">
                        <span className="font-bold text-stone-900 text-sm">Tổng thanh toán:</span>
                        <span className="font-mono font-extrabold text-base text-[#166534]">
                          {(selectedOrder.total || 0).toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 font-bold text-stone-700 transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>

                  {/* Next Status Transitions inside Drawer */}
                  {(selectedOrder.allowedNextStatuses ?? [])
                    .filter((st) => st !== "CANCELLED")
                    .map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={async () => {
                          await handleUpdateOrderStatus(selectedOrder.orderCode, st);
                          setSelectedOrder((prev) => (prev ? { ...prev, status: st as any } : null));
                        }}
                        className="px-4 py-2 rounded-xl bg-[#16261E] hover:bg-emerald-900 text-white font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>{orderNextActionLabel(st)}</span>
                        <ArrowRight size={13} />
                      </button>
                    ))}
                </div>
              </aside>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: QUẢN LÝ KHO VOUCHER (MEMBER 4 - UC-23)               */}
      {/* ========================================================= */}
      {activeTab === "vouchers" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateVoucherModal(true)}
              className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus size={16} />
              <span>Tạo voucher</span>
            </button>
          </div>

          {/* Vouchers Table */}
          <div className="bento-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5">Mã Voucher (Code)</th>
                    <th className="p-3.5">Tiêu đề & Mô tả</th>
                    <th className="p-3.5">Mức giảm</th>
                    <th className="p-3.5">Đơn tối thiểu</th>
                    <th className="p-3.5">Hạn dùng</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vouchersLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                        Đang tải danh sách voucher…
                      </td>
                    </tr>
                  ) : vouchers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                        Chưa có voucher nào trong hệ thống. Bấm nút Tạo Voucher Mới để khởi tạo.
                      </td>
                    </tr>
                  ) : (
                    vouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-gray-900 text-sm">
                          <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                            {v.code}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-gray-900">{v.title}</div>
                          <div className="text-[11px] text-gray-500">{v.description}</div>
                        </td>
                        <td className="p-3.5 font-extrabold text-emerald-700">
                          {v.discount} {v.discount?.includes("%") ? "" : "đ"}
                        </td>
                        <td className="p-3.5 text-gray-600">
                          {v.minOrder} {v.minOrder?.includes("đ") || v.minOrder?.includes("k") ? "" : "đ"}
                        </td>
                        <td className="p-3.5 text-gray-500">{v.exp}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleVoucher(v.id)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors duration-200",
                              v.active
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                            )}
                          >
                            {v.active ? "Đang chạy" : "Tạm dừng"}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleVoucher(v.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-gray-100 transition-colors"
                              title="Bật/Tắt hoạt động"
                            >
                              <Power size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteVoucher(v.id, v.code)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Xóa voucher"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: QUẢN LÝ HỘI VIÊN AGRICLUB (MEMBER 4 - UC-24)         */}
      {/* ========================================================= */}
      {activeTab === "loyalty" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-end">
            <button
              onClick={fetchMembers}
              className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <RefreshCw size={14} className={membersLoading ? "animate-spin" : ""} />
              <span>Cập nhật danh sách</span>
            </button>
          </div>

          {/* Members Table */}
          <div className="bento-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5">Khách hàng & Liên hệ</th>
                    <th className="p-3.5">Hạng Thẻ (Tier)</th>
                    <th className="p-3.5">Điểm khả dụng</th>
                    <th className="p-3.5">Điểm trọn đời</th>
                    <th className="p-3.5">Tổng chi tiêu</th>
                    <th className="p-3.5 text-right">Thao tác Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {membersLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        Đang tải danh sách hội viên…
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        Chưa có hội viên nào trong cơ sở dữ liệu.
                      </td>
                    </tr>
                  ) : (
                    members.map((m) => {
                      const tier = m.tier?.toUpperCase() || "BRONZE";
                      return (
                        <tr key={m.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-gray-900">{m.user?.fullName}</div>
                            <div className="text-[11px] text-gray-500">{m.user?.email}</div>
                            {m.user?.phone && (
                              <div className="text-[11px] text-gray-400">SĐT: {m.user.phone}</div>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1",
                                tier === "DIAMOND"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : tier === "GOLD"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : tier === "SILVER"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              )}
                            >
                              <Crown size={12} />
                              Hạng {tier}
                            </span>
                          </td>
                          <td className="p-3.5 font-black text-emerald-700 text-sm">
                            {m.currentPoints} điểm
                          </td>
                          <td className="p-3.5 text-gray-600 font-semibold">
                            {m.lifetimePoints} điểm
                          </td>
                          <td className="p-3.5 font-bold text-gray-900">
                            {(m.totalSpent || 0).toLocaleString("vi-VN")} đ
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedMember(m);
                                setShowBonusModal(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                            >
                              <Award size={13} />
                              <span>Tặng Điểm VIP</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: QUẢN LÝ SỰ KIỆN & MÙA VỤ KHUYẾN MÃI (EVENTS)        */}
      {/* ========================================================= */}
      {activeTab === "events" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex rounded-lg border border-border bg-card p-1" aria-label="Kiểu hiển thị sự kiện">
                <button type="button" aria-label="Hiển thị dạng bảng" aria-pressed={eventView === "table"} onClick={() => setEventView("table")} className={cn("rounded-md p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", eventView === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><List aria-hidden="true" size={15} /></button>
                <button type="button" aria-label="Hiển thị dạng thẻ" aria-pressed={eventView === "cards"} onClick={() => setEventView("cards")} className={cn("rounded-md p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", eventView === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><LayoutGrid aria-hidden="true" size={15} /></button>
              </div>
              <Link
                href="/events"
                target="_blank"
                className="flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Eye size={14} />
                <span>Xem Trang Khách Hàng</span>
              </Link>
              <button
                onClick={handleOpenAddEvent}
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Plus size={16} />
                <span>Thêm sự kiện</span>
              </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <AdminStatCard label="Tổng chiến dịch" value={campaignStats.total} helper="Tất cả chiến dịch đã cấu hình" icon={CalendarDays} />
            <AdminStatCard label="Đang diễn ra" value={campaignStats.active} helper="Ưu đãi đang có hiệu lực" icon={Activity} tone="success" />
            <AdminStatCard label="Sắp diễn ra" value={campaignStats.upcoming} helper="Đang chờ đến ngày bắt đầu" icon={Clock} tone="primary" />
            <AdminStatCard label="Đã kết thúc" value={campaignStats.expired} helper="Đã ngừng áp dụng ưu đãi" icon={CheckCircle2} />
          </div>

          {/* Filter & Search */}
          <div className="bento-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, loại mùa vụ, voucher hoặc nông sản…"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-gray-400 font-semibold shrink-0">Trạng thái:</span>
              {(
                [
                  { key: "all", label: "Tất cả" },
                  { key: "active", label: "Đang diễn ra" },
                  { key: "upcoming", label: "Sắp tới" },
                  { key: "expired", label: "Đã kết thúc" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setEventFilter(f.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                    eventFilter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bảng sự kiện có độ rộng cột ổn định, tránh ép chữ và lệch hàng */}
          <div className={cn("grid gap-4 lg:grid-cols-2", eventView === "table" && "md:hidden")}>
            {filteredCampaigns.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center lg:col-span-2"><CalendarDays aria-hidden="true" className="mx-auto text-muted-foreground" size={28} /><h3 className="mt-3 text-sm font-semibold">Không tìm thấy sự kiện</h3><p className="mt-1 text-xs text-muted-foreground">Thay đổi từ khóa, bộ lọc hoặc tạo sự kiện mới.</p></div>}
            {filteredCampaigns.map((campaign) => {
              const status = getCampaignStatus(campaign);
              return <article key={campaign.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">
                <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-orange-500" />
                <div className="p-5"><div className="flex items-start gap-3"><span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-2xl">{campaign.bannerIcon || "🌾"}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="min-w-0 text-base font-bold leading-6 text-foreground">{campaign.title}</h3><span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", campaign.typeColor)}>{campaign.typeLabel}</span></div><p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">/{campaign.slug}</p></div></div><p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{campaign.description || "Chưa có mô tả sự kiện."}</p><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-muted/60 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Thời gian</p><p className="mt-1 text-xs font-semibold tabular-nums">{new Intl.DateTimeFormat("vi-VN").format(new Date(`${campaign.startDate}T00:00:00`))} – {new Intl.DateTimeFormat("vi-VN").format(new Date(`${campaign.endDate}T00:00:00`))}</p></div><div className="rounded-xl bg-emerald-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Ưu đãi</p><p className="mt-1 text-lg font-black tabular-nums text-emerald-800">-{campaign.discountPercent}%</p></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold", !campaign.active ? "border-amber-200 bg-amber-50 text-amber-800" : status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : status === "upcoming" ? "border-blue-200 bg-blue-50 text-blue-800" : "border-border bg-muted text-muted-foreground")}>{!campaign.active ? "Tạm dừng" : status === "active" ? "Đang diễn ra" : status === "upcoming" ? "Sắp diễn ra" : "Đã kết thúc"}</span><div className="flex gap-1"><button type="button" onClick={() => handleToggleEvent(campaign.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`${campaign.active ? "Tạm dừng" : "Bật"} ${campaign.title}`}><Power aria-hidden="true" size={15} /></button><button type="button" onClick={() => handleOpenEditEvent(campaign)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Chỉnh sửa ${campaign.title}`}><Edit aria-hidden="true" size={15} /></button><button type="button" onClick={() => handleDeleteEvent(campaign.id, campaign.title)} className="rounded-lg p-2 text-danger hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger" aria-label={`Xóa ${campaign.title}`}><Trash2 aria-hidden="true" size={15} /></button></div></div></div>
              </article>;
            })}
          </div>

          <div className={cn("overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs", eventView !== "table" ? "hidden" : "hidden md:block")}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] table-fixed text-left text-xs">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[12%]" />
                  <col className="w-[17%]" />
                  <col className="w-[15%]" />
                  <col className="w-[14%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                </colgroup>
                <thead className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold uppercase leading-4 tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-3.5">Sự kiện</th>
                    <th className="px-4 py-3.5">Phân loại</th>
                    <th className="px-4 py-3.5">Thời gian</th>
                    <th className="px-4 py-3.5">Ưu đãi</th>
                    <th className="px-4 py-3.5">Phạm vi áp dụng</th>
                    <th className="px-3 py-3.5 text-center">Hiển thị</th>
                    <th className="px-3 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 align-top">
                  {filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                        Không tìm thấy sự kiện nào phù hợp với bộ lọc. Bấm &quot;+ Thêm Sự Kiện Mới&quot; để tạo.
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((c) => {
                      const status = getCampaignStatus(c);
                      return (
                        <tr key={c.id} className="transition-colors hover:bg-gray-50/70">
                          <td className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-2xl">
                                {c.bannerIcon || "🌾"}
                              </span>
                              <div className="min-w-0">
                                <div className="text-sm font-bold leading-5 text-gray-950">{c.title}</div>
                                <div className="mt-0.5 truncate font-mono text-[10px] text-gray-400">/{c.slug}</div>
                                <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-gray-500">
                                  {c.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold leading-4", c.typeColor)}>
                              {c.typeLabel}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-0.5 font-mono text-[11px] leading-4 text-gray-700">
                              <div>Từ {new Date(`${c.startDate}T00:00:00`).toLocaleDateString("vi-VN")}</div>
                              <div>đến {new Date(`${c.endDate}T00:00:00`).toLocaleDateString("vi-VN")}</div>
                            </div>
                            <div className="mt-2">
                              {!c.active ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Tạm dừng
                                </span>
                              ) : status === "active" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                  Đang diễn ra
                                </span>
                              ) : status === "upcoming" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                  Sắp diễn ra
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-300">
                                  Đã kết thúc
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-base font-extrabold text-rose-600">
                              -{c.discountPercent}%
                              {c.discountAmount ? (
                                <span className="text-[11px] font-normal text-gray-500 ml-1">
                                  (~{c.discountAmount.toLocaleString("vi-VN")} đ)
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1">
                              <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold leading-4 text-emerald-800">
                                Trừ trực tiếp vào giá
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium leading-5 text-gray-700">
                              {c.targetType === "all"
                                ? "Toàn bộ danh mục nông sản"
                                : c.targetProductNames && c.targetProductNames.length > 0
                                ? c.targetProductNames.join(", ")
                                : c.targetCategoryCodes?.join(", ") || "Chung"}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <button
                              onClick={() => handleToggleEvent(c.id)}
                              className={cn(
                                "inline-flex min-w-[64px] justify-center rounded-full px-2.5 py-1.5 text-[10px] font-bold leading-4 transition-colors duration-200",
                                c.active
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                              )}
                            >
                              {c.active ? "Đang bật" : "Tạm dừng"}
                            </button>
                          </td>
                          <td className="px-3 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditEvent(c)}
                                aria-label={`Chỉnh sửa sự kiện ${c.title}`}
                                className="rounded-lg bg-gray-100 p-2 text-gray-700 transition-colors hover:bg-gray-200"
                                title="Chỉnh sửa sự kiện"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEvent(c.id, c.title)}
                                aria-label={`Xóa sự kiện ${c.title}`}
                                className="rounded-lg bg-red-50 p-2 text-red-700 transition-colors hover:bg-red-100"
                                title="Xóa sự kiện"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: QUẢN TRỊ BÀI VIẾT BLOG & CẨM NANG NÔNG NGHIỆP        */}
      {/* ========================================================= */}
      {activeTab === "blog" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-wrap items-center justify-end gap-2">
              <Link
                href="/blog"
                target="_blank"
                className="flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Eye size={14} />
                <span>Xem Trang Blog</span>
              </Link>
              <button
                onClick={handleOpenAddBlog}
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Plus size={16} />
                <span>Viết bài mới</span>
              </button>
          </div>

          {/* Filter & Search */}
          <div className="bento-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tiêu đề, tác giả hoặc nội dung…"
                value={blogSearch}
                onChange={(e) => setBlogSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-gray-400 font-semibold shrink-0">Chuyên mục:</span>
              {(
                [
                  { key: "all", label: "Tất cả" },
                  { key: "season", label: "Mùa vụ & QĐ" },
                  { key: "ai", label: "Công nghệ AI" },
                  { key: "standard", label: "Tiêu chuẩn VietGAP" },
                  { key: "guide", label: "Cẩm nang" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setBlogFilter(f.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                    blogFilter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blog Table */}
          <div className="bento-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5">Tiêu đề & Tóm tắt</th>
                    <th className="p-3.5">Chuyên mục</th>
                    <th className="p-3.5">Tác giả & Ngày đăng</th>
                    <th className="p-3.5">Sản phẩm gắn kèm</th>
                    <th className="p-3.5 text-center">Trạng thái</th>
                    <th className="p-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBlogPosts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        Chưa có bài viết nào phù hợp. Bấm &quot;+ Viết Bài Mới&quot; để tạo.
                      </td>
                    </tr>
                  ) : (
                    filteredBlogPosts.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-3.5 max-w-md">
                          <div className="font-bold text-gray-900 text-sm line-clamp-1 flex items-center gap-2">
                            {p.featured && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                                Nổi bật
                              </span>
                            )}
                            {p.title}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono">/{p.slug}</div>
                          <div className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                            {p.excerpt}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {p.categoryLabel}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-gray-800">{p.author}</div>
                          <div className="text-[10px] text-gray-400">{p.authorRole}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {p.date} · {p.readTime}
                          </div>
                        </td>
                        <td className="p-3.5">
                          {p.relatedProductName ? (
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px] font-semibold">
                              {p.relatedProductName}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleToggleBlog(p.id)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors duration-200",
                              p.active
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                            )}
                          >
                            {p.active ? "Hiển thị" : "Tạm ẩn"}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditBlog(p)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                              title="Chỉnh sửa bài viết"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteBlog(p.id, p.title)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                              title="Xóa bài viết"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {showCreateVoucherModal && (
        <div onClick={() => setShowCreateVoucherModal(false)} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in cursor-pointer">
          <form
            onSubmit={handleCreateVoucher}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Ticket className="text-red-700" size={20} />
                <h3 className="font-bold text-gray-900 text-base">Tạo Mã Voucher Khuyến Mãi Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateVoucherModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mã Code (In hoa):</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: AGRITET2026, FREESHIP30…"
                  value={newVoucher.code}
                  onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 uppercase font-mono font-bold outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tiêu đề hiển thị:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giảm 30.000 đ cho đơn hàng rau củ…"
                  value={newVoucher.title}
                  onChange={(e) => setNewVoucher({ ...newVoucher, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Mức giảm (VNĐ hoặc %):</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 30000 hoặc 15%"
                    value={newVoucher.discount}
                    onChange={(e) => setNewVoucher({ ...newVoucher, discount: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Đơn tối thiểu (VNĐ):</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 150000"
                    value={newVoucher.minOrder}
                    onChange={(e) => setNewVoucher({ ...newVoucher, minOrder: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Hạn sử dụng:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 31/12/2026"
                    value={newVoucher.exp}
                    onChange={(e) => setNewVoucher({ ...newVoucher, exp: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Badge nhãn dán:</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: GIẢM 30K, FREESHIP"
                    value={newVoucher.badge}
                    onChange={(e) => setNewVoucher({ ...newVoucher, badge: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mô tả chi tiết:</label>
                <textarea
                  rows={2}
                  value={newVoucher.description}
                  onChange={(e) => setNewVoucher({ ...newVoucher, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowCreateVoucherModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Lưu & Phát Hành Voucher
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TẶNG ĐIỂM THƯỞNG VIP CHO HỘI VIÊN                   */}
      {/* ========================================================= */}
      {showBonusModal && selectedMember && (
        <div onClick={() => setShowBonusModal(false)} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in cursor-pointer">
          <form
            onSubmit={handleSendBonus}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Award className="text-amber-600" size={20} />
                <h3 className="font-bold text-gray-900 text-base">Tặng Điểm Thưởng VIP</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBonusModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1">
              <div>
                Khách hàng: <strong>{selectedMember.user?.fullName}</strong>
              </div>
              <div>Email: {selectedMember.user?.email}</div>
              <div>
                Hạng hiện tại: <strong>{selectedMember.tier}</strong> · Điểm khả dụng:{" "}
                <strong>{selectedMember.currentPoints} điểm</strong>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Số điểm thưởng (+ để cộng, - để trừ):
                </label>
                <input
                  type="number"
                  required
                  value={bonusPoints}
                  onChange={(e) => setBonusPoints(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-sm outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Lý do điều chỉnh điểm:</label>
                <input
                  type="text"
                  required
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowBonusModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md"
              >
                Xác Nhận Tặng Điểm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM / CHỈNH SỬA SỰ KIỆN MÙA VỤ (CAMPAIGN/EVENT)    */}
      {/* ========================================================= */}
      {showEventModal && (
        <div onClick={() => setShowEventModal(false)} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer">
          <form
            onSubmit={handleSaveEvent}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 space-y-4 my-8 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="text-emerald-700" size={20} />
                <h3 className="font-bold text-gray-900 text-base">
                  {editingEventId ? "Chỉnh Sửa Sự Kiện Khuyến Mãi" : "Thêm Sự Kiện / Mùa Vụ Khuyến Mãi Mới"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="border-b border-border pb-2">
                <h4 className="text-sm font-bold text-foreground">Thông tin cơ bản</h4>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Tên, đường dẫn và loại hình chiến dịch.</p>
              </div>
              {/* Event Title */}
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Tên sự kiện / Chiến dịch mùa vụ (*):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Mùa thu hoạch dâu tây Mộc Châu…"
                  value={eventForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9]/g, "-")
                      .replace(/-+/g, "-")
                      .replace(/^-|-$/g, "");
                    setEventForm({ ...eventForm, title, slug: editingEventId ? eventForm.slug : slug });
                  }}
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-sm outline-none focus:border-red-600"
                />
              </div>

              {/* Slug URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Đường dẫn tĩnh (Slug):</label>
                  <input
                    type="text"
                    required
                    placeholder="mua-thu-hoach-dau-tay"
                    value={eventForm.slug}
                    onChange={(e) => setEventForm({ ...eventForm, slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-mono text-xs outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Loại sự kiện & Nhãn hiển thị:</label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => {
                      const type = e.target.value as CampaignType;
                      let typeLabel = "Chính Vụ Thu Hoạch";
                      let typeColor = "bg-emerald-100 text-emerald-900 border-emerald-300";
                      if (type === "farmer_aid") {
                        typeLabel = "Trợ Giá Nông Dân";
                        typeColor = "bg-amber-100 text-amber-900 border-amber-300";
                      } else if (type === "flash_sale") {
                        typeLabel = "Xả Kho Tươi FEFO";
                        typeColor = "bg-rose-100 text-rose-900 border-rose-300";
                      } else if (type === "seasonal") {
                        typeLabel = "Nông Sản Theo Mùa";
                        typeColor = "bg-blue-100 text-blue-900 border-blue-300";
                      } else if (type === "holiday") {
                        typeLabel = "Lễ Hội & Tri Ân";
                        typeColor = "bg-purple-100 text-purple-900 border-purple-300";
                      }
                      setEventForm({ ...eventForm, type, typeLabel, typeColor });
                    }}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600 font-semibold"
                  >
                    <option value="harvest">🌿 Chính Vụ Thu Hoạch (Harvest)</option>
                    <option value="farmer_aid">🤝 Trợ Giá Nông Dân (Farmer Aid)</option>
                    <option value="flash_sale">⚡ Xả Kho Tươi FEFO (Flash Sale)</option>
                    <option value="seasonal">🍂 Nông Sản Theo Mùa (Seasonal)</option>
                    <option value="holiday">🎉 Lễ Hội & Tri Ân (Holiday)</option>
                  </select>
                </div>
              </div>

              {/* Dates & Discount */}
              <div className="border-b border-border pb-2 pt-2">
                <h4 className="text-sm font-bold text-foreground">Thời gian và ưu đãi</h4>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Khoảng hiệu lực và mức giảm áp dụng cho sản phẩm.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Ngày bắt đầu (*):</label>
                  <input
                    type="date"
                    required
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Ngày kết thúc (*):</label>
                  <input
                    type="date"
                    required
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Mức giảm giá (%):</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    required
                    value={eventForm.discountPercent}
                    onChange={(e) => setEventForm({ ...eventForm, discountPercent: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600 font-bold text-rose-600 text-sm"
                  />
                </div>
              </div>

              {/* Icons & Voucher */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Biểu trưng (Icon Emoji):</label>
                  <input
                    type="text"
                    value={eventForm.bannerIcon}
                    onChange={(e) => setEventForm({ ...eventForm, bannerIcon: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600 text-center text-lg"
                    placeholder="🍓"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Badge nhãn sản phẩm:</label>
                  <input
                    type="text"
                    value={eventForm.badgeText}
                    onChange={(e) => setEventForm({ ...eventForm, badgeText: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600"
                    placeholder="Vụ mùa -17%"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Voucher cộng dồn thêm (Tùy chọn):</label>
                  <input
                    type="text"
                    value={eventForm.voucherCode}
                    onChange={(e) => setEventForm({ ...eventForm, voucherCode: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600 uppercase font-mono font-bold"
                    placeholder="Để trống nếu chỉ giảm trực tiếp"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Mặc định sự kiện trừ thẳng vào giá bán, không cần nhập mã.</span>
                </div>
              </div>

              {/* Target Type & Product/Category Selector */}
              <div className="border-b border-border pb-2 pt-2">
                <h4 className="text-sm font-bold text-foreground">Phạm vi áp dụng</h4>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Chọn sản phẩm, danh mục hoặc toàn bộ cửa hàng.</p>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Phạm vi áp dụng giảm giá:</label>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={eventForm.targetType === "product"}
                      onChange={() => setEventForm({ ...eventForm, targetType: "product" })}
                    />
                    <span>Theo tên nông sản cụ thể</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={eventForm.targetType === "category"}
                      onChange={() => setEventForm({ ...eventForm, targetType: "category" })}
                    />
                    <span>Theo danh mục nông sản</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={eventForm.targetType === "all"}
                      onChange={() => setEventForm({ ...eventForm, targetType: "all" })}
                    />
                    <span>Toàn bộ cửa hàng</span>
                  </label>
                </div>

                {eventForm.targetType === "product" && (
                  <div>
                    <input
                      type="text"
                      placeholder="Nhập tên các loại nông sản (phân cách bằng dấu phẩy), ví dụ: Dâu Tây, Cải Xoăn Kale, Xà Lách"
                      value={eventForm.targetProductNames}
                      onChange={(e) => setEventForm({ ...eventForm, targetProductNames: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Các sản phẩm có tên chứa các từ khóa trên sẽ tự động được áp dụng mức giảm giá khi sự kiện đang diễn ra.
                    </p>
                  </div>
                )}

                {eventForm.targetType === "category" && (
                  <div>
                    <input
                      type="text"
                      placeholder="Mã danh mục, ví dụ: rau_la, trai_cay, cu_qua, nam_chebien"
                      value={eventForm.targetCategoryCodes}
                      onChange={(e) => setEventForm({ ...eventForm, targetCategoryCodes: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="border-b border-border pb-2 pt-2">
                <h4 className="text-sm font-bold text-foreground">Nội dung hiển thị</h4>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Thông tin khách hàng sẽ nhìn thấy trên trang sự kiện.</p>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mô tả tóm tắt sự kiện:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Tóm tắt lý do giảm giá và sản lượng thu hoạch…"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600"
                />
              </div>

              {/* Full Content (Blog-like details) */}
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Bài viết chi tiết sự kiện (Hiển thị kiểu Blog khi khách bấm xem):
                </label>
                <textarea
                  rows={4}
                  placeholder="Mô tả vùng trồng, quy trình canh tác và sản lượng…"
                  value={eventForm.fullContent}
                  onChange={(e) => setEventForm({ ...eventForm, fullContent: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="eventActive"
                  checked={eventForm.active}
                  onChange={(e) => setEventForm({ ...eventForm, active: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <label htmlFor="eventActive" className="font-semibold text-gray-800 cursor-pointer">
                  Kích hoạt sự kiện ngay (Nếu trong thời gian từ ngày bắt đầu đến kết thúc sẽ tự động giảm giá)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                {editingEventId ? "Lưu Thay Đổi Sự Kiện" : "Tạo & Công Bố Sự Kiện"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VIẾT / SỬA BÀI BLOG & CẨM NANG                        */}
      {/* ========================================================= */}
      {showBlogModal && (
        <div onClick={() => setShowBlogModal(false)} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer">
          <form
            onSubmit={handleSaveBlog}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 space-y-4 my-8 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <BookOpen className="text-emerald-700" size={20} />
                <h3 className="font-bold text-gray-900 text-base">
                  {editingBlogId ? "Chỉnh Sửa Bài Viết Blog" : "Viết Bài Viết Blog Mới"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBlogModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {/* Blog Title */}
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Tiêu đề bài viết (*):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tiêu đề bài viết…"
                  value={blogForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9]/g, "-")
                      .replace(/-+/g, "-")
                      .replace(/^-|-$/g, "");
                    setBlogForm({ ...blogForm, title, slug: editingBlogId ? blogForm.slug : slug });
                  }}
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-sm outline-none focus:border-red-600"
                />
              </div>

              {/* Category & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Chuyên mục:</label>
                  <select
                    value={blogForm.category}
                    onChange={(e) => {
                      const category = e.target.value as "all" | "ai" | "season" | "standard" | "guide";
                      let categoryLabel = "Quyết định & Mùa vụ";
                      if (category === "ai") categoryLabel = "Công nghệ AI";
                      else if (category === "standard") categoryLabel = "Tiêu chuẩn VietGAP";
                      else if (category === "guide") categoryLabel = "Cẩm nang tiêu dùng";
                      setBlogForm({ ...blogForm, category, categoryLabel });
                    }}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600 font-semibold"
                  >
                    <option value="season">🍂 Quyết định & Mùa vụ</option>
                    <option value="ai">🤖 Công nghệ AI</option>
                    <option value="standard">📜 Tiêu chuẩn VietGAP / GlobalGAP</option>
                    <option value="guide">💡 Cẩm nang tiêu dùng</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Đường dẫn tĩnh (Slug):</label>
                  <input
                    type="text"
                    required
                    value={blogForm.slug}
                    onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-mono text-xs outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Author & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Tác giả (*):</label>
                  <input
                    type="text"
                    required
                    value={blogForm.author}
                    onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Chức vụ / Học vị:</label>
                  <input
                    type="text"
                    value={blogForm.authorRole}
                    onChange={(e) => setBlogForm({ ...blogForm, authorRole: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Thời lượng đọc:</label>
                  <input
                    type="text"
                    value={blogForm.readTime}
                    onChange={(e) => setBlogForm({ ...blogForm, readTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Related Product */}
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nông sản gắn kèm (CTA):</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Dâu tây Mộc Châu, cải xoăn kale…"
                  value={blogForm.relatedProductName}
                  onChange={(e) => setBlogForm({ ...blogForm, relatedProductName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tóm tắt ngắn (Excerpt):</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Đoạn tóm tắt hiển thị trên thẻ bài viết…"
                  value={blogForm.excerpt}
                  onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600"
                />
              </div>

              {/* Content */}
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nội dung bài viết (*):</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Nội dung chi tiết và kiến thức chuyên môn…"
                  value={blogForm.content}
                  onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600"
                />
              </div>

              {/* Featured & Active Toggles */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blogForm.featured}
                    onChange={(e) => setBlogForm({ ...blogForm, featured: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span className="font-semibold text-gray-800">Đặt làm bài viết Nổi Bật (Featured)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blogForm.active}
                    onChange={(e) => setBlogForm({ ...blogForm, active: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span className="font-semibold text-gray-800">Hiển thị công khai</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowBlogModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                {editingBlogId ? "Cập Nhật Bài Viết" : "Xuất Bản Bài Viết"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const ORDER_STATUS_OPTIONS = [
  { value: "PENDING_PAYMENT", label: "Chờ thanh toán" },
  { value: "PAID", label: "Chờ đóng gói" },
  { value: "CONFIRMED", label: "Chờ lấy hàng" },
  { value: "PREPARING", label: "Đang đóng gói" },
  { value: "SHIPPING", label: "Đang giao hàng" },
  { value: "DELIVERED", label: "Đã giao hàng" },
  { value: "COMPLETED", label: "Đã hoàn tất" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "REFUNDED", label: "Đã hoàn tiền" },
];

function orderStatusLabel(status?: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Chờ thanh toán";
    case "PAID":
      return "Chờ đóng gói";
    case "CONFIRMED":
      return "Chờ lấy hàng";
    case "PREPARING":
      return "Đang đóng gói";
    case "SHIPPING":
      return "Đang giao hàng";
    case "DELIVERED":
      return "Đã giao hàng";
    case "COMPLETED":
      return "Đã hoàn tất";
    case "CANCELLED":
      return "Đã hủy";
    case "REFUNDED":
      return "Đã hoàn tiền";
    default:
      return status || "Chưa xác định";
  }
}

function orderNextActionLabel(nextStatus: string) {
  switch (nextStatus) {
    case "PAID":
      return "Xác nhận";
    case "CONFIRMED":
      return "Duyệt";
    case "PREPARING":
      return "Đóng gói";
    case "SHIPPING":
      return "Giao xe";
    case "DELIVERED":
      return "Đã giao";
    case "COMPLETED":
      return "Hoàn tất";
    case "REFUNDED":
      return "Hoàn tiền";
    default:
      return orderStatusLabel(nextStatus);
  }
}

function formatCompactDateTime(dateStr?: string | Date) {
  if (!dateStr) return "Hôm nay";
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month} · ${hours}:${minutes}`;
  } catch {
    return String(dateStr);
  }
}

function getShortAddress(addr?: string) {
  if (!addr) return "";
  const parts = addr.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return parts.slice(-2).join(", ");
  }
  return addr;
}

/** Chỉ tính doanh thu cho đơn đã thanh toán hoặc COD đã được xác nhận. */
const REVENUE_STATUSES = new Set(["PAID", "CONFIRMED", "SHIPPING", "DELIVERED", "COMPLETED"]);

export default function AdminPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-gray-400">
          Đang tải bảng điều khiển quản trị…
        </div>
      }
    >
      <AdminPortalContent />
    </Suspense>
  );
}
