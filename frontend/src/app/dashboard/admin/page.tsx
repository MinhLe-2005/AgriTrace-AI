"use client";

import {
  Activity,
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Gift,
  Package,
  Plus,
  Power,
  RefreshCw,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  Ticket,
  Trash2,
  Truck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { useUsers } from "@/hooks/use-users";
import { useVerificationMutations, useVerifications } from "@/hooks/use-verifications";
import { getApiErrorMessage } from "@/lib/api";
import { catalogService, type ApiOrder, type ApiVoucher } from "@/services/catalog.service";
import { loyaltyService, type LoyaltyMemberAdmin } from "@/services/loyalty.service";
import {
  useCampaignStore,
  type CampaignItem,
  type AdminBlogPost,
  type CampaignType,
} from "@/stores/campaign-store";
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

type AdminTab = "verifications" | "orders" | "vouchers" | "loyalty" | "events" | "blog";

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("verifications");

  // Member 1: Users & Verifications Hooks
  const users = useUsers();
  const verifications = useVerifications();
  const verificationMutations = useVerificationMutations();
  const pendingRequests = useMemo(
    () => verifications.data?.filter((request) => request.status === "PENDING" || request.status === "UNDER_REVIEW") ?? [],
    [verifications.data]
  );
  const busy = verificationMutations.approve.isPending || verificationMutations.reject.isPending;

  // Member 4: Orders, Vouchers, and Loyalty States
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
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
    deleteBlogPost,
  } = useCampaignStore();

  const [eventSearch, setEventSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<"all" | "active" | "upcoming" | "expired">("all");
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

  // Load Member 4 data on tab change or mount
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
    try {
      const data = await catalogService.getOrders();
      setOrders(data || []);
    } catch {
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
  async function decide(request: VerificationRequest, decision: "approve" | "reject") {
    const defaultReason = decision === "approve" ? "Hồ sơ hợp lệ." : "";
    const reason = window.prompt(
      decision === "approve" ? "Lý do phê duyệt:" : "Nhập lý do từ chối:",
      defaultReason
    );
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do xử lý hồ sơ.");
      return;
    }

    try {
      const input = { id: request.id, reason: reason.trim() };
      if (decision === "approve") {
        await verificationMutations.approve.mutateAsync(input);
        toast.success(`Đã phê duyệt hồ sơ của ${request.subjectName}.`);
      } else {
        await verificationMutations.reject.mutateAsync(input);
        toast.success(`Đã từ chối hồ sơ của ${request.subjectName}.`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  // --- Handlers: Orders ---
  async function handleUpdateOrderStatus(orderCode: string, newStatus: string) {
    try {
      const ok = await loyaltyService.adminUpdateOrderStatus(orderCode, newStatus);
      if (ok) {
        toast.success(`Đã cập nhật trạng thái đơn #${orderCode} sang ${newStatus}!`);
        setOrders((prev) =>
          prev.map((o) => (o.orderCode === orderCode ? { ...o, status: newStatus as ApiOrder["status"] } : o))
        );
        if (selectedOrder?.orderCode === orderCode) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus as ApiOrder["status"] } : null));
        }
      } else {
        toast.error("Cập nhật trạng thái thất bại.");
      }
    } catch {
      toast.error("Lỗi khi kết nối cập nhật đơn hàng.");
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
    } catch {
      toast.error("Không thể tạo voucher. Mã có thể đã tồn tại.");
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
    } catch {
      toast.error("Không thể xóa voucher.");
    }
  }

  // --- Handlers: Loyalty Bonus ---
  async function handleSendBonus(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMember) return;
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
    } catch {
      toast.error("Không thể cập nhật điểm thưởng.");
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

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim()) {
      toast.error("Vui lòng nhập tên sự kiện!");
      return;
    }
    const catCodes = eventForm.targetCategoryCodes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const prodNames = eventForm.targetProductNames
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingEventId) {
      updateCampaign(editingEventId, {
        title: eventForm.title.trim(),
        slug: eventForm.slug.trim() || eventForm.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
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
      toast.success(`Đã cập nhật sự kiện: ${eventForm.title}!`);
    } else {
      addCampaign({
        title: eventForm.title.trim(),
        slug: eventForm.slug.trim() || eventForm.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
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
  };

  const handleDeleteEvent = (id: string, title: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa sự kiện [${title}]? Sau khi xóa, các sản phẩm áp dụng sự kiện này sẽ tự động trở về giá niêm yết ban đầu.`)) {
      deleteCampaign(id);
      toast.success(`Đã xóa sự kiện [${title}]!`);
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

  const handleSaveBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogForm.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết!");
      return;
    }

    if (editingBlogId) {
      updateBlogPost(editingBlogId, {
        title: blogForm.title.trim(),
        slug: blogForm.slug.trim() || blogForm.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
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
      addBlogPost({
        title: blogForm.title.trim(),
        slug: blogForm.slug.trim() || blogForm.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
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
  };

  const handleDeleteBlog = (id: string, title: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa bài viết [${title}]?`)) {
      deleteBlogPost(id);
      toast.success(`Đã xóa bài viết [${title}]!`);
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
      const matchStatus = orderFilter === "ALL" || o.status?.toUpperCase() === orderFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, orderSearch, orderFilter]);

  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  const totalUsers = users.isPending ? "…" : users.isError ? "—" : (users.data?.length ?? 0).toLocaleString("vi-VN");
  const lockedUsers = users.isPending ? "…" : users.isError ? "—" : (users.data?.filter((user) => !user.active).length ?? 0).toLocaleString("vi-VN");
  const pendingCount = verifications.isPending ? "…" : verifications.isError ? "—" : pendingRequests.length.toLocaleString("vi-VN");

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-900 bg-red-950 p-5 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-800 shadow-md">
            <Shield size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Cổng Quản Trị Viên (Admin Portal)</h1>
              <span className="rounded-full border border-red-400/30 bg-red-500/30 px-2 py-0.5 text-[11px] font-semibold text-red-300">
                Toàn Hệ Thống
              </span>
            </div>
            <p className="text-xs text-red-200/80">
              Quản trị toàn diện: Người dùng, Đơn hàng chuỗi cung ứng, Kho Voucher & Hội viên AgriClub.
            </p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-red-900/60 p-1 border border-red-800/80 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("verifications")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors",
              activeTab === "verifications"
                ? "bg-white text-red-950 shadow-xs"
                : "text-red-200 hover:text-white hover:bg-red-800/60"
            )}
          >
            <UserCheck size={14} />
            <span>Duyệt Hồ Sơ ({pendingCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors",
              activeTab === "orders"
                ? "bg-white text-red-950 shadow-xs"
                : "text-red-200 hover:text-white hover:bg-red-800/60"
            )}
          >
            <ShoppingBag size={14} />
            <span>Quản Lý Đơn Hàng</span>
          </button>
          <button
            onClick={() => setActiveTab("vouchers")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors",
              activeTab === "vouchers"
                ? "bg-white text-red-950 shadow-xs"
                : "text-red-200 hover:text-white hover:bg-red-800/60"
            )}
          >
            <Ticket size={14} />
            <span>Kho Voucher</span>
          </button>
          <button
            onClick={() => setActiveTab("loyalty")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors",
              activeTab === "loyalty"
                ? "bg-white text-red-950 shadow-xs"
                : "text-red-200 hover:text-white hover:bg-red-800/60"
            )}
          >
            <Crown size={14} />
            <span>Hội Viên AgriClub</span>
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors",
              activeTab === "events"
                ? "bg-white text-red-950 shadow-xs"
                : "text-red-200 hover:text-white hover:bg-red-800/60"
            )}
          >
            <Sparkles size={14} />
            <span>Sự Kiện & Mùa Vụ ({campaigns.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("blog")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors",
              activeTab === "blog"
                ? "bg-white text-red-950 shadow-xs"
                : "text-red-200 hover:text-white hover:bg-red-800/60"
            )}
          >
            <BookOpen size={14} />
            <span>Quản Trị Blog ({blogPosts.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PHÊ DUYỆT HỒ SƠ & TỔNG QUAN TÀI KHOẢN (MEMBER 1)     */}
      {/* ========================================================= */}
      {activeTab === "verifications" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
              <div className="text-xs text-gray-500">Tổng tài khoản</div>
              <div className="text-2xl font-black text-gray-900">{totalUsers}</div>
              {users.isError && <p className="mt-1 text-[11px] text-red-600">Không tải được dữ liệu người dùng.</p>}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
              <div className="text-xs text-gray-500">Chờ duyệt xác minh</div>
              <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
              {verifications.isError && <p className="mt-1 text-[11px] text-red-600">Không tải được hồ sơ xác minh.</p>}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
              <div className="text-xs text-gray-500">Tài khoản bị khóa</div>
              <div className="text-2xl font-black text-red-600">{lockedUsers}</div>
              {users.isError && <p className="mt-1 text-[11px] text-red-600">Không tải được dữ liệu người dùng.</p>}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
              <div className="text-xs text-gray-500">Doanh thu hệ thống</div>
              <div className="text-2xl font-black text-emerald-700">
                {totalRevenue.toLocaleString("vi-VN")} đ
              </div>
              <p className="mt-1 text-[11px] text-gray-400">Từ các đơn hàng đã xác nhận</p>
            </div>
          </div>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <UserCheck size={18} className="text-[#1a7a3a]" />
                Hồ sơ xác minh đang chờ xử lý ({pendingCount})
              </h2>
              <span className="text-xs text-gray-400">Nông dân & Nhà phân phối</span>
            </div>

            {verifications.isPending ? (
              <div className="p-4"><LoadingSkeleton rows={3} /></div>
            ) : verifications.isError ? (
              <div className="p-4"><ErrorState onRetry={() => verifications.refetch()} /></div>
            ) : pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">Không còn hồ sơ xác minh nào đang chờ xử lý.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingRequests.map((request) => {
                  const href = documentHref(request.documentUrl);
                  return (
                    <article key={request.id} className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-gray-900">{request.subjectName}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {request.subjectEmail} · {request.organizationName} · {request.type}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          Loại giấy tờ: {request.documentType} · Gửi lúc: {submittedAt(request.createdAt)}
                        </div>
                        {request.note && <p className="mt-1 break-words text-xs text-gray-600">Ghi chú: {request.note}</p>}
                        <div className="mt-1 text-xs">
                          Hồ sơ:{" "}
                          {href ? (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="break-all text-emerald-700 underline">
                              Mở tài liệu
                            </a>
                          ) : (
                            <span className="break-all text-gray-500">{request.documentUrl}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void decide(request, "approve")}
                          className="rounded-lg bg-[#1a7a3a] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#156e34] disabled:opacity-50"
                        >
                          Duyệt
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void decide(request, "reject")}
                          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: QUẢN LÝ ĐƠN HÀNG (MEMBER 4 - UC-21, UC-22)           */}
      {/* ========================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-6 animate-fade-in">
          {/* Order KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-xs text-gray-500">Tổng số đơn hàng</div>
              <div className="text-2xl font-black text-gray-900">{orders.length}</div>
              <div className="text-[11px] text-gray-400 mt-1">Toàn bộ khách hàng</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-xs text-gray-500">Đang giao xe lạnh</div>
              <div className="text-2xl font-black text-blue-600">
                {orders.filter((o) => o.status === "SHIPPING").length}
              </div>
              <div className="text-[11px] text-blue-500 mt-1">Xe lạnh chuyên dụng</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-xs text-gray-500">Đã giao thành công</div>
              <div className="text-2xl font-black text-emerald-700">
                {orders.filter((o) => o.status === "DELIVERED").length}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">Hoàn tất quy trình</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-xs text-gray-500">Tổng doanh thu</div>
              <div className="text-2xl font-black text-amber-600">
                {totalRevenue.toLocaleString("vi-VN")} đ
              </div>
              <div className="text-[11px] text-gray-400 mt-1">COD + PayOS VietQR</div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo mã đơn (#ORD-...), tên người nhận, SĐT hoặc email..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-red-600"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-gray-400 font-semibold shrink-0">Lọc:</span>
              {(
                [
                  { key: "ALL", label: "Tất cả" },
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
                    "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                    orderFilter === f.key
                      ? "bg-red-950 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {f.label}
                </button>
              ))}
              <button
                onClick={fetchOrders}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs transition-colors shrink-0"
                title="Làm mới"
              >
                <RefreshCw size={14} className={ordersLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5">Mã đơn & Ngày đặt</th>
                    <th className="p-3.5">Khách hàng & Nhận hàng</th>
                    <th className="p-3.5">Tổng tiền</th>
                    <th className="p-3.5">Thanh toán</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        Đang tải danh sách đơn hàng...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.orderCode} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-gray-900 block">
                            #{order.orderCode}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "Hôm nay"}
                          </span>
                          {order.lotCode && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[10px] font-mono">
                              Lô: {order.lotCode}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-gray-900">{order.receiverName}</div>
                          <div className="text-[11px] text-gray-500">{order.receiverPhone}</div>
                          <div className="text-[11px] text-gray-400 truncate max-w-[220px]">
                            {order.receiverAddress}
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-gray-900">
                          <div>{(order.total || 0).toLocaleString("vi-VN")} đ</div>
                          {order.discount ? (
                            <div className="text-[10px] text-emerald-700">
                              Đã giảm {(order.discount).toLocaleString("vi-VN")}đ
                            </div>
                          ) : null}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-gray-100 text-gray-700">
                            {order.paymentMethod || "COD"}
                          </span>
                          {order.voucherUsed && (
                            <div className="text-[10px] text-purple-700 mt-1 font-mono">
                              🎟️ {order.voucherUsed}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[11px] font-bold border inline-block",
                              order.status === "DELIVERED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : order.status === "SHIPPING"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : order.status === "CANCELLED"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            )}
                          >
                            {order.status === "DELIVERED"
                              ? "Đã giao thành công"
                              : order.status === "SHIPPING"
                              ? "Đang giao xe lạnh"
                              : order.status === "CANCELLED"
                              ? "Đã hủy đơn"
                              : order.status === "PAID"
                              ? "Đã thanh toán (payOS)"
                              : "Chờ xác nhận"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.orderCode, e.target.value)}
                              className="text-[11px] font-semibold border border-gray-200 rounded-lg p-1 bg-white outline-none focus:border-red-600"
                            >
                              <option value="CONFIRMED">Chờ xác nhận</option>
                              <option value="SHIPPING">Giao xe lạnh</option>
                              <option value="DELIVERED">Đã giao hàng</option>
                              <option value="CANCELLED">Hủy đơn</option>
                            </select>
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
      {/* TAB 3: QUẢN LÝ KHO VOUCHER (MEMBER 4 - UC-23)               */}
      {/* ========================================================= */}
      {activeTab === "vouchers" && (
        <div className="space-y-6 animate-fade-in">
          {/* Voucher Header & Create Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Ticket className="text-red-700" size={20} />
                Quản Trị Kho Voucher & Mã Khuyến Mãi
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Tạo mã giảm giá mới, quản lý thời hạn và kiểm soát trạng thái áp dụng trên giỏ hàng toàn quốc.
              </p>
            </div>
            <button
              onClick={() => setShowCreateVoucherModal(true)}
              className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-white text-xs font-bold transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm"
            >
              <Plus size={16} />
              <span>+ Tạo Voucher Mới</span>
            </button>
          </div>

          {/* Vouchers Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
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
                        Đang tải danh sách voucher...
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
                              "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all",
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
          {/* Loyalty Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Crown className="text-amber-600" size={20} />
                Quản Trị Hội Viên Thân Thiết AgriClub
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Theo dõi xếp hạng hội viên, tổng chi tiêu tích lũy, điểm thưởng khả dụng và tặng điểm VIP cho khách hàng.
              </p>
            </div>
            <button
              onClick={fetchMembers}
              className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-2 self-start sm:self-auto"
            >
              <RefreshCw size={14} className={membersLoading ? "animate-spin" : ""} />
              <span>Cập nhật danh sách</span>
            </button>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
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
                        Đang tải danh sách hội viên...
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
                              <Sparkles size={13} />
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
          {/* Header & Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="text-emerald-700" size={20} />
                Quản Trị Sự Kiện & Mùa Vụ Khuyến Mãi (Events & Campaigns)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Thiết lập các sự kiện trợ giá trực tiếp vụ mùa. Khi hết thời hạn diễn ra (sau ngày kết thúc), hệ thống tự động ngừng áp dụng giảm giá trên danh mục sản phẩm.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/events"
                target="_blank"
                className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Eye size={14} />
                <span>Xem Trang Khách Hàng</span>
              </Link>
              <button
                onClick={handleOpenAddEvent}
                className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus size={16} />
                <span>+ Thêm Sự Kiện Mới</span>
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <div className="text-xs text-gray-500 font-semibold">Tổng chiến dịch</div>
              <div className="text-2xl font-black text-gray-900 mt-1">{campaignStats.total}</div>
              <div className="text-[11px] text-gray-400 mt-1">Đã cấu hình</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="text-xs text-emerald-700 font-semibold">Đang diễn ra (Active)</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">{campaignStats.active}</div>
              <div className="text-[11px] text-emerald-600 mt-1">Áp dụng giá giảm trực tiếp</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs">
              <div className="text-xs text-blue-700 font-semibold">Sắp diễn ra (Upcoming)</div>
              <div className="text-2xl font-black text-blue-800 mt-1">{campaignStats.upcoming}</div>
              <div className="text-[11px] text-blue-500 mt-1">Chờ đến ngày kích hoạt</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <div className="text-xs text-gray-500 font-semibold">Đã kết thúc (Expired)</div>
              <div className="text-2xl font-black text-gray-500 mt-1">{campaignStats.expired}</div>
              <div className="text-[11px] text-gray-400 mt-1">Tự động ngưng giảm giá</div>
            </div>
          </div>

          {/* Filter & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm sự kiện theo tên, loại vụ mùa, mã voucher, nông sản..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-red-600"
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
                      ? "bg-red-950 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Campaigns Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5">Biểu trưng & Tên sự kiện</th>
                    <th className="p-3.5">Phân loại</th>
                    <th className="p-3.5">Thời gian & Trạng thái</th>
                    <th className="p-3.5">Mức giảm & Voucher</th>
                    <th className="p-3.5">Nông sản áp dụng</th>
                    <th className="p-3.5 text-center">Bật/Tắt</th>
                    <th className="p-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
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
                        <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl p-1.5 rounded-xl bg-gray-100 border border-gray-200 shrink-0">
                                {c.bannerIcon || "🌾"}
                              </span>
                              <div>
                                <div className="font-bold text-gray-900 text-sm">{c.title}</div>
                                <div className="text-[11px] text-gray-400 font-mono">/{c.slug}</div>
                                <div className="text-[11px] text-gray-500 line-clamp-1 max-w-sm mt-0.5">
                                  {c.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-bold border", c.typeColor)}>
                              {c.typeLabel}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="font-mono text-gray-700">
                              {c.startDate} → {c.endDate}
                            </div>
                            <div className="mt-1">
                              {status === "active" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                  Đang diễn ra (Giảm giá có hiệu lực)
                                </span>
                              ) : status === "upcoming" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                  Sắp diễn ra
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-300">
                                  Đã kết thúc (Về giá gốc)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="text-sm font-extrabold text-rose-600">
                              -{c.discountPercent}%
                              {c.discountAmount ? (
                                <span className="text-[11px] font-normal text-gray-500 ml-1">
                                  (~{c.discountAmount.toLocaleString("vi-VN")} đ)
                                </span>
                              ) : null}
                            </div>
                            {c.voucherCode && (
                              <div className="mt-1">
                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] font-bold">
                                  Mã: {c.voucherCode}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="text-gray-700 font-medium">
                              {c.targetType === "all"
                                ? "Toàn bộ danh mục nông sản"
                                : c.targetProductNames && c.targetProductNames.length > 0
                                ? c.targetProductNames.join(", ")
                                : c.targetCategoryCodes?.join(", ") || "Chung"}
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => toggleCampaign(c.id)}
                              className={cn(
                                "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all",
                                c.active
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                              )}
                            >
                              {c.active ? "Đang bật" : "Tắt"}
                            </button>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditEvent(c)}
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                                title="Chỉnh sửa sự kiện"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(c.id, c.title)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
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
          {/* Header & Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="text-emerald-700" size={20} />
                Quản Trị Bài Viết Blog & Cẩm Nang Tiêu Dùng
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Quản lý các bài viết cẩm nang, quyết định công bố giá vụ mùa, thông báo AI và kiến thức kiểm định an toàn nông nghiệp.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/blog"
                target="_blank"
                className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Eye size={14} />
                <span>Xem Trang Blog</span>
              </Link>
              <button
                onClick={handleOpenAddBlog}
                className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus size={16} />
                <span>+ Viết Bài Mới</span>
              </button>
            </div>
          </div>

          {/* Filter & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm bài viết theo tiêu đề, tác giả hoặc nội dung..."
                value={blogSearch}
                onChange={(e) => setBlogSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-red-600"
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
                      ? "bg-red-950 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blog Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
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
                            onClick={() =>
                              updateBlogPost(p.id, { active: !p.active })
                            }
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all",
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleCreateVoucher}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4"
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
                  placeholder="Ví dụ: AGRITET2026, FREESHIP30..."
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
                  placeholder="Ví dụ: Giảm 30.000đ cho đơn hàng rau củ..."
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
                className="px-5 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-white text-xs font-bold shadow-md"
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleSendBonus}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber-600" size={20} />
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <form
            onSubmit={handleSaveEvent}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 space-y-4 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="text-emerald-700" size={20} />
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
              {/* Event Title */}
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Tên sự kiện / Chiến dịch mùa vụ (*):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Mùa Thu Hoạch Dâu Tây Mộc Châu, Trợ Giá Rau Đà Lạt..."
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
                  <label className="font-semibold text-gray-700 block mb-1">Mã Voucher tặng kèm:</label>
                  <input
                    type="text"
                    value={eventForm.voucherCode}
                    onChange={(e) => setEventForm({ ...eventForm, voucherCode: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-600 uppercase font-mono font-bold"
                    placeholder="DAUTAY25"
                  />
                </div>
              </div>

              {/* Target Type & Product/Category Selector */}
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
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mô tả tóm tắt sự kiện:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Tóm tắt ngắn gọn lý do giảm giá vụ mùa, sản lượng thu hoạch rộ..."
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
                  placeholder="Mô tả chi tiết vùng trồng, quy trình canh tác VietGAP/GlobalGAP, sản lượng thu hoạch, cam kết xe lạnh 24H..."
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
                className="px-5 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-white text-xs font-bold shadow-md"
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <form
            onSubmit={handleSaveBlog}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 space-y-4 my-8"
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
                  placeholder="Nhập tiêu đề bài viết blog..."
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
                  placeholder="Ví dụ: Dâu Tây New Zealand Mộc Châu, Cải Xoăn Kale..."
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
                  placeholder="Đoạn tóm tắt ngắn hiển thị trên thẻ bài viết..."
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
                  placeholder="Nội dung bài viết chi tiết, kiến thức chuyên môn, phân tích mùa vụ..."
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
                className="px-5 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-white text-xs font-bold shadow-md"
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
