"use client";

import type { ReactNode } from "react";
import { getApiErrorMessage } from "@/lib/api";
import type { DocumentType } from "@/types/warehouse";

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  INBOUND: "Nhập kho",
  OUTBOUND: "Xuất kho",
  COUNT: "Kiểm kê",
  ADJUSTMENT: "Điều chỉnh",
  TRANSFER: "Chuyển kho",
};

export const MOVEMENT_LABELS: Record<string, { label: string; cls: string }> = {
  INBOUND: {
    label: "Nhập kho",
    cls: "border-emerald-300 bg-emerald-50 text-emerald-900",
  },
  OUTBOUND: {
    label: "Xuất kho",
    cls: "border-sky-300 bg-sky-50 text-sky-900",
  },
  TRANSFER_IN: {
    label: "Nhận chuyển kho",
    cls: "border-teal-300 bg-teal-50 text-teal-900",
  },
  TRANSFER_OUT: {
    label: "Xuất chuyển kho",
    cls: "border-indigo-300 bg-indigo-50 text-indigo-900",
  },
  COUNT: {
    label: "Kiểm kê",
    cls: "border-amber-300 bg-amber-50 text-amber-900",
  },
  ADJUSTMENT: {
    label: "Điều chỉnh",
    cls: "border-orange-300 bg-orange-50 text-orange-900",
  },
};

export const ALERT_TYPE_LABELS: Record<string, string> = {
  EXPIRY: "Hạn dùng",
  STALE: "Tồn lâu",
  QUALITY_HOLD: "Chất lượng",
  LEDGER_MISMATCH: "Lệch sổ cái",
  STALE_DRAFT: "Phiếu nháp treo",
  STALE_RESERVATION: "Giữ hàng treo",
  LOW_STOCK: "Tồn thấp",
  SENSOR_OFFLINE: "Mất tín hiệu",
  TEMPERATURE_HIGH: "Nhiệt độ cao",
  TEMPERATURE_LOW: "Nhiệt độ thấp",
  HUMIDITY_HIGH: "Độ ẩm cao",
  HUMIDITY_LOW: "Độ ẩm thấp",
  NEAR_EXPIRY_HIGH_STOCK: "Gần hạn, tồn lớn",
  SHELF_LIFE_LOW_HIGH_STOCK: "Hạn dùng còn ít, tồn lớn",
  SHELF_LIFE_DATA_MISSING: "Thiếu dữ liệu ngày thu hoạch",
};

export const STATUS_NAMES: Record<string, string> = {
  DRAFT: "Bản nháp",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
  HANDED_OVER: "Đã bàn giao",
  PARTIALLY_CONSUMED: "Đã xuất một phần",
  IN_TRANSIT: "Đang vận chuyển",
  RECEIVED: "Đã nhận đủ",
  ACTIVE: "Đang giữ",
  EXPIRED: "Hết hạn giữ",
  CONSUMED: "Đã xuất",
  RELEASED: "Đã giải phóng",
  OPEN: "Chưa xử lý",
  ACKNOWLEDGED: "Đang xử lý",
  RESOLVED: "Đã xử lý",
};

const STATUS_TONES: Record<string, string> = {
  DRAFT: "border-amber-300 bg-amber-50 text-amber-900",
  CONFIRMED: "border-emerald-300 bg-emerald-50 text-emerald-900",
  CANCELLED: "border-rose-300 bg-rose-50 text-rose-900",
  HANDED_OVER: "border-teal-300 bg-teal-50 text-teal-900",
  PARTIALLY_CONSUMED: "border-amber-300 bg-amber-50 text-amber-900",
  IN_TRANSIT: "border-sky-300 bg-sky-50 text-sky-900",
  RECEIVED: "border-emerald-400 bg-emerald-100 text-emerald-950",
  ACTIVE: "border-emerald-300 bg-emerald-50 text-emerald-900",
  EXPIRED: "border-rose-300 bg-rose-50 text-rose-900",
  CONSUMED: "border-teal-300 bg-teal-50 text-teal-900",
  RELEASED: "border-slate-300 bg-slate-100 text-slate-700",
  OPEN: "border-rose-300 bg-rose-50 text-rose-900",
  ACKNOWLEDGED: "border-amber-300 bg-amber-50 text-amber-900",
  RESOLVED: "border-emerald-300 bg-emerald-50 text-emerald-900",
};

export const roundKg = (value: number) => Math.round(value * 1000) / 1000;

export const quantity = (value?: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(
    value ?? 0
  );

export const formatTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : "—";

export const formatDateIso = (value: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);

function escapeCsvCell(value: unknown): string {
  const raw = value == null ? "" : String(value);
  return /[",\r\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: unknown[][]
) {
  if (typeof window === "undefined") return;
  const csvLines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  const blob = new Blob(["\uFEFF" + csvLines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function WarehouseErrorNotice({ error }: { error: unknown }) {
  return error ? (
    <p
      role="alert"
      className="rounded-none border border-red-300 bg-red-50 px-3 py-2 text-[13px] text-red-800"
    >
      {getApiErrorMessage(error)}
    </p>
  ) : null;
}

export function WarehouseTable({
  head,
  empty,
  numericCols = [],
  sortKeys = [],
  sort,
  onSort,
  children,
}: {
  head: string[];
  empty?: boolean;
  numericCols?: number[];
  sortKeys?: (string | undefined)[];
  sort?: { key: string; dir: "asc" | "desc" };
  onSort?: (key: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="max-h-[65vh] overflow-auto rounded-none border border-slate-300 bg-white">
      <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
        <thead className="sticky top-0 z-10 border-b border-slate-300 bg-slate-100 text-xs font-semibold text-slate-700 shadow-[inset_0_-1px_0_#cbd5e1]">
          <tr>
            {head.map((h, idx) => {
              const sortKey = sortKeys[idx];
              const active = sortKey && sort?.key === sortKey;
              return (
                <th
                  key={h}
                  className={
                    "border-r border-slate-300 bg-slate-100 px-2.5 py-2 font-semibold whitespace-nowrap last:border-r-0" +
                    (numericCols.includes(idx) ? " text-right" : "")
                  }
                >
                  {sortKey && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(sortKey)}
                      className={
                        "inline-flex w-full items-center gap-1 hover:text-emerald-800 " +
                        (numericCols.includes(idx) ? "justify-end" : "justify-start")
                      }
                    >
                      <span>{h}</span>
                      <span className="text-[10px] text-slate-400">
                        {active ? (sort.dir === "asc" ? "▲" : "▼") : "⇅"}
                      </span>
                    </button>
                  ) : (
                    h
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 [&_td]:border-r [&_td]:border-slate-200 [&_td]:px-2.5 [&_td]:py-1.5 [&_td:last-child]:border-r-0 [&_tr:hover]:bg-emerald-50/40">
          {empty ? (
            <tr>
              <td
                colSpan={head.length}
                className="py-6 text-center text-slate-500"
              >
                Chưa có dữ liệu.
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function WarehouseStatusBadge({ value }: { value: string }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-[2px] border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap " +
        (STATUS_TONES[value] ?? "border-slate-300 bg-slate-100 text-slate-700")
      }
    >
      {STATUS_NAMES[value] ?? value}
    </span>
  );
}
