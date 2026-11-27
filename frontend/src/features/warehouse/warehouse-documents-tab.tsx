"use client";

import { useMemo } from "react";
import { Download, Printer, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  DOC_TYPE_LABELS,
  STATUS_NAMES,
  WarehouseErrorNotice,
  WarehouseStatusBadge,
  WarehouseTable,
  downloadCsv,
  formatTime,
  quantity,
} from "./warehouse-utils";
import type { DocumentType, WarehouseDocument } from "@/types/warehouse";

interface Props {
  warehouseId: string;
  warehouseName?: string;
  documents: WarehouseDocument[];
  error: unknown;
  busy: boolean;
  actionLoadingId: string | null;
  typeFilter: "ALL" | DocumentType;
  statusFilter: string;
  onTypeFilterChange: (next: "ALL" | DocumentType) => void;
  onStatusFilterChange: (next: string) => void;
  onCreateDocument: (type: DocumentType) => void;
  onOpenDetail: (doc: WarehouseDocument) => void;
  onOpenPrint: (doc: WarehouseDocument) => void;
  onConfirmDocument: (doc: WarehouseDocument) => void;
  onRequestCancel: (doc: WarehouseDocument) => void;
  onReceiveTransfer: (doc: WarehouseDocument) => void;
  onHandover: (doc: WarehouseDocument) => void;
  onAttachShipment: (doc: WarehouseDocument) => void;
}

export function WarehouseDocumentsTab({
  warehouseId,
  warehouseName,
  documents,
  error,
  busy,
  actionLoadingId,
  typeFilter,
  statusFilter,
  onTypeFilterChange,
  onStatusFilterChange,
  onCreateDocument,
  onOpenDetail,
  onOpenPrint,
  onConfirmDocument,
  onRequestCancel,
  onReceiveTransfer,
  onHandover,
  onAttachShipment,
}: Props) {
  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      if (typeFilter !== "ALL" && d.type !== typeFilter) return false;
      if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
      return true;
    });
  }, [documents, typeFilter, statusFilter]);

  function handleExportCsv() {
    downloadCsv(
      `chung-tu-kho-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Kho",
        "Mã phiếu",
        "Loại phiếu",
        "Thời gian",
        "Trạng thái",
        "Biên bản bàn giao",
        "Mã chuyến giao",
        "Ghi chú",
        "Người lập",
      ],
      filteredDocuments.map((d) => [
        warehouseName ?? "",
        d.id.slice(0, 8),
        DOC_TYPE_LABELS[d.type],
        formatTime(d.createdAt),
        STATUS_NAMES[d.status] ?? d.status,
        d.handoverReference ?? "",
        d.shipmentCode ?? "",
        d.note ?? "",
        d.createdBy,
      ])
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-slate-50 px-2.5 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold text-slate-600">Lập phiếu:</span>
          {(Object.keys(DOC_TYPE_LABELS) as DocumentType[]).map((t) => (
            <Button
              key={t}
              size="sm"
              variant="secondary"
              className="h-8 whitespace-nowrap px-2.5 text-xs"
              onClick={() => onCreateDocument(t)}
            >
              + {DOC_TYPE_LABELS[t]}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Select
            aria-label="Lọc loại chứng từ"
            className="h-8 w-auto text-xs"
            value={typeFilter}
            onChange={(e) =>
              onTypeFilterChange(e.target.value as "ALL" | DocumentType)
            }
          >
            <option value="ALL">Mọi loại phiếu</option>
            {(Object.keys(DOC_TYPE_LABELS) as DocumentType[]).map((t) => (
              <option key={t} value={t}>
                {DOC_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Lọc trạng thái chứng từ"
            className="h-8 w-auto text-xs"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="IN_TRANSIT">Đang vận chuyển</option>
            <option value="HANDED_OVER">Đã bàn giao</option>
            <option value="RECEIVED">Đã nhận đủ</option>
            <option value="CANCELLED">Đã hủy</option>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!filteredDocuments.length}
            onClick={handleExportCsv}
            className="h-8 whitespace-nowrap text-xs"
          >
            <Download size={13} />
            Xuất CSV
          </Button>
        </div>
      </div>

      <WarehouseErrorNotice error={error} />
      <WarehouseTable
        head={["Mã", "Loại", "Thời gian", "Trạng thái", "Ghi chú", "Thao tác"]}
        empty={!filteredDocuments.length}
      >
        {filteredDocuments.map((d) => (
          <tr key={d.id}>
            <td>
              <button
                className="font-mono text-emerald-700 underline"
                onClick={() => onOpenDetail(d)}
              >
                {d.id.slice(0, 8)}
              </button>
            </td>
            <td>
              {DOC_TYPE_LABELS[d.type]}
              {d.type === "TRANSFER" && (
                <div className="text-xs text-slate-500">
                  {d.targetWarehouseId === warehouseId
                    ? "Chuyển đến"
                    : "Chuyển đi"}
                  {" · Đã nhận "}
                  {quantity(
                    d.lines.reduce((n, l) => n + (l.receivedKg ?? 0), 0)
                  )}
                  {" / "}
                  {quantity(d.lines.reduce((n, l) => n + l.quantityKg, 0))}
                  {" kg"}
                </div>
              )}
            </td>
            <td>{formatTime(d.createdAt)}</td>
            <td>
              <div className="space-y-1">
                <WarehouseStatusBadge value={d.status} />
                {d.handoverReference && (
                  <p className="text-[11px] text-slate-500">
                    Biên bản:{" "}
                    <strong className="text-slate-700">
                      {d.handoverReference}
                    </strong>
                  </p>
                )}
                {d.shipmentCode && (
                  <p className="inline-flex items-center gap-1 rounded-[2px] border border-sky-300 bg-sky-50 px-1.5 py-0.5 font-mono text-[11px] font-medium text-sky-900">
                    <Truck size={11} />
                    {d.shipmentCode}
                  </p>
                )}
              </div>
            </td>
            <td>{d.note}</td>
            <td>
              <div className="flex flex-nowrap items-center gap-1.5">
                {d.status === "DRAFT" && d.warehouseId === warehouseId && (
                  <>
                    <Button
                      size="sm"
                      className="whitespace-nowrap"
                      disabled={
                        actionLoadingId === `confirm-${d.id}` ||
                        actionLoadingId === `cancel-${d.id}`
                      }
                      onClick={() => onConfirmDocument(d)}
                    >
                      Xác nhận
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="whitespace-nowrap text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                      disabled={
                        actionLoadingId === `confirm-${d.id}` ||
                        actionLoadingId === `cancel-${d.id}`
                      }
                      onClick={() => onRequestCancel(d)}
                    >
                      {actionLoadingId === `cancel-${d.id}`
                        ? "Đang hủy..."
                        : "Hủy"}
                    </Button>
                  </>
                )}
                {d.status === "IN_TRANSIT" &&
                  d.targetWarehouseId === warehouseId && (
                    <Button
                      size="sm"
                      className="whitespace-nowrap"
                      disabled={actionLoadingId === `receive-${d.id}`}
                      onClick={() => onReceiveTransfer(d)}
                    >
                      {actionLoadingId === `receive-${d.id}`
                        ? "Đang nhận..."
                        : "Nhận hàng"}
                    </Button>
                  )}
                {(d.type === "OUTBOUND" || d.type === "TRANSFER") &&
                  d.warehouseId === warehouseId &&
                  !d.handoverReference &&
                  (d.status === "CONFIRMED" || d.status === "IN_TRANSIT") && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="whitespace-nowrap"
                      disabled={busy}
                      onClick={() => onHandover(d)}
                    >
                      Bàn giao
                    </Button>
                  )}
                {d.type === "OUTBOUND" &&
                  d.warehouseId === warehouseId &&
                  d.status === "HANDED_OVER" &&
                  d.handoverReference &&
                  !d.shipmentCode && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="whitespace-nowrap"
                      disabled={busy}
                      onClick={() => onAttachShipment(d)}
                    >
                      Gắn chuyến giao
                    </Button>
                  )}
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 whitespace-nowrap px-2 text-xs text-slate-700"
                  title="Xem & in phiếu kho"
                  onClick={() => onOpenPrint(d)}
                >
                  <Printer size={13} />
                  In
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </WarehouseTable>
    </>
  );
}
