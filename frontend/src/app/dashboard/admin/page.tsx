"use client";

import {
  Activity,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  DollarSign,
  Edit,
  Eye,
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
import { useEffect, useMemo, useState } from "react";

import { ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { useUsers } from "@/hooks/use-users";
import { useVerificationMutations, useVerifications } from "@/hooks/use-verifications";
import { getApiErrorMessage } from "@/lib/api";
import { catalogService, type ApiOrder, type ApiVoucher } from "@/services/catalog.service";
import { loyaltyService, type LoyaltyMemberAdmin } from "@/services/loyalty.service";
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

type AdminTab = "verifications" | "orders" | "vouchers" | "loyalty";

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
      {/* MODAL: TẠO VOUCHER MỚI                                     */}
      {/* ========================================================= */}
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
    </div>
  );
}
