"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  Layers,
  MapPin,
  Package,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  createA4PdfBlobFromCanvas,
  renderRevenueReportCanvas,
  type RevenueReportPayload,
  type SegmentRevenueRow,
  type TimeSeriesPoint,
} from "@/lib/pdf-revenue-report";
import { catalogService, type ApiOrder, type ApiProduct } from "@/services/catalog.service";
import { type ApiFarmItem, type ApiHarvestLot } from "@/services/farmer.service";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

type PeriodPreset = "7d" | "30d" | "quarter" | "year" | "custom";
type Granularity = "day" | "month";
type BreakdownDimension = "category" | "farm" | "cert" | "payment";

const REVENUE_VALID_STATUSES = new Set([
  "PAID",
  "CONFIRMED",
  "PREPARING",
  "SHIPPING",
  "DELIVERED",
  "COMPLETED",
]);

const CATEGORY_META: Record<string, { label: string; subLabel: string; color: string }> = {
  rau_la: {
    label: "Rau Ăn Lá & Thủy Canh",
    subLabel: "Xà lách, cải kale, bó xôi, rau gia vị...",
    color: "#166534",
  },
  trai_cay: {
    label: "Trái Cây Đặc Sản Vùng Miền",
    subLabel: "Dâu tây Mộc Châu, cam sành, bơ sáp, mận hậu...",
    color: "#A3630A",
  },
  cu_qua: {
    label: "Củ Quả & Nông Sản Tươi",
    subLabel: "Cà chua beef, ớt chuông, khoai lang, cà rốt...",
    color: "#0F766E",
  },
  nam_chebien: {
    label: "Nấm Tươi & Nông Sản Chế Biến",
    subLabel: "Nấm hương, trà shan tuyết, nông sản sấy lạnh...",
    color: "#1E40AF",
  },
};

function inferCategoryCode(itemName: string, productMap: Map<string, ApiProduct>): string {
  const clean = (itemName || "").trim().toLowerCase();
  const exact = productMap.get(clean);
  if (exact?.categoryCode && CATEGORY_META[exact.categoryCode]) {
    return exact.categoryCode;
  }
  for (const [pName, prod] of productMap.entries()) {
    if ((clean.includes(pName) || pName.includes(clean)) && prod.categoryCode && CATEGORY_META[prod.categoryCode]) {
      return prod.categoryCode;
    }
  }
  if (
    clean.includes("dâu") ||
    clean.includes("cam") ||
    clean.includes("bưởi") ||
    clean.includes("mận") ||
    clean.includes("xoài") ||
    clean.includes("bơ") ||
    clean.includes("nho") ||
    clean.includes("táo") ||
    clean.includes("dưa lưới")
  ) {
    return "trai_cay";
  }
  if (
    clean.includes("cà chua") ||
    clean.includes("khoai") ||
    clean.includes("cà rốt") ||
    clean.includes("bí") ||
    clean.includes("ớt") ||
    clean.includes("dưa leo") ||
    clean.includes("củ")
  ) {
    return "cu_qua";
  }
  if (
    clean.includes("nấm") ||
    clean.includes("chè") ||
    clean.includes("trà") ||
    clean.includes("sấy") ||
    clean.includes("mật ong")
  ) {
    return "nam_chebien";
  }
  return "rau_la";
}

function inferFarmLabel(
  originOrFarm?: string,
  lotCode?: string,
  itemName?: string,
  productMap?: Map<string, ApiProduct>
): { code: string; label: string; subLabel: string; color: string } {
  const cleanName = (itemName || "").trim().toLowerCase();
  const matchedProd = productMap?.get(cleanName);
  const raw = (originOrFarm || matchedProd?.farm || matchedProd?.origin || "").toLowerCase();
  const lot = (lotCode || matchedProd?.batchCode || "").toUpperCase();

  if (raw.includes("mộc châu") || raw.includes("sơn la") || lot.includes("MC") || lot.includes("TC")) {
    return {
      code: "NT-MC-03",
      label: "Vườn Sinh Thái Mộc Châu (NT-MC-03)",
      subLabel: "Thị trấn Nông trường Mộc Châu, Sơn La",
      color: "#0F766E",
    };
  }
  if (raw.includes("cao lãnh") || raw.includes("đồng tháp") || raw.includes("miền tây") || lot.includes("DT-CL")) {
    return {
      code: "NT-DT-02",
      label: "Vườn Cây Ăn Trái Cao Lãnh (NT-DT-02)",
      subLabel: "Xã Mỹ Xương, Huyện Cao Lãnh, Đồng Tháp",
      color: "#A3630A",
    };
  }
  return {
    code: "NT-DL-01",
    label: "Nông Trại Xanh Đà Lạt (NT-DL-01)",
    subLabel: "Xã Xuân Thọ, TP. Đà Lạt, Lâm Đồng",
    color: "#166534",
  };
}

function inferCertStandard(rawCert?: string): { code: string; label: string; subLabel: string; color: string } {
  const c = (rawCert || "VietGAP").toLowerCase();
  if (c.includes("global")) {
    return {
      code: "GLOBALGAP",
      label: "Tiêu Chuẩn Quốc Tế GlobalGAP",
      subLabel: "Truy xuất chuỗi lạnh xuất khẩu & siêu thị cao cấp",
      color: "#0F766E",
    };
  }
  if (c.includes("organic") || c.includes("hữu cơ")) {
    return {
      code: "ORGANIC",
      label: "Chứng Nhận Hữu Cơ (Organic TCVN)",
      subLabel: "Canh tác sinh thái 100% không hóa chất tổng hợp",
      color: "#A3630A",
    };
  }
  return {
    code: "VIETGAP",
    label: "Chứng Nhận An Toàn VietGAP",
    subLabel: "Thực hành nông nghiệp tốt tiêu chuẩn Việt Nam",
    color: "#166534",
  };
}

function parseUnitQty(qtyStr?: string): number {
  if (!qtyStr) return 1;
  const match = String(qtyStr).match(/\d+/);
  return match ? Math.max(1, parseInt(match[0], 10)) : 1;
}

export function AdminRevenueDashboard({
  orders,
  ordersLoading,
  onRefreshOrders,
  farms = [],
  batches = [],
}: {
  orders: ApiOrder[];
  ordersLoading: boolean;
  onRefreshOrders: () => void;
  farms?: ApiFarmItem[];
  batches?: ApiHarvestLot[];
}) {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [period, setPeriod] = useState<PeriodPreset>("year");
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [customFrom, setCustomFrom] = useState("2026-01-01");
  const [customTo, setCustomTo] = useState("2026-12-31");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [ledgerDimension, setLedgerDimension] = useState<BreakdownDimension>("category");
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [targetRevenueInput, setTargetRevenueInput] = useState<number>(5_000_000);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    catalogService
      .getProducts()
      .then((list) => setProducts(list || []))
      .catch(() => {});
  }, []);

  const productMap = useMemo(() => {
    const map = new Map<string, ApiProduct>();
    products.forEach((p) => {
      if (p.name) map.set(p.name.trim().toLowerCase(), p);
    });
    return map;
  }, [products]);

  // Reference anchor date: latest order date or current system date
  const anchorDate = useMemo(() => {
    let latest = new Date();
    orders.forEach((o) => {
      if (o.createdAt) {
        const d = new Date(o.createdAt);
        if (!Number.isNaN(d.getTime()) && d > latest) {
          latest = d;
        }
      }
    });
    return latest;
  }, [orders]);

  // Filter orders by selected time period
  const periodOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o.createdAt) return true;
      const d = new Date(o.createdAt);
      if (Number.isNaN(d.getTime())) return true;

      if (period === "7d") {
        const cutoff = new Date(anchorDate);
        cutoff.setDate(cutoff.getDate() - 7);
        return d >= cutoff;
      }
      if (period === "30d") {
        const cutoff = new Date(anchorDate);
        cutoff.setDate(cutoff.getDate() - 30);
        return d >= cutoff;
      }
      if (period === "quarter") {
        const cutoff = new Date(anchorDate);
        cutoff.setDate(cutoff.getDate() - 90);
        return d >= cutoff;
      }
      if (period === "custom") {
        const fromD = customFrom ? new Date(`${customFrom}T00:00:00`) : null;
        const toD = customTo ? new Date(`${customTo}T23:59:59`) : null;
        if (fromD && d < fromD) return false;
        if (toD && d > toD) return false;
        return true;
      }
      return true; // "year" / all time
    });
  }, [orders, period, anchorDate, customFrom, customTo]);

  // Core multi-dimensional aggregation
  const analytics = useMemo(() => {
    let netRevenue = 0;
    let gmv = 0;
    let totalDiscount = 0;
    let refundedAmount = 0;
    let paidOrders = 0;
    let refundedOrders = 0;
    let cancelledOrders = 0;
    let vietQrRevenue = 0;
    let codRevenue = 0;

    const catAcc = new Map<
      string,
      { label: string; subLabel: string; color: string; revenue: number; orders: Set<string>; units: number }
    >();
    Object.entries(CATEGORY_META).forEach(([code, meta]) => {
      catAcc.set(code, {
        label: meta.label,
        subLabel: meta.subLabel,
        color: meta.color,
        revenue: 0,
        orders: new Set(),
        units: 0,
      });
    });

    const farmAcc = new Map<
      string,
      { label: string; subLabel: string; color: string; revenue: number; orders: Set<string>; units: number }
    >();
    const certAcc = new Map<
      string,
      { label: string; subLabel: string; color: string; revenue: number; orders: Set<string>; units: number }
    >();
    const prodAcc = new Map<
      string,
      { label: string; subLabel: string; color: string; revenue: number; orders: Set<string>; units: number }
    >();
    const timeAcc = new Map<string, { sortKey: string; label: string; revenue: number; orders: number }>();

    periodOrders.forEach((order) => {
      const st = String(order.status || "").toUpperCase();
      const isRefunded = st === "REFUNDED" || order.refundStatus === "APPROVED";
      const isCancelled = st === "CANCELLED";
      const isValidRevenue = REVENUE_VALID_STATUSES.has(st) && !isRefunded && !isCancelled;

      if (isRefunded) {
        refundedOrders += 1;
        refundedAmount += order.refundAmount || order.total || 0;
      } else if (isCancelled) {
        cancelledOrders += 1;
      }

      if (!isValidRevenue) return;

      const items = order.items && order.items.length > 0 ? order.items : [];
      const itemsRawSum = items.reduce((sum, it) => sum + (it.price || 0), 0);
      const orderTotal = order.total || 0;
      const orderSubtotal = order.subtotal || itemsRawSum || orderTotal;
      const orderDiscount = order.discount || 0;

      // Filter by category if Admin selected a specific category slice
      if (selectedCategoryFilter !== "ALL") {
        const hasCategoryItem = items.some(
          (it) => inferCategoryCode(it.name, productMap) === selectedCategoryFilter
        );
        if (!hasCategoryItem) return;
      }

      paidOrders += 1;
      netRevenue += orderTotal;
      gmv += orderSubtotal + (order.shippingFee || 0);
      totalDiscount += orderDiscount;

      const isVietQR = (order.paymentMethod || "COD").toUpperCase() === "PAYOS";
      if (isVietQR) {
        vietQrRevenue += orderTotal;
      } else {
        codRevenue += orderTotal;
      }

      // Time series bucket
      const d = order.createdAt ? new Date(order.createdAt) : new Date();
      const validD = Number.isNaN(d.getTime()) ? new Date() : d;
      const daySort = validD.toISOString().slice(0, 10);
      const monthSort = validD.toISOString().slice(0, 7);
      const tKey = granularity === "month" ? monthSort : daySort;
      const tLabel =
        granularity === "month"
          ? `T${validD.getMonth() + 1}/${validD.getFullYear()}`
          : `${String(validD.getDate()).padStart(2, "0")}/${String(validD.getMonth() + 1).padStart(2, "0")}`;

      const existingTime = timeAcc.get(tKey) || { sortKey: tKey, label: tLabel, revenue: 0, orders: 0 };
      existingTime.revenue += orderTotal;
      existingTime.orders += 1;
      timeAcc.set(tKey, existingTime);

      // Distribute order net revenue proportionally across items
      if (items.length === 0) {
        const fallbackCat = catAcc.get("rau_la")!;
        fallbackCat.revenue += orderTotal;
        fallbackCat.orders.add(order.orderCode);
        fallbackCat.units += 1;
      } else {
        items.forEach((it) => {
          const weight = itemsRawSum > 0 ? (it.price || 0) / itemsRawSum : 1 / items.length;
          const allocatedRev = Math.round(orderTotal * weight);
          const qtyNum = parseUnitQty(it.qty);

          // 1. Category
          const catCode = inferCategoryCode(it.name, productMap);
          const catEntry = catAcc.get(catCode) || catAcc.get("rau_la")!;
          catEntry.revenue += allocatedRev;
          catEntry.orders.add(order.orderCode);
          catEntry.units += qtyNum;

          // 2. Farm
          const farmMeta = inferFarmLabel(it.origin, order.lotCode, it.name, productMap);
          const fEntry = farmAcc.get(farmMeta.code) || {
            label: farmMeta.label,
            subLabel: farmMeta.subLabel,
            color: farmMeta.color,
            revenue: 0,
            orders: new Set<string>(),
            units: 0,
          };
          fEntry.revenue += allocatedRev;
          fEntry.orders.add(order.orderCode);
          fEntry.units += qtyNum;
          farmAcc.set(farmMeta.code, fEntry);

          // 3. Certification
          const certMeta = inferCertStandard(it.cert);
          const cEntry = certAcc.get(certMeta.code) || {
            label: certMeta.label,
            subLabel: certMeta.subLabel,
            color: certMeta.color,
            revenue: 0,
            orders: new Set<string>(),
            units: 0,
          };
          cEntry.revenue += allocatedRev;
          cEntry.orders.add(order.orderCode);
          cEntry.units += qtyNum;
          certAcc.set(certMeta.code, cEntry);

          // 4. Product
          const pKey = (it.name || "Nông sản VietGAP").trim();
          const pEntry = prodAcc.get(pKey) || {
            label: pKey,
            subLabel: `${certMeta.code} • ${farmMeta.label.replace(/\s*\([^)]*\)/, "")}`,
            color: "#166534",
            revenue: 0,
            orders: new Set<string>(),
            units: 0,
          };
          pEntry.revenue += allocatedRev;
          pEntry.orders.add(order.orderCode);
          pEntry.units += qtyNum;
          prodAcc.set(pKey, pEntry);
        });
      }
    });

    const toSegmentRows = (
      map: Map<
        string,
        { label: string; subLabel: string; color: string; revenue: number; orders: Set<string>; units: number }
      >
    ): SegmentRevenueRow[] => {
      const totalSegRev = Math.max(
        1,
        Array.from(map.values()).reduce((s, v) => s + v.revenue, 0)
      );
      return Array.from(map.entries())
        .map(([code, v]) => ({
          code,
          label: v.label,
          subLabel: v.subLabel,
          revenue: v.revenue,
          orderCount: v.orders.size,
          unitCount: v.units,
          sharePercent: v.revenue > 0 ? (v.revenue / totalSegRev) * 100 : 0,
          colorHex: v.color,
        }))
        .sort((a, b) => b.revenue - a.revenue);
    };

    const categorySegments = toSegmentRows(catAcc);
    const farmSegments = toSegmentRows(farmAcc);
    const certSegments = toSegmentRows(certAcc);
    const topProducts = toSegmentRows(prodAcc);

    const paymentSegments: SegmentRevenueRow[] = [
      {
        code: "PAYOS_VIETQR",
        label: "Chuyển Khoản VietQR 24/7 (PayOS)",
        subLabel: "Đối soát tự động & Quản trị viên phê duyệt sao kê",
        revenue: vietQrRevenue,
        orderCount: periodOrders.filter(
          (o) =>
            REVENUE_VALID_STATUSES.has(String(o.status).toUpperCase()) &&
            (o.paymentMethod || "").toUpperCase() === "PAYOS"
        ).length,
        unitCount: periodOrders.filter(
          (o) =>
            REVENUE_VALID_STATUSES.has(String(o.status).toUpperCase()) &&
            (o.paymentMethod || "").toUpperCase() === "PAYOS"
        ).length,
        sharePercent: netRevenue > 0 ? (vietQrRevenue / netRevenue) * 100 : 0,
        colorHex: "#0F766E",
      },
      {
        code: "COD_CASH",
        label: "Thanh Toán Khi Nhận Hàng (COD)",
        subLabel: "Thu hộ qua đội xe lạnh chuỗi cung ứng AgriTrace",
        revenue: codRevenue,
        orderCount: periodOrders.filter(
          (o) =>
            REVENUE_VALID_STATUSES.has(String(o.status).toUpperCase()) &&
            (o.paymentMethod || "COD").toUpperCase() !== "PAYOS"
        ).length,
        unitCount: periodOrders.filter(
          (o) =>
            REVENUE_VALID_STATUSES.has(String(o.status).toUpperCase()) &&
            (o.paymentMethod || "COD").toUpperCase() !== "PAYOS"
        ).length,
        sharePercent: netRevenue > 0 ? (codRevenue / netRevenue) * 100 : 0,
        colorHex: "#A3630A",
      },
    ].sort((a, b) => b.revenue - a.revenue);

    const sortedTime: TimeSeriesPoint[] = Array.from(timeAcc.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-14)
      .map(({ label, revenue, orders: count }) => ({ label, revenue, orders: count }));

    const aov = paidOrders > 0 ? Math.round(netRevenue / paidOrders) : 0;

    return {
      kpis: {
        netRevenue,
        gmv,
        totalDiscount,
        refundedAmount,
        totalOrders: periodOrders.length,
        paidOrders,
        refundedOrders,
        cancelledOrders,
        aov,
        vietQrRevenue,
        codRevenue,
      },
      timeSeries: sortedTime,
      categorySegments,
      farmSegments,
      certSegments,
      paymentSegments,
      topProducts,
    };
  }, [periodOrders, productMap, selectedCategoryFilter, granularity]);

  const periodLabelText = useMemo(() => {
    if (period === "7d") return "7 ngày gần nhất";
    if (period === "30d") return "30 ngày gần nhất";
    if (period === "quarter") return "Quý hiện tại (90 ngày)";
    if (period === "custom") return `Từ ${customFrom} đến ${customTo}`;
    return "Toàn hệ thống (Năm 2026)";
  }, [period, customFrom, customTo]);

  const buildPdfPayload = (): RevenueReportPayload => ({
    reportTitle: "Báo Cáo Tổng Hợp Doanh Thu Đa Chiều",
    periodLabel:
      selectedCategoryFilter === "ALL"
        ? periodLabelText
        : `${periodLabelText} • Mảng: ${CATEGORY_META[selectedCategoryFilter]?.label || selectedCategoryFilter}`,
    generatedAt: new Date().toLocaleString("vi-VN"),
    generatedBy: user?.name || "Lê Quang Minh (Quản trị viên)",
    targetRevenue: targetRevenueInput,
    kpis: analytics.kpis,
    timeSeries: analytics.timeSeries,
    categorySegments: analytics.categorySegments,
    farmSegments: analytics.farmSegments,
    certSegments: analytics.certSegments,
    topProducts: analytics.topProducts,
  });

  const handlePreviewPdf = () => {
    try {
      const canvas = renderRevenueReportCanvas(buildPdfPayload());
      setPreviewDataUrl(canvas.toDataURL("image/png"));
    } catch {
      toast.error("Không thể khởi tạo bản xem trước PDF.");
    }
  };

  const handleDownloadPdf = () => {
    setIsExportingPdf(true);
    try {
      const payload = buildPdfPayload();
      const canvas = renderRevenueReportCanvas(payload);
      const pdfBlob = createA4PdfBlobFromCanvas(canvas);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      const dateStamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `Bao-Cao-Doanh-Thu-AgriTrace-${dateStamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast.success("Đã kết xuất và tải xuống báo cáo PDF (Khổ A4) thành công!");
    } catch {
      toast.error("Có lỗi khi xuất file PDF báo cáo doanh thu.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintReport = () => {
    const canvas = renderRevenueReportCanvas(buildPdfPayload());
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) {
      toast.info("Trình duyệt đang chặn cửa sổ bật lên. Đang tải trực tiếp file PDF...");
      handleDownloadPdf();
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <title>Báo Cáo Doanh Thu AgriTrace AI</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; background: #FBF9F5; display: flex; justify-content: center; }
            img { width: 210mm; height: 297mm; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print();" />
        </body>
      </html>
    `);
    win.document.close();
  };

  const targetProgressPct =
    targetRevenueInput > 0
      ? Math.min(100, Math.round((analytics.kpis.netRevenue / targetRevenueInput) * 100))
      : 100;

  const activeLedgerRows =
    ledgerDimension === "category"
      ? analytics.categorySegments
      : ledgerDimension === "farm"
      ? analytics.farmSegments
      : ledgerDimension === "cert"
      ? analytics.certSegments
      : analytics.paymentSegments;

  // SVG Time-Series Chart Geometry
  const svgW = 680;
  const svgH = 230;
  const padL = 56;
  const padR = 20;
  const padT = 20;
  const padB = 34;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;
  const maxTimeRev = Math.max(100_000, ...analytics.timeSeries.map((d) => d.revenue));

  const chartCoords = analytics.timeSeries.map((pt, idx) => {
    const count = analytics.timeSeries.length;
    const x = count === 1 ? padL + plotW / 2 : padL + (idx / (count - 1)) * plotW;
    const y = padT + plotH - (pt.revenue / maxTimeRev) * plotH;
    return { ...pt, x, y, idx };
  });

  const linePath =
    chartCoords.length > 1
      ? chartCoords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ")
      : "";

  const areaPath =
    chartCoords.length > 1
      ? `${linePath} L ${chartCoords[chartCoords.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(
          1
        )} L ${chartCoords[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`
      : "";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Control Toolbar: Time Period, Category Filter, Target & PDF Export Actions */}
      <section className="bento-card p-4 sm:p-5 bg-white border border-[#E4DFD5] rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Period Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#16261E] mr-1">
              <Calendar size={15} className="text-[#166534]" />
              <span>Kỳ báo cáo:</span>
            </span>
            {(
              [
                { key: "7d", label: "7 Ngày" },
                { key: "30d", label: "30 Ngày" },
                { key: "quarter", label: "Quý Này (90N)" },
                { key: "year", label: "Toàn Năm 2026" },
                { key: "custom", label: "Tùy Chọn Ngày" },
              ] as const
            ).map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98",
                  period === p.key
                    ? "bg-[#16261E] text-white shadow-2xs"
                    : "bg-[#F6F3EC] text-stone-700 hover:bg-[#EAE5D9]"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Export PDF & Print Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefreshOrders}
              className="p-2 rounded-xl border border-[#E4DFD5] bg-[#FBF9F5] hover:bg-stone-100 text-[#166534] transition-colors cursor-pointer"
              title="Đồng bộ lại dữ liệu đơn hàng mới nhất"
            >
              <RefreshCw size={15} className={ordersLoading ? "animate-spin" : ""} />
            </button>

            <button
              type="button"
              onClick={handlePreviewPdf}
              className="px-3.5 py-2 rounded-xl border border-[#E4DFD5] bg-white hover:bg-[#F6F3EC] text-[#16261E] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
            >
              <Eye size={14} className="text-[#166534]" />
              <span>Xem Trước Bản PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrintReport}
              className="px-3.5 py-2 rounded-xl border border-[#E4DFD5] bg-white hover:bg-[#F6F3EC] text-[#16261E] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
            >
              <Printer size={14} className="text-[#A3630A]" />
              <span>In Báo Cáo A4</span>
            </button>

            <button
              type="button"
              disabled={isExportingPdf}
              onClick={handleDownloadPdf}
              className="px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
            >
              <Download size={14} className="text-amber-300" />
              <span>{isExportingPdf ? "Đang kết xuất PDF..." : "Xuất Báo Cáo PDF (A4)"}</span>
            </button>
          </div>
        </div>

        {/* Sub-filters: Custom Date Range + Category Slice + Target Benchmark */}
        <div className="pt-3 border-t border-[#F0ECE1] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 font-bold text-stone-500">
              <Filter size={13} className="text-[#166534]" />
              <span>Lọc theo mảng nông sản:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter("ALL")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer",
                selectedCategoryFilter === "ALL"
                  ? "bg-emerald-100 text-[#166534] border border-emerald-300"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              )}
            >
              Tất cả mảng ({orders.length} đơn)
            </button>
            {Object.entries(CATEGORY_META).map(([code, meta]) => (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedCategoryFilter(code)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer",
                  selectedCategoryFilter === code
                    ? "bg-emerald-100 text-[#166534] border border-emerald-300"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                )}
              >
                {meta.label}
              </button>
            ))}
          </div>

          {period === "custom" ? (
            <div className="flex items-center gap-2">
              <label className="text-stone-500 font-semibold">Từ:</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-[#E4DFD5] font-mono text-xs"
              />
              <label className="text-stone-500 font-semibold">Đến:</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-[#E4DFD5] font-mono text-xs"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-stone-500 font-semibold">Chỉ tiêu KPI doanh thu kỳ:</span>
              <select
                aria-label="Chọn chỉ tiêu doanh thu kỳ"
                value={targetRevenueInput}
                onChange={(e) => setTargetRevenueInput(Number(e.target.value))}
                className="px-2.5 py-1 rounded-lg border border-[#E4DFD5] bg-[#FBF9F5] font-mono font-bold text-[#16261E] text-xs"
              >
                <option value={2000000}>2.000.000 đ</option>
                <option value={5000000}>5.000.000 đ</option>
                <option value={10000000}>10.000.000 đ</option>
                <option value={25000000}>25.000.000 đ</option>
                <option value={50000000}>50.000.000 đ</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* 2. Four Executive KPI Cards with Bullet Chart Target Benchmark (UI/UX Pro Max Chart Rule) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Net Revenue + Bullet Target */}
        <article className="bento-card p-5 bg-white border border-[#E4DFD5] rounded-2xl flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#166534]" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
                  Doanh Thu Thuần (Net)
                </span>
              </div>
              <p className="mt-2 font-mono text-2xl font-extrabold text-[#16261E]">
                {analytics.kpis.netRevenue.toLocaleString("vi-VN")} đ
              </p>
            </div>
            <span className="size-10 rounded-xl bg-emerald-50 border border-emerald-200 text-[#166534] flex items-center justify-center shrink-0">
              <DollarSign size={18} />
            </span>
          </div>

          {/* Compact Bullet Chart against Target */}
          <div className="mt-3 pt-2.5 border-t border-[#F0ECE1] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-stone-500">So với chỉ tiêu kỳ:</span>
              <span className="font-mono font-bold text-[#166534] flex items-center gap-0.5">
                <ArrowUpRight size={12} />
                {targetProgressPct}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#F0ECE1] overflow-hidden relative">
              <div
                className="h-full rounded-full bg-[#166534] transition-all duration-500"
                style={{ width: `${targetProgressPct}%` }}
              />
            </div>
          </div>
        </article>

        {/* KPI 2: Gross Merchandise Value (GMV) & AOV */}
        <article className="bento-card p-5 bg-white border border-[#E4DFD5] rounded-2xl flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#0F766E]" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
                  Tổng Giá Trị Đơn (GMV)
                </span>
              </div>
              <p className="mt-2 font-mono text-2xl font-extrabold text-[#16261E]">
                {analytics.kpis.gmv.toLocaleString("vi-VN")} đ
              </p>
            </div>
            <span className="size-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center shrink-0">
              <TrendingUp size={18} />
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F0ECE1] flex items-center justify-between text-[11px]">
            <span className="text-stone-500 font-medium">Giá trị TB đơn (AOV):</span>
            <span className="font-mono font-bold text-[#0F766E]">
              {analytics.kpis.aov.toLocaleString("vi-VN")} đ / đơn
            </span>
          </div>
        </article>

        {/* KPI 3: Subsidies & Vouchers */}
        <article className="bento-card p-5 bg-white border border-[#E4DFD5] rounded-2xl flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#A3630A]" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
                  Trợ Giá & Voucher
                </span>
              </div>
              <p className="mt-2 font-mono text-2xl font-extrabold text-[#16261E]">
                {analytics.kpis.totalDiscount.toLocaleString("vi-VN")} đ
              </p>
            </div>
            <span className="size-10 rounded-xl bg-amber-50 border border-amber-200 text-[#A3630A] flex items-center justify-center shrink-0">
              <Wallet size={18} />
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F0ECE1] flex items-center justify-between text-[11px]">
            <span className="text-stone-500 font-medium">Tỷ lệ chiết khấu / GMV:</span>
            <span className="font-mono font-bold text-[#A3630A]">
              {analytics.kpis.gmv > 0
                ? ((analytics.kpis.totalDiscount / analytics.kpis.gmv) * 100).toFixed(1)
                : "0.0"}
              %
            </span>
          </div>
        </article>

        {/* KPI 4: Order Fulfillment vs Refunds */}
        <article className="bento-card p-5 bg-white border border-[#E4DFD5] rounded-2xl flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-600" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
                  Hoàn Tiền & Khiếu Nại
                </span>
              </div>
              <p className="mt-2 font-mono text-2xl font-extrabold text-[#16261E]">
                {analytics.kpis.refundedAmount.toLocaleString("vi-VN")} đ
              </p>
            </div>
            <span className="size-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
              <ArrowDownRight size={18} />
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F0ECE1] flex items-center justify-between text-[11px]">
            <span className="text-stone-500 font-medium">
              Hợp lệ: <strong className="text-[#166534] font-mono">{analytics.kpis.paidOrders}</strong> đơn
            </span>
            <span className="font-mono font-semibold text-rose-700">
              {analytics.kpis.refundedOrders} hoàn • {analytics.kpis.cancelledOrders} hủy
            </span>
          </div>
        </article>
      </div>

      {/* 3. Asymmetric Bento Row 1 (7:5 Split): Interactive Time-Series Chart + Category Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Interactive SVG Revenue & Order Volume Trend */}
        <section className="lg:col-span-7 bento-card bg-white border border-[#E4DFD5] rounded-2xl overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-[#E4DFD5] bg-[#FBF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-base text-[#16261E] flex items-center gap-2">
                <BarChart3 size={18} className="text-[#166534]" />
                <span>Biểu Đồ Xu Hướng Doanh Thu & Lưu Lượng Đơn Hàng</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Di chuột hoặc chạm vào từng mốc thời gian để xem đối soát doanh thu và số đơn.
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-[#E4DFD5] bg-white p-1 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setGranularity("day")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                  granularity === "day" ? "bg-[#16261E] text-white" : "text-stone-600 hover:text-stone-900"
                )}
              >
                Theo Ngày
              </button>
              <button
                type="button"
                onClick={() => setGranularity("month")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                  granularity === "month" ? "bg-[#16261E] text-white" : "text-stone-600 hover:text-stone-900"
                )}
              >
                Theo Tháng
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Active Hover Summary Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#F6F3EC] border border-[#E4DFD5] text-xs">
              {hoveredPointIdx !== null && chartCoords[hoveredPointIdx] ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#16261E] text-amber-300 font-mono font-bold">
                      Mốc: {chartCoords[hoveredPointIdx].label}
                    </span>
                    <span className="text-stone-600 font-semibold">
                      Số lượng: <strong className="font-mono text-[#16261E]">{chartCoords[hoveredPointIdx].orders} đơn hàng</strong>
                    </span>
                  </div>
                  <div className="font-mono font-extrabold text-sm text-[#166534]">
                    Doanh thu: {chartCoords[hoveredPointIdx].revenue.toLocaleString("vi-VN")} đ
                  </div>
                </>
              ) : (
                <>
                  <span className="text-stone-600 font-medium">
                    Tổng hợp <strong>{analytics.timeSeries.length}</strong> mốc thời gian trong kỳ ({periodLabelText})
                  </span>
                  <span className="font-mono font-bold text-[#166534]">
                    Đỉnh mốc: {maxTimeRev.toLocaleString("vi-VN")} đ
                  </span>
                </>
              )}
            </div>

            {/* Interactive SVG Area + Bar Chart */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="w-full h-auto min-w-[480px] select-none"
                role="img"
                aria-label="Biểu đồ xu hướng doanh thu theo thời gian"
              >
                <defs>
                  <linearGradient id="agriRevenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#166534" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#166534" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines & Y-Axis Labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = padT + plotH * ratio;
                  const val = Math.round(maxTimeRev * (1 - ratio));
                  const label =
                    val >= 1_000_000
                      ? `${(val / 1_000_000).toFixed(1)}M`
                      : val > 0
                      ? `${Math.round(val / 1000)}K`
                      : "0";
                  return (
                    <g key={idx}>
                      <line
                        x1={padL}
                        y1={y}
                        x2={svgW - padR}
                        y2={y}
                        stroke="#E4DFD5"
                        strokeDasharray={ratio === 1 ? undefined : "4 4"}
                        strokeWidth={1}
                      />
                      <text
                        x={padL - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-stone-500 font-mono text-[10px] font-semibold"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Area */}
                {areaPath && <path d={areaPath} fill="url(#agriRevenueAreaGrad)" />}

                {/* Volume Columns + Trend Line + Interactive Nodes */}
                {chartCoords.map((c) => {
                  const barW = Math.min(28, Math.max(10, plotW / Math.max(4, chartCoords.length * 1.8)));
                  const barH = Math.max(4, padT + plotH - c.y);
                  const isHovered = hoveredPointIdx === c.idx;
                  return (
                    <g
                      key={c.idx}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPointIdx(c.idx)}
                      onMouseLeave={() => setHoveredPointIdx(null)}
                    >
                      <rect
                        x={c.x - barW / 2}
                        y={c.y}
                        width={barW}
                        height={barH}
                        rx={4}
                        fill={isHovered ? "#16261E" : "#166534"}
                        fillOpacity={isHovered ? 0.85 : 0.45}
                      />
                      <text
                        x={c.x}
                        y={padT + plotH + 18}
                        textAnchor="middle"
                        className={cn(
                          "font-mono text-[10px]",
                          isHovered ? "fill-[#16261E] font-extrabold" : "fill-stone-500 font-semibold"
                        )}
                      >
                        {c.label}
                      </text>
                    </g>
                  );
                })}

                {/* Smooth Trend Line Overlay */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#166534"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {chartCoords.map((c) => {
                  const isHovered = hoveredPointIdx === c.idx;
                  return (
                    <circle
                      key={`dot-${c.idx}`}
                      cx={c.x}
                      cy={c.y}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? "#FCD34D" : "#FFFFFF"}
                      stroke="#16261E"
                      strokeWidth={2}
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredPointIdx(c.idx)}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </section>

        {/* Right 5 Cols: Revenue Breakdown by Agricultural Category (Horizontal Ranked Bar) */}
        <section className="lg:col-span-5 bento-card bg-white border border-[#E4DFD5] rounded-2xl overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-[#E4DFD5] bg-[#FBF9F5]">
            <h2 className="font-bold text-base text-[#16261E] flex items-center gap-2">
              <Layers size={18} className="text-[#166534]" />
              <span>Doanh Thu Theo Mảng Ngành Hàng</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Xếp hạng tỷ trọng đóng góp của 4 mảng nông sản chủ lực.
            </p>
          </div>

          <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
            {/* Multi-Segment Stacked Bar Overview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
                <span>Tỷ trọng cơ cấu ngành hàng</span>
                <span className="font-mono text-[#16261E]">100%</span>
              </div>
              <div className="h-3.5 w-full rounded-full bg-[#F0ECE1] overflow-hidden flex gap-0.5 p-0.5">
                {analytics.categorySegments
                  .filter((s) => s.sharePercent > 0)
                  .map((seg) => (
                    <div
                      key={seg.code}
                      style={{
                        width: `${Math.max(4, seg.sharePercent)}%`,
                        backgroundColor: seg.colorHex,
                      }}
                      className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                      title={`${seg.label}: ${seg.sharePercent.toFixed(1)}%`}
                    />
                  ))}
              </div>
            </div>

            {/* Ranked Category Rows */}
            <div className="space-y-3.5">
              {analytics.categorySegments.map((seg, idx) => (
                <div
                  key={seg.code}
                  onClick={() =>
                    setSelectedCategoryFilter((prev) => (prev === seg.code ? "ALL" : seg.code))
                  }
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer",
                    selectedCategoryFilter === seg.code
                      ? "border-[#166534] bg-emerald-50/40 shadow-2xs"
                      : "border-[#E4DFD5] bg-[#FBF9F5]/60 hover:bg-[#F6F3EC]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: seg.colorHex }}
                      />
                      <span className="font-bold text-[#16261E] truncate">
                        {idx + 1}. {seg.label}
                      </span>
                    </div>
                    <div className="font-mono font-extrabold text-[#16261E] shrink-0">
                      {seg.revenue.toLocaleString("vi-VN")} đ
                    </div>
                  </div>

                  <div className="mt-2 h-2 w-full rounded-full bg-[#E4DFD5]/70 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(3, seg.sharePercent)}%`,
                        backgroundColor: seg.colorHex,
                      }}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500">
                    <span>
                      {seg.orderCount} đơn • {seg.unitCount} sản phẩm
                    </span>
                    <span className="font-mono font-bold text-[#166534]">
                      {seg.sharePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 4. Row 2 (6:6 Split): Farm / Origin Revenue + Payment Channels & Certification Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Revenue by Farm / Cooperative */}
        <section className="lg:col-span-6 bento-card bg-white border border-[#E4DFD5] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[#E4DFD5] bg-[#FBF9F5] flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-[#16261E] flex items-center gap-2">
                <Sprout size={18} className="text-[#166534]" />
                <span>Doanh Thu Theo Nông Trại & Hợp Tác Xã</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Đối soát sản lượng tiêu thụ và doanh thu về từng vùng trồng ({farms.length || 3} nông trại liên kết).
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 font-mono text-[11px] font-bold text-[#166534]">
              {batches.length || 5} lô truy xuất
            </span>
          </div>

          <div className="p-5 space-y-3.5">
            {analytics.farmSegments.map((farm) => (
              <div
                key={farm.code}
                className="p-3.5 rounded-xl border border-[#E4DFD5] bg-[#FBF9F5]/70 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#16261E] text-amber-300 font-mono text-[10px] font-bold">
                        {farm.code}
                      </span>
                      <h3 className="font-bold text-xs text-[#16261E]">{farm.label}</h3>
                    </div>
                    {farm.subLabel && (
                      <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                        <MapPin size={11} className="text-stone-400" />
                        {farm.subLabel}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-extrabold text-sm text-[#166534]">
                      {farm.revenue.toLocaleString("vi-VN")} đ
                    </div>
                    <div className="font-mono text-[11px] font-bold text-stone-500">
                      Tỷ trọng: {farm.sharePercent.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-[#E4DFD5] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(4, farm.sharePercent)}%`,
                      backgroundColor: farm.colorHex,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-600">
                  <span>Số đơn có sản phẩm của trại: <strong>{farm.orderCount} đơn</strong></span>
                  <span>Tổng sản lượng xuất bán: <strong className="font-mono">{farm.unitCount} đơn vị</strong></span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right 6 Cols: Payment Channel Split & Certification Tier Breakdown */}
        <section className="lg:col-span-6 bento-card bg-white border border-[#E4DFD5] rounded-2xl overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-[#E4DFD5] bg-[#FBF9F5]">
            <h2 className="font-bold text-base text-[#16261E] flex items-center gap-2">
              <CreditCard size={18} className="text-[#0F766E]" />
              <span>Cơ Cấu Dòng Tiền Thanh Toán & Chuẩn Chứng Nhận</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Phân tích doanh thu theo phương thức thanh toán và chuẩn chất lượng nông nghiệp.
            </p>
          </div>

          <div className="p-5 space-y-5 flex-1">
            {/* Payment Method Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {analytics.paymentSegments.map((pm) => (
                <div
                  key={pm.code}
                  className="p-4 rounded-xl border border-[#E4DFD5] bg-[#FBF9F5] flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
                      {pm.code === "PAYOS_VIETQR" ? "VIETQR 24/7 (PAYOS)" : "TIỀN MẶT (COD)"}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full font-mono text-[11px] font-extrabold text-white"
                      style={{ backgroundColor: pm.colorHex }}
                    >
                      {pm.sharePercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="font-mono text-lg font-extrabold text-[#16261E]">
                    {pm.revenue.toLocaleString("vi-VN")} đ
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {pm.orderCount} đơn hàng hợp lệ
                  </div>
                </div>
              ))}
            </div>

            {/* Certification Standard Breakdown */}
            <div className="space-y-2.5 pt-2 border-t border-[#F0ECE1]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#16261E] flex items-center gap-1.5">
                  <Award size={15} className="text-[#A3630A]" />
                  <span>Doanh thu theo tiêu chuẩn chứng nhận chất lượng</span>
                </span>
              </div>

              {analytics.certSegments.map((cert) => (
                <div
                  key={cert.code}
                  className="p-3 rounded-xl border border-[#E4DFD5] bg-white flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-[#166534] shrink-0" />
                      <span className="font-bold text-xs text-[#16261E] truncate">{cert.label}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">{cert.subLabel}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-xs text-[#16261E]">
                      {cert.revenue.toLocaleString("vi-VN")} đ
                    </div>
                    <div className="font-mono text-[10px] font-bold text-[#166534]">
                      {cert.sharePercent.toFixed(1)}% • {cert.unitCount} SP
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 5. Detailed Financial Ledger & Top Products Table (A11y Fallback & Audit Export View) */}
      <section className="bento-card bg-white border border-[#E4DFD5] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#E4DFD5] bg-[#FBF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-base text-[#16261E] flex items-center gap-2">
              <FileText size={18} className="text-[#166534]" />
              <span>Sổ Cái Đối Soát Doanh Thu Chi Tiết & Top Nông Sản Chủ Lực</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Bảng số liệu chuẩn phục vụ kiểm toán nội bộ và xuất báo cáo PDF A4.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: "category", label: "Theo Mảng Ngành Hàng" },
                { key: "farm", label: "Theo Nông Trại" },
                { key: "cert", label: "Theo Chứng Nhận" },
                { key: "payment", label: "Theo Kênh Thanh Toán" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setLedgerDimension(tab.key)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                  ledgerDimension === tab.key
                    ? "bg-[#16261E] text-white"
                    : "bg-white border border-[#E4DFD5] text-stone-600 hover:bg-stone-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E4DFD5]">
          {/* Left 7 Cols: Selected Dimension Ledger Table */}
          <div className="lg:col-span-7 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E4DFD5] text-stone-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Mảng / Phân Khúc</th>
                  <th className="py-3 px-3 text-right">Số Đơn</th>
                  <th className="py-3 px-3 text-right">Sản Lượng</th>
                  <th className="py-3 px-4 text-right">Doanh Thu Thuần</th>
                  <th className="py-3 px-4 text-right">Tỷ Trọng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE1]">
                {activeLedgerRows.map((row) => (
                  <tr key={row.code} className="hover:bg-[#FBF9F5] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: row.colorHex }}
                        />
                        <span className="font-bold text-[#16261E]">{row.label}</span>
                      </div>
                      {row.subLabel && (
                        <div className="text-[11px] text-stone-500 mt-0.5 pl-4">{row.subLabel}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-stone-700">
                      {row.orderCount}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-stone-700">
                      {row.unitCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-[#166534]">
                      {row.revenue.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#16261E]">
                      {row.sharePercent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#F6F3EC] border-t border-[#E4DFD5] font-bold text-xs">
                <tr>
                  <td className="py-3 px-4 text-[#16261E]">TỔNG CỘNG KỲ BÁO CÁO</td>
                  <td className="py-3 px-3 text-right font-mono text-[#16261E]">
                    {analytics.kpis.paidOrders}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#16261E]">
                    {activeLedgerRows.reduce((s, r) => s + r.unitCount, 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm font-extrabold text-[#166534]">
                    {analytics.kpis.netRevenue.toLocaleString("vi-VN")} đ
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#16261E]">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Right 5 Cols: Top Performing Agricultural Products */}
          <div className="lg:col-span-5 p-5 space-y-3 bg-[#FBF9F5]/50">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <Package size={14} className="text-[#166534]" />
                <span>Top Nông Sản Mang Lại Doanh Thu Cao Nhất</span>
              </h3>
              <span className="text-[11px] font-mono font-semibold text-stone-500">
                Top {Math.min(6, analytics.topProducts.length)}
              </span>
            </div>

            <div className="space-y-2.5">
              {analytics.topProducts.slice(0, 6).map((prod, idx) => (
                <div
                  key={prod.code}
                  className="p-3 rounded-xl bg-white border border-[#E4DFD5] flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="size-6 rounded-lg bg-[#16261E] text-amber-300 font-mono text-xs font-extrabold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-[#16261E] truncate">{prod.label}</div>
                      <div className="text-[10px] text-stone-500 truncate">
                        {prod.subLabel} • {prod.unitCount} SP ({prod.orderCount} đơn)
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-extrabold text-xs text-[#166534]">
                      {prod.revenue.toLocaleString("vi-VN")} đ
                    </div>
                    <div className="font-mono text-[10px] font-semibold text-stone-500">
                      {prod.sharePercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. A4 PDF Report Preview Lightbox Modal */}
      {previewDataUrl && (
        <div
          onClick={() => setPreviewDataUrl(null)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-[#E4DFD5] cursor-default"
          >
            <div className="px-6 py-4 bg-[#16261E] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-amber-300" />
                <div>
                  <h3 className="font-bold text-sm">
                    Xem Trước Bản Kết Xuất PDF Báo Cáo Doanh Thu (Chuẩn A4 Portrait)
                  </h3>
                  <p className="text-[11px] text-emerald-200/80">
                    Kỳ báo cáo: {periodLabelText} • Độ phân giải in ấn 150 DPI
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-3.5 py-1.5 rounded-xl bg-[#166534] hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} className="text-amber-300" />
                  <span>Tải File .PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDataUrl(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto bg-stone-800/90 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewDataUrl}
                alt="Bản xem trước Báo cáo Doanh thu PDF A4"
                className="max-w-full h-auto rounded-lg shadow-2xl border border-stone-600"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
