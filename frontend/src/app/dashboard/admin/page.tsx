"use client";

import { Activity, Shield, UserCheck } from "lucide-react";
import { useMemo } from "react";

import { ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { useUsers } from "@/hooks/use-users";
import { useVerificationMutations, useVerifications } from "@/hooks/use-verifications";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import type { VerificationRequest } from "@/types/verification";

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

export default function AdminPortalPage() {
  const users = useUsers();
  const verifications = useVerifications();
  const verificationMutations = useVerificationMutations();
  const pendingRequests = useMemo(
    () => verifications.data?.filter((request) => request.status === "PENDING" || request.status === "UNDER_REVIEW") ?? [],
    [verifications.data]
  );
  const busy = verificationMutations.approve.isPending || verificationMutations.reject.isPending;

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

  const totalUsers = users.isPending ? "…" : users.isError ? "—" : (users.data?.length ?? 0).toLocaleString("vi-VN");
  const lockedUsers = users.isPending ? "…" : users.isError ? "—" : (users.data?.filter((user) => !user.active).length ?? 0).toLocaleString("vi-VN");
  const pendingCount = verifications.isPending ? "…" : verifications.isError ? "—" : pendingRequests.length.toLocaleString("vi-VN");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-900 bg-red-950 p-5 text-white shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-800">
          <Shield size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">Cổng Quản Trị Viên (Admin Portal)</h1>
            <span className="rounded-full border border-red-400/30 bg-red-500/30 px-2 py-0.5 text-[11px] font-semibold text-red-300">
              Toàn Hệ Thống
            </span>
          </div>
          <p className="text-xs text-red-200/80">
            Quản lý người dùng và xét duyệt hồ sơ xác minh đối tác.
          </p>
        </div>
      </div>

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
          <div className="text-xs text-gray-500">Nhật ký Audit 24h</div>
          <div className="text-2xl font-black text-blue-600">—</div>
          <div className="mt-1 text-[11px] text-gray-400">Backend chưa có API audit log.</div>
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

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Activity size={18} className="text-blue-600" />
          Nhật Ký Thay Đổi Quan Trọng (Audit Log)
        </h2>
        <p className="text-xs text-gray-500">Chức năng nhật ký kiểm toán chưa được kết nối với backend; dữ liệu chưa khả dụng.</p>
      </section>
    </div>
  );
}
