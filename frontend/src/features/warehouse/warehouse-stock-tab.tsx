"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  WarehouseErrorNotice,
  WarehouseTable,
  downloadCsv,
  formatTime,
  quantity,
} from "./warehouse-utils";
import type { Balance, Inspection } from "@/types/warehouse";

export type StockFilterMode = "ALL" | "EXPIRING" | "HELD";

interface Props {
  warehouseName?: string;
  rows: Balance[];
  hasNext?: boolean;
  stockLoaded: boolean;
  stockError: unknown;
  inspections: Inspection[];
  inspectionsError: unknown;
  stockPage: number;
  onStockPageChange: (page: number) => void;
  stockSearch: string;
  onStockSearchChange: (search: string) => void;
  filterMode: StockFilterMode;
  onFilterModeChange: (mode: StockFilterMode) => void;
  todayIso: string;
  expiryCutoffIso: string;
  locationLabel: (locationId: string) => string;
  inspectionLotCode: (balanceId: string) => string;
  onInspect: (balance: Balance) => void;
}

export function WarehouseStockTab({
  warehouseName,
  rows,
  hasNext,
  stockLoaded,
  stockError,
  inspections,
  inspectionsError,
  stockPage,
  onStockPageChange,
  stockSearch,
  onStockSearchChange,
  filterMode,
  onFilterModeChange,
  todayIso,
  expiryCutoffIso,
  locationLabel,
  inspectionLotCode,
  onInspect,
}: Props) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({
    key: "expiryDate",
    dir: "asc",
  });
  function toggleSort(key: string) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }
  const filteredRows = useMemo(() => {
    const base =
      filterMode === "HELD"
        ? rows.filter((b) => b.held)
        : filterMode === "EXPIRING"
          ? rows.filter((b) => b.quantityKg > 0 && b.expiryDate <= expiryCutoffIso)
          : rows;
    const copy = [...base];
    copy.sort((a, b) => {
      const mul = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "availableKg") return (a.availableKg - b.availableKg) * mul;
      return a.expiryDate.localeCompare(b.expiryDate) * mul;
    });
    return copy;
  }, [rows, filterMode, expiryCutoffIso, sort]);

  function handleExportCsv() {
    downloadCsv(
      `ton-kho-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Kho",
        "Mã lô",
        "Sản phẩm",
        "Vị trí",
        "Hạn dùng",
        "Tồn thực tế (kg)",
        "Giữ cho đơn (kg)",
        "Khả dụng (kg)",
        "Chất lượng",
      ],
      filteredRows.map((b) => [
        warehouseName ?? "",
        b.lotCode,
        b.productId,
        locationLabel(b.locationId),
        b.expiryDate,
        b.quantityKg,
        b.reservedKg,
        b.availableKg,
        b.held ? "Cách ly" : "Bình thường",
      ])
    );
  }

  return (
    <>
      <WarehouseErrorNotice error={stockError} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="block min-w-[240px] max-w-md flex-1 text-sm">
          Tìm tồn theo lô, sản phẩm hoặc vị trí
          <Input
            value={stockSearch}
            maxLength={150}
            onChange={(e) => onStockSearchChange(e.target.value)}
            placeholder="Nhập tên hoặc mã…"
          />
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["ALL", "Tất cả"],
              ["EXPIRING", "Sắp hết / quá hạn"],
              ["HELD", "Đang cách ly"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onFilterModeChange(mode)}
              className={
                "rounded-[2px] border px-2.5 py-1 text-xs font-medium transition " +
                (filterMode === mode
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50")
              }
            >
              {label}
            </button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!filteredRows.length}
            onClick={handleExportCsv}
            className="ml-1 whitespace-nowrap"
          >
            <Download size={14} />
            Xuất CSV
          </Button>
        </div>
      </div>

      <WarehouseTable
        head={[
          "Lô",
          "Vị trí",
          "Hạn dùng",
          "Tồn / Giữ (kg)",
          "Khả dụng (kg)",
          "Chất lượng",
        ]}
        numericCols={[3, 4]}
        sortKeys={[undefined, undefined, "expiryDate", undefined, "availableKg", undefined]}
        sort={sort}
        onSort={toggleSort}
        empty={stockLoaded && !filteredRows.length}
      >
        {filteredRows.map((b) => (
          <tr key={b.id}>
            <td>
              <span className="font-mono font-medium">{b.lotCode}</span>
              <span className="block text-xs text-slate-500">
                {b.productId}
              </span>
            </td>
            <td>{locationLabel(b.locationId)}</td>
            <td>
              <span
                className={
                  "inline-flex rounded-[2px] border px-1.5 py-0.5 font-mono text-[11px] font-medium " +
                  (b.expiryDate < todayIso
                    ? "border-rose-300 bg-rose-50 text-rose-900"
                    : b.expiryDate <= expiryCutoffIso
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-slate-300 bg-slate-100 text-slate-700")
                }
              >
                {b.expiryDate}
              </span>
            </td>
            <td className="text-right font-mono tabular-nums">
              {quantity(b.quantityKg)} / {quantity(b.reservedKg)}
            </td>
            <td className="text-right font-mono font-semibold tabular-nums text-emerald-800">
              {quantity(b.availableKg)}
            </td>
            <td>
              <span>{b.held ? "Cách ly" : "Chưa cách ly"}</span>
              <Button
                className="ml-2 whitespace-nowrap"
                size="sm"
                variant="secondary"
                onClick={() => onInspect(b)}
              >
                {b.held ? "Giải phóng" : "Cách ly"}
              </Button>
            </td>
          </tr>
        ))}
      </WarehouseTable>

      <div className="flex items-center justify-end gap-3 text-sm">
        <span>
          {rows.length} dòng trên trang {stockPage + 1}
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={stockPage === 0}
          onClick={() => onStockPageChange(stockPage - 1)}
        >
          Tồn trước
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!hasNext}
          onClick={() => onStockPageChange(stockPage + 1)}
        >
          Tồn sau
        </Button>
      </div>

      <h2 className="font-semibold">Lịch sử kiểm tra</h2>
      <WarehouseErrorNotice error={inspectionsError} />
      <WarehouseTable
        head={["Thời gian", "Lô", "Kết quả", "Ghi nhận", "Người thực hiện"]}
        empty={!inspections.length}
      >
        {inspections.map((i) => (
          <tr key={i.id}>
            <td>{formatTime(i.createdAt)}</td>
            <td>{inspectionLotCode(i.balanceId)}</td>
            <td>{i.held ? "Cách ly" : "Giải phóng"}</td>
            <td>{i.note}</td>
            <td>{i.actor}</td>
          </tr>
        ))}
      </WarehouseTable>
    </>
  );
}
