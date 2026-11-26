"use client";

import { useState } from "react";
import {
  X,
  AlertTriangle,
  Upload,
  CheckCircle2,
  DollarSign,
  RefreshCw,
  Gift,
  ShieldAlert,
  Info,
} from "lucide-react";
import type { ApiOrder } from "@/services/catalog.service";
import { orderChatService } from "@/services/order-chat.service";
import { toast } from "@/stores/toast-store";

interface OrderDisputeModalProps {
  order: ApiOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: ApiOrder) => void;
}

export function OrderDisputeModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: OrderDisputeModalProps) {
  const [reason, setReason] = useState("Rau củ bị dập nát, thối úng do vận chuyển");
  const [solution, setSolution] = useState<"REFUND_MONEY" | "REPLACE_GOODS" | "VOUCHER">("REFUND_MONEY");
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState(
    "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const totalAmt = order.total || 0;

  const reasonsList = [
    "Rau củ bị dập nát, thối úng do vận chuyển",
    "Chuỗi lạnh không đạt (thùng bảo quản nóng, đá gel tan)",
    "Giao thiếu số lượng hoặc sai loại nông sản",
    "Nông sản héo, chất lượng không đạt chuẩn VietGAP",
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      toast.error("Vui lòng chọn lý do khiếu nại!");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await orderChatService.createDispute(order!.orderCode, {
        reason,
        solution,
        amount: totalAmt,
        photoUrl,
        note: note.trim() || undefined,
      });

      toast.success("Đã gửi yêu cầu Trả hàng / Hoàn tiền thành công! Shop và Admin sẽ đối soát ngay.");
      onSuccess(updated);
      onClose();
    } catch {
      toast.error("Không thể gửi yêu cầu khiếu nại. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 via-amber-900 to-amber-950 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-amber-200 font-bold">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Yêu Cầu Trả Hàng / Hoàn Tiền</h3>
              <p className="text-xs text-amber-200/90 font-mono mt-0.5">
                Đơn hàng #{order.orderCode} • Chuỗi lạnh VietGAP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Order Snapshot Pill */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-gray-500 font-semibold">Sản phẩm khiếu nại:</div>
              <div className="font-bold text-gray-900 text-xs mt-0.5">
                {order.items?.[0]?.name || "Nông sản tươi"} {order.items?.length > 1 ? `(+${order.items.length - 1} món khác)` : ""}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-gray-500 font-semibold">Số tiền yêu cầu hoàn:</div>
              <div className="font-bold font-mono text-emerald-800 text-sm mt-0.5">
                {totalAmt.toLocaleString("vi-VN")} đ
              </div>
            </div>
          </div>

          {/* Section 1: Reason Selection */}
          <div className="space-y-2">
            <label className="font-bold text-gray-900 text-xs block">
              1. Lý do khiếu nại chính: <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5">
              {reasonsList.map((r, i) => (
                <label
                  key={i}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    reason === r
                      ? "bg-amber-50/80 border-amber-400 text-amber-950 font-semibold"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="dispute_reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="mt-0.5 accent-amber-600"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 2: Solution */}
          <div className="space-y-2">
            <label className="font-bold text-gray-900 text-xs block">
              2. Phương án giải quyết mong muốn:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSolution("REFUND_MONEY")}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  solution === "REFUND_MONEY"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <DollarSign size={16} className="mx-auto mb-1 text-emerald-600" />
                <div className="text-[11px]">Hoàn tiền 100%</div>
                <div className="text-[10px] text-gray-500 mt-0.5">(Không cần trả hàng)</div>
              </button>

              <button
                type="button"
                onClick={() => setSolution("REPLACE_GOODS")}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  solution === "REPLACE_GOODS"
                    ? "bg-blue-50 border-blue-500 text-blue-950 font-bold"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <RefreshCw size={16} className="mx-auto mb-1 text-blue-600" />
                <div className="text-[11px]">Giao bù rau mới</div>
                <div className="text-[10px] text-gray-500 mt-0.5">(Hái sớm mai)</div>
              </button>

              <button
                type="button"
                onClick={() => setSolution("VOUCHER")}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  solution === "VOUCHER"
                    ? "bg-purple-50 border-purple-500 text-purple-950 font-bold"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Gift size={16} className="mx-auto mb-1 text-purple-600" />
                <div className="text-[11px]">Nhận Voucher 100%</div>
                <div className="text-[10px] text-gray-500 mt-0.5">(Tặng +50 điểm VIP)</div>
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
              <Info size={14} className="text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong>Chính sách nông sản sạch:</strong> Khách hàng không cần gửi trả lại rau củ hỏng. Sau khi Admin/Shop xác nhận ảnh, tiền sẽ được hoàn ngay vào tài khoản hoặc ví của bạn.
              </span>
            </div>
          </div>

          {/* Section 3: Evidence Photo */}
          <div className="space-y-2">
            <label className="font-bold text-gray-900 text-xs block">
              3. Ảnh chụp thực tế lúc mở thùng đồng kiểm: <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden relative shrink-0">
                <img src={photoUrl} alt="Evidence" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="URL ảnh bằng chứng nông sản hư hỏng..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50/50"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoUrl("https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop")
                    }
                    className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[10px] font-semibold text-gray-700 cursor-pointer"
                  >
                    Mẫu 1: Dập lá
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoUrl("https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&auto=format&fit=crop")
                    }
                    className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[10px] font-semibold text-gray-700 cursor-pointer"
                  >
                    Mẫu 2: Nát quả
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-900 text-xs block">
              4. Mô tả chi tiết thêm cho Shop & Quản Trị Viên:
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Lúc mở hộp thấy đá gel đã tan hết, rau cải xoăn bị úa vàng phần ngọn, mong shop giải quyết..."
              className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50/50"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-800 hover:to-amber-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:bg-gray-300"
            >
              {isSubmitting ? "Đang gửi yêu cầu..." : "Gửi Yêu Cầu Hoàn Tiền"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
