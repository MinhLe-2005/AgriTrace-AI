"use client";

import { CheckCircle2, Copy, Download, FileText, Layers, Printer, ShieldCheck, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPdfBlobFromCanvas } from "@/lib/pdf-label";
import { toast } from "@/stores/toast-store";

function formatGs1Date(raw?: string): string {
  if (!raw) return "000000";
  const cleaned = raw.trim();
  const vnMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (vnMatch) {
    return `${vnMatch[3].slice(-2)}${vnMatch[2].padStart(2, "0")}${vnMatch[1].padStart(2, "0")}`;
  }
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1].slice(-2)}${isoMatch[2].padStart(2, "0")}${isoMatch[3].padStart(2, "0")}`;
  }
  return "261125";
}

function CertSealBadge({ certName }: { certName: string }) {
  const lower = certName.toLowerCase();
  const isGlobal = lower.includes("global");
  const isOrganic = lower.includes("organic") || lower.includes("hữu cơ");
  const primary = isGlobal ? "#0f766e" : isOrganic ? "#65a30d" : "#15803d";
  const shortLabel = isGlobal ? "GLOBALG.A.P" : isOrganic ? "ORGANIC" : "VIETGAP";

  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 64 64"
      aria-label={`Logo chứng nhận ${certName}`}
      className="shrink-0"
    >
      <circle cx="32" cy="32" r="29" fill="#ffffff" stroke={primary} strokeWidth="3" />
      <circle cx="32" cy="32" r="24" fill="#ecfdf5" stroke={primary} strokeWidth="1.2" strokeDasharray="3 2" />
      <path
        d="M32 14 C38 20, 41 28, 32 37 C23 28, 26 20, 32 14 Z"
        fill={primary}
      />
      <path d="M32 19 L32 35" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="8" y="38" width="48" height="12" rx="4" fill={primary} />
      <text
        x="32"
        y="46.5"
        textAnchor="middle"
        fill="#ffffff"
        fontSize={shortLabel.length > 8 ? "7" : "8.5"}
        fontWeight="800"
        fontFamily="Arial, sans-serif"
      >
        {shortLabel}
      </text>
    </svg>
  );
}

export interface QrLabelLot {
  code: string;
  product: string;
  qty: string;
  unit: string;
  harvestDate: string;
  expiryDate?: string;
  cert?: string;
  farmCode?: string;
  cultivation?: string;
  farmName?: string;
  farmAddress?: string;
  status?: string;
  transportDestination?: string;
}

interface QrLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot: QrLabelLot | null;
  defaultFarmName?: string;
  defaultFarmAddress?: string;
}

export function QrLabelModal({
  isOpen,
  onClose,
  lot,
  defaultFarmName = "Nông Trại Xanh Đà Lạt (Mã: NT-DL-01)",
  defaultFarmAddress = "Xã Xuân Thọ, TP. Đà Lạt, Tỉnh Lâm Đồng",
}: QrLabelModalProps) {
  const [layoutMode, setLayoutMode] = useState<"single" | "grid4">("single");
  const [packSpec, setPackSpec] = useState("Thùng carton vi lỗ thở 15-20kg");
  const [storageTemp, setStorageTemp] = useState("Chuỗi lạnh 2°C – 6°C • Độ ẩm 85%");
  const [isDownloading, setIsDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !lot) return null;

  const farmName = lot.farmName || defaultFarmName;
  const farmAddress = lot.farmAddress || defaultFarmAddress;
  const certName = lot.cert || "VietGAP";
  const originUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const publicTraceUrl = `${originUrl}/traceability?batch=${encodeURIComponent(lot.code)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=4&data=${encodeURIComponent(
    publicTraceUrl
  )}`;

  const handlePrint = () => {
    toast.info("Đang mở hộp thoại in tem nhãn nông sản...");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicTraceUrl);
      toast.success("Đã sao chép liên kết trang tra cứu QR công khai!");
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  };

  const gs1Harvest = formatGs1Date(lot.harvestDate);
  const gs1Expiry = formatGs1Date(lot.expiryDate);
  const gs1BarcodeLine = `(01) 8938501234567 (10) ${lot.code} (11) ${gs1Harvest} (17) ${gs1Expiry}`;

  const renderGs1Canvas = (onRendered: (canvas: HTMLCanvasElement) => void, onFailMessage: string) => {
    setIsDownloading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        toast.error("Không thể khởi tạo khung tem");
        setIsDownloading(false);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsDownloading(false);
        return;
      }

      canvas.width = 800;
      canvas.height = 600;

      // Nền trắng
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 800, 600);

      // Viền tem
      ctx.strokeStyle = "#166534";
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, 780, 580);

      // Header xanh lá
      ctx.fillStyle = "#166534";
      ctx.fillRect(10, 10, 780, 80);

      // Chữ Header
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("AGRITRACE AI • TEM TRUY XUẤT NGUỒN GỐC GS1", 30, 46);
      ctx.font = "13px sans-serif";
      ctx.fillText("TIÊU CHUẨN NÔNG SẢN MINH BẠCH • ĐỊNH DANH SỐ QUỐC GIA", 30, 72);

      // Vẽ huy hiệu logo chứng nhận VietGAP/GlobalGAP góc phải
      const drawCertLogoOnCanvas = () => {
        const lowerCert = certName.toLowerCase();
        const badgeColor = lowerCert.includes("global")
          ? "#0f766e"
          : lowerCert.includes("organic") || lowerCert.includes("hữu cơ")
          ? "#65a30d"
          : "#15803d";
        const badgeLabel = lowerCert.includes("global")
          ? "GLOBALG.A.P"
          : lowerCert.includes("organic") || lowerCert.includes("hữu cơ")
          ? "ORGANIC"
          : "VIETGAP";

        const cx = 720;
        const cy = 152;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 42, 0, Math.PI * 2);
        ctx.fillStyle = "#ecfdf5";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = badgeColor;
        ctx.stroke();

        ctx.fillStyle = badgeColor;
        ctx.fillRect(cx - 38, cy + 6, 76, 18);
        ctx.fillStyle = "#ffffff";
        ctx.font = badgeLabel.length > 8 ? "bold 10px sans-serif" : "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(badgeLabel, cx, cy + 19);

        ctx.fillStyle = badgeColor;
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("CERTIFIED", cx, cy - 8);
        ctx.restore();
        ctx.textAlign = "left";
      };

      const finishCanvasBody = () => {
        // Chú thích dưới QR
        ctx.fillStyle = "#15803d";
        ctx.font = "bold 13px monospace";
        ctx.fillText(`agritrace.vn/tr/${lot.code}`, 45, 385);

        ctx.fillStyle = "#6b7280";
        ctx.font = "12px sans-serif";
        ctx.fillText("Dùng camera quét để xem nhật ký", 40, 405);

        // Logo chứng nhận
        drawCertLogoOnCanvas();

        // Khối thông tin bên phải
        ctx.fillStyle = "#111827";
        ctx.font = "bold 22px sans-serif";
        ctx.fillText(lot.product.toUpperCase().slice(0, 24), 300, 145);

        ctx.fillStyle = "#166534";
        ctx.font = "bold 19px monospace";
        ctx.fillText(`MÃ LÔ: #${lot.code}`, 300, 180);

        ctx.fillStyle = "#047857";
        ctx.font = "bold 15px sans-serif";
        ctx.fillText(`CHỨNG NHẬN: ${certName.toUpperCase()}`, 300, 215);

        ctx.fillStyle = "#374151";
        ctx.font = "15px sans-serif";
        ctx.fillText(`Nông trại: ${farmName}`, 300, 248);
        ctx.fillText(`Vùng trồng: ${farmAddress}`, 300, 278);
        ctx.fillText(`Ngày thu hoạch: ${lot.harvestDate}    |    HSD: ${lot.expiryDate || "—"}`, 300, 308);
        ctx.fillText(`Sản lượng lô: ${lot.qty} ${lot.unit}    |    Quy cách: ${packSpec}`, 300, 338);
        ctx.fillText(`Bảo quản: ${storageTemp}`, 300, 368);
        if (lot.transportDestination) {
          ctx.fillText(`Điểm giao / Kho đích: ${lot.transportDestination}`, 300, 398);
        }

        // Đường phân cách & mã GS1-128
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, 435);
        ctx.lineTo(770, 435);
        ctx.stroke();

        // Vẽ dải vạch tượng trưng GS1-128
        ctx.fillStyle = "#111827";
        for (let bx = 180; bx < 620; bx += 7) {
          const barW = (bx % 14 === 0) ? 4 : 2;
          ctx.fillRect(bx, 462, barW, 56);
        }

        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(gs1BarcodeLine, 400, 545);
        ctx.textAlign = "left";

        onRendered(canvas);
        setIsDownloading(false);
      };

      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.onload = () => {
        ctx.drawImage(qrImg, 35, 120, 240, 240);
        finishCanvasBody();
      };
      qrImg.onerror = () => {
        // Fallback khung QR nếu môi trường không truy cập được qrserver
        ctx.strokeStyle = "#166534";
        ctx.lineWidth = 3;
        ctx.strokeRect(45, 130, 220, 220);
        ctx.fillStyle = "#166534";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText("QR TRACE", 155, 225);
        ctx.fillText(lot.code, 155, 255);
        ctx.textAlign = "left";
        finishCanvasBody();
      };
      qrImg.src = qrImageUrl;
    } catch {
      toast.error(onFailMessage);
      setIsDownloading(false);
    }
  };

  const handleDownloadPng = () => {
    renderGs1Canvas((canvas) => {
      const link = document.createElement("a");
      link.download = `TEM_GS1_${lot.code}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success(`Đã tải ảnh tem ${lot.code} (PNG) thành công!`);
    }, "Lỗi xuất ảnh tem");
  };

  const handleDownloadPdf = () => {
    renderGs1Canvas((canvas) => {
      const pdfBlob = createPdfBlobFromCanvas(canvas, layoutMode === "grid4" ? "a4Grid4" : "label100x75");
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.download = `TEM_GS1_${lot.code}_${layoutMode === "grid4" ? "A4_4TEM" : "100x75"}.pdf`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Đã xuất file PDF tem nhãn ${lot.code} thành công!`);
    }, "Lỗi xuất file PDF tem nhãn");
  };

  const SingleLabel = ({ isPrintOnly = false }: { isPrintOnly?: boolean }) => (
    <div
      className={`bg-white border-2 border-emerald-800 rounded-xl overflow-hidden text-gray-900 shadow-sm ${
        isPrintOnly ? "w-full max-w-[760px] mx-auto p-0" : "w-full p-0"
      }`}
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      {/* Label Header */}
      <div className="bg-emerald-800 text-white px-4 py-2.5 flex items-center justify-between border-b border-emerald-900">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white text-emerald-800 flex items-center justify-center font-black text-xs">
            AG
          </div>
          <div>
            <div className="font-extrabold text-xs sm:text-sm tracking-wide uppercase">
              AgriTrace AI • Tem Nguồn Gốc Chuẩn GS1
            </div>
            <div className="text-[10px] text-emerald-200">Định danh số GS1 Digital Link • QR Code Truy Xuất Khép Kín</div>
          </div>
        </div>
        <div className="text-right">
          <span className="bg-emerald-700/80 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500 uppercase">
            {certName}
          </span>
          <div className="text-[9px] text-emerald-200 mt-0.5">ISO/IEC 18004</div>
        </div>
      </div>

      {/* Label Content */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
        {/* Left: QR Code Box */}
        <div className="sm:col-span-4 flex flex-col items-center justify-center bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-center">
          <div className="relative p-1 bg-white rounded-md border border-gray-300 shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImageUrl} alt={`QR Code ${lot.code}`} className="w-36 h-36 object-contain" />
          </div>
          <span className="font-mono font-bold text-[11px] text-emerald-800 mt-1.5 block">
            #{lot.code}
          </span>
          <span className="text-[9px] text-gray-500 leading-tight block">
            Quét bằng Camera để kiểm tra 100% nhật ký &amp; KCS
          </span>
        </div>

        {/* Right: Product & Farm Info */}
        <div className="sm:col-span-8 text-xs space-y-1.5">
          <div className="border-b border-gray-100 pb-1.5 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                {lot.product}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="font-mono font-extrabold text-emerald-800 text-xs bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  MÃ LÔ: {lot.code}
                </span>
                <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.2 rounded text-[10px]">
                  {certName}
                </span>
                <span className="text-[10px] text-gray-500 italic">
                  {lot.cultivation || "Theo quy trình an toàn"}
                </span>
              </div>
            </div>
            <CertSealBadge certName={certName} />
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
            <div>
              <span className="text-gray-500 block text-[10px]">Nông trại:</span>
              <strong className="text-gray-800">{farmName}</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">Sản lượng:</span>
              <strong className="text-emerald-700">{lot.qty} {lot.unit}</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">Ngày thu hoạch:</span>
              <strong className="text-gray-800">{lot.harvestDate}</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">Hạn sử dụng (HSD):</span>
              <strong className="text-rose-700">{lot.expiryDate || "—"}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500 block text-[10px]">Vùng trồng:</span>
              <span className="text-gray-700">{farmAddress}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500 block text-[10px]">Bảo quản &amp; Quy cách:</span>
              <span className="text-gray-700">{storageTemp} • {packSpec}</span>
            </div>
            {lot.transportDestination && (
              <div className="col-span-2">
                <span className="text-gray-500 block text-[10px]">Kho đích / Nơi giao:</span>
                <span className="text-blue-800 font-semibold">{lot.transportDestination}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Label Footer (Barcode 1D GS1 Representation) */}
      <div className="bg-gray-100 border-t border-gray-200 px-4 py-2 flex flex-wrap items-center justify-between text-[10px] text-gray-600">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="font-bold text-gray-800">GS1-128:</span>
          <span>(01) 8938501234567 (10) {lot.code}</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-800 font-semibold">
          <ShieldCheck size={12} /> Nông sản minh bạch AgriTrace
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* VÙNG IN DÀNH RIÊNG CHO MÁY IN (@media print) */}
      <div id="printable-label-area" className="hidden print:block bg-white text-black p-4">
        {layoutMode === "single" ? (
          <div className="p-2">
            <SingleLabel isPrintOnly />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-2">
            <SingleLabel isPrintOnly />
            <SingleLabel isPrintOnly />
            <SingleLabel isPrintOnly />
            <SingleLabel isPrintOnly />
          </div>
        )}
      </div>

      {/* Hidden Canvas for PNG Generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* MODAL PREVIEW TRÊN GIAO DIỆN MÀN HÌNH */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs cursor-pointer animate-in fade-in duration-200 print:hidden"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] cursor-default"
        >
          {/* Header Modal */}
          <div className="bg-emerald-950 text-white px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800/80 border border-emerald-600/50 flex items-center justify-center text-emerald-300">
                <Printer size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    In Tem Nhãn Mã QR Lô Hàng
                  </h3>
                  <span className="font-mono text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700">
                    #{lot.code}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">
                  Định dạng tem dán bao bì &amp; thùng carton chuẩn GS1 Digital Link
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/50 cursor-pointer transition-colors"
              title="Đóng"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Modal */}
          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            {/* Tùy chỉnh & Chế độ in */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                  <Layers size={13} className="text-emerald-700" /> Khổ in:
                </span>
                <button
                  type="button"
                  onClick={() => setLayoutMode("single")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    layoutMode === "single"
                      ? "bg-emerald-700 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  Tem Đơn (100x75mm)
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode("grid4")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    layoutMode === "grid4"
                      ? "bg-emerald-700 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  Bảng A4 (4 Tem/Trang)
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Copy size={12} /> Sao chép URL tra cứu
              </button>
            </div>

            {/* Xem trước tem nhãn */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-gray-500 text-[11px]">
                <span className="font-bold text-gray-700 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" /> Bản xem trước tem nhãn (Print Preview):
                </span>
                <span>Chuẩn máy in nhiệt &amp; decal dán thùng</span>
              </div>

              <div className="p-3 bg-gray-100 rounded-xl border border-gray-200 overflow-x-auto flex justify-center">
                <SingleLabel />
              </div>
            </div>

            {/* Thông số in bổ sung */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Quy cách đóng thùng trên tem:
                </label>
                <input
                  type="text"
                  value={packSpec}
                  onChange={(e) => setPackSpec(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600 focus:bg-white text-gray-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Điều kiện lưu trữ &amp; bảo quản:
                </label>
                <input
                  type="text"
                  value={storageTemp}
                  onChange={(e) => setStorageTemp(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600 focus:bg-white text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Footer Modal Actions */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-gray-500 flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-600" />
              Tem nhãn được mã hóa định danh duy nhất cho lô #{lot.code}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={isDownloading}
                onClick={handleDownloadPng}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#1a7a3a] border border-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              >
                <Download size={14} />
                {isDownloading ? "Đang xuất..." : "Tải Ảnh PNG"}
              </button>
              <button
                type="button"
                disabled={isDownloading}
                onClick={handleDownloadPdf}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              >
                <FileText size={14} />
                Xuất File PDF
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-[#1a7a3a] hover:bg-[#14632e] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <Printer size={14} />
                In Tem Ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-label-area,
          #printable-label-area * {
            visibility: visible !important;
          }
          #printable-label-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 8mm !important;
            background: white !important;
            z-index: 999999 !important;
          }
          @page {
            size: auto;
            margin: 5mm;
          }
        }
      `}</style>
    </>
  );
}
