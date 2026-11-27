"use client";

import { Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Droplets,
  ExternalLink,
  Leaf,
  MapPin,
  PackageCheck,
  Printer,
  QrCode,
  Search,
  ShieldCheck,
  Sprout,
  Thermometer,
  Truck,
  Warehouse,
  X,
} from "lucide-react";
import { LotQrReader, readLotCode } from "@/components/ui/lot-qr-reader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { catalogService } from "@/services/catalog.service";
import { farmerService } from "@/services/farmer.service";
import { QrLabelModal } from "@/components/farmer/qr-label-modal";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";

type Measurement = {
  temperatureC: number;
  humidityPercent: number;
  recordedAt: string;
  simulated: boolean;
};

type TrackingEvent = {
  temperatureC: number | null;
  humidityPercent: number | null;
  status: string;
  timestamp: string;
};

type Chain = {
  batchCode: string;
  productName: string | null;
  source: string;
  farm: {
    name: string | null;
    location: string | null;
    certification: string | null;
    cultivation: string | null;
  };
  harvest: {
    harvestDate: string | null;
    expiryDate: string | null;
    qualityResult?: string | null;
  };
  warehouse: {
    stops: {
      warehouseId: string;
      warehouseName: string;
      location: string | null;
      receivedAt: string;
      targetTemperatureC: number | null;
      quantityKg: number;
      measurement: Measurement | null;
    }[];
  };
  shipments: {
    shipmentCode: string;
    status: string;
    quantityKg: number;
    dispatchTime: string | null;
    estimatedArrival: string | null;
    actualArrival: string | null;
    trackingEvents: TrackingEvent[];
  }[];
  delivery: {
    receivedAt: string | null;
  } | null;
  timeline: {
    stage: string;
    title: string;
    description: string | null;
    location: string | null;
    temperatureC: number | null;
    timestamp: string | null;
  }[];
};

const SHIPMENT_STATUS_META: Record<
  string,
  { label: string; badgeClass: string }
> = {
  PREPARING: {
    label: "Đang chuẩn bị",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  IN_TRANSIT: {
    label: "Đang vận chuyển",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
  },
  DELIVERED: {
    label: "Đã giao hàng",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  RECEIVED: {
    label: "Đã tiếp nhận",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  CANCELLED: {
    label: "Đã hủy",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
  },
  ON_SCHEDULE: {
    label: "Đúng lịch trình",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  DELAYED: {
    label: "Chậm tiến độ",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  INCIDENT: {
    label: "Có sự cố",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
  },
};

const STAGE_META: Record<
  string,
  { label: string; dotClass: string; badgeClass: string }
> = {
  FARM: {
    label: "Nông trại",
    dotClass: "bg-emerald-600",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  HARVEST: {
    label: "Thu hoạch",
    dotClass: "bg-lime-600",
    badgeClass: "bg-lime-50 text-lime-800 border-lime-200",
  },
  WAREHOUSE_IN: {
    label: "Nhập kho",
    dotClass: "bg-teal-600",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
  },
  WAREHOUSE_OUT: {
    label: "Xuất kho",
    dotClass: "bg-sky-600",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
  },
  SHIPPING: {
    label: "Vận chuyển",
    dotClass: "bg-indigo-600",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  DELIVERED: {
    label: "Đã giao",
    dotClass: "bg-emerald-700",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
};

const when = (value: string) =>
  new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

function formatDateText(raw?: string | null) {
  if (!raw) return "Chưa ghi nhận";
  const match = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : raw;
}

function getExpiryBadge(raw?: string | null) {
  if (!raw) return null;
  const cleaned = raw.trim();
  let iso = "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) iso = cleaned;
  else {
    const vn = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (vn) iso = `${vn[3]}-${vn[2]}-${vn[1]}`;
  }
  if (!iso) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const p = (t: string) => parts.find((i) => i.type === t)?.value ?? "";
  const todayIso = `${p("year")}-${p("month")}-${p("day")}`;
  const diffDays = Math.round(
    (Date.parse(iso) - Date.parse(todayIso)) / 86400000
  );
  if (diffDays < 0)
    return {
      label: "Đã hết hạn",
      cls: "bg-rose-500/20 text-rose-100 border-rose-300/40",
    };
  if (diffDays <= 3)
    return {
      label: diffDays === 0 ? "Hết hạn hôm nay" : `Còn ${diffDays} ngày`,
      cls: "bg-amber-400/25 text-amber-100 border-amber-300/40",
    };
  return {
    label: `Còn hạn (${diffDays} ngày)`,
    cls: "bg-emerald-400/20 text-emerald-100 border-emerald-300/40",
  };
}

function TracePage() {
  const params = useSearchParams();
  const paramCode = params.get("batch") || params.get("lot") || "";
  const [input, setInput] = useState(paramCode);
  const [code, setCode] = useState(readLotCode(paramCode));
  const [invalid, setInvalid] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [copied, setCopied] = useState(false);
  const roles = useAuthStore((s) => s.user?.roles);

  const lookup = (raw: string) => {
    const value = readLotCode(raw);
    setInput(value || raw);
    setCode(value);
    setInvalid(!value);
    setPrinting(false);
  };

  useEffect(() => {
    setInput(paramCode);
    setCode(readLotCode(paramCode));
    setInvalid(!!paramCode && !readLotCode(paramCode));
    setPrinting(false);
  }, [paramCode]);

  const records = useQuery({
    queryKey: ["trace-records"],
    queryFn: catalogService.getAllTraceability,
  });

  const query = useQuery({
    queryKey: ["public-chain", code],
    enabled: !!code,
    retry: false,
    queryFn: async ({ signal }) =>
      (
        await api.get<Chain>(
          "/traceability/" + encodeURIComponent(code) + "/chain",
          { signal }
        )
      ).data,
  });

  const data = query.data;
  const logs = useQuery({
    queryKey: ["trace-logs", data?.batchCode],
    enabled: !!data,
    queryFn: () => farmerService.getLogs({ batchCode: data!.batchCode }),
    retry: false,
  });

  const tab = params.get("tab");
  useEffect(() => {
    if (data && (tab === "cert" || tab === "log"))
      document
        .getElementById(tab === "cert" ? "cert-inspection" : "farming-log")
        ?.scrollIntoView({ behavior: "smooth" });
  }, [tab, data]);

  const handleCopyShareLink = async () => {
    if (!data || typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/traceability?batch=${encodeURIComponent(data.batchCode)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Đã sao chép liên kết truy xuất lô " + data.batchCode);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }
  };

  const expiryStatus = data ? getExpiryBadge(data.harvest.expiryDate) : null;

  const hasFarm = Boolean(data?.farm.name || data?.harvest.harvestDate);
  const hasWarehouse = Boolean(data?.warehouse.stops.length);
  const hasShipment = Boolean(data?.shipments.length);
  const hasDelivery = Boolean(
    data?.delivery?.receivedAt ||
      data?.shipments.some(
        (s) => s.status === "DELIVERED" || s.status === "RECEIVED"
      )
  );

  const journeySteps = [
    {
      label: "Nông trại & Thu hoạch",
      done: hasFarm,
      icon: Sprout,
    },
    {
      label: "Kho lạnh bảo quản",
      done: hasWarehouse,
      icon: Warehouse,
    },
    {
      label: "Vận chuyển lạnh",
      done: hasShipment,
      icon: Truck,
    },
    {
      label: "Giao hàng & Tiếp nhận",
      done: hasDelivery,
      icon: PackageCheck,
    },
  ];

  return (
    <div className="biophilic-mesh min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <main className="mx-auto max-w-5xl space-y-6">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Link href="/" className="transition-colors hover:text-primary">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="font-semibold text-foreground">
            Truy xuất nguồn gốc
          </span>
        </nav>

        {/* Page Hero Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Hồ sơ minh bạch từ nông trại tới bàn ăn</span>
          </div>
          <h1 className="font-serif-display flex items-center justify-center gap-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <QrCode className="text-primary" size={30} aria-hidden="true" />
            <span>Truy Xuất Nguồn Gốc Lô Nông Sản</span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Nhập hoặc quét mã QR trên tem nhãn để kiểm tra lịch sử thu hoạch,
            nhật ký canh tác, điều kiện kho lạnh và hành trình vận chuyển thực
            tế của lô hàng.
          </p>
        </div>

        {/* Search & QR Scanner Card */}
        <section className="bento-card space-y-4 p-5 sm:p-6">
          <form
            className="flex flex-col gap-2.5 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              lookup(input);
            }}
          >
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                aria-label="Mã lô"
                placeholder="Nhập mã lô trên tem (VD: XL-2026-08, DEMO-...)"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (invalid) setInvalid(false);
                }}
                className="h-11 rounded-xl pl-10 pr-9 font-mono-code text-sm"
                required
              />
              {input && (
                <button
                  type="button"
                  aria-label="Xóa mã lô đang nhập"
                  onClick={() => {
                    setInput("");
                    setCode("");
                    setInvalid(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <Button type="submit" className="h-11 rounded-xl px-6 font-semibold">
              <Search size={16} aria-hidden="true" />
              Tra cứu lô
            </Button>
          </form>

          <div className="flex flex-col justify-between gap-3 border-t border-border/70 pt-3 sm:flex-row sm:items-start">
            <LotQrReader onCode={lookup} />

            {!!records.data?.length && (
              <div className="space-y-1.5 sm:max-w-md sm:text-right">
                <p className="text-xs font-medium text-muted-foreground">
                  Lô gợi ý tra cứu nhanh:
                </p>
                <div className="flex flex-wrap gap-1.5 sm:justify-end">
                  {records.data.slice(0, 6).map((r) => (
                    <button
                      type="button"
                      key={r.batchCode}
                      onClick={() => lookup(r.batchCode)}
                      className={
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors " +
                        (code.toLowerCase() === r.batchCode.toLowerCase()
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface/70 text-foreground hover:border-emerald-300 hover:bg-emerald-50")
                      }
                    >
                      <span className="font-mono-code font-semibold">
                        {r.batchCode}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {invalid && (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-800"
            >
              <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
              Mã lô không hợp lệ. Vui lòng kiểm tra lại ký tự trên tem.
            </p>
          )}

          {query.isError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              <span className="flex items-center gap-2 font-medium">
                <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
                {axios.isAxiosError(query.error) &&
                query.error.response?.status === 404
                  ? `Không tìm thấy hồ sơ truy xuất cho mã lô "${code}".`
                  : "Chưa tải được hồ sơ lô. Vui lòng thử lại."}
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => query.refetch()}
              >
                Thử lại
              </Button>
            </div>
          )}
        </section>

        {/* Loading Skeleton */}
        {code && query.isPending && (
          <div role="status" className="space-y-4">
            <p className="sr-only">Đang tra cứu lô…</p>
            <div className="h-36 animate-pulse rounded-2xl bg-emerald-900/15" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-44 animate-pulse rounded-2xl bg-white/80" />
              <div className="h-44 animate-pulse rounded-2xl bg-white/80" />
            </div>
          </div>
        )}

        {/* Empty Initial State */}
        {!code && !invalid && (
          <section className="bento-card grid gap-4 p-6 text-center sm:grid-cols-3 sm:text-left">
            <div className="space-y-1.5 rounded-xl bg-surface/70 p-4">
              <Sprout className="text-primary" size={20} />
              <h2 className="text-sm font-semibold text-foreground">
                1. Nguồn gốc & Canh tác
              </h2>
              <p className="text-xs text-muted-foreground">
                Hiển thị nông trại sản xuất, chứng nhận VietGAP/GlobalGAP, ngày
                thu hoạch và nhật ký chăm sóc có minh chứng.
              </p>
            </div>
            <div className="space-y-1.5 rounded-xl bg-surface/70 p-4">
              <Thermometer className="text-teal-700" size={20} />
              <h2 className="text-sm font-semibold text-foreground">
                2. Lưu kho chuỗi lạnh
              </h2>
              <p className="text-xs text-muted-foreground">
                Theo dõi thời điểm nhập kho, tồn kho thực tế và số đo nhiệt độ,
                độ ẩm kho trong suốt thời gian lưu lô.
              </p>
            </div>
            <div className="space-y-1.5 rounded-xl bg-surface/70 p-4">
              <Truck className="text-sky-700" size={20} />
              <h2 className="text-sm font-semibold text-foreground">
                3. Vận chuyển & Bàn giao
              </h2>
              <p className="text-xs text-muted-foreground">
                Xác thực các chuyến xe lạnh đã nhận bàn giao, nhật ký nhiệt độ
                hành trình và thời điểm giao hàng.
              </p>
            </div>
          </section>
        )}

        {/* Traceability Result */}
        {data && (
          <article className="space-y-5">
            {/* Hero Result Banner */}
            <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-6 text-white shadow-lg sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-code rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-emerald-100">
                      {data.batchCode}
                    </span>
                    {data.source === "LEGACY_RECORD" ? (
                      <span className="rounded-full border border-amber-300/40 bg-amber-400/20 px-2.5 py-0.5 text-xs font-medium text-amber-100">
                        Hồ sơ lưu trữ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-2.5 py-0.5 text-xs font-medium text-emerald-100">
                        <CheckCircle2 size={12} />
                        Dữ liệu vận hành thực tế
                      </span>
                    )}
                    {expiryStatus && (
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${expiryStatus.cls}`}
                      >
                        {expiryStatus.label}
                      </span>
                    )}
                  </div>
                  <h2 className="font-serif-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {data.productName || "Lô nông sản"}
                  </h2>
                  <p className="text-sm text-emerald-100/85">
                    {data.farm.name || "Chưa ghi nhận nông trại"}
                    {data.farm.location ? ` · ${data.farm.location}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleCopyShareLink}
                    className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Đã sao chép" : "Sao chép link"}
                  </Button>
                  {data.productName &&
                    data.farm.certification &&
                    data.farm.name && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setPrinting(true)}
                        className="rounded-xl border-0 bg-white !text-emerald-950 hover:bg-emerald-50"
                      >
                        <Printer size={14} />
                        In tem QR
                      </Button>
                    )}
                </div>
              </div>

              {/* 4-Stage Progress Stepper */}
              <div className="mt-6 grid grid-cols-2 gap-2.5 border-t border-white/15 pt-5 sm:grid-cols-4">
                {journeySteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.label}
                      className={
                        "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs transition-colors " +
                        (step.done
                          ? "border-emerald-300/35 bg-white/12 text-white"
                          : "border-white/10 bg-black/15 text-white/55")
                      }
                    >
                      <span
                        className={
                          "flex size-7 shrink-0 items-center justify-center rounded-lg " +
                          (step.done
                            ? "bg-emerald-400/25 text-emerald-200"
                            : "bg-white/10 text-white/45")
                        }
                      >
                        <Icon size={15} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{step.label}</p>
                        <p className="text-[11px] opacity-80">
                          {step.done ? "Đã ghi nhận" : "Chưa có dữ liệu"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </header>

            {/* Main 2-column Bento Grid */}
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Farm & Harvest Card */}
              <section
                className="bento-card space-y-4 p-5 sm:p-6"
                id="cert-inspection"
              >
                <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Leaf size={18} aria-hidden="true" />
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">
                      Nông trại & Thu hoạch
                    </h3>
                  </div>
                  {data.farm.certification && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      <Award size={13} aria-hidden="true" />
                      {data.farm.certification}
                    </span>
                  )}
                </div>

                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-surface/70 p-3 sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">
                      Đơn vị sản xuất
                    </dt>
                    <dd className="mt-0.5 font-semibold text-foreground">
                      {data.farm.name || "Chưa ghi nhận nông trại"}
                    </dd>
                    {data.farm.location && (
                      <dd className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin size={12} aria-hidden="true" />
                        <span>{data.farm.location}</span>
                      </dd>
                    )}
                  </div>

                  <div className="rounded-xl bg-surface/70 p-3">
                    <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar size={12} aria-hidden="true" />
                      Ngày thu hoạch
                    </dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {formatDateText(data.harvest.harvestDate)}
                    </dd>
                  </div>

                  <div className="rounded-xl bg-surface/70 p-3">
                    <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={12} aria-hidden="true" />
                      Hạn sử dụng
                    </dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {formatDateText(data.harvest.expiryDate)}
                    </dd>
                  </div>

                  <div className="rounded-xl bg-surface/70 p-3 sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">
                      Chứng nhận theo hồ sơ
                    </dt>
                    <dd className="mt-0.5 font-medium text-foreground">
                      {data.farm.certification || "Chưa ghi nhận"}
                    </dd>
                    {data.farm.cultivation && (
                      <dd className="mt-1.5 border-t border-border/60 pt-1.5 text-xs text-muted-foreground">
                        Phương thức canh tác: {data.farm.cultivation}
                      </dd>
                    )}
                  </div>
                </dl>
              </section>

              {/* Warehouse Cold-Chain Card */}
              <section className="bento-card space-y-4 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Warehouse size={18} aria-hidden="true" />
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">
                      Lịch sử nhập kho
                    </h3>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {data.warehouse.stops.length} điểm kho
                  </span>
                </div>

                {!data.warehouse.stops.length ? (
                  <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-muted-foreground">
                    Chưa ghi nhận nhập kho.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.warehouse.stops.map((s) => (
                      <div
                        key={s.warehouseId}
                        className="space-y-2.5 rounded-xl border border-border/80 bg-surface/50 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <strong className="text-sm font-semibold text-foreground">
                              {s.warehouseName}
                            </strong>
                            {s.location && (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin size={12} aria-hidden="true" />
                                <span>{s.location}</span>
                              </p>
                            )}
                          </div>
                          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                            Tồn: {s.quantityKg.toLocaleString("vi-VN")} kg
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Nhập lần đầu: {when(s.receivedAt)}</span>
                          {s.targetTemperatureC != null && (
                            <span>
                              Nhiệt độ mục tiêu: {s.targetTemperatureC} °C
                            </span>
                          )}
                        </div>

                        {s.measurement ? (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal-200/70 bg-white px-3 py-2 text-xs">
                            <div className="flex flex-wrap items-center gap-3 font-medium text-foreground">
                              <span className="inline-flex items-center gap-1 text-teal-800">
                                <Thermometer size={13} aria-hidden="true" />
                                {s.measurement.temperatureC} °C
                              </span>
                              <span className="inline-flex items-center gap-1 text-sky-800">
                                <Droplets size={13} aria-hidden="true" />
                                {s.measurement.humidityPercent}%
                              </span>
                              <span className="text-muted-foreground">
                                Lúc {when(s.measurement.recordedAt)}
                              </span>
                            </div>
                            <span
                              className={
                                "rounded-full px-2 py-0.5 text-[11px] font-medium " +
                                (s.measurement.simulated
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-emerald-50 text-emerald-800")
                              }
                            >
                              {s.measurement.simulated
                                ? "Cảm biến giả lập"
                                : "Thiết bị đăng ký"}
                            </span>
                          </div>
                        ) : (
                          <p className="rounded-lg bg-white/80 px-3 py-2 text-xs text-muted-foreground">
                            Chưa có số đo đại diện cả kho trong thời gian lưu lô.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Shipments & Cold-chain Tracking */}
            <section className="bento-card space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <Truck size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Chuyến đã nhận bàn giao
                    </h3>
                    {data.delivery?.receivedAt && (
                      <p className="text-xs text-emerald-700">
                        Tiếp nhận gần nhất: {when(data.delivery.receivedAt)}
                      </p>
                    )}
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {data.shipments.length} chuyến
                </span>
              </div>

              {!data.shipments.length ? (
                <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-muted-foreground">
                  Chưa ghi nhận bàn giao lô cho chuyến.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.shipments.map((s) => {
                    const statusMeta = SHIPMENT_STATUS_META[s.status] ?? {
                      label: s.status,
                      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
                    };
                    return (
                      <div
                        key={s.shipmentCode}
                        className="space-y-3 rounded-xl border border-border/80 bg-surface/50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono-code text-sm font-bold text-foreground">
                            {s.shipmentCode}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.badgeClass}`}
                          >
                            {statusMeta.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg bg-white p-2.5">
                            <span className="block text-muted-foreground">
                              Sản lượng bàn giao
                            </span>
                            <strong className="text-sm text-foreground">
                              {s.quantityKg.toLocaleString("vi-VN")} kg
                            </strong>
                          </div>
                          <div className="rounded-lg bg-white p-2.5">
                            <span className="block text-muted-foreground">
                              {s.actualArrival
                                ? "Đến nơi thực tế"
                                : s.estimatedArrival
                                  ? "Dự kiến đến"
                                  : "Xuất phát"}
                            </span>
                            <strong className="text-xs font-semibold text-foreground">
                              {s.actualArrival
                                ? when(s.actualArrival)
                                : s.estimatedArrival
                                  ? when(s.estimatedArrival)
                                  : s.dispatchTime
                                    ? when(s.dispatchTime)
                                    : "Chưa cập nhật"}
                            </strong>
                          </div>
                        </div>

                        {s.trackingEvents?.length > 0 && (
                          <div className="space-y-1.5 border-t border-border/60 pt-2.5">
                            <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                              <Activity size={12} aria-hidden="true" />
                              Giám sát hành trình ({s.trackingEvents.length}{" "}
                              mốc)
                            </p>
                            <ul className="max-h-40 space-y-1.5 overflow-y-auto pr-1 text-xs">
                              {s.trackingEvents.map((ev, idx) => {
                                const evMeta =
                                  SHIPMENT_STATUS_META[ev.status] ?? null;
                                return (
                                  <li
                                    key={idx}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5"
                                  >
                                    <span className="font-medium text-foreground">
                                      {evMeta ? evMeta.label : ev.status}
                                    </span>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      {ev.temperatureC != null && (
                                        <span className="text-teal-700 font-medium">
                                          {ev.temperatureC} °C
                                        </span>
                                      )}
                                      {ev.humidityPercent != null && (
                                        <span className="text-sky-700 font-medium">
                                          {ev.humidityPercent}%
                                        </span>
                                      )}
                                      <span>{when(ev.timestamp)}</span>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Farming Log + Timeline Grid */}
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Farming Log */}
              <section
                className="bento-card space-y-4 p-5 sm:p-6"
                id="farming-log"
              >
                <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-lime-50 text-lime-700">
                      <Sprout size={18} aria-hidden="true" />
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">
                      Nhật ký canh tác
                    </h3>
                  </div>
                  {logs.data && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {logs.data.length} bản ghi
                    </span>
                  )}
                </div>

                {logs.isPending ? (
                  <p role="status" className="text-sm text-muted-foreground">
                    Đang tải nhật ký…
                  </p>
                ) : logs.isError ? (
                  <p className="text-sm text-rose-700">
                    Chưa tải được nhật ký.
                  </p>
                ) : !logs.data?.length ? (
                  <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-muted-foreground">
                    Chưa ghi nhận nhật ký.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.data.map((l, i) => {
                      const proof = l.proofImage || l.image;
                      return (
                        <div
                          key={l.id ?? i}
                          className="space-y-1.5 rounded-xl border border-border/80 bg-surface/50 p-3.5 text-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                              {l.stage || "Chăm sóc"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateText(l.date)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">
                            {l.action || l.notes || l.note}
                          </p>
                          {proof && (
                            <a
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                              href={proof}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <span>Xem ảnh minh chứng</span>
                              <ExternalLink size={12} aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Timeline Stepper */}
              <section className="bento-card space-y-4 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <Clock size={18} aria-hidden="true" />
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">
                      Hành trình lô
                    </h3>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {data.timeline.length} sự kiện
                  </span>
                </div>

                {!data.timeline.length ? (
                  <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-muted-foreground">
                    Chưa có sự kiện hành trình nào được ghi nhận.
                  </div>
                ) : (
                  <ol className="relative ml-2.5 space-y-4 border-l-2 border-border pl-5">
                    {data.timeline.map((e, i) => {
                      const meta = STAGE_META[e.stage] ?? {
                        label: e.stage,
                        dotClass: "bg-slate-500",
                        badgeClass:
                          "bg-slate-100 text-slate-700 border-slate-200",
                      };
                      return (
                        <li key={i} className="relative">
                          <span
                            aria-hidden="true"
                            className={`absolute -left-[27px] top-1.5 size-3 rounded-full ring-4 ring-white ${meta.dotClass}`}
                          />
                          <div className="space-y-1 rounded-xl bg-surface/50 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}
                              >
                                {meta.label}
                              </span>
                              {e.timestamp && (
                                <span className="text-xs text-muted-foreground">
                                  {when(e.timestamp)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              {e.title}
                            </p>
                            {e.description && (
                              <p className="text-xs text-muted-foreground">
                                {e.description}
                              </p>
                            )}
                            {(e.location || e.temperatureC != null) && (
                              <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
                                {e.location && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin size={11} aria-hidden="true" />
                                    {e.location}
                                  </span>
                                )}
                                {e.temperatureC != null && (
                                  <span className="inline-flex items-center gap-1 font-medium text-teal-700">
                                    <Thermometer size={11} aria-hidden="true" />
                                    {e.temperatureC} °C
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            </div>

            {/* Role-Aware Action Footer */}
            <div className="bento-card flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
              <p className="text-xs text-muted-foreground">
                Mã lô <span className="font-mono-code font-semibold">{data.batchCode}</span> ·
                Các mục chưa phát sinh trong vận hành được để trống minh bạch.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {roles?.includes("WAREHOUSE") && (
                  <Link
                    href="/dashboard/warehouse"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    <Warehouse size={14} />
                    Mở quản lý kho
                    <ArrowRight size={13} />
                  </Link>
                )}
                {roles?.includes("FARMER") && (
                  <Link
                    href="/dashboard/farmer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    <Sprout size={14} />
                    Mở quản lý nông trại
                    <ArrowRight size={13} />
                  </Link>
                )}
                {roles?.includes("DISTRIBUTOR") && (
                  <Link
                    href="/dashboard/distributor/receive"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    <Truck size={14} />
                    Tiếp nhận vận chuyển
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>

            {printing && (
              <QrLabelModal
                isOpen
                onClose={() => setPrinting(false)}
                defaultFarmAddress="Chưa ghi nhận"
                lot={{
                  code: data.batchCode,
                  product: data.productName ?? data.batchCode,
                  qty: "",
                  unit: "",
                  harvestDate: data.harvest.harvestDate ?? "",
                  expiryDate: data.harvest.expiryDate ?? undefined,
                  cert: data.farm.certification ?? undefined,
                  farmName: data.farm.name ?? undefined,
                  farmAddress: data.farm.location ?? undefined,
                  cultivation: data.farm.cultivation ?? undefined,
                }}
              />
            )}
          </article>
        )}
      </main>
    </div>
  );
}

export default function TraceabilityPage() {
  return (
    <Suspense
      fallback={
        <div className="biophilic-mesh min-h-screen px-4 py-12 text-center text-sm text-muted-foreground">
          Đang tải trang tra cứu nguồn gốc…
        </div>
      }
    >
      <TracePage />
    </Suspense>
  );
}
