"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Clock,
  MapPin,
  Minus,
  Package,
  RefreshCw,
  Thermometer,
  X,
} from "lucide-react";
import { warehouseHeatmapService as service } from "@/services/warehouse-heatmap.service";
import { getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "@/stores/toast-store";
import type {
  HeatmapCell,
  HeatmapSignal,
  HeatmapState,
  LocationCoordinates,
} from "@/types/warehouse-heatmap";

const quantity = (n: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(n);
const time = (s: string) =>
  new Date(s).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
const date = (s: string) => s.split("-").reverse().join("/");
const colors: Record<HeatmapState, string> = {
  GOOD: "border-emerald-300 bg-emerald-50 text-emerald-950",
  WARNING: "border-amber-300 bg-amber-50 text-amber-950",
  DANGER: "border-red-300 bg-red-50 text-red-950",
  UNKNOWN: "border-slate-300 bg-slate-100 text-slate-600",
  EMPTY: "border-slate-200 bg-white text-slate-500",
};
const icons = {
  GOOD: Check,
  WARNING: Clock,
  DANGER: AlertTriangle,
  UNKNOWN: Minus,
  EMPTY: Package,
};
const layers = {
  overall: "Tổng quan",
  capacity: "Sức chứa",
  expiry: "Hạn dùng",
  temperature: "Nhiệt độ",
} as const;
type Layer = keyof typeof layers;
function Signal({ signal }: { signal: HeatmapSignal }) {
  const Icon = icons[signal.state];
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs " +
        colors[signal.state]
      }
    >
      <Icon size={13} aria-hidden />
      {signal.label}
    </span>
  );
}
function Dialog({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl outline-none"
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
          if (e.key === "Tab") {
            const elements = ref.current?.querySelectorAll<HTMLElement>(
              "button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]"
            );
            if (elements?.length) {
              const first = elements[0],
                last = elements[elements.length - 1];
              if (
                e.shiftKey &&
                (document.activeElement === first ||
                  document.activeElement === ref.current)
              ) {
                e.preventDefault();
                last.focus();
              } else if (
                !e.shiftKey &&
                (document.activeElement === last ||
                  document.activeElement === ref.current)
              ) {
                e.preventDefault();
                first.focus();
              }
            }
          }
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            aria-label="Đóng"
            className="rounded p-1 hover:bg-slate-100"
            onClick={close}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Shelf({
  cell,
  layer,
  dimmed,
  open,
}: {
  cell: HeatmapCell;
  layer: Layer;
  dimmed: boolean;
  open: () => void;
}) {
  const signal = cell[layer],
    Icon = icons[signal.state];
  return (
    <button
      onClick={open}
      aria-label={`${cell.code}, ${signal.label}, ${quantity(cell.quantityKg)} kg`}
      title={`${cell.name} · ${signal.label}`}
      className={`relative min-h-32 rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${colors[signal.state]} ${dimmed ? "opacity-30" : ""}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-bold">{cell.code}</span>
        <Icon size={16} aria-hidden />
      </div>
      <p className="mt-2 text-lg font-semibold">
        {layer === "temperature"
          ? cell.reading?.fresh
            ? `${quantity(cell.reading.temperature)} °C`
            : "Chưa rõ"
          : layer === "expiry"
            ? cell.earliestExpiry
              ? date(cell.earliestExpiry)
              : "Kệ trống"
            : `${quantity(cell.occupancyPercent)}%`}
      </p>
      <p className="text-xs opacity-80">
        {quantity(cell.quantityKg)} / {quantity(cell.capacityKg)} kg ·{" "}
        {cell.lots.length} lô
      </p>
      <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
        {cell.heldKg > 0 && (
          <span className="rounded bg-white/80 px-1">Giữ chất lượng</span>
        )}
        {!cell.active && (
          <span className="rounded bg-white/80 px-1">Ngừng hoạt động</span>
        )}
        {cell.reading?.simulated && (
          <span className="rounded bg-white/80 px-1">Giả lập</span>
        )}
        {cell.measurementScope === "WAREHOUSE" && (
          <span className="rounded bg-white/80 px-1">Nhiệt độ cả kho</span>
        )}
      </div>
    </button>
  );
}
export function WarehouseHeatmapPanel({
  warehouseId,
}: {
  warehouseId: string;
}) {
  const client = useQueryClient();
  const [layer, setLayer] = useState<Layer>("overall"),
    [level, setLevel] = useState(1),
    [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [edit, setEdit] = useState<
    (LocationCoordinates & { locationId: string }) | null
  >(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const map = useQuery({
    queryKey: ["warehouse", warehouseId, "heatmap"],
    queryFn: () => service.map(warehouseId),
    retry: false,
    refetchInterval: 30000,
  });
  const cells = map.data?.cells ?? [],
    selected = cells.find((c) => c.locationId === selectedId);
  const placed = cells.filter((c) => c.layout?.level === level),
    unplaced = cells.filter((c) => !c.layout);
  const rows = Math.max(3, ...placed.map((c) => c.layout!.row)),
    columns = Math.max(4, ...placed.map((c) => c.layout!.column));
  const grid = new Map(
    placed.map((c) => [`${c.layout!.row}:${c.layout!.column}`, c])
  );
  const matches = (c: HeatmapCell) =>
    [c.code, c.name, ...c.lots.flatMap((l) => [l.lotCode, l.productId])]
      .join(" ")
      .toLocaleLowerCase("vi")
      .includes(search.trim().toLocaleLowerCase("vi"));
  async function mutate(operation: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    try {
      await operation();
      await client.invalidateQueries({
        queryKey: ["warehouse", warehouseId, "heatmap"],
      });
      toast.success(message);
      return true;
    } catch (e) {
      setError(getApiErrorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  function startEdit(c: HeatmapCell) {
    setSelectedId(null);
    setError("");
    setEdit({
      locationId: c.locationId,
      row: c.layout?.row ?? 1,
      column: c.layout?.column ?? 1,
      level: c.layout?.level ?? level,
    });
  }
  const legends: [HeatmapState, string][] =
    layer === "capacity"
      ? [
          ["GOOD", "Dưới 70%"],
          ["WARNING", "Từ 70% đến 100%"],
          ["DANGER", "Vượt 100%"],
          ["EMPTY", "Kệ trống"],
        ]
      : layer === "expiry"
        ? [
            ["GOOD", "Chưa gần hạn"],
            ["WARNING", `Còn ≤ ${map.data?.expiryWarningDays ?? 3} ngày`],
            ["DANGER", "Quá hạn"],
            ["EMPTY", "Kệ trống"],
          ]
        : layer === "temperature"
          ? [
              ["GOOD", "Trong ngưỡng"],
              ["WARNING", "Vượt ngưỡng, chờ đủ thời gian"],
              ["DANGER", "Sự cố / lệch mục tiêu"],
              ["UNKNOWN", "Thiếu hoặc cũ số đo"],
            ]
          : [
              ["GOOD", "Trong ngưỡng"],
              ["WARNING", "Cần theo dõi"],
              ["DANGER", "Cần xử lý"],
              ["UNKNOWN", "Thiếu số đo mới"],
              ["EMPTY", "Kệ trống"],
            ];
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <MapPin className="text-emerald-700" size={22} />
            Sơ đồ kho
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Chọn kệ để xem lô hàng, sức chứa và tình trạng bảo quản.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => void map.refetch()}
          disabled={map.isFetching}
        >
          <RefreshCw size={15} />
          Làm mới
        </Button>
      </div>
      {map.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {getApiErrorMessage(map.error)}
        </div>
      )}
      {map.isPending && <p role="status">Đang tải sơ đồ kho…</p>}
      {map.data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              [
                "Đã xếp trên sơ đồ",
                `${cells.length - unplaced.length} / ${cells.length} kệ`,
              ],
              [
                "Tồn thực tế",
                `${quantity(cells.reduce((s, c) => s + c.quantityKg, 0))} kg`,
              ],
              [
                "Cần xử lý",
                `${cells.filter((c) => c.overall.state === "DANGER").length} kệ`,
              ],
              [
                "Chưa có số đo mới",
                `${cells.filter((c) => c.temperature.state === "UNKNOWN").length} kệ`,
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border bg-white p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-slate-500">
              Lớp màu
              <Select
                aria-label="Lớp màu"
                value={layer}
                onChange={(e) => setLayer(e.target.value as Layer)}
              >
                {Object.entries(layers).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-xs text-slate-500">
              Tầng
              <Select
                aria-label="Tầng"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Tầng {i + 1}
                  </option>
                ))}
              </Select>
            </label>
            <label className="min-w-48 flex-1 text-xs text-slate-500">
              Tìm kệ hoặc lô
              <Input
                aria-label="Tìm kệ hoặc lô"
                placeholder="Mã kệ, mã lô, sản phẩm…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Chú giải">
            {legends.map(([state, label]) => (
              <Signal key={state} signal={{ state, label }} />
            ))}
          </div>
          <div className="rounded-2xl border bg-slate-50 p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>Tầng {level} · Hàng × Cột · Bấm ô trống để xếp kệ</span>
              <span>{placed.length} kệ</span>
            </div>
            <div className="overflow-x-auto pb-2">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `32px repeat(${columns},minmax(150px,1fr))`,
                  gap: 10,
                  minWidth: columns * 160 + 32,
                }}
              >
                <span aria-hidden />
                {Array.from({ length: columns }, (_, i) => (
                  <span
                    key={`c${i}`}
                    className="text-center text-xs font-medium text-slate-500"
                  >
                    Cột {i + 1}
                  </span>
                ))}
                {Array.from({ length: rows }, (_, r) => [
                  <span
                    key={`r${r}`}
                    className="flex items-center text-xs text-slate-500"
                  >
                    {r + 1}
                  </span>,
                  ...Array.from({ length: columns }, (_, c) => {
                    const cell = grid.get(`${r + 1}:${c + 1}`);
                    return cell ? (
                      <Shelf
                        key={cell.locationId}
                        cell={cell}
                        layer={layer}
                        dimmed={!matches(cell)}
                        open={() => setSelectedId(cell.locationId)}
                      />
                    ) : (
                      <button
                        key={`${r}:${c}`}
                        aria-label={`Xếp kệ vào hàng ${r + 1}, cột ${c + 1}, tầng ${level}`}
                        className="min-h-32 rounded-xl border border-dashed border-slate-300 text-sm text-slate-400 hover:border-emerald-500 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                        onClick={() => {
                          setError("");
                          setEdit({
                            locationId: "",
                            row: r + 1,
                            column: c + 1,
                            level,
                          });
                        }}
                      >
                        + Xếp kệ
                      </button>
                    );
                  }),
                ])}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
            <span>
              Nhiệt độ ghi “cả kho” là số đo đại diện. Số đo giả lập có nhãn
              riêng.
            </span>
            <span>
              Cập nhật {time(map.data.generatedAt)} · Tự làm mới mỗi 30 giây
            </span>
          </div>
          {map.data.warehouseAlerts > 0 && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Có {map.data.warehouseAlerts} cảnh báo chung của kho. Xem đầy đủ
              tại tab Cảnh báo.
            </p>
          )}
          <section className="space-y-3">
            <h3 className="font-semibold">
              Kệ chưa xếp trên sơ đồ{" "}
              <span className="text-slate-400">({unplaced.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Tọa độ chỉ mô tả vị trí trên sơ đồ. Muốn chuyển hàng thật, dùng
              chứng từ Chuyển kho.
            </p>
            {unplaced.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {unplaced.filter(matches).map((c) => (
                  <div
                    key={c.locationId}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3"
                  >
                    <button
                      className="min-w-0 text-left"
                      onClick={() => setSelectedId(c.locationId)}
                    >
                      <p className="font-medium">
                        {c.code} · {c.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {quantity(c.quantityKg)} kg · {c.lots.length} lô
                      </p>
                    </button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => startEdit(c)}
                    >
                      Xếp kệ
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {cells.length
                  ? "Tất cả kệ đã có tọa độ."
                  : "Chưa có vị trí lưu trữ. Tạo vị trí tại tab Kho & vị trí trước."}
              </p>
            )}
          </section>
        </>
      )}
      {selected && (
        <Dialog
          title={`${selected.code} · ${selected.name}`}
          close={() => setSelectedId(null)}
        >
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Signal signal={selected.capacity} />
              <Signal signal={selected.expiry} />
              <Signal signal={selected.temperature} />
              {!selected.active && (
                <span className="text-sm">Ngừng hoạt động</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Tồn thực tế", selected.quantityKg],
                ["Giữ chất lượng", selected.heldKg],
                ["Giữ cho đơn", selected.reservedKg],
                ["Khả dụng", selected.availableKg],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="font-semibold">{quantity(Number(value))} kg</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Sức chứa {quantity(selected.capacityKg)} kg · Đã dùng{" "}
              {quantity(selected.occupancyPercent)}%. Hàng giữ chất lượng và giữ
              cho đơn đều nằm trong tồn thực tế.
            </p>
            <div className="rounded-xl border p-4">
              <h3 className="flex items-center gap-2 font-medium">
                <Thermometer size={16} />
                Nhiệt độ bảo quản
              </h3>
              <p className="mt-1 text-sm">
                {selected.temperature.label} · {selected.temperaturePolicy}
              </p>
              {selected.reading && (
                <>
                  <p className="mt-2 font-semibold">
                    {quantity(selected.reading.temperature)} °C · Độ ẩm{" "}
                    {quantity(selected.reading.humidity)}%{" "}
                    {selected.reading.simulated && (
                      <span className="text-amber-700">(GIẢ LẬP)</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selected.reading.deviceName} ·{" "}
                    {selected.measurementScope === "WAREHOUSE"
                      ? "Số đo đại diện cả kho, không phải cảm biến riêng của kệ"
                      : "Cảm biến tại kệ"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Đo lúc {time(selected.reading.recordedAt)} · Nhận lúc{" "}
                    {time(selected.reading.receivedAt)}
                    {!selected.reading.fresh && " · SỐ ĐO ĐÃ CŨ"}
                  </p>
                </>
              )}
            </div>
            <section>
              <h3 className="mb-2 font-medium">
                Lô hàng trên kệ ({selected.lots.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs text-slate-500">
                      {[
                        "Lô / sản phẩm",
                        "Hạn dùng",
                        "Thực tế",
                        "Giữ đơn",
                        "Khả dụng",
                        "Chất lượng",
                      ].map((h) => (
                        <th key={h} className="whitespace-nowrap p-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lots.map((l) => (
                      <tr key={l.id} className="border-b">
                        <td className="p-2">
                          <b>{l.lotCode}</b>
                          <p className="text-xs text-slate-500">
                            {l.productId}
                          </p>
                        </td>
                        <td className="whitespace-nowrap p-2">
                          {date(l.expiryDate)}
                        </td>
                        <td className="p-2">{quantity(l.quantityKg)} kg</td>
                        <td className="p-2">{quantity(l.reservedKg)}</td>
                        <td className="p-2">{quantity(l.availableKg)}</td>
                        <td className="p-2">
                          {l.held ? "Đang giữ" : "Không giữ"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!selected.lots.length && (
                <p className="p-3 text-sm text-slate-500">
                  Kệ hiện chưa có hàng.
                </p>
              )}
            </section>
            {selected.alerts.length > 0 && (
              <section>
                <h3 className="mb-2 font-medium">Cảnh báo liên quan</h3>
                {selected.alerts.map((a) => (
                  <p
                    key={a.id}
                    className="mb-2 rounded-lg bg-amber-50 p-3 text-sm"
                  >
                    {a.severity} ·{" "}
                    {a.status === "ACKNOWLEDGED" ? "Đã tiếp nhận" : "Đang mở"} ·{" "}
                    {a.message}
                  </p>
                ))}
              </section>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                {selected.layout
                  ? `Hàng ${selected.layout.row} · Cột ${selected.layout.column} · Tầng ${selected.layout.level}. Cập nhật bởi ${selected.layout.updatedBy} lúc ${time(selected.layout.updatedAt)}`
                  : "Chưa gán tọa độ"}
              </p>
              <Button variant="secondary" onClick={() => startEdit(selected)}>
                Sửa tọa độ
              </Button>
            </div>
          </div>
        </Dialog>
      )}
      {edit && (
        <Dialog
          title="Xếp vị trí trên sơ đồ"
          close={() => !busy && setEdit(null)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await mutate(
                  () => service.place(warehouseId, edit.locationId, edit),
                  "Đã lưu tọa độ kệ."
                )
              ) {
                setLevel(edit.level);
                setEdit(null);
              }
            }}
          >
            <label className="block text-sm">
              Vị trí lưu trữ
              <Select
                aria-label="Vị trí lưu trữ"
                required
                value={edit.locationId}
                onChange={(e) =>
                  setEdit({ ...edit, locationId: e.target.value })
                }
              >
                <option value="">Chọn kệ chưa xếp</option>
                {cells
                  .filter((c) => !c.layout || c.locationId === edit.locationId)
                  .map((c) => (
                    <option key={c.locationId} value={c.locationId}>
                      {c.code} · {c.name}
                    </option>
                  ))}
              </Select>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  ["row", "Hàng", 30],
                  ["column", "Cột", 30],
                  ["level", "Tầng", 10],
                ] as const
              ).map(([field, label, max]) => (
                <label key={field} className="text-sm">
                  {label}
                  <Input
                    aria-label={label}
                    type="number"
                    min={1}
                    max={max}
                    step={1}
                    required
                    value={edit[field]}
                    onChange={(e) =>
                      setEdit({ ...edit, [field]: Number(e.target.value) })
                    }
                  />
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Tối đa 30 hàng × 30 cột, 10 tầng. Mỗi ô chứa một vị trí lưu trữ.
              Sửa tọa độ không thay đổi tồn kho.
            </p>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex flex-wrap justify-between gap-3">
              {cells.find((c) => c.locationId === edit.locationId)?.layout ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      await mutate(
                        () => service.unplace(warehouseId, edit.locationId),
                        "Đã đưa kệ về danh sách chưa xếp."
                      )
                    )
                      setEdit(null);
                  }}
                >
                  Bỏ tọa độ
                </Button>
              ) : (
                <span />
              )}
              <Button
                disabled={busy || !edit.locationId}
                loading={busy}
                type="submit"
              >
                Lưu tọa độ
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}
