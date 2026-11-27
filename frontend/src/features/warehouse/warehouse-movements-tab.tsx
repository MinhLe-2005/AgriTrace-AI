"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MOVEMENT_LABELS,
  WarehouseErrorNotice,
  WarehouseTable,
  downloadCsv,
  formatTime,
  quantity,
} from "./warehouse-utils";
import type { Movement } from "@/types/warehouse";

interface LotMeta {
  productId?: string;
  lotCode?: string;
}

interface Props {
  warehouseName?: string;
  movements: Movement[];
  error: unknown;
  locationLabel: (locationId: string) => string;
  getLotMeta: (lotId: string) => LotMeta | undefined;
}

type DirectionFilter = "ALL" | "IN" | "OUT" | "OTHER";

export function WarehouseMovementsTab({
  warehouseName,
  movements,
  error,
  locationLabel,
  getLotMeta,
}: Props) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [directionFilter, setDirectionFilter] =
    useState<DirectionFilter>("ALL");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({
    key: "occurredAt",
    dir: "desc",
  });
  function toggleSort(key: string) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "occurredAt" ? "desc" : "asc" }
    );
  }

  const filteredMovements = useMemo(() => {
    const q = debouncedSearch.trim().toLocaleLowerCase("vi");
    const base = movements.filter((m) => {
      if (directionFilter === "IN" && m.deltaKg <= 0) return false;
      if (directionFilter === "OUT" && m.deltaKg >= 0) return false;
      if (
        directionFilter === "OTHER" &&
        m.type !== "COUNT" &&
        m.type !== "ADJUSTMENT"
      )
        return false;
      if (!q) return true;
      const meta = getLotMeta(m.lotId);
      const haystack = [
        meta?.lotCode ?? m.lotId,
        meta?.productId ?? "",
        locationLabel(m.locationId),
        m.actor,
        MOVEMENT_LABELS[m.type]?.label ?? m.type,
      ]
        .join(" ")
        .toLocaleLowerCase("vi");
      return haystack.includes(q);
    });
    const copy = [...base];
    copy.sort((a, b) => {
      const mul = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "deltaKg") return (a.deltaKg - b.deltaKg) * mul;
      return a.occurredAt.localeCompare(b.occurredAt) * mul;
    });
    return copy;
  }, [movements, directionFilter, debouncedSearch, getLotMeta, locationLabel, sort]);

  function handleExportCsv() {
    downloadCsv(
      `nhat-ky-kho-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Kho",
        "Thời gian",
        "Mã lô",
        "Sản phẩm",
        "Vị trí",
        "Loại biến động",
        "Biến động (kg)",
        "Tồn sau (kg)",
        "Người thực hiện",
      ],
      filteredMovements.map((m) => {
        const meta = getLotMeta(m.lotId);
        return [
          warehouseName ?? "",
          formatTime(m.occurredAt),
          meta?.lotCode ?? m.lotId.slice(0, 8),
          meta?.productId ?? "",
          locationLabel(m.locationId),
          MOVEMENT_LABELS[m.type]?.label ?? m.type,
          m.deltaKg,
          m.balanceAfterKg,
          m.actor,
        ];
      })
    );
  }

  return (
    <>
      <WarehouseErrorNotice error={error} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="block min-w-[240px] max-w-md flex-1 text-sm">
          Tìm nhật ký theo lô, vị trí hoặc người thực hiện
          <Input
            value={search}
            maxLength={120}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mã lô, sản phẩm, vị trí, người thao tác…"
          />
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["ALL", "Tất cả"],
              ["IN", "Nhập / Tăng (+)"],
              ["OUT", "Xuất / Giảm (-)"],
              ["OTHER", "Kiểm kê / Điều chỉnh"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setDirectionFilter(key)}
              className={
                "rounded-[2px] border px-2.5 py-1 text-xs font-medium transition " +
                (directionFilter === key
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
            disabled={!filteredMovements.length}
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
          "Thời gian",
          "Lô / vị trí",
          "Loại",
          "Biến động (kg)",
          "Tồn sau (kg)",
          "Người thực hiện",
        ]}
        numericCols={[3, 4]}
        sortKeys={["occurredAt", undefined, undefined, "deltaKg", undefined, undefined]}
        sort={sort}
        onSort={toggleSort}
        empty={!filteredMovements.length}
      >
        {filteredMovements.map((m) => (
          <tr key={m.id}>
            <td className="font-mono text-xs">{formatTime(m.occurredAt)}</td>
            <td>
              <span className="font-mono font-medium">
                {getLotMeta(m.lotId)?.lotCode ?? m.lotId.slice(0, 8)}
              </span>{" "}
              / {locationLabel(m.locationId)}
            </td>
            <td>
              <span
                className={
                  "inline-flex rounded-[2px] border px-1.5 py-0.5 text-[11px] font-medium " +
                  (MOVEMENT_LABELS[m.type]?.cls ??
                    "border-slate-300 bg-slate-100 text-slate-700")
                }
              >
                {MOVEMENT_LABELS[m.type]?.label ?? m.type}
              </span>
            </td>
            <td
              className={
                "text-right font-mono font-semibold tabular-nums " +
                (m.deltaKg > 0
                  ? "text-emerald-700"
                  : m.deltaKg < 0
                    ? "text-rose-700"
                    : "text-slate-600")
              }
            >
              {m.deltaKg > 0 ? "+" : ""}
              {quantity(m.deltaKg)}
            </td>
            <td className="text-right font-mono tabular-nums">
              {quantity(m.balanceAfterKg)}
            </td>
            <td>{m.actor}</td>
          </tr>
        ))}
      </WarehouseTable>
    </>
  );
}
