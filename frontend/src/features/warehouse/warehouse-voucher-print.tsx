"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  DOC_TYPE_LABELS,
  STATUS_NAMES,
  formatTime,
  quantity,
} from "./warehouse-utils";
import type { Warehouse, WarehouseDocument } from "@/types/warehouse";

interface LotMeta {
  productId?: string;
  lotCode?: string;
}

interface Props {
  document: WarehouseDocument;
  warehouse?: Warehouse;
  locationLabel: (locationId: string) => string;
  getLotMeta: (lotId: string) => LotMeta | undefined;
  onClose: () => void;
}

export function WarehouseVoucherPrintModal({
  document: doc,
  warehouse,
  locationLabel,
  getLotMeta,
  onClose,
}: Props) {
  const totalKg = doc.lines.reduce(
    (sum, line) => sum + (line.quantityKg ?? 0),
    0
  );
  const titleLabel = `Phiếu ${DOC_TYPE_LABELS[doc.type].toLowerCase()}`;

  useEffect(() => {
    const cleanup = () => {
      document.body.classList.remove("printing-warehouse-voucher");
    };
    window.addEventListener("afterprint", cleanup);
    return () => {
      window.removeEventListener("afterprint", cleanup);
      cleanup();
    };
  }, []);

  function handlePrint() {
    document.body.classList.add("printing-warehouse-voucher");
    window.print();
  }

  return (
    <Modal
      size="wide"
      title={`In phiếu kho · #${doc.id.slice(0, 8).toUpperCase()}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div
          id="warehouse-print-voucher"
          className="space-y-4 border border-slate-300 bg-white p-5 text-slate-900"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-300 pb-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                AgriTrace Cold-Chain Warehouse
              </p>
              <h3 className="mt-0.5 text-lg font-bold uppercase text-slate-900">
                {titleLabel}
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Kho thực hiện: <strong>{warehouse?.name ?? "—"}</strong>
                {warehouse?.location ? ` · ${warehouse.location}` : ""}
              </p>
            </div>
            <div className="space-y-0.5 text-right text-xs text-slate-600">
              <p>
                Mã phiếu:{" "}
                <strong className="font-mono text-slate-900">
                  {doc.id.slice(0, 8).toUpperCase()}
                </strong>
              </p>
              <p>Ngày lập: {formatTime(doc.createdAt)}</p>
              <p>
                Trạng thái:{" "}
                <strong>{STATUS_NAMES[doc.status] ?? doc.status}</strong>
              </p>
              {doc.shipmentCode && (
                <p>
                  Mã chuyến giao: <strong>{doc.shipmentCode}</strong>
                </p>
              )}
              {doc.handoverReference && (
                <p>
                  Biên bản bàn giao: <strong>{doc.handoverReference}</strong>
                </p>
              )}
            </div>
          </div>

          {doc.note && (
            <p className="border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
              <strong>Lý do / Ghi chú:</strong> {doc.note}
            </p>
          )}

          <table className="w-full border-collapse border border-slate-300 text-left text-xs">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-slate-700">
                <th className="border-r border-slate-300 px-2.5 py-1.5 font-semibold">
                  STT
                </th>
                <th className="border-r border-slate-300 px-2.5 py-1.5 font-semibold">
                  Sản phẩm
                </th>
                <th className="border-r border-slate-300 px-2.5 py-1.5 font-semibold">
                  Mã lô
                </th>
                <th className="border-r border-slate-300 px-2.5 py-1.5 font-semibold">
                  Vị trí
                </th>
                {doc.type === "TRANSFER" && (
                  <th className="border-r border-slate-300 px-2.5 py-1.5 font-semibold">
                    Vị trí đích
                  </th>
                )}
                <th className="px-2.5 py-1.5 text-right font-semibold">
                  Số lượng (kg)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {doc.lines.map((line, index) => {
                const meta = getLotMeta(line.lotId);
                return (
                  <tr key={index}>
                    <td className="border-r border-slate-200 px-2.5 py-1.5 text-right tabular-nums text-slate-500">
                      {index + 1}
                    </td>
                    <td className="border-r border-slate-200 px-2.5 py-1.5 font-medium text-slate-900">
                      {meta?.productId ?? "Nông sản"}
                    </td>
                    <td className="border-r border-slate-200 px-2.5 py-1.5 font-mono text-slate-700">
                      {meta?.lotCode ?? line.lotId.slice(0, 8)}
                    </td>
                    <td className="border-r border-slate-200 px-2.5 py-1.5">
                      {locationLabel(line.locationId)}
                    </td>
                    {doc.type === "TRANSFER" && (
                      <td className="border-r border-slate-200 px-2.5 py-1.5">
                        {line.targetLocationId
                          ? locationLabel(line.targetLocationId)
                          : "—"}
                      </td>
                    )}
                    <td className="px-2.5 py-1.5 text-right font-semibold tabular-nums">
                      {quantity(line.quantityKg)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-300 bg-slate-50 font-semibold">
                <td
                  colSpan={doc.type === "TRANSFER" ? 5 : 4}
                  className="border-r border-slate-300 px-2.5 py-1.5 text-right"
                >
                  Tổng cộng ({doc.lines.length} dòng):
                </td>
                <td className="px-2.5 py-1.5 text-right tabular-nums text-emerald-800">
                  {quantity(totalKg)} kg
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="grid grid-cols-3 gap-4 pt-4 text-center text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-800">Người lập phiếu</p>
              <p className="mt-0.5 text-[11px]">{doc.createdBy}</p>
              <div className="mt-10 border-t border-dashed border-slate-300 pt-1">
                Ký & ghi rõ họ tên
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Thủ kho xác nhận</p>
              <p className="mt-0.5 text-[11px]">{doc.confirmedBy ?? "Chưa xác nhận"}</p>
              <div className="mt-10 border-t border-dashed border-slate-300 pt-1">
                Ký & ghi rõ họ tên
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Bên giao / nhận</p>
              <p className="mt-0.5 text-[11px]">{doc.handoverBy ?? "—"}</p>
              <div className="mt-10 border-t border-dashed border-slate-300 pt-1">
                Ký & ghi rõ họ tên
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 print:hidden">
          <Button type="button" variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          <Button type="button" onClick={handlePrint}>
            <Printer size={15} />
            In phiếu (Ctrl+P)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
