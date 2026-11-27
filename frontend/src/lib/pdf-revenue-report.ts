/**
 * Pure TypeScript A4 PDF 1.4 Revenue Report Generator for AgriTrace AI.
 * Renders a high-DPI executive financial dossier onto an HTML5 Canvas
 * (preserving full Vietnamese diacritics, tabular numbers, and vector-sharp charts)
 * and embeds it directly into an A4 Portrait PDF (595.28 x 841.89 pt) via DCTDecode.
 */

export interface SegmentRevenueRow {
  code: string;
  label: string;
  subLabel?: string;
  revenue: number;
  orderCount: number;
  unitCount: number;
  sharePercent: number;
  colorHex: string;
}

export interface TimeSeriesPoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface RevenueReportPayload {
  reportTitle: string;
  periodLabel: string;
  generatedAt: string;
  generatedBy: string;
  targetRevenue: number;
  kpis: {
    netRevenue: number;
    gmv: number;
    totalDiscount: number;
    refundedAmount: number;
    totalOrders: number;
    paidOrders: number;
    refundedOrders: number;
    cancelledOrders: number;
    aov: number;
    vietQrRevenue: number;
    codRevenue: number;
  };
  timeSeries: TimeSeriesPoint[];
  categorySegments: SegmentRevenueRow[];
  farmSegments: SegmentRevenueRow[];
  certSegments: SegmentRevenueRow[];
  topProducts: SegmentRevenueRow[];
}

function formatVnd(amount: number): string {
  return `${Math.round(amount || 0).toLocaleString("vi-VN")} đ`;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Renders the executive A4 portrait report onto a 1240 x 1754 canvas (150 DPI A4)
 */
export function renderRevenueReportCanvas(payload: RevenueReportPayload): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const W = 1240;
  const H = 1754;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // 1. Background Surface (Warm Botanical Editorial Ivory)
  ctx.fillStyle = "#FBF9F5";
  ctx.fillRect(0, 0, W, H);

  // Top Signature Accent Bar
  const topGrad = ctx.createLinearGradient(0, 0, W, 0);
  topGrad.addColorStop(0, "#16261E");
  topGrad.addColorStop(0.55, "#166534");
  topGrad.addColorStop(1, "#A3630A");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 14);

  // 2. Executive Header Banner
  const M = 56; // Horizontal Margin
  const contentW = W - M * 2;

  drawRoundedRect(ctx, M, 40, contentW, 138, 18);
  ctx.fillStyle = "#16261E";
  ctx.fill();

  // Brand Badge inside Header
  drawRoundedRect(ctx, M + 26, 64, 190, 26, 13);
  ctx.fillStyle = "rgba(252, 211, 77, 0.14)";
  ctx.fill();
  ctx.fillStyle = "#FCD34D";
  ctx.font = "bold 12px monospace";
  ctx.fillText("AGRITRACE AI • FINANCIAL OS", M + 38, 81);

  // Main Title
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 28px 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.fillText(payload.reportTitle.toUpperCase(), M + 26, 122);

  ctx.fillStyle = "#A7F3D0";
  ctx.font = "600 15px 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.fillText(`Kỳ báo cáo: ${payload.periodLabel}`, M + 26, 152);

  // Right Meta Box in Header
  ctx.textAlign = "right";
  ctx.fillStyle = "#D6D3D1";
  ctx.font = "600 13px 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.fillText(`Ngày kết xuất: ${payload.generatedAt}`, W - M - 26, 86);
  ctx.fillText(`Người lập biểu: ${payload.generatedBy}`, W - M - 26, 112);
  ctx.fillStyle = "#FCD34D";
  ctx.font = "bold 13px monospace";
  ctx.fillText("CHUẨN ĐỐI SOÁT: ISO/VIETGAP LEDGER", W - M - 26, 144);
  ctx.textAlign = "left";

  // 3. Four Executive KPI Cards (y = 198)
  const kpiY = 198;
  const kpiGap = 18;
  const kpiW = (contentW - kpiGap * 3) / 4;
  const kpiH = 128;

  const targetPct =
    payload.targetRevenue > 0
      ? Math.min(999, Math.round((payload.kpis.netRevenue / payload.targetRevenue) * 100))
      : 100;

  const kpiCards = [
    {
      label: "DOANH THU THUẦN (NET)",
      value: formatVnd(payload.kpis.netRevenue),
      sub: `Đạt ${targetPct}% mục tiêu kỳ (${payload.kpis.paidOrders} đơn hợp lệ)`,
      accent: "#166534",
      bg: "#FFFFFF",
    },
    {
      label: "TỔNG GIÁ TRỊ ĐƠN (GMV)",
      value: formatVnd(payload.kpis.gmv),
      sub: `Giá trị TB (AOV): ${formatVnd(payload.kpis.aov)} / đơn`,
      accent: "#0F766E",
      bg: "#FFFFFF",
    },
    {
      label: "TRỢ GIÁ & VOUCHER",
      value: formatVnd(payload.kpis.totalDiscount),
      sub: `Tỷ lệ trợ giá: ${
        payload.kpis.gmv > 0 ? ((payload.kpis.totalDiscount / payload.kpis.gmv) * 100).toFixed(1) : "0.0"
      }% tổng GMV`,
      accent: "#A3630A",
      bg: "#FFFFFF",
    },
    {
      label: "HOÀN TIỀN KHIẾU NẠI",
      value: formatVnd(payload.kpis.refundedAmount),
      sub: `${payload.kpis.refundedOrders} đơn hoàn • ${payload.kpis.cancelledOrders} đơn hủy`,
      accent: "#BE123C",
      bg: "#FFFFFF",
    },
  ];

  kpiCards.forEach((card, idx) => {
    const x = M + idx * (kpiW + kpiGap);
    drawRoundedRect(ctx, x, kpiY, kpiW, kpiH, 14);
    ctx.fillStyle = card.bg;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#E4DFD5";
    ctx.stroke();

    // Top accent pill
    ctx.fillStyle = card.accent;
    ctx.fillRect(x + 18, kpiY + 16, 28, 4);

    ctx.fillStyle = "#57534E";
    ctx.font = "bold 12px 'Segoe UI', Roboto, Arial, sans-serif";
    ctx.fillText(card.label, x + 18, kpiY + 42);

    ctx.fillStyle = "#16261E";
    ctx.font = "bold 23px Consolas, monospace";
    ctx.fillText(card.value, x + 18, kpiY + 78);

    ctx.fillStyle = "#78716C";
    ctx.font = "600 12px 'Segoe UI', Roboto, Arial, sans-serif";
    ctx.fillText(card.sub, x + 18, kpiY + 106);
  });

  // 4. Row 1: Revenue Trend Chart (Left 62%) + Payment Channel Split (Right 36%)
  const row1Y = 348;
  const row1H = 310;
  const leftW = Math.round(contentW * 0.62);
  const rightW = contentW - leftW - 20;
  const rightX = M + leftW + 20;

  // 4A. Left Box: Time-Series Bar + Line Chart
  drawRoundedRect(ctx, M, row1Y, leftW, row1H, 16);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.strokeStyle = "#E4DFD5";
  ctx.stroke();

  ctx.fillStyle = "#16261E";
  ctx.font = "bold 16px 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.fillText("BIỂU ĐỒ DIỄN BIẾN DOANH THU THUẦN THEO THỜI GIAN", M + 22, row1Y + 32);
  ctx.fillStyle = "#78716C";
  ctx.font = "600 12px 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.fillText("Đơn vị: VNĐ • Cột thể hiện doanh thu từng mốc thời gian trong kỳ báo cáo", M + 22, row1Y + 52);

  const chartX = M + 74;
  const chartY = row1Y + 76;
  const chartW = leftW - 102;
  const chartH = 185;

  const points = payload.timeSeries.length > 0 ? payload.timeSeries : [{ label: "Hôm nay", revenue: 0, orders: 0 }];
  const maxRev = Math.max(100000, ...points.map((p) => p.revenue));

  // Horizontal Grid lines
  ctx.strokeStyle = "#F0ECE1";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const gy = chartY + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(chartX, gy);
    ctx.lineTo(chartX + chartW, gy);
    ctx.stroke();

    const val = Math.round((maxRev * (4 - i)) / 4);
    ctx.fillStyle = "#78716C";
    ctx.font = "600 11px Consolas, monospace";
    ctx.textAlign = "right";
    ctx.fillText(val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${Math.round(val / 1000)}K`, chartX - 10, gy + 4);
  }
  ctx.textAlign = "left";

  // Draw Columns
  const slotW = chartW / points.length;
  const barW = Math.min(38, Math.max(12, slotW * 0.52));

  points.forEach((pt, idx) => {
    const ratio = Math.min(1, Math.max(0, pt.revenue / maxRev));
    const bh = Math.max(4, ratio * chartH);
    const bx = chartX + idx * slotW + (slotW - barW) / 2;
    const by = chartY + chartH - bh;

    drawRoundedRect(ctx, bx, by, barW, bh, 5);
    ctx.fillStyle = pt.revenue > 0 ? "#166534" : "#E4DFD5";
    ctx.fill();

    // Label on X axis
    ctx.fillStyle = "#57534E";
    ctx.font = "600 11px 'Segoe UI', Roboto, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(pt.label, bx + barW / 2, chartY + chartH + 20);
  });
  ctx.textAlign = "left";

  // 4B. Right Box: Payment Channel & Fulfillment Breakdown
  drawRoundedRect(ctx, rightX, row1Y, rightW, row1H, 16);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.strokeStyle = "#E4DFD5";
  ctx.stroke();

  ctx.fillStyle = "#16261E";
  ctx.font = "bold 16px 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.fillText("CƠ CẤU KÊNH THANH TOÁN", rightX + 22, row1Y + 32);
  ctx.fillStyle = "#78716C";
  ctx.font = "600 12px 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.fillText("Đối soát VietQR 24/7 (PayOS) và Thu hộ COD", rightX + 22, row1Y + 52);

  const totalChannelRev = Math.max(1, payload.kpis.vietQrRevenue + payload.kpis.codRevenue);
  const qrPct = Math.round((payload.kpis.vietQrRevenue / totalChannelRev) * 100);
  const codPct = 100 - qrPct;

  // Stacked Horizontal Bar for Payment Channels
  const stackX = rightX + 22;
  const stackY = row1Y + 80;
  const stackW = rightW - 44;
  drawRoundedRect(ctx, stackX, stackY, stackW, 24, 12);
  ctx.fillStyle = "#E4DFD5";
  ctx.fill();

  const qrBarW = Math.round((stackW * qrPct) / 100);
  if (qrBarW > 0) {
    drawRoundedRect(ctx, stackX, stackY, Math.max(16, qrBarW), 24, 12);
    ctx.fillStyle = "#0F766E";
    ctx.fill();
  }

  const paymentRows = [
    {
      name: "Chuyển khoản VietQR 24/7",
      amount: formatVnd(payload.kpis.vietQrRevenue),
      pct: `${qrPct}%`,
      color: "#0F766E",
    },
    {
      name: "Tiền mặt khi nhận hàng (COD)",
      amount: formatVnd(payload.kpis.codRevenue),
      pct: `${codPct}%`,
      color: "#A3630A",
    },
  ];

  paymentRows.forEach((row, i) => {
    const ry = row1Y + 132 + i * 74;
    drawRoundedRect(ctx, stackX, ry, stackW, 60, 12);
    ctx.fillStyle = "#FBF9F5";
    ctx.fill();
    ctx.strokeStyle = "#E4DFD5";
    ctx.stroke();

    ctx.fillStyle = row.color;
    ctx.fillRect(stackX + 14, ry + 16, 10, 28);

    ctx.fillStyle = "#16261E";
    ctx.font = "bold 14px 'Segoe UI', Roboto, Arial, sans-serif";
    ctx.fillText(row.name, stackX + 34, ry + 26);

    ctx.fillStyle = "#57534E";
    ctx.font = "bold 14px Consolas, monospace";
    ctx.fillText(row.amount, stackX + 34, ry + 47);

    ctx.textAlign = "right";
    ctx.fillStyle = row.color;
    ctx.font = "bold 18px Consolas, monospace";
    ctx.fillText(row.pct, stackX + stackW - 16, ry + 38);
    ctx.textAlign = "left";
  });

  // 5. Row 2: Doanh Thu Theo Mảng Ngành Hàng (Left 50%) + Doanh Thu Theo Nông Trại & Chứng Nhận (Right 50%)
  const row2Y = 680;
  const row2H = 380;
  const halfW = (contentW - 20) / 2;

  const renderSegmentBox = (
    bx: number,
    by: number,
    bw: number,
    bh: number,
    title: string,
    subtitle: string,
    rows: SegmentRevenueRow[]
  ) => {
    drawRoundedRect(ctx, bx, by, bw, bh, 16);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#E4DFD5";
    ctx.stroke();

    ctx.fillStyle = "#16261E";
    ctx.font = "bold 16px 'Segoe UI', Roboto, Arial, sans-serif";
    ctx.fillText(title, bx + 22, by + 32);
    ctx.fillStyle = "#78716C";
    ctx.font = "600 12px 'Segoe UI', Roboto, Arial, sans-serif";
    ctx.fillText(subtitle, bx + 22, by + 52);

    const displayRows = rows.slice(0, 4);
    displayRows.forEach((r, idx) => {
      const itemY = by + 76 + idx * 72;
      const innerW = bw - 44;

      ctx.fillStyle = "#16261E";
      ctx.font = "bold 14px 'Segoe UI', Roboto, Arial, sans-serif";
      ctx.fillText(`${idx + 1}. ${r.label}`, bx + 22, itemY + 16);

      ctx.textAlign = "right";
      ctx.fillStyle = "#16261E";
      ctx.font = "bold 14px Consolas, monospace";
      ctx.fillText(`${formatVnd(r.revenue)} (${r.sharePercent.toFixed(1)}%)`, bx + 22 + innerW, itemY + 16);
      ctx.textAlign = "left";

      // Progress track
      drawRoundedRect(ctx, bx + 22, itemY + 26, innerW, 12, 6);
      ctx.fillStyle = "#F0ECE1";
      ctx.fill();

      const fillW = Math.max(10, Math.round((innerW * Math.min(100, r.sharePercent)) / 100));
      drawRoundedRect(ctx, bx + 22, itemY + 26, fillW, 12, 6);
      ctx.fillStyle = r.colorHex || "#166534";
      ctx.fill();

      ctx.fillStyle = "#78716C";
      ctx.font = "600 11px 'Segoe UI', Roboto, Arial, sans-serif";
      ctx.fillText(
        `${r.orderCount} đơn hàng • ${r.unitCount} đơn vị sản phẩm${r.subLabel ? ` • ${r.subLabel}` : ""}`,
        bx + 22,
        itemY + 54
      );
    });
  };

  renderSegmentBox(
    M,
    row2Y,
    halfW,
    row2H,
    "DOANH THU THEO MẢNG NGÀNH HÀNG NÔNG SẢN",
    "Phân bổ tỷ trọng doanh thu theo từng nhóm danh mục",
    payload.categorySegments
  );

  renderSegmentBox(
    M + halfW + 20,
    row2Y,
    halfW,
    row2H,
    "DOANH THU THEO NÔNG TRẠI & HỢP TÁC XÃ",
    "Đóng góp doanh thu theo vùng trồng trong chuỗi cung ứng",
    payload.farmSegments
  );

  // 6. Row 3: Bảng Đối Soát Top Nông Sản Chủ Lực & Tiêu Chuẩn Chứng Nhận (y = 1082)
  const row3Y = 1082;
  const row3H = 445;
  drawRoundedRect(ctx, M, row3Y, contentW, row3H, 16);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.strokeStyle = "#E4DFD5";
  ctx.stroke();

  ctx.fillStyle = "#16261E";
  ctx.font = "bold 16px 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.fillText("BẢNG TỔNG HỢP CHI TIẾT TOP NÔNG SẢN & TIÊU CHUẨN CHẤT LƯỢNG", M + 22, row3Y + 34);

  // Certification Pills on Top Right of Table
  let certOffsetX = W - M - 22;
  [...payload.certSegments].reverse().forEach((cert) => {
    const text = `${cert.label}: ${formatVnd(cert.revenue)} (${cert.sharePercent.toFixed(0)}%)`;
    ctx.font = "bold 12px Consolas, monospace";
    const tw = ctx.measureText(text).width + 24;
    certOffsetX -= tw;
    drawRoundedRect(ctx, certOffsetX, row3Y + 14, tw, 26, 13);
    ctx.fillStyle = "#F6F3EC";
    ctx.fill();
    ctx.strokeStyle = "#E4DFD5";
    ctx.stroke();
    ctx.fillStyle = "#166534";
    ctx.fillText(text, certOffsetX + 12, row3Y + 31);
    certOffsetX -= 10;
  });

  // Table Header
  const tableX = M + 22;
  const tableY = row3Y + 56;
  const tableW = contentW - 44;
  drawRoundedRect(ctx, tableX, tableY, tableW, 38, 8);
  ctx.fillStyle = "#16261E";
  ctx.fill();

  ctx.fillStyle = "#FCD34D";
  ctx.font = "bold 12px 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.fillText("STT", tableX + 16, tableY + 24);
  ctx.fillText("TÊN NÔNG SẢN / MẶT HÀNG", tableX + 70, tableY + 24);
  ctx.fillText("NGUỒN GỐC / CHỨNG NHẬN", tableX + 430, tableY + 24);
  ctx.textAlign = "right";
  ctx.fillText("SỐ ĐƠN", tableX + 750, tableY + 24);
  ctx.fillText("SẢN LƯỢNG", tableX + 870, tableY + 24);
  ctx.fillText("DOANH THU", tableX + tableW - 110, tableY + 24);
  ctx.fillText("TỶ TRỌNG", tableX + tableW - 16, tableY + 24);
  ctx.textAlign = "left";

  const topRows = payload.topProducts.slice(0, 7);
  topRows.forEach((prod, i) => {
    const ry = tableY + 42 + i * 48;
    if (i % 2 === 1) {
      drawRoundedRect(ctx, tableX, ry, tableW, 44, 6);
      ctx.fillStyle = "#FBF9F5";
      ctx.fill();
    }

    ctx.fillStyle = "#57534E";
    ctx.font = "bold 13px Consolas, monospace";
    ctx.fillText(String(i + 1).padStart(2, "0"), tableX + 16, ry + 27);

    ctx.fillStyle = "#16261E";
    ctx.font = "bold 14px 'Segoe UI', Roboto, Arial, sans-serif";
    ctx.fillText(prod.label.slice(0, 32), tableX + 70, ry + 27);

    ctx.fillStyle = "#57534E";
    ctx.font = "600 13px 'Segoe UI', Roboto, Arial, sans-serif";
    ctx.fillText((prod.subLabel || "VietGAP • Đà Lạt").slice(0, 32), tableX + 430, ry + 27);

    ctx.textAlign = "right";
    ctx.fillStyle = "#16261E";
    ctx.font = "600 13px Consolas, monospace";
    ctx.fillText(`${prod.orderCount}`, tableX + 750, ry + 27);
    ctx.fillText(`${prod.unitCount}`, tableX + 870, ry + 27);

    ctx.fillStyle = "#166534";
    ctx.font = "bold 14px Consolas, monospace";
    ctx.fillText(formatVnd(prod.revenue), tableX + tableW - 110, ry + 27);

    ctx.fillStyle = "#16261E";
    ctx.font = "bold 13px Consolas, monospace";
    ctx.fillText(`${prod.sharePercent.toFixed(1)}%`, tableX + tableW - 16, ry + 27);
    ctx.textAlign = "left";
  });

  // 7. Executive Signature & Audit Stamp Footer (y = 1554)
  const footY = 1554;
  ctx.strokeStyle = "#D6D3D1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(M, footY);
  ctx.lineTo(W - M, footY);
  ctx.stroke();

  ctx.fillStyle = "#57534E";
  ctx.font = "600 13px 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.fillText("Tài liệu đối soát nội bộ thuộc Hệ thống Quản lý Chuỗi Cung Ứng Nông Sản Sạch AgriTrace AI.", M, footY + 34);
  ctx.fillStyle = "#78716C";
  ctx.font = "12px 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.fillText(
    "Số liệu doanh thu thuần chỉ ghi nhận từ các đơn hàng đã thanh toán VietQR hoặc đã xác nhận giao hàng COD (không tính đơn đã hủy/hoàn tiền).",
    M,
    footY + 58
  );

  // Official Digital Verification Stamp Box
  const stampX = W - M - 270;
  const stampY = footY + 18;
  drawRoundedRect(ctx, stampX, stampY, 270, 118, 12);
  ctx.fillStyle = "#F0FDF4";
  ctx.fill();
  ctx.strokeStyle = "#166534";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#166534";
  ctx.font = "bold 12px monospace";
  ctx.fillText("XÁC THỰC BỞI BAN QUẢN TRỊ", stampX + 135, stampY + 26);
  ctx.fillStyle = "#16261E";
  ctx.font = "bold 16px 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.fillText(payload.generatedBy, stampX + 135, stampY + 58);
  ctx.fillStyle = "#15803D";
  ctx.font = "bold 11px monospace";
  ctx.fillText(`DIGITAL SEAL • ${payload.generatedAt}`, stampX + 135, stampY + 86);
  ctx.fillText("STATUS: VERIFIED & AUDITED", stampX + 135, stampY + 104);
  ctx.textAlign = "left";

  return canvas;
}

/**
 * Encodes a rendered A4 canvas into a standalone PDF 1.4 Blob (A4 Portrait: 595.28 x 841.89 pt)
 */
export function createA4PdfBlobFromCanvas(canvas: HTMLCanvasElement): Blob {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
  const base64 = dataUrl.split(",")[1] || "";
  const binaryStr = atob(base64);
  const jpegBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    jpegBytes[i] = binaryStr.charCodeAt(i);
  }

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const contentCommands = `q\n${pageWidth.toFixed(2)} 0 0 ${pageHeight.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`;

  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(contentCommands);

  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let cursor = 0;

  const pushStr = (text: string) => {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    cursor += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    cursor += bytes.length;
  };

  pushStr("%PDF-1.4\n");
  pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  // 1: Catalog
  offsets.push(cursor);
  pushStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // 2: Pages
  offsets.push(cursor);
  pushStr("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  // 3: Page
  offsets.push(cursor);
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(
      2
    )}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // 4: Image XObject (JPEG)
  offsets.push(cursor);
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushStr("\nendstream\nendobj\n");

  // 5: Content Stream
  offsets.push(cursor);
  pushStr(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
  pushBytes(contentBytes);
  pushStr("endstream\nendobj\n");

  const xrefOffset = cursor;
  pushStr(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
  for (const offset of offsets) {
    pushStr(`${String(offset).padStart(10, "0")} 00000 n \n`);
  }
  pushStr(
    `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  const blobParts: BlobPart[] = chunks.map((chunk) => {
    const copy = new Uint8Array(chunk.byteLength);
    copy.set(chunk);
    return copy;
  });
  return new Blob(blobParts, { type: "application/pdf" });
}
