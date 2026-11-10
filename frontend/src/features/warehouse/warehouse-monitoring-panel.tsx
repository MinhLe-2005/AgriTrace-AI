"use client";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { warehouseMonitoringService as service } from "@/services/warehouse-monitoring.service";
import { warehouseService } from "@/services/warehouse.service";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import type { StorageLocation } from "@/types/warehouse";
import type {
  MonitoringRule,
  MonitoringRuleInput,
  MonitoringRuleKind,
  SensorDevice,
  SensorSecret,
  SensorReading,
} from "@/types/warehouse-monitoring";
import type { WarehouseLiveStatus } from "./use-warehouse-live";

const kinds: Record<MonitoringRuleKind, string> = {
  TEMPERATURE_HIGH: "Nhiệt độ cao hơn ngưỡng",
  TEMPERATURE_LOW: "Nhiệt độ thấp hơn ngưỡng",
  HUMIDITY_HIGH: "Độ ẩm cao hơn ngưỡng",
  HUMIDITY_LOW: "Độ ẩm thấp hơn ngưỡng",
  NEAR_EXPIRY_HIGH_STOCK: "Gần hết hạn và tồn lớn",
  SHELF_LIFE_LOW_HIGH_STOCK: "Phần trăm hạn dùng thấp và tồn lớn",
};
const formatTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : "—";
const value = (data: FormData, key: string) =>
  String(data.get(key) ?? "").trim();
const number = (data: FormData, key: string) => Number(data.get(key));
function ErrorNotice({ error }: { error: unknown }) {
  return error ? (
    <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
      {getApiErrorMessage(error)}
    </p>
  ) : null;
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function WarehouseLiveBadge({
  status,
}: {
  status: WarehouseLiveStatus;
}) {
  const text = {
    connecting: "Đang kết nối trực tiếp",
    connected: "Đang cập nhật trực tiếp",
    reconnecting: "Đang kết nối lại · tự tải dự phòng",
    offline: "Chưa kết nối trực tiếp",
  }[status];
  return (
    <span
      role="status"
      className={
        "rounded-full px-3 py-1 text-xs " +
        (status === "connected"
          ? "bg-emerald-50 text-emerald-800"
          : "bg-slate-100 text-slate-600")
      }
    >
      {text}
    </span>
  );
}
function ReadingChart({
  rows,
  maxGap,
}: {
  rows: SensorReading[];
  maxGap: number;
}) {
  const points = [...rows].reverse();
  if (points.length < 2)
    return (
      <p className="text-sm text-slate-500">
        Cần ít nhất hai bản đo để vẽ biểu đồ.
      </p>
    );
  const temperatures = points.map((p) => p.temperature),
    minimum = Math.min(...temperatures) - 1,
    maximum = Math.max(...temperatures) + 1;
  const start = Date.parse(points[0].recordedAt),
    end = Date.parse(points[points.length - 1].recordedAt);
  const segments: string[][] = [];
  points.forEach((point, index) => {
    if (
      index === 0 ||
      Date.parse(point.recordedAt) - Date.parse(points[index - 1].recordedAt) >
        maxGap * 1000
    )
      segments.push([]);
    segments[segments.length - 1].push(
      `${20 + ((Date.parse(point.recordedAt) - start) / Math.max(1, end - start)) * 680},${150 - ((point.temperature - minimum) / (maximum - minimum)) * 120}`
    );
  });
  return (
    <div className="rounded-xl border bg-white p-3">
      <svg
        viewBox="0 0 720 180"
        role="img"
        aria-label="Lịch sử nhiệt độ theo thời gian"
        className="w-full"
      >
        <line x1="20" y1="150" x2="700" y2="150" stroke="#cbd5e1" />
        {segments.map((segment, index) => (
          <polyline
            key={index}
            points={segment.join(" ")}
            fill="none"
            stroke="#047857"
            strokeWidth="2"
          />
        ))}
        <text x="20" y="18" fontSize="12">
          {maximum.toFixed(1)} °C
        </text>
        <text x="20" y="170" fontSize="11">
          {formatTime(points[0].recordedAt)}
        </text>
        <text x="700" y="170" textAnchor="end" fontSize="11">
          {formatTime(points[points.length - 1].recordedAt)}
        </text>
      </svg>
      <p className="text-xs text-slate-500">
        Tối đa 2.000 bản đo gần nhất trong khoảng chọn. Đường bị ngắt khi khoảng
        cách giữa hai bản đo vượt cấu hình tín hiệu.
      </p>
    </div>
  );
}
function RuleForm({
  initial,
  locations,
  busy,
  save,
}: {
  initial?: MonitoringRule;
  locations: StorageLocation[];
  busy: boolean;
  save: (input: MonitoringRuleInput, id?: string) => Promise<void>;
}) {
  const [kind, setKind] = useState<MonitoringRuleKind>(
    initial?.kind ?? "TEMPERATURE_HIGH"
  );
  const percent = kind === "SHELF_LIFE_LOW_HIGH_STOCK";
  const stock = kind === "NEAR_EXPIRY_HIGH_STOCK" || percent;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await save(
      {
        name: value(data, "name"),
        kind,
        locationId: value(data, "locationId") || null,
        threshold: number(data, "threshold"),
        durationMinutes: stock ? 0 : number(data, "duration"),
        recoveryMinutes: stock ? 0 : number(data, "recovery"),
        minQuantityKg: stock ? number(data, "quantity") : null,
        severity: value(data, "severity"),
        enabled: data.has("enabled"),
      },
      initial?.id
    );
  }
  return (
    <form
      onSubmit={submit}
      className="max-h-[70vh] space-y-3 overflow-auto pr-1"
    >
      <Field label="Tên quy tắc">
        <Input
          name="name"
          required
          maxLength={100}
          defaultValue={initial?.name}
        />
      </Field>
      <Field label="Điều kiện">
        <Select
          value={kind}
          onChange={(e) => setKind(e.target.value as MonitoringRuleKind)}
        >
          {Object.entries(kinds).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Phạm vi">
        <Select name="locationId" defaultValue={initial?.locationId ?? ""}>
          <option value="">Toàn kho</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.code} · {l.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label={
          percent
            ? "Hạn dùng còn dưới (%)"
            : stock
              ? "Hạn dùng còn tối đa (ngày)"
              : kind.startsWith("TEMPERATURE")
                ? "Ngưỡng nhiệt độ (°C)"
                : "Ngưỡng độ ẩm (%)"
        }
      >
        <Input
          key={kind}
          name="threshold"
          type="number"
          required
          step={stock && !percent ? 1 : 0.1}
          min={stock ? 0 : kind.startsWith("HUMIDITY") ? 0 : -100}
          max={stock && !percent ? 365 : 100}
          defaultValue={
            initial?.kind === kind
              ? initial.threshold
              : stock && !percent
                ? 3
                : 10
          }
        />
      </Field>
      {stock ? (
        <>
          <Field label="Tổng tồn thực tế của lô lớn hơn (kg)">
            <Input
              name="quantity"
              required
              type="number"
              min="0"
              step="0.001"
              defaultValue={initial?.minQuantityKg ?? 500}
            />
          </Field>
          <p className="text-xs text-slate-500">
            Cộng tồn của cùng lô trong phạm vi chọn, gồm hàng đang giữ và cách
            ly.{" "}
            {percent
              ? "% còn lại = (ngày hết hạn − hôm nay) / (ngày hết hạn − ngày thu hoạch) × 100. Thiếu ngày thu hoạch hợp lệ sẽ tạo cảnh báo dữ liệu, không tự suy đoán."
              : "Điều kiện tính theo số ngày còn đến hạn."}
          </p>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vượt ngưỡng liên tục (phút)">
            <Input
              name="duration"
              required
              type="number"
              min={0}
              max={1440}
              step={1}
              defaultValue={initial?.durationMinutes ?? 120}
            />
          </Field>
          <Field label="Ổn định để kết thúc (phút)">
            <Input
              name="recovery"
              required
              type="number"
              min={0}
              max={1440}
              step={1}
              defaultValue={initial?.recoveryMinutes ?? 5}
            />
          </Field>
        </div>
      )}
      <Field label="Mức độ">
        <Select name="severity" defaultValue={initial?.severity ?? "HIGH"}>
          <option value="MEDIUM">Trung bình</option>
          <option value="HIGH">Cao</option>
          <option value="CRITICAL">Khẩn cấp</option>
        </Select>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          name="enabled"
          type="checkbox"
          defaultChecked={initial?.enabled ?? true}
        />
        Bật quy tắc
      </label>
      <p className="text-xs text-slate-500">
        Thiếu bản đo không được tính là vượt ngưỡng liên tục. Kết thúc sự cố
        nhiệt độ không tự giải phóng hàng cách ly.
      </p>
      <Button type="submit" disabled={busy}>
        Lưu quy tắc
      </Button>
    </form>
  );
}
export function WarehouseMonitoringPanel({
  warehouseId,
  locations,
  liveStatus,
}: {
  warehouseId: string;
  locations: StorageLocation[];
  liveStatus: WarehouseLiveStatus;
}) {
  const client = useQueryClient();
  const [busy, setBusy] = useState(false),
    [modal, setModal] = useState<"device" | "rule" | "settings" | null>(null);
  const [editingRule, setEditingRule] = useState<MonitoringRule | undefined>();
  const [historyRule, setHistoryRule] = useState<MonitoringRule | null>(null);
  const [revisionPage, setRevisionPage] = useState(0);
  const [secret, setSecret] = useState<SensorSecret | null>(null),
    [sample, setSample] = useState<SensorDevice | null>(null),
    [disable, setDisable] = useState<SensorDevice | null>(null);
  const [selectedDevice, setSelectedDevice] = useState(""),
    [hours, setHours] = useState(2),
    [deliveryPage, setDeliveryPage] = useState(0);
  const prefix = ["warehouse", warehouseId, "monitoring"];
  const settings = useQuery({
    queryKey: [...prefix, "settings"],
    queryFn: () => service.settings(warehouseId),
    retry: false,
  });
  const devices = useQuery({
    queryKey: [...prefix, "devices"],
    queryFn: () => service.devices(warehouseId),
    retry: false,
    refetchInterval: 30000,
  });
  const rules = useQuery({
    queryKey: [...prefix, "rules"],
    queryFn: () => service.rules(warehouseId),
    retry: false,
  });
  const latest = useQuery({
    queryKey: [...prefix, "latest"],
    queryFn: () => service.latest(warehouseId),
    retry: false,
    refetchInterval: 30000,
  });
  const revisions = useQuery({
    queryKey: [...prefix, "revisions", historyRule?.id, revisionPage],
    queryFn: () =>
      service.ruleHistory(warehouseId, historyRule!.id, revisionPage),
    enabled: !!historyRule,
    retry: false,
  });
  const alerts = useQuery({
    queryKey: ["warehouse", warehouseId, "alerts"],
    queryFn: () => warehouseService.alerts(warehouseId),
    retry: false,
    refetchInterval: 30000,
  });
  const deliveries = useQuery({
    queryKey: [...prefix, "deliveries", deliveryPage],
    queryFn: () => service.deliveries(warehouseId, deliveryPage),
    retry: false,
    refetchInterval: 30000,
  });
  useEffect(() => {
    if (!selectedDevice && devices.data?.length)
      setSelectedDevice(devices.data[0].id);
  }, [selectedDevice, devices.data]);
  const history = useQuery({
    queryKey: [...prefix, "history", selectedDevice, hours],
    queryFn: () => {
      const end = new Date();
      return service.readings(
        warehouseId,
        selectedDevice,
        new Date(end.getTime() - hours * 3600000).toISOString(),
        end.toISOString()
      );
    },
    enabled: !!selectedDevice,
    retry: false,
    refetchInterval: 30000,
  });
  const locationName = (id: string | null) =>
    id
      ? (locations.find((l) => l.id === id)?.code ?? id.slice(0, 8))
      : "Cả kho";
  async function run(
    action: () => Promise<unknown>,
    message = "Đã lưu thay đổi."
  ) {
    if (busy) return false;
    setBusy(true);
    try {
      await action();
      await client.invalidateQueries({ queryKey: ["warehouse", warehouseId] });
      toast.success(message);
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Giám sát môi trường kho</h2>
          <p className="text-sm text-slate-500">
            Cảnh báo được kiểm tra tự động; ngưỡng và thời gian duy trì do quản
            lý cấu hình.
          </p>
        </div>
        <WarehouseLiveBadge status={liveStatus} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={busy}
          onClick={() =>
            run(
              () => service.evaluate(warehouseId),
              "Đã đánh giá quy tắc giám sát."
            )
          }
        >
          Đánh giá ngay
        </Button>
        <Button variant="secondary" onClick={() => setModal("device")}>
          Thêm cảm biến
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setEditingRule(undefined);
            setModal("rule");
          }}
        >
          Thêm quy tắc
        </Button>
        <Button
          variant="secondary"
          disabled={!settings.data}
          onClick={() => setModal("settings")}
        >
          Tín hiệu & thông báo
        </Button>
      </div>
      <ErrorNotice error={settings.error} />
      <ErrorNotice error={devices.error} />
      <ErrorNotice error={latest.error} />
      <ErrorNotice error={alerts.error} />
      {devices.isPending && <p role="status">Đang tải cảm biến…</p>}
      {!devices.isPending && !devices.error && !devices.data?.length && (
        <p className="rounded-xl border bg-white p-5 text-slate-500">
          Chưa có cảm biến. Đăng ký thiết bị hoặc cảm biến giả lập để bắt đầu
          nhận dữ liệu.
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {devices.data
          ?.filter((d) => d.active)
          .map((device) => {
            const reading = latest.data?.find((r) => r.deviceId === device.id);
            const incident = alerts.data?.some(
              (a) => a.deviceId === device.id && a.status !== "RESOLVED"
            );
            const warning =
              reading?.fresh &&
              rules.data?.some(
                (r) =>
                  r.enabled &&
                  (r.locationId === null ||
                    r.locationId === device.locationId) &&
                  (r.kind === "TEMPERATURE_HIGH"
                    ? reading.temperature > r.threshold
                    : r.kind === "TEMPERATURE_LOW"
                      ? reading.temperature < r.threshold
                      : r.kind === "HUMIDITY_HIGH"
                        ? reading.humidity > r.threshold
                        : r.kind === "HUMIDITY_LOW"
                          ? reading.humidity < r.threshold
                          : false)
              );
            return (
              <article
                key={device.id}
                className={
                  "space-y-2 rounded-xl border p-4 " +
                  (incident
                    ? "border-red-300 bg-red-50"
                    : !reading?.fresh
                      ? "bg-slate-50"
                      : warning
                        ? "border-amber-300 bg-amber-50"
                        : "border-emerald-200 bg-emerald-50")
                }
              >
                <div className="flex justify-between gap-2">
                  <h3 className="font-semibold">{device.name}</h3>
                  <span className="text-xs">
                    {device.simulated ? "Giả lập" : "Thiết bị đăng ký"}
                  </span>
                </div>
                <p className="text-sm">{locationName(device.locationId)}</p>
                <p className="text-2xl font-semibold">
                  {reading
                    ? `${reading.temperature} °C · ${reading.humidity}%`
                    : "Chưa có số đo"}
                </p>
                <p className="text-sm">
                  {!reading?.fresh
                    ? "Chưa có dữ liệu mới"
                    : incident
                      ? "Có cảnh báo cần xử lý"
                      : warning
                        ? "Đang vượt ngưỡng, theo dõi thời gian"
                        : "Trong ngưỡng đã cấu hình"}
                </p>
                <p className="text-xs text-slate-500">
                  Đo: {formatTime(reading?.recordedAt)}
                  <br />
                  Nhận: {formatTime(reading?.receivedAt)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {device.simulated && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSample(device)}
                    >
                      Gửi mẫu giả lập
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDisable(device)}
                  >
                    Ngừng thiết bị
                  </Button>
                </div>
              </article>
            );
          })}
      </div>
      <section className="space-y-3">
        <h3 className="font-semibold">Quy tắc đang cấu hình</h3>
        <ErrorNotice error={rules.error} />
        {!rules.data?.length && !rules.isPending && (
          <p className="text-sm text-slate-500">
            Chưa có quy tắc tùy chỉnh. Các ngưỡng tồn kho cơ bản vẫn được quản
            lý trong tab Cảnh báo.
          </p>
        )}
        {rules.data?.map((rule) => (
          <article
            key={rule.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"
          >
            <div>
              <h4 className="font-medium">
                {rule.name}{" "}
                <span className="text-xs text-slate-500">
                  · {rule.enabled ? "Đang bật" : "Đã tắt"}
                </span>
              </h4>
              <p className="text-sm">
                {kinds[rule.kind]} · {rule.threshold}
                {rule.kind === "NEAR_EXPIRY_HIGH_STOCK"
                  ? ` ngày và tồn > ${rule.minQuantityKg} kg`
                  : rule.kind === "SHELF_LIFE_LOW_HIGH_STOCK"
                    ? `% hạn dùng và tồn > ${rule.minQuantityKg} kg`
                    : rule.kind.startsWith("TEMPERATURE")
                      ? " °C"
                      : " %"}{" "}
                · {locationName(rule.locationId)}
              </p>
              {rule.kind !== "NEAR_EXPIRY_HIGH_STOCK" &&
                rule.kind !== "SHELF_LIFE_LOW_HIGH_STOCK" && (
                  <p className="text-xs text-slate-500">
                    Duy trì {rule.durationMinutes} phút · phục hồi{" "}
                    {rule.recoveryMinutes} phút
                  </p>
                )}
              <p className="text-xs text-slate-500">
                Cập nhật: {rule.updatedBy} · {formatTime(rule.updatedAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setRevisionPage(0);
                  setHistoryRule(rule);
                }}
              >
                Lịch sử
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setEditingRule(rule);
                  setModal("rule");
                }}
              >
                Sửa quy tắc
              </Button>
            </div>
          </article>
        ))}
      </section>
      <section className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <h3 className="mr-auto font-semibold">Lịch sử số đo</h3>
          <Field label="Thiết bị">
            <Select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
            >
              <option value="">Chọn cảm biến</option>
              {devices.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.active ? "" : " (đã ngừng)"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Khoảng xem">
            <Select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            >
              <option value={1}>1 giờ</option>
              <option value={2}>2 giờ</option>
              <option value={6}>6 giờ</option>
              <option value={24}>24 giờ</option>
            </Select>
          </Field>
        </div>
        <ErrorNotice error={history.error} />
        {history.isFetching && (
          <p role="status" className="text-sm">
            Đang tải lịch sử…
          </p>
        )}
        {selectedDevice && (
          <ReadingChart
            rows={history.data ?? []}
            maxGap={settings.data?.maxGapSeconds ?? 120}
          />
        )}
        {history.data?.slice(0, 5).map((r) => (
          <p key={r.id} className="text-sm text-slate-600">
            {formatTime(r.recordedAt)} · {r.temperature} °C · {r.humidity}% ·{" "}
            {r.simulated ? "giả lập" : "thiết bị đăng ký"}
          </p>
        ))}
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold">Lịch sử gửi Telegram</h3>
        <ErrorNotice error={deliveries.error} />
        <p className="text-sm text-slate-500">
          {settings.data?.telegramEnabled
            ? "Đã bật gửi đến nhóm cấu hình."
            : "Telegram đang tắt. Cảnh báo trong hệ thống vẫn hoạt động."}{" "}
          Yêu cầu gửi được lưu để thử lại khi có lỗi.
        </p>
        {deliveries.data?.map((d) => (
          <div
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-3 text-sm"
          >
            <p>
              Cảnh báo {d.alertId.slice(0, 8)} ·{" "}
              {{
                PENDING: "Chờ gửi",
                RETRY: "Đang chờ thử lại",
                SENT: "Đã gửi",
                FAILED: "Gửi thất bại",
                CANCELLED: "Đã hủy",
              }[d.status] ?? d.status}{" "}
              · {d.attempts} lần thử
              {d.sentAt && <span> · {formatTime(d.sentAt)}</span>}
            </p>
            {["RETRY", "FAILED"].includes(d.status) && (
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  run(
                    () => service.retryDelivery(warehouseId, d.id),
                    "Đã đưa vào hàng chờ gửi lại."
                  )
                }
              >
                Thử lại
              </Button>
            )}
          </div>
        ))}
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={deliveryPage === 0}
            onClick={() => setDeliveryPage(deliveryPage - 1)}
          >
            Trước
          </Button>
          <span className="text-sm">Trang {deliveryPage + 1}</span>
          <Button
            size="sm"
            variant="secondary"
            disabled={deliveries.data?.length !== 100}
            onClick={() => setDeliveryPage(deliveryPage + 1)}
          >
            Sau
          </Button>
        </div>
      </section>
      {modal === "device" && (
        <Modal title="Đăng ký cảm biến" onClose={() => !busy && setModal(null)}>
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              if (
                await run(
                  async () =>
                    setSecret(
                      await service.createDevice(warehouseId, {
                        name: value(data, "name"),
                        locationId: value(data, "locationId") || null,
                        simulated: data.has("simulated"),
                      })
                    ),
                  "Đã đăng ký thiết bị."
                )
              )
                setModal(null);
            }}
          >
            <Field label="Tên cảm biến">
              <Input name="name" required maxLength={100} />
            </Field>
            <Field label="Vị trí đo">
              <Select name="locationId">
                <option value="">Đại diện cả kho</option>
                {locations
                  .filter((l) => l.active)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code} · {l.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input name="simulated" type="checkbox" defaultChecked />
              Cảm biến giả lập dùng thử
            </label>
            <p className="text-sm text-slate-500">
              Mỗi phạm vi có một cảm biến đang hoạt động. Dữ liệu giả lập được
              ghi nhãn riêng.
            </p>
            <Button type="submit" disabled={busy}>
              Đăng ký
            </Button>
          </form>
        </Modal>
      )}
      {secret && (
        <Modal title="Khóa thiết bị mới" onClose={() => setSecret(null)}>
          <div className="space-y-3">
            <p className="text-sm">
              Khóa chỉ hiển thị lần này. Sao chép vào thiết bị hoặc công cụ giả
              lập; danh sách cảm biến không trả lại khóa.
            </p>
            <Field label="ID thiết bị">
              <Input readOnly value={secret.device.id} />
            </Field>
            <Field label="Khóa gửi dữ liệu">
              <Input readOnly value={secret.deviceKey} />
            </Field>
            <Button onClick={() => setSecret(null)}>Đã lưu khóa</Button>
          </div>
        </Modal>
      )}
      {historyRule && (
        <Modal
          title={"Lịch sử quy tắc · " + historyRule.name}
          onClose={() => setHistoryRule(null)}
        >
          <div className="space-y-3">
            <ErrorNotice error={revisions.error} />
            {revisions.isPending && <p>Đang tải lịch sử…</p>}
            {revisions.data?.map((r) => (
              <article key={r.id} className="rounded-xl border p-3 text-sm">
                <p className="font-medium">
                  {r.definition.name} · {r.definition.enabled ? "Bật" : "Tắt"}
                </p>
                <p>
                  {kinds[r.definition.kind]}: {r.definition.threshold}
                  {r.definition.kind === "NEAR_EXPIRY_HIGH_STOCK"
                    ? ` ngày; tồn trên ${r.definition.minQuantityKg} kg`
                    : r.definition.kind === "SHELF_LIFE_LOW_HIGH_STOCK"
                      ? `% hạn dùng; tồn trên ${r.definition.minQuantityKg} kg`
                      : r.definition.kind.startsWith("TEMPERATURE")
                        ? " °C"
                        : " %"}
                </p>
                <p>
                  {locationName(r.definition.locationId)} ·{" "}
                  {r.definition.severity} · Duy trì{" "}
                  {r.definition.durationMinutes} phút · phục hồi{" "}
                  {r.definition.recoveryMinutes} phút
                </p>
                <p className="text-xs text-slate-500">
                  {r.actor} · {formatTime(r.createdAt)}
                </p>
              </article>
            ))}
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                disabled={!revisionPage || revisions.isFetching}
                onClick={() => setRevisionPage((p) => p - 1)}
              >
                Trước
              </Button>
              <span>Trang {revisionPage + 1}</span>
              <Button
                variant="secondary"
                disabled={
                  revisions.isFetching || (revisions.data?.length ?? 0) < 100
                }
                onClick={() => setRevisionPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {modal === "rule" && (
        <Modal
          title={editingRule ? "Sửa quy tắc" : "Thêm quy tắc"}
          onClose={() => !busy && setModal(null)}
        >
          <RuleForm
            key={editingRule?.id ?? "new"}
            initial={editingRule}
            locations={locations}
            busy={busy}
            save={async (input, id) => {
              if (
                await run(
                  () => service.saveRule(warehouseId, input, id),
                  "Đã lưu quy tắc."
                )
              )
                setModal(null);
            }}
          />
        </Modal>
      )}
      {modal === "settings" && settings.data && (
        <Modal
          title="Tín hiệu và thông báo"
          onClose={() => !busy && setModal(null)}
        >
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              if (
                await run(() =>
                  service.saveSettings(warehouseId, {
                    maxGapSeconds: number(data, "gap"),
                    telegramEnabled: data.has("telegramEnabled"),
                    telegramChatId: value(data, "chatId") || null,
                  })
                )
              )
                setModal(null);
            }}
          >
            <Field label="Khoảng cách tối đa giữa hai bản đo (giây)">
              <Input
                name="gap"
                type="number"
                required
                min={10}
                max={3600}
                step={1}
                defaultValue={settings.data.maxGapSeconds}
              />
            </Field>
            <p className="text-xs text-slate-500">
              Quá khoảng này, hệ thống đánh dấu mất dữ liệu. Chuỗi vượt ngưỡng
              có khoảng trống sẽ được tính lại.
            </p>
            <Field label="Mã nhóm Telegram">
              <Input
                name="chatId"
                maxLength={100}
                defaultValue={settings.data.telegramChatId ?? ""}
                placeholder="-100…"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                name="telegramEnabled"
                type="checkbox"
                disabled={!settings.data.telegramConfigured}
                defaultChecked={settings.data.telegramEnabled}
              />
              Bật gửi Telegram
            </label>
            {!settings.data.telegramConfigured && (
              <p className="text-sm text-slate-500">
                Quản trị hệ thống chưa cấu hình bot Telegram.
              </p>
            )}
            <Button type="submit" disabled={busy}>
              Lưu cấu hình
            </Button>
          </form>
        </Modal>
      )}
      {sample && (
        <Modal
          title="Gửi mẫu đo giả lập"
          onClose={() => !busy && setSample(null)}
        >
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              if (
                await run(
                  () =>
                    service.ingest({
                      deviceId: sample.id,
                      deviceKey: value(data, "key"),
                      messageId: crypto.randomUUID(),
                      recordedAt: new Date().toISOString(),
                      temperature: number(data, "temperature"),
                      humidity: number(data, "humidity"),
                      simulated: true,
                    }),
                  "Đã nhận mẫu đo giả lập."
                )
              )
                setSample(null);
            }}
          >
            <p className="text-sm">
              {sample.name} · {locationName(sample.locationId)}
            </p>
            <Field label="Khóa thiết bị">
              <Input
                name="key"
                type="password"
                autoComplete="off"
                required
                maxLength={100}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nhiệt độ (°C)">
                <Input
                  name="temperature"
                  type="number"
                  required
                  min={-100}
                  max={100}
                  step="0.1"
                  defaultValue={4}
                />
              </Field>
              <Field label="Độ ẩm (%)">
                <Input
                  name="humidity"
                  type="number"
                  required
                  min={0}
                  max={100}
                  step="0.1"
                  defaultValue={85}
                />
              </Field>
            </div>
            <p className="text-xs text-slate-500">
              Một bản đo không chứng minh được điều kiện kéo dài. Dùng lịch sử
              giả lập để thử quy tắc theo thời gian.
            </p>
            <Button type="submit" disabled={busy}>
              Gửi bản đo
            </Button>
          </form>
        </Modal>
      )}
      {disable && (
        <Modal title="Ngừng cảm biến" onClose={() => !busy && setDisable(null)}>
          <p className="mb-4 text-sm">
            Ngừng nhận dữ liệu từ {disable.name}? Lịch sử đo vẫn được giữ lại.
          </p>
          <Button
            variant="danger"
            disabled={busy}
            onClick={async () => {
              if (
                await run(
                  () => service.disableDevice(warehouseId, disable.id),
                  "Đã ngừng thiết bị."
                )
              )
                setDisable(null);
            }}
          >
            Ngừng thiết bị này
          </Button>
        </Modal>
      )}
    </div>
  );
}
