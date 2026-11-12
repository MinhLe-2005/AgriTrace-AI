"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Warehouse as WarehouseIcon } from "lucide-react";
import { warehouseService as service } from "@/services/warehouse.service";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { WarehouseDocumentEditor } from "./warehouse-document-editor";
import {
  WarehouseMonitoringPanel,
  WarehouseLiveBadge,
} from "./warehouse-monitoring-panel";
import { useWarehouseLive } from "./use-warehouse-live";
import { WarehouseHeatmapPanel } from "./warehouse-heatmap";
import type {
  DocumentType,
  WarehouseDocument,
  Warehouse,
  StorageLocation,
  Allocation,
  AlertAction,
} from "@/types/warehouse";

const labels: Record<DocumentType, string> = {
  INBOUND: "Nhập kho",
  OUTBOUND: "Xuất kho",
  COUNT: "Kiểm kê",
  ADJUSTMENT: "Điều chỉnh",
  TRANSFER: "Chuyển kho",
};
const tabs = [
  "Tổng quan",
  "Kho & vị trí",
  "Tồn & chất lượng",
  "Chứng từ",
  "FEFO & giữ hàng",
  "Cảnh báo",
  "Giám sát",
  "Sơ đồ kho",
  "Nhật ký",
] as const;
const quantity = (value?: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(
    value ?? 0
  );
const time = (value?: string) =>
  value
    ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : "—";
const date = (value: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
interface Field {
  name: string;
  label: string;
  type?: string;
  value?: string | number;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  optional?: boolean;
}
interface Action {
  title: string;
  fields: Field[];
  submit: (data: FormData) => Promise<unknown>;
}
function str(data: FormData, key: string) {
  return String(data.get(key) ?? "").trim();
}
function num(data: FormData, key: string) {
  return Number(data.get(key));
}
function ErrorNotice({ error }: { error: unknown }) {
  return error ? (
    <p
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
    >
      {getApiErrorMessage(error)}
    </p>
  ) : null;
}
function Table({
  head,
  empty,
  children,
}: {
  head: string[];
  empty?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            {head.map((h) => (
              <th className="p-3 font-medium" key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y [&_td]:p-3">
          {empty ? (
            <tr>
              <td
                colSpan={head.length}
                className="py-8 text-center text-slate-500"
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
function Status({ value }: { value: string }) {
  const names: Record<string, string> = {
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
  return (
    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
      {names[value] ?? value}
    </span>
  );
}
export function WarehouseManager() {
  const user = useAuthStore((s) => s.user);
  const authorized = !!user?.roles.some(
    (r) => r === "WAREHOUSE" || r === "ADMIN"
  );
  const client = useQueryClient();
  const [id, setId] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]>("Tổng quan");
  const [busy, setBusy] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [detail, setDetail] = useState<WarehouseDocument | null>(null);
  const [confirmation, setConfirmation] = useState<WarehouseDocument | null>(
    null
  );
  const [history, setHistory] = useState<AlertAction[] | null>(null);
  const [allocation, setAllocation] = useState<Allocation[] | null>(null);
  const [page, setPage] = useState(0);
  const [stockPage, setStockPage] = useState(0);
  const [stockSearch, setStockSearch] = useState("");
  useEffect(() => {
    setPage(0);
    setStockPage(0);
  }, [tab]);
  const [from, setFrom] = useState(date(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(date(new Date()));
  const warehouses = useQuery({
    queryKey: ["warehouse", "all"],
    queryFn: service.all,
    enabled: authorized,
    retry: false,
  });
  useEffect(() => {
    if (!id && warehouses.data?.length) setId(warehouses.data[0].id);
  }, [id, warehouses.data]);
  useEffect(() => {
    setPage(0);
    setAllocation(null);
  }, [id, tab, from, to]);
  useEffect(() => {
    setStockPage(0);
  }, [id, stockSearch]);
  const enabled = !!id && authorized;
  const liveStatus = useWarehouseLive(enabled ? id : "");
  const locations = useQuery({
    queryKey: ["warehouse", id, "locations"],
    queryFn: () => service.locations(id),
    enabled,
    retry: false,
  });
  const stock = useQuery({
    queryKey: ["warehouse", id, "stock"],
    queryFn: () => service.stock(id),
    enabled,
    retry: false,
  });
  const conversions = useQuery({
    queryKey: ["warehouse", id, "conversions"],
    queryFn: () => service.conversions(id),
    enabled: enabled && tab === "Kho & vị trí",
    retry: false,
  });
  const documents = useQuery({
    queryKey: ["warehouse", id, "documents", page],
    queryFn: () => service.documents(id, page),
    enabled: enabled && tab === "Chứng từ",
    retry: false,
  });
  const reservations = useQuery({
    queryKey: ["warehouse", id, "reservations", page],
    queryFn: () => service.reservations(id, page),
    enabled: enabled && tab === "FEFO & giữ hàng",
    retry: false,
  });
  const alerts = useQuery({
    queryKey: ["warehouse", id, "alerts"],
    queryFn: () => service.alerts(id),
    enabled: enabled && tab === "Cảnh báo",
    retry: false,
  });
  const rules = useQuery({
    queryKey: ["warehouse", id, "rules"],
    queryFn: () => service.rules(id),
    enabled: enabled && tab === "Cảnh báo",
    retry: false,
  });
  const inspections = useQuery({
    queryKey: ["warehouse", id, "inspections", page],
    queryFn: () => service.inspections(id, page),
    enabled: enabled && tab === "Tồn & chất lượng",
    retry: false,
  });
  const dashboard = useQuery({
    queryKey: ["warehouse", id, "dashboard", from, to],
    queryFn: () => service.dashboard(id, from, to),
    enabled: enabled && tab === "Tổng quan",
    retry: false,
  });
  const forecast = useQuery({
    queryKey: ["warehouse", id, "forecast"],
    queryFn: () => service.forecast(id),
    enabled: enabled && tab === "Tổng quan",
    retry: false,
  });
  const movements = useQuery({
    queryKey: ["warehouse", id, "movements", from, to, page],
    queryFn: () => service.movements(id, from, to, page),
    enabled: enabled && tab === "Nhật ký",
    retry: false,
  });
  const warehouse = warehouses.data?.find((w) => w.id === id);
  const locationLabel = (value: string) =>
    locations.data?.find((l) => l.id === value)?.code ?? value.slice(0, 8);
  async function run(
    fn: () => Promise<unknown>,
    message = "Đã lưu thay đổi.",
    actionId?: string
  ) {
    if (actionId ? actionLoadingId === actionId : busy) return false;
    if (actionId) setActionLoadingId(actionId);
    setBusy(true);
    try {
      await fn();
      await client.invalidateQueries({ queryKey: ["warehouse"] });
      toast.success(message);
      return true;
    } catch (e) {
      toast.error(getApiErrorMessage(e));
      return false;
    } finally {
      if (actionId) setActionLoadingId(null);
      setBusy(false);
    }
  }
  const capacityFields = (w?: Warehouse | StorageLocation): Field[] => [
    {
      name: "capacityTons",
      label: "Sức chứa (tấn)",
      type: "number",
      min: 0.01,
      max: 99999999.99,
      step: 0.01,
      value: w?.capacityTons ?? 1,
    },
    {
      name: "tempTargetC",
      label: "Nhiệt độ mục tiêu (°C)",
      type: "number",
      min: -999.9,
      max: 999.9,
      step: 0.1,
      value: w?.tempTargetC ?? 4,
    },
    {
      name: "humidityTarget",
      label: "Độ ẩm mục tiêu (%)",
      type: "number",
      min: 0,
      max: 100,
      step: 0.1,
      value: w?.humidityTarget ?? 85,
    },
  ];
  function editWarehouse(w?: Warehouse) {
    setAction({
      title: w ? "Sửa kho" : "Tạo kho",
      fields: [
        { name: "name", label: "Tên kho", value: w?.name },
        { name: "location", label: "Địa chỉ", value: w?.location },
        ...capacityFields(w),
      ],
      submit: (data) =>
        service.save(
          {
            name: str(data, "name"),
            location: str(data, "location"),
            capacityTons: num(data, "capacityTons"),
            tempTargetC: num(data, "tempTargetC"),
            humidityTarget: num(data, "humidityTarget"),
            managerId: w?.managerId ?? null,
          },
          w?.id
        ),
    });
  }
  function editLocation(l?: StorageLocation) {
    setAction({
      title: l ? "Sửa vị trí" : "Thêm vị trí",
      fields: [
        { name: "code", label: "Mã vị trí", value: l?.code },
        { name: "name", label: "Tên vị trí", value: l?.name },
        ...capacityFields(l),
      ],
      submit: (data) =>
        service.saveLocation(
          id,
          {
            code: str(data, "code"),
            name: str(data, "name"),
            capacityTons: num(data, "capacityTons"),
            tempTargetC: num(data, "tempTargetC"),
            humidityTarget: num(data, "humidityTarget"),
          },
          l?.id
        ),
    });
  }
  const productFields: Field[] = [
    {
      name: "productId",
      label: "Sản phẩm",
      options: [...new Set(stock.data?.map((b) => b.productId))].map((p) => ({
        value: p,
        label: p,
      })),
    },
    {
      name: "quantityKg",
      label: "Số lượng (kg)",
      type: "number",
      min: 0.001,
      step: 0.001,
      value: 1,
    },
  ];
  const paginated =
    tab === "Chứng từ" ||
    tab === "Nhật ký" ||
    tab === "FEFO & giữ hàng" ||
    tab === "Tồn & chất lượng";
  const pageLength =
    tab === "Chứng từ"
      ? documents.data?.length
      : tab === "Nhật ký"
        ? movements.data?.length
        : tab === "FEFO & giữ hàng"
          ? reservations.data?.length
          : inspections.data?.length;
  const filteredStock = (stock.data ?? []).filter((b) =>
    `${b.lotCode} ${b.productId} ${locationLabel(b.locationId)}`
      .toLocaleLowerCase("vi")
      .includes(stockSearch.toLocaleLowerCase("vi"))
  );
  const activeQuery =
    tab === "Tổng quan"
      ? dashboard
      : tab === "Kho & vị trí"
        ? locations
        : tab === "Tồn & chất lượng"
          ? stock
          : tab === "Chứng từ"
            ? documents
            : tab === "FEFO & giữ hàng"
              ? reservations
              : tab === "Cảnh báo"
                ? alerts
                : movements;
  if (!authorized)
    return (
      <p role="alert" className="rounded-xl bg-amber-50 p-5">
        Tài khoản cần quyền Warehouse hoặc Admin để quản lý kho.
      </p>
    );
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-white">
        <div className="flex gap-3">
          <WarehouseIcon className="size-10 text-emerald-300" />
          <div>
            <h1 className="text-xl font-semibold">Quản lý kho nông sản</h1>
            <p className="mt-1 text-sm text-slate-300">
              Nhập kho · tồn theo lô · FEFO · kiểm kê và cảnh báo
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              client.invalidateQueries({ queryKey: ["warehouse"] })
            }
          >
            <RefreshCw size={16} />
            Tải lại
          </Button>
          <Button onClick={() => editWarehouse()}>
            <Plus size={16} />
            Tạo kho
          </Button>
        </div>
      </header>
      <ErrorNotice error={warehouses.error} />
      {warehouses.isPending && <p role="status">Đang tải danh sách kho…</p>}
      {!warehouses.isPending &&
        !warehouses.error &&
        !warehouses.data?.length && (
          <p className="rounded-xl border bg-white p-8 text-center text-slate-500">
            Chưa có kho. Tạo kho đầu tiên để bắt đầu.
          </p>
        )}
      {enabled && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-sm">
              <span className="block">Kho đang quản lý</span>
              <Select value={id} onChange={(e) => setId(e.target.value)}>
                {warehouses.data?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                    {w.active ? "" : " (Đã ngừng)"}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm">
              Từ ngày
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="text-sm">
              Đến ngày
              <Input
                type="date"
                min={from}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            {(
              [
                "Tổng quan",
                "Chứng từ",
                "Tồn & chất lượng",
                "FEFO & giữ hàng",
              ] as string[]
            ).includes(tab) && (
              <>
                <Button
                  className="ml-auto"
                  disabled={!warehouse?.active}
                  onClick={() => setDocumentType("INBOUND")}
                >
                  Nhập kho
                </Button>
                <Button
                  variant="secondary"
                  disabled={!warehouse?.active}
                  onClick={() => setDocumentType("OUTBOUND")}
                >
                  Xuất kho
                </Button>
              </>
            )}
          </div>
          <nav
            aria-label="Chức năng kho"
            className="flex gap-1 overflow-x-auto border-b pb-2"
          >
            {tabs.map((t) => (
              <button
                key={t}
                aria-current={tab === t ? "page" : undefined}
                onClick={() => setTab(t)}
                className={
                  "whitespace-nowrap rounded-lg px-3 py-2 text-sm " +
                  (tab === t
                    ? "bg-emerald-700 text-white"
                    : "text-slate-600 hover:bg-slate-100")
                }
              >
                {t}
              </button>
            ))}
          </nav>
          {tab !== "Giám sát" && <WarehouseLiveBadge status={liveStatus} />}
          {tab === "Sơ đồ kho" && (
            <WarehouseHeatmapPanel key={id} warehouseId={id} />
          )}
          {tab === "Giám sát" && (
            <WarehouseMonitoringPanel
              key={id}
              warehouseId={id}
              locations={locations.data ?? []}
              liveStatus={liveStatus}
            />
          )}
          <ErrorNotice error={locations.error} />
          {tab !== "Tồn & chất lượng" && <ErrorNotice error={stock.error} />}
          {activeQuery.isFetching && (
            <p role="status" className="text-sm text-slate-500">
              Đang tải dữ liệu…
            </p>
          )}
          {tab === "Tổng quan" && (
            <>
              <ErrorNotice error={dashboard.error} />
              {dashboard.isPending && <p role="status">Đang tải thống kê…</p>}
              {dashboard.data && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["Tồn thực tế", dashboard.data.onHandKg],
                      ["Đang giữ cho đơn", dashboard.data.reservedKg],
                      ["Có thể sử dụng", dashboard.data.availableKg],
                      ["Sức chứa kho", dashboard.data.capacityKg],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl border bg-white p-4"
                      >
                        <p className="text-sm text-slate-500">{label}</p>
                        <p className="mt-2 text-2xl font-semibold">
                          {quantity(Number(value))}{" "}
                          <span className="text-sm font-normal">kg</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="rounded-xl border bg-white p-4 text-sm">
                    Trong kỳ: nhập{" "}
                    <strong>{quantity(dashboard.data.inboundKg)} kg</strong> ·
                    xuất{" "}
                    <strong>{quantity(dashboard.data.outboundKg)} kg</strong> ·{" "}
                    {dashboard.data.expiringBalances} lô/vị trí gần hết hạn ·{" "}
                    {dashboard.data.heldBalances} lô/vị trí cách ly ·{" "}
                    {dashboard.data.openAlerts} cảnh báo chưa hoàn tất ·{" "}
                    {dashboard.data.draftDocuments} phiếu nháp.
                  </p>
                </>
              )}
              <h2 className="text-lg font-semibold">
                Ước tính tiêu thụ từ lịch sử xuất
              </h2>
              <p className="text-sm text-slate-500">
                Trung bình 14 ngày; cần ít nhất 3 lần xuất. Số liệu là gợi ý để
                thủ kho đánh giá.
              </p>
              <ErrorNotice error={forecast.error} />
              <Table
                head={[
                  "Sản phẩm",
                  "Khả dụng (kg)",
                  "Xuất TB/ngày (kg)",
                  "Ngày để xuất hết",
                  "Đánh giá",
                ]}
                empty={!forecast.data?.length}
              >
                {forecast.data?.map((f) => (
                  <tr key={f.productId}>
                    <td>{f.productId}</td>
                    <td>{quantity(f.availableKg)}</td>
                    <td>{quantity(f.dailyOutboundKg)}</td>
                    <td>{f.daysToClear ?? "—"}</td>
                    <td>{f.recommendation}</td>
                  </tr>
                ))}
              </Table>
            </>
          )}
          {tab === "Kho & vị trí" && (
            <>
              {warehouse && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
                  <div>
                    <h2 className="font-semibold">{warehouse.name}</h2>
                    <p className="text-sm text-slate-500">
                      {warehouse.location} · {quantity(warehouse.capacityTons)}{" "}
                      tấn · {warehouse.tempTargetC}°C ·{" "}
                      {warehouse.humidityTarget}% ẩm
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => editWarehouse(warehouse)}
                    >
                      Sửa kho
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        run(() => service.status(id, !warehouse.active))
                      }
                    >
                      {warehouse.active ? "Ngừng hoạt động" : "Kích hoạt"}
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <h2 className="font-semibold">Vị trí lưu trữ</h2>
                <Button
                  disabled={!warehouse?.active}
                  onClick={() => editLocation()}
                >
                  Thêm vị trí
                </Button>
              </div>
              <ErrorNotice error={locations.error} />
              <Table
                head={[
                  "Mã",
                  "Tên",
                  "Sức chứa (tấn)",
                  "Nhiệt độ / Ẩm",
                  "Trạng thái",
                  "Thao tác",
                ]}
                empty={!locations.data?.length}
              >
                {locations.data?.map((l) => (
                  <tr key={l.id}>
                    <td>{l.code}</td>
                    <td>{l.name}</td>
                    <td>{quantity(l.capacityTons)}</td>
                    <td>
                      {l.tempTargetC}°C / {l.humidityTarget}%
                    </td>
                    <td>{l.active ? "Hoạt động" : "Đã ngừng"}</td>
                    <td>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!warehouse?.active}
                          onClick={() => editLocation(l)}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy || (!l.active && !warehouse?.active)}
                          onClick={() =>
                            run(() =>
                              service.locationStatus(id, l.id, !l.active)
                            )
                          }
                        >
                          {l.active ? "Ngừng" : "Bật"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                <h2 className="font-semibold">Quy đổi trọng lượng sản phẩm</h2>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setAction({
                      title: "Khai báo trọng lượng đo thực tế",
                      fields: [
                        {
                          name: "productId",
                          label: "Tên sản phẩm đúng theo đơn hàng",
                        },
                        { name: "unit", label: "Đơn vị đóng gói (bó, hộp…)" },
                        {
                          name: "kgPerUnit",
                          label: "Kg trên mỗi đơn vị",
                          type: "number",
                          min: 0.000001,
                          step: 0.000001,
                        },
                      ],
                      submit: (data) =>
                        service.saveConversion(id, {
                          productId: str(data, "productId"),
                          unit: str(data, "unit"),
                          kgPerUnit: num(data, "kgPerUnit"),
                        }),
                    })
                  }
                >
                  Khai báo quy đổi
                </Button>
              </div>
              <p className="text-sm text-slate-500">
                Kg, g và tấn được quy đổi sẵn. Với bó/hộp, nhập trọng lượng đã
                đo; cấu hình áp dụng cho cùng sản phẩm ở các kho.
              </p>
              <ErrorNotice error={conversions.error} />
              <Table
                head={["Sản phẩm", "Đơn vị", "Kg / đơn vị", "Người cập nhật"]}
                empty={!conversions.data?.length}
              >
                {conversions.data?.map((c) => (
                  <tr key={c.productId + ":" + c.unit}>
                    <td>{c.productId}</td>
                    <td>{c.unit}</td>
                    <td>{quantity(c.kgPerUnit)}</td>
                    <td>
                      {c.updatedBy} · {time(c.updatedAt)}
                    </td>
                  </tr>
                ))}
              </Table>
            </>
          )}
          {tab === "Tồn & chất lượng" && (
            <>
              <ErrorNotice error={stock.error} />
              <label className="block max-w-md text-sm">
                Tìm tồn theo lô, sản phẩm hoặc vị trí
                <Input
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  placeholder="Nhập tên hoặc mã…"
                />
              </label>
              <Table
                head={[
                  "Lô",
                  "Vị trí",
                  "Hạn dùng",
                  "Tồn / Giữ (kg)",
                  "Khả dụng (kg)",
                  "Chất lượng",
                ]}
                empty={!filteredStock.length}
              >
                {filteredStock
                  .slice(stockPage * 100, (stockPage + 1) * 100)
                  .map((b) => (
                    <tr key={b.id}>
                      <td>{b.lotCode}</td>
                      <td>{locationLabel(b.locationId)}</td>
                      <td>{b.expiryDate}</td>
                      <td>
                        {quantity(b.quantityKg)} / {quantity(b.reservedKg)}
                      </td>
                      <td>{quantity(b.availableKg)}</td>
                      <td>
                        <span>{b.held ? "Cách ly" : "Chưa cách ly"}</span>
                        <Button
                          className="ml-2"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setAction({
                              title: b.held
                                ? "Giải phóng cách ly"
                                : "Kiểm tra và cách ly",
                              fields: [
                                {
                                  name: "note",
                                  label: "Kết quả kiểm tra và lý do",
                                },
                              ],
                              submit: (data) =>
                                service.inspect(
                                  id,
                                  b.id,
                                  !b.held,
                                  str(data, "note")
                                ),
                            })
                          }
                        >
                          {b.held ? "Giải phóng" : "Cách ly"}
                        </Button>
                      </td>
                    </tr>
                  ))}
              </Table>
              <div className="flex items-center justify-end gap-3 text-sm">
                <span>
                  {filteredStock.length} dòng tồn · Trang {stockPage + 1}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={stockPage === 0}
                  onClick={() => setStockPage(stockPage - 1)}
                >
                  Tồn trước
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={(stockPage + 1) * 100 >= filteredStock.length}
                  onClick={() => setStockPage(stockPage + 1)}
                >
                  Tồn sau
                </Button>
              </div>
              <h2 className="font-semibold">Lịch sử kiểm tra</h2>
              <ErrorNotice error={inspections.error} />
              <Table
                head={[
                  "Thời gian",
                  "Lô",
                  "Kết quả",
                  "Ghi nhận",
                  "Người thực hiện",
                ]}
                empty={!inspections.data?.length}
              >
                {inspections.data?.map((i) => (
                  <tr key={i.id}>
                    <td>{time(i.createdAt)}</td>
                    <td>
                      {stock.data?.find((b) => b.id === i.balanceId)?.lotCode ??
                        i.balanceId.slice(0, 8)}
                    </td>
                    <td>{i.held ? "Cách ly" : "Giải phóng"}</td>
                    <td>{i.note}</td>
                    <td>{i.actor}</td>
                  </tr>
                ))}
              </Table>
            </>
          )}
          {tab === "Chứng từ" && (
            <>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(labels) as DocumentType[]).map((t) => (
                  <Button
                    key={t}
                    variant="secondary"
                    onClick={() => setDocumentType(t)}
                  >
                    Lập phiếu {labels[t].toLowerCase()}
                  </Button>
                ))}
              </div>
              <ErrorNotice error={documents.error} />
              <Table
                head={[
                  "Mã",
                  "Loại",
                  "Thời gian",
                  "Trạng thái",
                  "Ghi chú",
                  "Thao tác",
                ]}
                empty={!documents.data?.length}
              >
                {documents.data?.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <button
                        className="text-emerald-700 underline"
                        onClick={() => setDetail(d)}
                      >
                        {d.id.slice(0, 8)}
                      </button>
                    </td>
                    <td>
                      {labels[d.type]}
                      {d.type === "TRANSFER" && (
                        <div className="text-xs text-slate-500">
                          {d.targetWarehouseId === id
                            ? "Chuyển đến"
                            : "Chuyển đi"}
                          {" · Đã nhận "}
                          {quantity(
                            d.lines.reduce((n, l) => n + (l.receivedKg ?? 0), 0)
                          )}
                          {" / "}
                          {quantity(
                            d.lines.reduce((n, l) => n + l.quantityKg, 0)
                          )}
                          {" kg"}
                        </div>
                      )}
                    </td>
                    <td>{time(d.createdAt)}</td>
                    <td>
                      <Status value={d.status} />
                    </td>
                    <td>{d.note}</td>
                    <td>
                      <div className="flex gap-2">
                        {d.status === "DRAFT" && d.warehouseId === id && (
                          <>
                            <Button
                              size="sm"
                              disabled={
                                actionLoadingId === `confirm-${d.id}` ||
                                actionLoadingId === `cancel-${d.id}`
                              }
                              onClick={() => setConfirmation(d)}
                            >
                              Xác nhận
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={
                                actionLoadingId === `confirm-${d.id}` ||
                                actionLoadingId === `cancel-${d.id}`
                              }
                              onClick={() =>
                                run(
                                  () => service.cancel(id, d.id),
                                  "Đã hủy phiếu.",
                                  `cancel-${d.id}`
                                )
                              }
                            >
                              {actionLoadingId === `cancel-${d.id}`
                                ? "Đang hủy..."
                                : "Hủy"}
                            </Button>
                          </>
                        )}
                        {d.status === "IN_TRANSIT" &&
                          d.targetWarehouseId === id && (
                            <Button
                              size="sm"
                              disabled={actionLoadingId === `receive-${d.id}`}
                              onClick={() =>
                                setAction({
                                  title: "Nhận hàng chuyển kho",
                                  fields: [
                                    ...d.lines.map((l) => ({
                                      name: "receive-" + l.id,
                                      label:
                                        l.lotId +
                                        " · Tổng đã nhận (kg), trước đó " +
                                        quantity(l.receivedKg),
                                      type: "number",
                                      min: l.receivedKg ?? 0,
                                      max: l.quantityKg,
                                      step: 0.001,
                                      value: l.quantityKg,
                                    })),
                                    {
                                      name: "note",
                                      label:
                                        "Ghi chú nhận hàng / phần còn chờ đối soát",
                                      optional: true,
                                    },
                                  ],
                                  submit: (data) =>
                                    service.receive(
                                      id,
                                      d.id,
                                      d.lines.map((l) => ({
                                        lineId: l.id ?? "",
                                        receivedKg: num(
                                          data,
                                          "receive-" + l.id
                                        ),
                                      })),
                                      str(data, "note")
                                    ),
                                })
                              }
                            >
                              {actionLoadingId === `receive-${d.id}`
                                ? "Đang nhận..."
                                : "Nhận hàng"}
                            </Button>
                          )}
                        {(d.type === "OUTBOUND" || d.type === "TRANSFER") &&
                          d.warehouseId === id &&
                          !d.handoverReference &&
                          (d.status === "CONFIRMED" ||
                            d.status === "IN_TRANSIT") && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busy}
                              onClick={() =>
                                setAction({
                                  title: "Ghi nhận bàn giao",
                                  fields: [
                                    {
                                      name: "reference",
                                      label:
                                        "Mã biên bản / tham chiếu nhà phân phối",
                                    },
                                  ],
                                  submit: (data) =>
                                    service.handover(
                                      id,
                                      d.id,
                                      str(data, "reference")
                                    ),
                                })
                              }
                            >
                              Bàn giao
                            </Button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
            </>
          )}
          {tab === "FEFO & giữ hàng" && (
            <>
              <p className="text-sm text-slate-600">
                Hạn dùng được tính đến hết ngày ghi trên lô theo giờ Việt Nam.
                Hàng bị giữ chất lượng vẫn cần được mở giữ trước khi xuất.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    setAction({
                      title: "Đề xuất FEFO",
                      fields: productFields,
                      submit: async (data) => {
                        setAllocation(
                          await service.fefo(
                            id,
                            str(data, "productId"),
                            num(data, "quantityKg")
                          )
                        );
                      },
                    })
                  }
                >
                  Đề xuất xuất theo FEFO
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setAction({
                      title: "Giữ hàng cho đơn",
                      fields: [
                        ...productFields,
                        {
                          name: "orderId",
                          label: "ID đơn hàng",
                          type: "number",
                          min: 1,
                        },
                        {
                          name: "ttl",
                          label: "Thời gian giữ (phút)",
                          type: "number",
                          min: 1,
                          max: 1440,
                          value: 30,
                        },
                      ],
                      submit: (data) =>
                        service.reserve(
                          id,
                          num(data, "orderId"),
                          str(data, "productId"),
                          num(data, "quantityKg"),
                          num(data, "ttl")
                        ),
                    })
                  }
                >
                  Giữ hàng cho đơn
                </Button>
              </div>
              {allocation && (
                <>
                  <Table
                    head={["Lô", "Vị trí", "Hạn dùng", "Số lượng (kg)"]}
                    empty={!allocation.length}
                  >
                    {allocation.map((a) => (
                      <tr key={a.balanceId}>
                        <td>{a.lotCode}</td>
                        <td>{locationLabel(a.locationId)}</td>
                        <td>{a.expiryDate}</td>
                        <td>{quantity(a.quantityKg)}</td>
                      </tr>
                    ))}
                  </Table>
                  <Button
                    disabled={busy}
                    onClick={() =>
                      run(
                        () =>
                          service.createDocument(id, "OUTBOUND", {
                            note: "Đề xuất FEFO",
                            lines: allocation.map((a) => ({
                              lotId: a.lotId,
                              locationId: a.locationId,
                              quantityKg: a.quantityKg,
                            })),
                          }),
                        "Đã tạo phiếu xuất nháp. Xem và xác nhận trong Chứng từ."
                      )
                    }
                  >
                    Lập phiếu xuất theo đề xuất
                  </Button>
                </>
              )}
              <ErrorNotice error={reservations.error} />
              <Table
                head={[
                  "Mã giữ",
                  "Đơn",
                  "Hết hạn",
                  "Trạng thái",
                  "Đã xuất / Chưa xuất (kg)",
                  "Thao tác",
                ]}
                empty={!reservations.data?.length}
              >
                {reservations.data?.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id.slice(0, 8)}</td>
                    <td>{r.orderId}</td>
                    <td>{time(r.expiresAt)}</td>
                    <td>
                      <Status value={r.status} />
                    </td>
                    <td>
                      {quantity(
                        r.lines.reduce(
                          (sum, l) => sum + (l.dispatchedKg ?? 0),
                          0
                        )
                      )}
                      {" / "}
                      {quantity(
                        r.lines.reduce(
                          (sum, l) =>
                            sum + l.quantityKg - (l.dispatchedKg ?? 0),
                          0
                        )
                      )}
                    </td>
                    <td>
                      {(r.status === "ACTIVE" ||
                        r.status === "PARTIALLY_CONSUMED") && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              setAction({
                                title: "Xuất từng phần cho đơn " + r.orderId,
                                fields: r.lines
                                  .filter(
                                    (l) => l.quantityKg > (l.dispatchedKg ?? 0)
                                  )
                                  .map((l) => ({
                                    name: "qty-" + l.balanceId,
                                    label:
                                      l.lotCode +
                                      " · " +
                                      locationLabel(l.locationId) +
                                      " (kg)",
                                    type: "number",
                                    min: 0,
                                    step: 0.001,
                                    max: l.quantityKg - (l.dispatchedKg ?? 0),
                                    value: l.quantityKg - (l.dispatchedKg ?? 0),
                                  })),
                                submit: (data) => {
                                  const lines = r.lines
                                    .map((l) => ({
                                      lotId: l.lotId,
                                      locationId: l.locationId,
                                      quantityKg: num(
                                        data,
                                        "qty-" + l.balanceId
                                      ),
                                    }))
                                    .filter((l) => l.quantityKg > 0);
                                  if (!lines.length)
                                    throw new Error(
                                      "Nhập ít nhất một lượng xuất lớn hơn 0."
                                    );
                                  return service.createDocument(
                                    id,
                                    "OUTBOUND",
                                    {
                                      reservationId: r.id,
                                      note: "Xuất cho đơn " + r.orderId,
                                      lines,
                                    }
                                  );
                                },
                              })
                            }
                          >
                            Lập phiếu xuất
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy}
                            onClick={() =>
                              run(
                                () => service.reconcile(id, r.id),
                                "Đã phân bổ lại; kiểm tra các lô còn bị giữ hoặc thiếu hàng trước khi xuất."
                              )
                            }
                          >
                            Phân bổ lại
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => run(() => service.release(id, r.id))}
                          >
                            Giải phóng
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            </>
          )}
          {tab === "Cảnh báo" && (
            <>
              <div className="flex gap-2">
                <Button
                  disabled={busy}
                  onClick={() =>
                    run(() => service.refreshAlerts(id), "Đã quét cảnh báo.")
                  }
                >
                  Quét cảnh báo
                </Button>
                <Button
                  variant="secondary"
                  disabled={!rules.data}
                  onClick={() =>
                    setAction({
                      title: "Ngưỡng cảnh báo",
                      fields: [
                        {
                          name: "expiry",
                          label: "Cảnh báo trước hạn (ngày)",
                          type: "number",
                          min: 0,
                          max: 365,
                          value: rules.data?.expiryWarningDays,
                        },
                        {
                          name: "stale",
                          label: "Lưu kho dài (ngày)",
                          type: "number",
                          min: 1,
                          max: 3650,
                          value: rules.data?.staleDays,
                        },
                        {
                          name: "low",
                          label: "Tồn tối thiểu / sản phẩm (kg)",
                          type: "number",
                          min: 0,
                          step: 0.001,
                          value: rules.data?.lowStockKg,
                        },
                      ],
                      submit: (data) =>
                        service.saveRules(id, {
                          expiryWarningDays: num(data, "expiry"),
                          staleDays: num(data, "stale"),
                          lowStockKg: num(data, "low"),
                        }),
                    })
                  }
                >
                  Cấu hình ngưỡng
                </Button>
              </div>
              <ErrorNotice error={alerts.error} />
              <ErrorNotice error={rules.error} />
              <p className="text-sm text-slate-500">
                Nhấn Quét cảnh báo sau khi thay đổi tồn hoặc ngưỡng. Nếu điều
                kiện vẫn tồn tại, cảnh báo đã hoàn tất sẽ mở lại ở lần quét sau.
              </p>
              <Table
                head={["Mức độ", "Loại", "Nội dung", "Trạng thái", "Thao tác"]}
                empty={!alerts.data?.length}
              >
                {alerts.data?.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {{
                        CRITICAL: "Khẩn cấp",
                        HIGH: "Cao",
                        MEDIUM: "Trung bình",
                      }[a.severity] ?? a.severity}
                    </td>
                    <td>
                      {{
                        EXPIRY: "Hạn dùng",
                        STALE: "Tồn lâu",
                        QUALITY_HOLD: "Chất lượng",
                        LOW_STOCK: "Tồn thấp",
                        SENSOR_OFFLINE: "Mất tín hiệu",
                        TEMPERATURE_HIGH: "Nhiệt độ cao",
                        TEMPERATURE_LOW: "Nhiệt độ thấp",
                        HUMIDITY_HIGH: "Độ ẩm cao",
                        HUMIDITY_LOW: "Độ ẩm thấp",
                        NEAR_EXPIRY_HIGH_STOCK: "Gần hạn, tồn lớn",
                        SHELF_LIFE_LOW_HIGH_STOCK: "Hạn dùng còn ít, tồn lớn",
                        SHELF_LIFE_DATA_MISSING: "Thiếu dữ liệu ngày thu hoạch",
                      }[a.type] ?? a.type}
                    </td>
                    <td>{a.message}</td>
                    <td>
                      <Status value={a.status} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {a.status !== "RESOLVED" &&
                          ["ACKNOWLEDGED", "RESOLVED"].map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setAction({
                                  title:
                                    status === "RESOLVED"
                                      ? "Hoàn tất cảnh báo"
                                      : "Tiếp nhận cảnh báo",
                                  fields: [
                                    { name: "note", label: "Ghi nhận xử lý" },
                                  ],
                                  submit: (data) =>
                                    service.act(
                                      id,
                                      a.id,
                                      status,
                                      str(data, "note")
                                    ),
                                })
                              }
                            >
                              {status === "RESOLVED" ? "Hoàn tất" : "Tiếp nhận"}
                            </Button>
                          ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            try {
                              setHistory(await service.alertHistory(id, a.id));
                            } catch (e) {
                              toast.error(getApiErrorMessage(e));
                            }
                          }}
                        >
                          Lịch sử
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
            </>
          )}
          {tab === "Nhật ký" && (
            <>
              <ErrorNotice error={movements.error} />
              <Table
                head={[
                  "Thời gian",
                  "Lô / vị trí",
                  "Loại",
                  "Biến động (kg)",
                  "Tồn sau (kg)",
                  "Người thực hiện",
                ]}
                empty={!movements.data?.length}
              >
                {movements.data?.map((m) => (
                  <tr key={m.id}>
                    <td>{time(m.occurredAt)}</td>
                    <td>
                      {stock.data?.find((b) => b.lotId === m.lotId)?.lotCode ??
                        m.lotId.slice(0, 8)}{" "}
                      / {locationLabel(m.locationId)}
                    </td>
                    <td>{m.type}</td>
                    <td>
                      {m.deltaKg > 0 ? "+" : ""}
                      {quantity(m.deltaKg)}
                    </td>
                    <td>{quantity(m.balanceAfterKg)}</td>
                    <td>{m.actor}</td>
                  </tr>
                ))}
              </Table>
            </>
          )}
          {paginated && (
            <div className="flex items-center justify-end gap-3 text-sm">
              <Button
                size="sm"
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Trước
              </Button>
              <span>Trang {page + 1}</span>
              <Button
                size="sm"
                variant="secondary"
                disabled={pageLength !== 100}
                onClick={() => setPage(page + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
      {action && (
        <Modal title={action.title} onClose={() => setAction(null)}>
          <form
            className="max-h-[65vh] space-y-3 overflow-auto pr-1"
            onSubmit={async (e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              if (await run(() => action.submit(data))) setAction(null);
            }}
          >
            {action.fields.map((f) => (
              <label key={f.name} className="block space-y-1 text-sm">
                <span>{f.label}</span>
                {f.options ? (
                  <Select
                    name={f.name}
                    required={!f.optional}
                    defaultValue={f.value ?? ""}
                  >
                    <option value="">Chọn…</option>
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    name={f.name}
                    type={f.type ?? "text"}
                    required={!f.optional}
                    defaultValue={f.value}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    maxLength={500}
                  />
                )}
              </label>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAction(null)}
              >
                Đóng
              </Button>
              <Button type="submit" disabled={busy}>
                Lưu
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {documentType && (
        <WarehouseDocumentEditor
          key={id + documentType}
          warehouseId={id}
          type={documentType}
          warehouses={warehouses.data ?? []}
          locations={locations.data ?? []}
          balances={stock.data ?? []}
          busy={busy}
          run={run}
          close={() => setDocumentType(null)}
        />
      )}
      {confirmation && (
        <Modal
          title={`Xác nhận phiếu ${labels[confirmation.type].toLowerCase()}`}
          onClose={() => !busy && setConfirmation(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn xác nhận phiếu{" "}
              <strong className="text-slate-900">
                {labels[confirmation.type]}
              </strong>{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                {confirmation.id.slice(0, 8)}
              </code>{" "}
              và ghi nhận thay đổi tồn kho?
            </p>
            {confirmation.note && (
              <p className="rounded-lg border bg-slate-50 p-2.5 text-xs text-slate-600">
                <strong>Ghi chú:</strong> {confirmation.note}
              </p>
            )}
            <div className="max-h-60 overflow-y-auto rounded-lg border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 border-b bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-2">Mã lô</th>
                    <th className="p-2">Vị trí</th>
                    {confirmation.type === "TRANSFER" && (
                      <th className="p-2">Vị trí đích</th>
                    )}
                    <th className="p-2 text-right">Số lượng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {confirmation.lines.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-2 font-mono text-slate-800">
                        {stock.data?.find((b) => b.lotId === l.lotId)
                          ?.lotCode ?? l.lotId.slice(0, 8)}
                      </td>
                      <td className="p-2 text-slate-700">
                        {locationLabel(l.locationId)}
                      </td>
                      {confirmation.type === "TRANSFER" && (
                        <td className="p-2 text-slate-700">
                          {l.targetLocationId
                            ? locationLabel(l.targetLocationId)
                            : "—"}
                        </td>
                      )}
                      <td className="p-2 text-right font-medium text-slate-900">
                        {quantity(l.quantityKg)} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-slate-50/80 font-medium">
                  <tr>
                    <td
                      colSpan={confirmation.type === "TRANSFER" ? 3 : 2}
                      className="p-2 text-slate-600"
                    >
                      Tổng cộng ({confirmation.lines.length} dòng):
                    </td>
                    <td className="p-2 text-right font-bold text-emerald-700">
                      {quantity(
                        confirmation.lines.reduce(
                          (sum, l) => sum + (l.quantityKg ?? 0),
                          0
                        )
                      )}{" "}
                      kg
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button
                variant="secondary"
                disabled={actionLoadingId === `confirm-${confirmation.id}`}
                onClick={() => setConfirmation(null)}
              >
                Đóng
              </Button>
              <Button
                disabled={actionLoadingId === `confirm-${confirmation.id}`}
                onClick={async () => {
                  if (
                    await run(
                      () => service.confirm(id, confirmation.id),
                      "Đã xác nhận phiếu.",
                      `confirm-${confirmation.id}`
                    )
                  )
                    setConfirmation(null);
                }}
              >
                {actionLoadingId === `confirm-${confirmation.id}`
                  ? "Đang xác nhận..."
                  : "Xác nhận phiếu"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {detail && (
        <Modal
          title={"Chi tiết phiếu " + detail.id.slice(0, 8)}
          onClose={() => setDetail(null)}
        >
          <div className="max-h-[65vh] space-y-3 overflow-auto">
            <p>
              {labels[detail.type]} · <Status value={detail.status} />
            </p>
            <p>{detail.note}</p>
            {detail.lines.map((l, i) => (
              <div key={i} className="rounded-lg border p-3 text-sm">
                <p>
                  Lô:{" "}
                  {stock.data?.find((b) => b.lotId === l.lotId)?.lotCode ??
                    l.lotId}
                </p>
                <p>Vị trí: {locationLabel(l.locationId)}</p>
                <p>
                  Số lượng: {quantity(l.quantityKg)} kg
                  {l.expectedKg != null
                    ? " · Tồn tại mốc kiểm kê: " +
                      quantity(l.expectedKg) +
                      " kg"
                    : ""}
                </p>
              </div>
            ))}
            <p className="text-xs text-slate-500">
              Lập: {detail.createdBy} · Xác nhận: {detail.confirmedBy ?? "—"}
            </p>
            {detail.handoverReference && (
              <p>
                Bàn giao: {detail.handoverReference} · {detail.handoverBy} ·{" "}
                {time(detail.handedOverAt)}
              </p>
            )}
          </div>
        </Modal>
      )}
      {history && (
        <Modal title="Lịch sử xử lý cảnh báo" onClose={() => setHistory(null)}>
          <div className="max-h-[60vh] space-y-3 overflow-auto">
            {history.map((a) => (
              <div key={a.id} className="rounded-lg border p-3 text-sm">
                <Status value={a.status} />
                <p className="mt-2">{a.note}</p>
                <p className="text-xs text-slate-500">
                  {a.actor} · {time(a.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
