"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Layers,
  PackageCheck,
  Plus,
  Printer,
  RefreshCw,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { warehouseService as service } from "@/services/warehouse.service";
import { distributorService } from "@/services/distributor.service";
import { WarehouseOrderReservation } from "./warehouse-order-reservation";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
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
import {
  DOC_TYPE_LABELS as labels,
  WarehouseErrorNotice as ErrorNotice,
  WarehouseStatusBadge as Status,
  WarehouseTable as Table,
  formatDateIso as date,
  formatTime as time,
  quantity,
  roundKg,
} from "./warehouse-utils";
import { WarehouseStockTab, type StockFilterMode } from "./warehouse-stock-tab";
import { WarehouseDocumentsTab } from "./warehouse-documents-tab";
import { WarehouseAlertsTab } from "./warehouse-alerts-tab";
import { WarehouseMovementsTab } from "./warehouse-movements-tab";
import { WarehouseVoucherPrintModal } from "./warehouse-voucher-print";
import type {
  DocumentType,
  WarehouseDocument,
  Warehouse,
  StorageLocation,
  Allocation,
  AlertAction,
} from "@/types/warehouse";

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

interface Field {
  name: string;
  label: string;
  type?: string;
  value?: string | number;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  options?: { value: string; label: string }[];
  optional?: boolean;
}
interface Action {
  title: string;
  fields: Field[];
  submit: (data: FormData) => Promise<unknown>;
}
interface PendingConfirm {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<unknown>;
}
function str(data: FormData, key: string) {
  return String(data.get(key) ?? "").trim();
}
function num(data: FormData, key: string) {
  return Number(data.get(key));
}
export function WarehouseManager() {
  const user = useAuthStore((s) => s.user);
  const authorized = !!user?.roles.some(
    (r) => r === "WAREHOUSE" || r === "ADMIN"
  );
  const client = useQueryClient();
  const [id, setId] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]>("Tổng quan");
  const [urlReady, setUrlReady] = useState(false);
  const [requestedWarehouseId, setRequestedWarehouseId] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [reserving, setReserving] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [preselectedLine, setPreselectedLine] = useState<{
    lotId: string;
    locationId: string;
  } | null>(null);
  const [stockFilterMode, setStockFilterMode] = useState<StockFilterMode>("ALL");
  const [printingDoc, setPrintingDoc] = useState<WarehouseDocument | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [docTypeFilter, setDocTypeFilter] = useState<"ALL" | DocumentType>("ALL");
  const [docStatusFilter, setDocStatusFilter] = useState<string>("ALL");
  const [alertStatusFilter, setAlertStatusFilter] = useState<string>("ALL");
  const [autoInboundPending, setAutoInboundPending] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const wParam = params.get("warehouse") ?? "";
    const tParam = params.get("tab") ?? "";
    const actionParam = params.get("action") ?? "";
    if (wParam) setRequestedWarehouseId(wParam);
    if ((tabs as readonly string[]).includes(tParam)) {
      setTab(tParam as (typeof tabs)[number]);
    }
    if (actionParam === "inbound") {
      setAutoInboundPending(true);
    }
    setUrlReady(true);
  }, []);
  useEffect(() => {
    if (!urlReady || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("warehouse", id);
    url.searchParams.set("tab", tab);
    url.searchParams.delete("action");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [id, tab, urlReady]);
  const [detail, setDetail] = useState<WarehouseDocument | null>(null);
  const [confirmation, setConfirmation] = useState<WarehouseDocument | null>(
    null
  );
  const [history, setHistory] = useState<AlertAction[] | null>(null);
  const [allocation, setAllocation] = useState<Allocation[] | null>(null);
  const [page, setPage] = useState(0);
  const [stockPage, setStockPage] = useState(0);
  const [stockSearch, setStockSearch] = useState("");
  const stockFilter = useDebouncedValue(stockSearch.trim(), 250);
  useEffect(() => {
    setStockPage(0);
  }, [stockFilter]);
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
    if (!urlReady || id || !warehouses.data?.length) return;
    const matched = warehouses.data.find((w) => w.id === requestedWarehouseId);
    setId(matched ? matched.id : warehouses.data[0].id);
  }, [id, warehouses.data, requestedWarehouseId, urlReady]);
  useEffect(() => {
    setPage(0);
    setAllocation(null);
  }, [id, tab, from, to]);
  useEffect(() => {
    setStockPage(0);
  }, [id]);
  const enabled = !!id && authorized;
  useEffect(() => {
    if (autoInboundPending && enabled) {
      setDocumentType("INBOUND");
      setAutoInboundPending(false);
    }
  }, [autoInboundPending, enabled]);
  const liveStatus = useWarehouseLive(enabled ? id : "");
  const locations = useQuery({
    queryKey: ["warehouse", id, "locations"],
    queryFn: () => service.locations(id),
    enabled,
    retry: false,
  });
  const onlyAvailableForEditor =
    documentType === "OUTBOUND" || documentType === "TRANSFER";
  const editorStock = useQuery({
    queryKey: ["warehouse", id, "stock", "editor", onlyAvailableForEditor],
    queryFn: () => service.stock(id, onlyAvailableForEditor),
    enabled: enabled && !!documentType,
    retry: false,
  });
  const stock = useQuery({
    queryKey: ["warehouse", id, "stock", stockFilter, stockPage],
    queryFn: () => service.stockPage(id, stockPage, stockFilter),
    enabled: enabled && tab === "Tồn & chất lượng",
    retry: false,
  });
  const stockProducts = useQuery({
    queryKey: ["warehouse", id, "stock-products"],
    queryFn: () => service.stockProducts(id),
    enabled: enabled && (tab === "Kho & vị trí" || tab === "FEFO & giữ hàng"),
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
  const activeShipments = useQuery({
    queryKey: ["warehouse", "active-shipments"],
    queryFn: () => distributorService.getShipments(),
    enabled: enabled && tab === "Chứng từ",
    retry: false,
  });
  const shipmentOptions = useMemo(
    () =>
      (activeShipments.data ?? [])
        .filter((s) => s.status === "PREPARING" || s.status === "IN_TRANSIT")
        .map((s) => ({
          value: s.shipmentCode,
          label: `${s.shipmentCode} — ${s.destination || s.driverName || s.status}`,
        })),
    [activeShipments.data]
  );
  const [resSort, setResSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const sortedReservations = useMemo(() => {
    const list = reservations.data ?? [];
    if (!resSort) return list;
    return [...list].sort((a, b) => {
      const av =
        resSort.key === "expiresAt"
          ? new Date(a.expiresAt).getTime()
          : resSort.key === "remainingKg"
            ? a.lines.reduce((sum, l) => sum + l.quantityKg - (l.dispatchedKg ?? 0), 0)
            : a.status;
      const bv =
        resSort.key === "expiresAt"
          ? new Date(b.expiresAt).getTime()
          : resSort.key === "remainingKg"
            ? b.lines.reduce((sum, l) => sum + l.quantityKg - (l.dispatchedKg ?? 0), 0)
            : b.status;
      if (av < bv) return resSort.dir === "asc" ? -1 : 1;
      if (av > bv) return resSort.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [reservations.data, resSort]);
  const alerts = useQuery({
    queryKey: ["warehouse", id, "alerts"],
    queryFn: () => service.alerts(id),
    enabled: enabled && tab === "Cảnh báo",
    retry: false,
  });
  const rules = useQuery({
    queryKey: ["warehouse", id, "rules"],
    queryFn: () => service.rules(id),
    enabled: enabled && (tab === "Cảnh báo" || tab === "Tồn & chất lượng"),
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
  const confirmationLots = useQuery({
    queryKey: ["warehouse", id, "lots"],
    queryFn: () => service.lots(id),
    enabled: enabled && (confirmation?.type === "INBOUND" || detail?.type === "INBOUND"),
    retry: false,
  });
  const inspectedIds = [...new Set((tab === "Tồn & chất lượng" ? inspections.data : [])?.map((i) => i.balanceId))];
  const selectedDocument = confirmation ?? detail ?? printingDoc;
  const visibleLots = [...new Set(selectedDocument
    ? selectedDocument.lines.map((line) => line.lotId)
    : (tab === "Nhật ký" ? movements.data : [])?.map((m) => m.lotId))];
  const stockLabels = useQuery({
    queryKey: ["warehouse", id, "stock-labels", inspectedIds, visibleLots],
    queryFn: () => service.stockLabels(id, inspectedIds, visibleLots),
    enabled: enabled && (inspectedIds.length > 0 || visibleLots.length > 0),
    retry: false,
  });
  const checkConfirmationReservation = confirmation?.type === "OUTBOUND" && !!confirmation.reservationId;
  const confirmationReservation = useQuery({
    queryKey: ["warehouse", id, "confirmation-reservation", confirmation?.reservationId],
    queryFn: () => service.findReservation(id, confirmation!.reservationId!),
    enabled: enabled && checkConfirmationReservation,
    staleTime: 0,
    retry: false,
  });
  const invalidConfirmationReservation = checkConfirmationReservation && confirmationReservation.isSuccess && (
    !confirmationReservation.data || !["ACTIVE", "PARTIALLY_CONSUMED"].includes(confirmationReservation.data.status) ||
    new Date(confirmationReservation.data.expiresAt).getTime() <= Date.now()
  );
  const reservationConfirmationPending = checkConfirmationReservation && (
    confirmationReservation.isFetching || !confirmationReservation.isSuccess || invalidConfirmationReservation
  );
  const todayIso = useMemo(() => date(new Date()), []);
  const expiryCutoffIso = useMemo(() => {
    const warnDays = rules.data?.expiryWarningDays ?? 3;
    return date(new Date(Date.now() + warnDays * 86400000));
  }, [rules.data?.expiryWarningDays]);

  const warehouse = useMemo(
    () => warehouses.data?.find((w) => w.id === id),
    [warehouses.data, id]
  );
  const locationCodeById = useMemo(
    () => new Map((locations.data ?? []).map((l) => [l.id, l.code])),
    [locations.data]
  );
  const labelByBalanceId = useMemo(
    () =>
      new Map(
        (stockLabels.data ?? [])
          .filter((b) => b.balanceId)
          .map((b) => [b.balanceId!, b])
      ),
    [stockLabels.data]
  );
  const labelByLotId = useMemo(
    () => new Map((stockLabels.data ?? []).map((b) => [b.lotId, b])),
    [stockLabels.data]
  );
  const inboundLotById = useMemo(
    () => new Map((confirmationLots.data ?? []).map((lot) => [lot.id, lot])),
    [confirmationLots.data]
  );
  const locationLabel = (value: string) =>
    locationCodeById.get(value) ?? value.slice(0, 8);
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
      options: (stockProducts.data ?? []).map((p) => ({
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
    <div className="warehouse-sheet space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-slate-300 border-t-2 border-t-emerald-700 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[2px] border border-emerald-700/30 bg-emerald-50 text-emerald-800">
            <WarehouseIcon className="size-4" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 sm:text-lg">
                Quản lý kho nông sản
              </h1>
              {enabled && tab !== "Giám sát" && (
                <WarehouseLiveBadge status={liveStatus} />
              )}
            </div>
            <p className="text-xs text-slate-500">
              Nhập kho · Tồn theo lô · FEFO · Kiểm kê · Giám sát chuỗi lạnh
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {enabled && activeQuery.isFetching && (
            <span
              role="status"
              className="rounded-[2px] border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500"
            >
              Đang đồng bộ…
            </span>
          )}
          <Button
            size="sm"
            variant="secondary"
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            onClick={() =>
              client.invalidateQueries({ queryKey: ["warehouse"] })
            }
          >
            <RefreshCw size={14} className={enabled && activeQuery.isFetching ? "animate-spin" : ""} />
            Tải lại
          </Button>
          <Button
            size="sm"
            onClick={() => editWarehouse()}
          >
            <Plus size={14} />
            Tạo kho
          </Button>
        </div>
      </header>
      <ErrorNotice error={warehouses.error} />
      {warehouses.isPending && <p role="status">Đang tải danh sách kho…</p>}
      {!warehouses.isPending &&
        !warehouses.error &&
        !warehouses.data?.length && (
          <p className="rounded-none border border-slate-300 bg-white p-8 text-center text-slate-500">
            Chưa có kho. Tạo kho đầu tiên để bắt đầu.
          </p>
        )}
      {enabled && (
        <>
          <div className="flex flex-wrap items-end gap-3 rounded-none border border-slate-300 bg-slate-50 px-3 py-2">
            <label className="min-w-[220px] space-y-1 text-xs">
              <span className="flex items-center gap-2 font-semibold text-slate-700">
                <span>Kho đang quản lý</span>
                {warehouse && (
                  <span
                    className={
                      "rounded-[2px] border px-1.5 py-0.5 text-[11px] font-medium " +
                      (warehouse.active
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-rose-300 bg-rose-50 text-rose-800")
                    }
                  >
                    {warehouse.active ? "Đang hoạt động" : "Đã ngừng"}
                  </span>
                )}
              </span>
              <Select className="h-8 text-xs border-slate-300 bg-white" value={id} onChange={(e) => setId(e.target.value)}>
                {warehouses.data?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                    {w.active ? "" : " (Đã ngừng)"}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-xs">
              <span className="block font-semibold text-slate-700">Từ ngày</span>
              <Input
                type="date"
                className="h-8 text-xs border-slate-300 bg-white"
                value={from}
                onChange={(e) => {
                  const next = e.target.value;
                  setFrom(next);
                  if (next && to && next > to) setTo(next);
                }}
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="block font-semibold text-slate-700">Đến ngày</span>
              <Input
                type="date"
                className="h-8 text-xs border-slate-300 bg-white"
                min={from}
                value={to}
                onChange={(e) => {
                  const next = e.target.value;
                  setTo(next);
                  if (next && from && next < from) setFrom(next);
                }}
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
                  size="sm"
                  className="ml-auto"
                  disabled={!warehouse?.active}
                  onClick={() => setDocumentType("INBOUND")}
                >
                  Nhập kho
                </Button>
                <Button
                  size="sm"
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
            className="flex gap-0.5 overflow-x-auto border-b border-slate-300 bg-slate-100/90 px-1 pt-1"
          >
            {tabs.map((t) => (
              <button
                key={t}
                aria-current={tab === t ? "page" : undefined}
                onClick={() => setTab(t)}
                className={
                  "whitespace-nowrap rounded-t-[2px] border px-3 py-1.5 text-[13px] transition-colors " +
                  (tab === t
                    ? "-mb-px border-slate-300 border-b-white bg-white font-semibold text-emerald-800"
                    : "border-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-900")
                }
              >
                {t}
              </button>
            ))}
          </nav>
          {tab === "Sơ đồ kho" && (
            <WarehouseHeatmapPanel
              key={id}
              warehouseId={id}
              liveStatus={liveStatus}
              onQuickDocument={(type, lotId, locationId) => {
                setPreselectedLine({ lotId, locationId });
                setDocumentType(type);
              }}
              onViewAlerts={() => {
                setAlertStatusFilter("OPEN_ALL");
                setTab("Cảnh báo");
              }}
            />
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
          {(tab === "Kho & vị trí" || tab === "FEFO & giữ hàng") && <ErrorNotice error={stockProducts.error} />}
          {(visibleLots.length > 0 || inspectedIds.length > 0) && <ErrorNotice error={stockLabels.error} />}

          {tab === "Tổng quan" && (
            <>
              <ErrorNotice error={dashboard.error} />
              {dashboard.isPending && (
                <div role="status" aria-label="Đang tải thống kê" className="space-y-3">
                  <div className="grid divide-y divide-slate-300 border border-slate-300 bg-white sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                    {[0, 1, 2, 3].map((k) => (
                      <div key={k} className="space-y-2 p-3">
                        <div className="h-3 w-24 animate-pulse bg-slate-200" />
                        <div className="h-6 w-32 animate-pulse bg-slate-200" />
                        <div className="h-1.5 w-full animate-pulse bg-slate-100" />
                      </div>
                    ))}
                  </div>
                  <div className="border border-slate-300 bg-white p-3 space-y-2">
                    <div className="h-4 w-48 animate-pulse bg-slate-200" />
                    <div className="h-8 w-full animate-pulse bg-slate-100" />
                    <div className="h-8 w-full animate-pulse bg-slate-100" />
                  </div>
                </div>
              )}
              {dashboard.data && (
                <>
                  <div className="grid divide-y divide-slate-300 border border-slate-300 bg-white sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                    <div className="p-3">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>Tồn thực tế</span>
                        <Layers size={15} className="text-emerald-700" />
                      </div>
                      <p className="mt-1.5 font-mono text-xl font-bold tabular-nums text-slate-900">
                        {quantity(dashboard.data.onHandKg)}{" "}
                        <span className="font-sans text-xs font-normal text-slate-500">kg</span>
                      </p>
                      {dashboard.data.capacityKg > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="h-1.5 w-full bg-slate-200">
                            <div
                              className="h-full bg-emerald-700"
                              style={{
                                width: `${Math.min(100, (dashboard.data.onHandKg / dashboard.data.capacityKg) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Chiếm{" "}
                            {Math.round(
                              (dashboard.data.onHandKg / dashboard.data.capacityKg) * 100
                            )}
                            % sức chứa
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>Đang giữ cho đơn</span>
                        <PackageCheck size={15} className="text-amber-600" />
                      </div>
                      <p className="mt-1.5 font-mono text-xl font-bold tabular-nums text-amber-800">
                        {quantity(dashboard.data.reservedKg)}{" "}
                        <span className="font-sans text-xs font-normal text-slate-500">kg</span>
                      </p>
                      <p className="mt-2 text-[11px] text-slate-500">
                        Đã phân bổ FEFO chờ xuất
                      </p>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>Có thể sử dụng</span>
                        <ArrowUpFromLine size={15} className="text-teal-700" />
                      </div>
                      <p className="mt-1.5 font-mono text-xl font-bold tabular-nums text-emerald-800">
                        {quantity(dashboard.data.availableKg)}{" "}
                        <span className="font-sans text-xs font-normal text-slate-500">kg</span>
                      </p>
                      <p className="mt-2 text-[11px] text-slate-500">
                        Đủ điều kiện xuất kho ngay
                      </p>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>Sức chứa kho</span>
                        <WarehouseIcon size={15} className="text-slate-600" />
                      </div>
                      <p className="mt-1.5 font-mono text-xl font-bold tabular-nums text-slate-900">
                        {quantity(dashboard.data.capacityKg)}{" "}
                        <span className="font-sans text-xs font-normal text-slate-500">kg</span>
                      </p>
                      <p className="mt-2 text-[11px] text-slate-500">
                        Công suất thiết kế tối đa
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 border border-slate-300 bg-slate-50 px-3 py-2 text-xs">
                    <span className="mr-1 font-semibold text-slate-700">
                      Trong kỳ:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDocTypeFilter("INBOUND");
                        setDocStatusFilter("ALL");
                        setTab("Chứng từ");
                      }}
                      className="inline-flex items-center gap-1 rounded-[2px] border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-900 transition hover:bg-emerald-100"
                    >
                      <ArrowDownToLine size={12} />
                      Nhập {quantity(dashboard.data.inboundKg)} kg
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDocTypeFilter("OUTBOUND");
                        setDocStatusFilter("ALL");
                        setTab("Chứng từ");
                      }}
                      className="inline-flex items-center gap-1 rounded-[2px] border border-sky-300 bg-sky-50 px-2 py-0.5 font-medium text-sky-900 transition hover:bg-sky-100"
                    >
                      <ArrowUpFromLine size={12} />
                      Xuất {quantity(dashboard.data.outboundKg)} kg
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStockFilterMode("EXPIRING");
                        setTab("Tồn & chất lượng");
                      }}
                      className="rounded-[2px] border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-900 transition hover:bg-amber-100"
                    >
                      {dashboard.data.expiringBalances} lô/vị trí gần hết hạn →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStockFilterMode("HELD");
                        setTab("Tồn & chất lượng");
                      }}
                      className="rounded-[2px] border border-slate-300 bg-white px-2 py-0.5 font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      {dashboard.data.heldBalances} lô/vị trí cách ly →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAlertStatusFilter("OPEN_ALL");
                        setTab("Cảnh báo");
                      }}
                      className={
                        "inline-flex items-center gap-1 rounded-[2px] border px-2 py-0.5 font-medium transition " +
                        (dashboard.data.openAlerts > 0
                          ? "border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100")
                      }
                    >
                      <AlertTriangle size={12} />
                      {dashboard.data.openAlerts} cảnh báo mở →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDocTypeFilter("ALL");
                        setDocStatusFilter("DRAFT");
                        setTab("Chứng từ");
                      }}
                      className="rounded-[2px] border border-slate-300 bg-white px-2 py-0.5 font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      {dashboard.data.draftDocuments} phiếu nháp →
                    </button>
                  </div>
                </>
              )}
              <div className="pt-1">
                <h2 className="text-sm font-bold text-slate-800">
                  Ước tính tiêu thụ từ lịch sử xuất
                </h2>
                <p className="text-xs text-slate-500">
                  Trung bình 14 ngày; cần ít nhất 3 lần xuất. Số liệu là gợi ý để
                  thủ kho đánh giá.
                </p>
              </div>
              <ErrorNotice error={forecast.error} />
              <Table
                head={[
                  "Sản phẩm",
                  "Khả dụng (kg)",
                  "Xuất TB/ngày (kg)",
                  "Ngày để xuất hết",
                  "Đánh giá",
                  "Thao tác nhanh",
                ]}
                numericCols={[1, 2, 3]}
                empty={!forecast.data?.length}
              >
                {forecast.data?.map((f) => (
                  <tr key={f.productId}>
                    <td className="font-medium">{f.productId}</td>
                    <td className="text-right font-mono tabular-nums">
                      {quantity(f.availableKg)}
                    </td>
                    <td className="text-right font-mono tabular-nums">
                      {quantity(f.dailyOutboundKg)}
                    </td>
                    <td className="text-right font-mono tabular-nums">
                      {f.daysToClear ?? "—"}
                    </td>
                    <td>{f.recommendation}</td>
                    <td>
                      {f.availableKg > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="whitespace-nowrap"
                          onClick={() => {
                            setTab("FEFO & giữ hàng");
                            setAction({
                              title: "Đề xuất FEFO · " + f.productId,
                              fields: [
                                {
                                  name: "productId",
                                  label: "Sản phẩm",
                                  value: f.productId,
                                },
                                {
                                  name: "quantityKg",
                                  label: "Số lượng (kg)",
                                  type: "number",
                                  min: 0.001,
                                  max: f.availableKg,
                                  step: 0.001,
                                  value: Math.min(
                                    f.availableKg,
                                    Math.max(1, roundKg(f.dailyOutboundKg || f.availableKg))
                                  ),
                                },
                              ],
                              submit: async (data) => {
                                setAllocation(
                                  await service.fefo(
                                    id,
                                    str(data, "productId"),
                                    num(data, "quantityKg")
                                  )
                                );
                              },
                            });
                          }}
                        >
                          Đề xuất FEFO
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            </>
          )}
          {tab === "Kho & vị trí" && (
            <>
              {warehouse && (
                <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-300 bg-white p-3">
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
                numericCols={[2]}
                empty={!locations.data?.length}
              >
                {locations.data?.map((l) => (
                  <tr key={l.id}>
                    <td className="font-mono font-medium">{l.code}</td>
                    <td>{l.name}</td>
                    <td className="text-right font-mono tabular-nums">{quantity(l.capacityTons)}</td>
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
                numericCols={[2]}
                empty={!conversions.data?.length}
              >
                {conversions.data?.map((c) => (
                  <tr key={c.productId + ":" + c.unit}>
                    <td>{c.productId}</td>
                    <td>{c.unit}</td>
                    <td className="text-right font-mono tabular-nums">{quantity(c.kgPerUnit)}</td>
                    <td>
                      {c.updatedBy} · {time(c.updatedAt)}
                    </td>
                  </tr>
                ))}
              </Table>
            </>
          )}
          {tab === "Tồn & chất lượng" && (
            <WarehouseStockTab
              warehouseName={warehouse?.name}
              rows={stock.data?.rows ?? []}
              hasNext={stock.data?.hasNext}
              stockLoaded={stock.isSuccess}
              stockError={stock.error}
              inspections={inspections.data ?? []}
              inspectionsError={inspections.error}
              stockPage={stockPage}
              onStockPageChange={setStockPage}
              stockSearch={stockSearch}
              onStockSearchChange={setStockSearch}
              filterMode={stockFilterMode}
              onFilterModeChange={setStockFilterMode}
              todayIso={todayIso}
              expiryCutoffIso={expiryCutoffIso}
              locationLabel={locationLabel}
              inspectionLotCode={(balanceId) =>
                labelByBalanceId.get(balanceId)?.lotCode ??
                balanceId.slice(0, 8)
              }
              onInspect={(b) =>
                setAction({
                  title: b.held ? "Giải phóng cách ly" : "Kiểm tra và cách ly",
                  fields: [
                    { name: "note", label: "Kết quả kiểm tra và lý do" },
                  ],
                  submit: (data) =>
                    service.inspect(id, b.id, !b.held, str(data, "note")),
                })
              }
            />
          )}
          {tab === "Chứng từ" && (
            <WarehouseDocumentsTab
              warehouseId={id}
              warehouseName={warehouse?.name}
              documents={documents.data ?? []}
              error={documents.error}
              busy={busy}
              actionLoadingId={actionLoadingId}
              typeFilter={docTypeFilter}
              statusFilter={docStatusFilter}
              onTypeFilterChange={setDocTypeFilter}
              onStatusFilterChange={setDocStatusFilter}
              onCreateDocument={(t) => setDocumentType(t)}
              onOpenDetail={(d) => setDetail(d)}
              onOpenPrint={(d) => setPrintingDoc(d)}
              onConfirmDocument={(d) => setConfirmation(d)}
              onRequestCancel={(d) =>
                setPendingConfirm({
                  title: "Xác nhận hủy phiếu nháp",
                  description: `Bạn có chắc muốn hủy phiếu ${labels[d.type].toLowerCase()} #${d.id.slice(0, 8)}? Thao tác này không thể hoàn tác.`,
                  confirmLabel: "Hủy phiếu",
                  onConfirm: () =>
                    run(
                      () => service.cancel(id, d.id),
                      "Đã hủy phiếu.",
                      `cancel-${d.id}`
                    ),
                })
              }
              onReceiveTransfer={(d) =>
                setAction({
                  title: "Nhận hàng chuyển kho",
                  fields: [
                    ...d.lines.map((l) => ({
                      name: "receive-" + l.id,
                      label:
                        "Lô #" +
                        l.lotId +
                        " · Tổng đã nhận (kg), trước đó " +
                        quantity(l.receivedKg),
                      type: "number",
                      min: roundKg(l.receivedKg ?? 0),
                      max: roundKg(l.quantityKg),
                      step: 0.001,
                      value: roundKg(l.quantityKg),
                    })),
                    {
                      name: "note",
                      label: "Ghi chú nhận hàng / phần còn chờ đối soát",
                      optional: true,
                    },
                  ],
                  submit: (data) =>
                    service.receive(
                      id,
                      d.id,
                      d.lines.map((l) => ({
                        lineId: l.id ?? "",
                        receivedKg: num(data, "receive-" + l.id),
                      })),
                      str(data, "note")
                    ),
                })
              }
              onHandover={(d) =>
                setAction({
                  title: "Ghi nhận bàn giao",
                  fields: [
                    {
                      name: "reference",
                      label: "Mã biên bản / tham chiếu nhà phân phối",
                    },
                    ...(d.type === "OUTBOUND"
                      ? [
                          {
                            name: "shipmentCode",
                            label: "Mã chuyến giao",
                            placeholder:
                              "Để trống để dùng chuyến đã gán cho đơn",
                            optional: true,
                            ...(shipmentOptions.length > 0
                              ? {
                                  options: [
                                    { value: "", label: "— Dùng chuyến mặc định của đơn —" },
                                    ...shipmentOptions,
                                  ],
                                }
                              : {}),
                          },
                        ]
                      : []),
                  ],
                  submit: (data) =>
                    service.handover(
                      id,
                      d.id,
                      str(data, "reference"),
                      str(data, "shipmentCode") || undefined
                    ),
                })
              }
              onAttachShipment={(d) =>
                setAction({
                  title: "Gắn mã chuyến giao hàng",
                  fields: [
                    {
                      name: "shipmentCode",
                      label: "Mã chuyến giao (VD: SHIP-...)",
                      placeholder: "Nhập mã chuyến vận chuyển",
                      ...(shipmentOptions.length > 0 ? { options: shipmentOptions } : {}),
                    },
                  ],
                  submit: (data) =>
                    service.handover(
                      id,
                      d.id,
                      d.handoverReference!,
                      str(data, "shipmentCode")
                    ),
                })
              }
            />
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
                  onClick={() => setReserving(true)}
                >
                  Giữ hàng cho đơn
                </Button>
              </div>
              {allocation && (
                <>
                  <Table
                    head={["Lô", "Vị trí", "Hạn dùng", "Số lượng (kg)"]}
                    numericCols={[3]}
                    empty={!allocation.length}
                  >
                    {allocation.map((a) => (
                      <tr key={a.balanceId}>
                        <td className="font-mono font-medium">{a.lotCode}</td>
                        <td>{locationLabel(a.locationId)}</td>
                        <td className="font-mono text-xs">{a.expiryDate}</td>
                        <td className="text-right font-mono tabular-nums">{quantity(a.quantityKg)}</td>
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
                sortKeys={[undefined, undefined, "expiresAt", "status", "remainingKg", undefined]}
                sort={resSort ?? undefined}
                onSort={(key) =>
                  setResSort((prev) =>
                    prev?.key === key
                      ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                      : { key, dir: "asc" }
                  )
                }
                numericCols={[4]}
                empty={!sortedReservations.length}
              >
                {sortedReservations.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id.slice(0, 8)}</td>
                    <td>{r.orderCode ? "#" + r.orderCode : r.orderId}</td>
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
                            onClick={() => {
                              const pendingLines = r.lines.filter(
                                (l) => roundKg(l.quantityKg - (l.dispatchedKg ?? 0)) > 0
                              );
                              const orderLabel = r.orderCode ? "#" + r.orderCode : String(r.orderId);
                              setAction({
                                title: "Xuất kho cho đơn " + orderLabel,
                                fields: pendingLines.map((l) => {
                                  const rem = roundKg(l.quantityKg - (l.dispatchedKg ?? 0));
                                  return {
                                    name: "qty-" + l.balanceId,
                                    label:
                                      l.lotCode +
                                      " · " +
                                      locationLabel(l.locationId) +
                                      " (tối đa " +
                                      quantity(rem) +
                                      " kg)",
                                    type: "number",
                                    min: 0,
                                    step: 0.001,
                                    max: rem,
                                    value: rem,
                                  };
                                }),
                                submit: (data) => {
                                  const lines = pendingLines
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
                                      note: "Xuất cho đơn " + orderLabel,
                                      lines,
                                    }
                                  );
                                },
                              });
                            }}
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
                            onClick={() =>
                              setPendingConfirm({
                                title: "Giải phóng giữ hàng cho đơn",
                                description: `Giải phóng phần giữ hàng của đơn ${r.orderCode ? "#" + r.orderCode : r.orderId}? Số lượng chưa xuất sẽ trở về tồn khả dụng.`,
                                confirmLabel: "Giải phóng",
                                onConfirm: () =>
                                  run(
                                    () => service.release(id, r.id),
                                    "Đã giải phóng giữ hàng."
                                  ),
                              })
                            }
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
            <WarehouseAlertsTab
              alerts={alerts.data ?? []}
              rules={rules.data}
              alertsError={alerts.error}
              rulesError={rules.error}
              busy={busy}
              statusFilter={alertStatusFilter}
              onStatusFilterChange={setAlertStatusFilter}
              onRefreshAlerts={() =>
                run(() => service.refreshAlerts(id), "Đã quét cảnh báo.")
              }
              onReconcileEndOfDay={() =>
                run(
                  () => service.reconcileEndOfDay(id),
                  "Đã đối soát cuối ngày (sổ cái vs tồn kho & phiếu treo)."
                )
              }
              onConfigureRules={() =>
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
              onActAlert={(a, targetStatus) =>
                setAction({
                  title:
                    targetStatus === "RESOLVED"
                      ? "Hoàn tất cảnh báo"
                      : "Tiếp nhận cảnh báo",
                  fields: [{ name: "note", label: "Ghi nhận xử lý" }],
                  submit: (data) =>
                    service.act(id, a.id, targetStatus, str(data, "note")),
                })
              }
              onViewHistory={async (alertId) => {
                try {
                  setHistory(await service.alertHistory(id, alertId));
                } catch (e) {
                  toast.error(getApiErrorMessage(e));
                }
              }}
            />
          )}
          {tab === "Nhật ký" && (
            <WarehouseMovementsTab
              warehouseName={warehouse?.name}
              movements={movements.data ?? []}
              error={movements.error}
              locationLabel={locationLabel}
              getLotMeta={(lotId) =>
                labelByLotId.get(lotId) ?? inboundLotById.get(lotId)
              }
            />
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
              <span>
                {tab === "Tồn & chất lượng"
                  ? `Lịch sử kiểm tra · Trang ${page + 1}`
                  : `Trang ${page + 1}`}
              </span>
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
      {reserving && (
        <WarehouseOrderReservation key={id} warehouseId={id} busy={busy} close={() => setReserving(false)}
          reserve={(orderId, product, kg, ttl) => run(() => service.reserve(id, orderId, product, kg, ttl), "Đã giữ hàng cho đơn.")} />
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
                    placeholder={f.placeholder}
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
      {documentType && !editorStock.data && (
        <Modal
          title="Lập phiếu kho"
          onClose={() => {
            setDocumentType(null);
            setPreselectedLine(null);
          }}
        >
          {editorStock.isError ? <><ErrorNotice error={editorStock.error} /><Button onClick={() => editorStock.refetch()}>Thử lại</Button></> : <p role="status">Đang tải tồn kho để lập phiếu…</p>}
        </Modal>
      )}
      {documentType && editorStock.data && (
        <WarehouseDocumentEditor
          key={
            id +
            documentType +
            (preselectedLine
              ? ":" + preselectedLine.lotId + ":" + preselectedLine.locationId
              : "")
          }
          warehouseId={id}
          type={documentType}
          warehouses={warehouses.data ?? []}
          locations={locations.data ?? []}
          balances={editorStock.data}
          busy={busy}
          initialLine={preselectedLine}
          run={run}
          close={() => {
            setDocumentType(null);
            setPreselectedLine(null);
          }}
          onOrderOutbound={() => {
            setDocumentType(null);
            setPreselectedLine(null);
            setTab("FEFO & giữ hàng");
          }}
        />
      )}
      {confirmation && (
        <Modal
          size="wide"
          title={`Xác nhận phiếu ${labels[confirmation.type].toLowerCase()}`}
          onClose={() => !busy && setConfirmation(null)}
        >
          <div className="space-y-4">
            {checkConfirmationReservation && confirmationReservation.isFetching && <p role="status" className="rounded-lg bg-sky-50 p-3 text-sm text-sky-800">Đang kiểm tra hiệu lực lượt giữ hàng…</p>}
            {checkConfirmationReservation && <ErrorNotice error={confirmationReservation.error} />}
            {invalidConfirmationReservation && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">Lượt giữ hàng của phiếu này không còn hiệu lực. Phiếu chưa làm thay đổi tồn kho. Hãy đóng cửa sổ, hủy phiếu nháp cũ, sau đó giữ hàng lại cho đơn và lập phiếu xuất mới.</p>}
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
                    <th className="p-2">Nông sản / mã lô</th>
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
                        <p className="font-sans font-semibold">{labelByLotId.get(l.lotId)?.productId ?? inboundLotById.get(l.lotId)?.productId ?? "Lô nông sản"}</p>
                        {labelByLotId.get(l.lotId)?.lotCode ?? inboundLotById.get(l.lotId)?.lotCode ?? l.lotId.slice(0, 8)}
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
                        {(confirmation.type === "COUNT" || confirmation.type === "ADJUSTMENT") && l.expectedKg != null ? <>
                          {quantity(l.expectedKg)} → {quantity(l.quantityKg)} kg
                          <span className="block text-xs">Chênh lệch {l.quantityKg > l.expectedKg ? "+" : ""}{quantity(l.quantityKg - l.expectedKg)} kg</span>
                        </> : <>{quantity(l.quantityKg)} kg</>}
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
              {invalidConfirmationReservation && (
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      await run(
                        () => service.cancel(id, confirmation.id),
                        "Đã hủy phiếu nháp hết hiệu lực.",
                        `cancel-${confirmation.id}`
                      )
                    )
                      setConfirmation(null);
                  }}
                >
                  Hủy phiếu nháp này
                </Button>
              )}
              <Button
                variant="secondary"
                disabled={actionLoadingId === `confirm-${confirmation.id}`}
                onClick={() => setConfirmation(null)}
              >
                Đóng
              </Button>
              <Button
                disabled={actionLoadingId === `confirm-${confirmation.id}` || reservationConfirmationPending}
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
                <p className="font-semibold text-slate-900">
                  {labelByLotId.get(l.lotId)?.productId ??
                    inboundLotById.get(l.lotId)?.productId ??
                    "Lô nông sản"}
                </p>
                <p>
                  Mã lô:{" "}
                  <span className="font-mono">
                    {labelByLotId.get(l.lotId)?.lotCode ??
                      inboundLotById.get(l.lotId)?.lotCode ??
                      l.lotId}
                  </span>
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
                {detail.shipmentCode && <> · Chuyến {detail.shipmentCode}</>}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const targetDoc = detail;
                  setDetail(null);
                  setPrintingDoc(targetDoc);
                }}
              >
                <Printer size={14} />
                In phiếu kho
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {printingDoc && (
        <WarehouseVoucherPrintModal
          document={printingDoc}
          warehouse={warehouse}
          locationLabel={locationLabel}
          getLotMeta={(lotId) =>
            labelByLotId.get(lotId) ?? inboundLotById.get(lotId)
          }
          onClose={() => setPrintingDoc(null)}
        />
      )}
      {pendingConfirm && (
        <Modal
          title={pendingConfirm.title}
          onClose={() => !busy && setPendingConfirm(null)}
        >
          <div className="space-y-4 text-sm text-slate-600">
            <p>{pendingConfirm.description}</p>
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => setPendingConfirm(null)}
              >
                Quay lại
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={busy}
                onClick={async () => {
                  await pendingConfirm.onConfirm();
                  setPendingConfirm(null);
                }}
              >
                {pendingConfirm.confirmLabel}
              </Button>
            </div>
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
