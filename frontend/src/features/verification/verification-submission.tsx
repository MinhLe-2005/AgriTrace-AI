"use client";

import { CheckCircle2, Clock3, FileText, Send, ShieldCheck } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { useMyVerifications, useVerificationSubmission } from "@/hooks/use-verifications";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { useAuthStore } from "@/stores/auth-store";
import type { VerificationType } from "@/types/verification";

const statusInfo = {
  PENDING: { label: "Đang chờ tiếp nhận", tone: "border-amber-200 bg-amber-50 text-amber-800", Icon: Clock3 },
  UNDER_REVIEW: { label: "Đang được xem xét", tone: "border-blue-200 bg-blue-50 text-blue-800", Icon: Clock3 },
  APPROVED: { label: "Đã được phê duyệt", tone: "border-emerald-200 bg-emerald-50 text-emerald-800", Icon: CheckCircle2 },
  REJECTED: { label: "Chưa được phê duyệt", tone: "border-red-200 bg-red-50 text-red-800", Icon: FileText },
  CHANGES_REQUESTED: { label: "Cần bổ sung hồ sơ", tone: "border-orange-200 bg-orange-50 text-orange-800", Icon: FileText },
  SUSPENDED: { label: "Tạm ngưng", tone: "border-gray-200 bg-gray-50 text-gray-700", Icon: Clock3 },
  EXPIRED: { label: "Đã hết hiệu lực", tone: "border-gray-200 bg-gray-50 text-gray-700", Icon: Clock3 },
} as const;

export function VerificationSubmission({ type }: { type: VerificationType }) {
  const roles = useAuthStore((state) => state.user?.roles ?? []);
  const canSubmit = roles.some((role) => role === type || role === `ROLE_${type}`);
  if (!canSubmit) return null;
  return <VerificationSubmissionContent type={type} />;
}

function VerificationSubmissionContent({ type }: { type: VerificationType }) {
  const mine = useMyVerifications();
  const submit = useVerificationSubmission();
  const [organizationName, setOrganizationName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [note, setNote] = useState("");
  if (mine.isPending) return <LoadingSkeleton rows={3} />;
  if (mine.isError) return <ErrorState message="Không thể tải trạng thái hồ sơ xác minh." onRetry={() => mine.refetch()} />;

  const latest = mine.data?.[0];
  const pending = latest?.status === "PENDING" || latest?.status === "UNDER_REVIEW";
  const info = latest ? statusInfo[latest.status] : null;
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationName.trim() || !documentType.trim() || !documentUrl.trim()) {
      toast.error("Vui lòng điền đủ đơn vị, loại giấy tờ và liên kết tài liệu.");
      return;
    }
    try {
      new URL(documentUrl);
    } catch {
      toast.error("Liên kết tài liệu không hợp lệ.");
      return;
    }
    try {
      await submit.mutateAsync({ type, organizationName: organizationName.trim(), documentType: documentType.trim(), documentUrl: documentUrl.trim(), note: note.trim() || undefined });
      toast.success("Đã gửi hồ sơ xác minh. Chúng tôi sẽ thông báo khi có kết quả.");
      setOrganizationName(""); setDocumentType(""); setDocumentUrl(""); setNote("");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  return <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-xs">
    <div className="border-b border-emerald-100 bg-emerald-50/60 p-5"><div className="flex items-start gap-3"><span className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><ShieldCheck size={20} /></span><div><h2 className="font-bold text-gray-900">Xác minh hồ sơ {type === "FARMER" ? "nông trại" : "nhà phân phối"}</h2><p className="mt-1 text-xs text-gray-600">Gửi thông tin đơn vị và liên kết giấy tờ để Quản trị viên xác minh. Tài liệu có thể là liên kết Google Drive, OneDrive hoặc trang công khai.</p></div></div></div>
    <div className="p-5">{latest && info && <VerificationStatus latest={latest} label={info.label} tone={info.tone} Icon={info.Icon} />}{pending ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Bạn đã có một hồ sơ đang được xử lý. Bạn chưa thể gửi thêm hồ sơ mới cho đến khi có kết quả.</p> : <form noValidate onSubmit={handleSubmit} className="mt-4 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Tên đơn vị / tổ chức" required><input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} maxLength={150} className="verification-field" placeholder={type === "FARMER" ? "Ví dụ: Nông trại xanh Đà Lạt" : "Ví dụ: Công ty vận tải ABC"} /></Field><Field label="Loại giấy tờ" required><input value={documentType} onChange={(e) => setDocumentType(e.target.value)} maxLength={50} className="verification-field" placeholder="Ví dụ: Chứng nhận VietGAP" /></Field></div><Field label="Liên kết tài liệu" required><input type="url" value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} maxLength={500} className="verification-field" placeholder="https://..." /><span className="mt-1 block text-[11px] text-gray-500">Đảm bảo Quản trị viên có quyền xem liên kết này.</span></Field><Field label="Ghi chú cho Quản trị viên"><textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} className="verification-field resize-y py-2" placeholder="Thông tin bổ sung về vùng trồng, đơn vị hoặc giấy tờ..." /></Field><Button type="submit" loading={submit.isPending}><Send size={15} />Gửi hồ sơ xác minh</Button></form>}</div>
    <style jsx>{`.verification-field { width: 100%; border: 1px solid #d1d5db; border-radius: .75rem; padding: .625rem .75rem; font-size: .875rem; outline: none; } .verification-field:focus { border-color: #059669; box-shadow: 0 0 0 3px rgba(5, 150, 105, .12); }`}</style>
  </section>;
}
function VerificationStatus({ latest, label, tone, Icon }: { latest: { organizationName: string; documentType: string; createdAt: string; decisionReason?: string | null }; label: string; tone: string; Icon: typeof Clock3 }) { return <div className={`rounded-xl border p-4 ${tone}`}><div className="flex items-center gap-2 font-bold"><Icon size={17} />{label}</div><p className="mt-2 text-xs">Đơn vị: <strong>{latest.organizationName}</strong> · Giấy tờ: <strong>{latest.documentType}</strong></p><p className="mt-1 text-xs">Gửi lúc: {new Date(latest.createdAt).toLocaleString("vi-VN")}</p>{latest.decisionReason && <p className="mt-2 rounded-lg bg-white/60 p-2 text-xs"><strong>Phản hồi từ Quản trị viên:</strong> {latest.decisionReason}</p>}</div>; }
function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}{required && <span className="text-red-600"> *</span>}</span>{children}</label>; }
