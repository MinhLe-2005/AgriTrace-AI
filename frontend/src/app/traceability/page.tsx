"use client";

import {
  AlertCircle,
  Award,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileCheck,
  FileText,
  Image as ImageIcon,
  Info,
  MapPin,
  Package,
  QrCode,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Truck,
  Upload,
  UserCheck,
  Warehouse,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import jsQR from "jsqr";
import { catalogService, ApiTraceability } from "@/services/catalog.service";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

type TraceabilityData = {
  productName: string;
  batchCode: string;
  qrImage: string;
  status: string;
  statusColor: string;
  farm: {
    name: string;
    location: string;
    farmer: string;
    farmerId: string;
    sowingDate: string;
    harvestDate: string;
    cert: string;
    certExp: string;
  };
  warehouse: {
    warehouseName: string;
    staff: string;
    importDate: string;
    expiryDate: string;
    storageTemp: string;
    humidity: string;
    condition: string;
  };
  shipment: {
    distributor: string;
    driver: string;
    plateNumber: string;
    departTime: string;
    currentStatus: string;
    containerTemp: string;
  };
  labTest: {
    agency: string;
    testDate: string;
    pesticide: string;
    nitrate: string;
    heavyMetals: string;
    microbiology: string;
    overall: string;
  };
};

const sampleTraceabilityData: Record<string, TraceabilityData> = {
  "XL-2026-08": {
    productName: "Xà Lách Thủy Canh Lô Lô Xanh",
    batchCode: "XL-2026-08",
    qrImage: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=AGRITRACE-XL-2026-08",
    status: "Đã kiểm định & Đang phân phối",
    statusColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    farm: {
      name: "Nông Trại Xanh Đà Lạt (Farm ID: NT-DL-01)",
      location: "Xã Xuân Thọ, TP. Đà Lạt, Tỉnh Lâm Đồng",
      farmer: "Nguyễn Văn Hùng",
      farmerId: "FM-104",
      sowingDate: "28/08/2026",
      harvestDate: "14/10/2026 (05:30 Sáng)",
      cert: "GlobalGAP #GG-VN-2024-910",
      certExp: "Hiệu lực đến 12/2027",
    },
    warehouse: {
      warehouseName: "Tổng Kho Trung Chuyển Miền Nam - KCN Tân Bình",
      staff: "Trần Thị Mai (Kho 02)",
      importDate: "14/10/2026 (11:15 Trưa)",
      expiryDate: "18/10/2026 (FEFO: Ưu tiên xuất kho trong 4 ngày)",
      storageTemp: "4°C - 6°C",
      humidity: "90%",
      condition: "Đạt chuẩn bảo quản lạnh rau ăn lá màng thở",
    },
    shipment: {
      distributor: "Công ty Vận Tải Nông Sản Xanh Express",
      driver: "Lê Hoàng Long",
      plateNumber: "49C-184.92",
      departTime: "14/10/2026 (14:00)",
      currentStatus: "Đang vận chuyển đến điểm phân phối Quận 1, TP.HCM",
      containerTemp: "5.2°C (Cảm biến IoT kiểm soát liên tục)",
    },
    labTest: {
      agency: "Trung tâm Kỹ thuật Tiêu chuẩn Đo lường Chất lượng (Quatest 1)",
      testDate: "14/10/2026 (08:00)",
      pesticide: "0.0 mg/kg (Không phát hiện dư lượng BVTV)",
      nitrate: "68 mg/kg (Ngưỡng an toàn Quốc gia < 500 mg/kg)",
      heavyMetals: "Âm tính (Pb, Cd, As = 0)",
      microbiology: "Đạt chuẩn VSATTP (E.coli, Salmonella = 0)",
      overall: "Đạt tiêu chuẩn an toàn sinh học xuất khẩu 100%",
    },
  },
  "DT-MC-2026-11": {
    productName: "Dâu Tây Giống Nhật Mộc Châu",
    batchCode: "DT-MC-2026-11",
    qrImage: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=AGRITRACE-DT-MC-2026-11",
    status: "Đã nhập kho lạnh trung tâm",
    statusColor: "bg-blue-50 text-blue-800 border-blue-200",
    farm: {
      name: "Hợp tác xã Nông nghiệp Mộc Châu Eco",
      location: "Thị trấn Nông Trường, Huyện Mộc Châu, Sơn La",
      farmer: "Hoàng Văn Tuấn",
      farmerId: "FM-MC-22",
      sowingDate: "15/07/2026",
      harvestDate: "13/10/2026 (06:00 Sáng)",
      cert: "VietGAP #VG-SL-2025-442",
      certExp: "Hiệu lực đến 11/2026",
    },
    warehouse: {
      warehouseName: "Kho Lạnh Hà Nội - KCN Đài Tư, Long Biên",
      staff: "Nguyễn Minh Đức",
      importDate: "13/10/2026 (22:30)",
      expiryDate: "19/10/2026 (FEFO: Còn 6 ngày)",
      storageTemp: "2°C - 4°C",
      humidity: "85%",
      condition: "Hút ẩm và đóng khay màng thở định hình",
    },
    shipment: {
      distributor: "Vận tải Bắc Nam Fresh Express",
      driver: "Vũ Văn Cường",
      plateNumber: "29H-883.12",
      departTime: "14/10/2026 (06:00)",
      currentStatus: "Hoàn tất bàn giao siêu thị & điểm phân phối",
      containerTemp: "3.5°C (Đo tự động liên tục)",
    },
    labTest: {
      agency: "Viện Kiểm nghiệm An toàn Vệ sinh Thực phẩm Quốc gia (NIFC)",
      testDate: "13/10/2026 (14:30)",
      pesticide: "0.0 mg/kg (Không phát hiện tồn dư BVTV)",
      nitrate: "42 mg/kg (Đạt chuẩn cao suối nguồn)",
      heavyMetals: "Âm tính tuyệt đối",
      microbiology: "Đạt chuẩn VSATTP",
      overall: "Đạt chuẩn an toàn VietGAP loại A",
    },
  },
  "CS-BG-2026-03": {
    productName: "Cam Sành Bố Hạ Mọng Nước",
    batchCode: "CS-BG-2026-03",
    qrImage: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=AGRITRACE-CS-BG-2026-03",
    status: "Đang giao hàng xe lạnh",
    statusColor: "bg-amber-50 text-amber-800 border-amber-200",
    farm: {
      name: "HTX Trái Cây Bố Hạ Bắc Giang",
      location: "Xã Bố Hạ, Huyện Yên Thế, Tỉnh Bắc Giang",
      farmer: "Trần Văn Bình",
      farmerId: "FM-BG-09",
      sowingDate: "Canh tác lâu năm",
      harvestDate: "11/10/2026",
      cert: "Hữu cơ (Organic BioCert #OB-2024)",
      certExp: "Hiệu lực đến 2027",
    },
    warehouse: {
      warehouseName: "Kho Tổng Phân Phối Nông Sản Miền Bắc",
      staff: "Phạm Hùng Cường",
      importDate: "11/10/2026 (18:00)",
      expiryDate: "23/10/2026 (FEFO: Còn 12 ngày)",
      storageTemp: "8°C - 12°C",
      humidity: "80%",
      condition: "Thùng carton lót rơm thông khí tự nhiên",
    },
    shipment: {
      distributor: "Đội xe lạnh AgriCold Miền Bắc",
      driver: "Trần Đình Trọng",
      plateNumber: "29C-552.19",
      departTime: "12/10/2026 (07:30)",
      currentStatus: "Đang phân phối tới hệ thống bán lẻ",
      containerTemp: "9.0°C",
    },
    labTest: {
      agency: "Trung tâm Chứng nhận Phù hợp (QUACERT)",
      testDate: "11/10/2026",
      pesticide: "0.0 mg/kg (Không dùng thuốc BVTV hóa học)",
      nitrate: "35 mg/kg (Chuẩn Organic)",
      heavyMetals: "Âm tính 100%",
      microbiology: "Đạt chuẩn VSATTP",
      overall: "Chứng nhận Nông sản Hữu cơ 100%",
    },
  },
};

export default function TraceabilityPage() {
  const searchParams = useSearchParams();
  const initialBatch = searchParams.get("batch") || searchParams.get("lot") || "XL-2026-08";

  const [batchCode, setBatchCode] = useState(initialBatch);
  const [searchedBatch, setSearchedBatch] = useState(initialBatch);

  // Camera QR Scanner Modal State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Hidden File input for Uploading QR Image
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const q = searchParams.get("batch") || searchParams.get("lot");
    if (q) {
      setBatchCode(q);
      setSearchedBatch(q);
    }
  }, [searchParams]);

  // Clean parsed batch code
  function cleanParsedCode(raw: string) {
    let clean = raw.trim();
    if (clean.startsWith("AGRITRACE-")) {
      clean = clean.replace("AGRITRACE-", "");
    } else if (clean.includes("batch=")) {
      clean = clean.split("batch=")[1].split("&")[0];
    } else if (clean.includes("lot=")) {
      clean = clean.split("lot=")[1].split("&")[0];
    }
    return clean;
  }

  // Camera Stream Handler
  async function startCameraScanner() {
    setIsCameraOpen(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        scanVideoFrame();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        "Không thể truy cập camera. Vui lòng cấp quyền máy ảnh cho trình duyệt hoặc sử dụng nút 'Tải ảnh tem QR' bên dưới."
      );
    }
  }

  function stopCameraScanner() {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  }

  function scanVideoFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        const parsed = cleanParsedCode(code.data);
        stopCameraScanner();
        setBatchCode(parsed);
        setSearchedBatch(parsed);
        toast.success(`Đã quét thành công mã tem QR: ${parsed}`);
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(scanVideoFrame);
  }

  // Image Upload Handler
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          const parsed = cleanParsedCode(code.data);
          setBatchCode(parsed);
          setSearchedBatch(parsed);
          toast.success(`Đã đọc thành công tem QR từ hình ảnh: ${parsed}`);
        } else {
          toast.error(
            "Không nhận diện được mã QR trong ảnh vừa chọn. Vui lòng chọn ảnh chụp rõ nét, góc thẳng hơn."
          );
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
  }

  // Live Supabase Traceability Data
  const [liveRecord, setLiveRecord] = useState<ApiTraceability | null>(null);

  useEffect(() => {
    let isCancelled = false;
    async function fetchRecord() {
      try {
        const res = await catalogService.getTraceabilityByBatch(searchedBatch);
        if (!isCancelled && res) {
          setLiveRecord(res);
        }
      } catch (err) {
        if (!isCancelled) setLiveRecord(null);
      }
    }
    fetchRecord();
    return () => {
      isCancelled = true;
    };
  }, [searchedBatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const base = sampleTraceabilityData[searchedBatch] || sampleTraceabilityData["XL-2026-08"];
  const currentData: TraceabilityData = liveRecord
    ? {
        productName: liveRecord.productName,
        batchCode: liveRecord.batchCode,
        qrImage: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=AGRITRACE-${liveRecord.batchCode}`,
        status: base.status || "Đã kiểm định & Đang phân phối",
        statusColor: base.statusColor || "bg-emerald-50 text-emerald-800 border-emerald-200",
        farm: {
          name: liveRecord.farmName || base.farm.name,
          location: liveRecord.location || base.farm.location,
          farmer: base.farm.farmer,
          farmerId: base.farm.farmerId,
          sowingDate: base.farm.sowingDate,
          harvestDate: liveRecord.harvestDate || base.farm.harvestDate,
          cert: liveRecord.certType || base.farm.cert,
          certExp: base.farm.certExp,
        },
        warehouse: base.warehouse,
        shipment: {
          ...base.shipment,
          containerTemp: liveRecord.tempAvg
            ? `${liveRecord.tempAvg} (Cảm biến IoT kiểm soát liên tục)`
            : base.shipment.containerTemp,
        },
        labTest: {
          ...base.labTest,
          agency: liveRecord.inspector || base.labTest.agency,
          overall: liveRecord.labResult || base.labTest.overall,
        },
      }
    : base;

  return (
    <div className="bg-[#f8faf8] min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-emerald-700 transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-800">Truy xuất nguồn gốc QR</span>
        </div>

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
              <QrCode className="text-emerald-700" size={28} />
              <span>Truy Xuất Nguồn Gốc Lô Nông Sản</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Quét mã QR trên tem bao bì hoặc nhập mã lô để tra cứu toàn diện nhật ký canh tác, kiểm định VietGAP và hành trình xe lạnh.
            </p>
          </div>
        </div>

        {/* ── Search & Scan Actions Bar ── */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-gray-200/90 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Input by code */}
            <div className="relative flex-1">
              <QrCode size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700" />
              <input
                type="text"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                placeholder="Nhập mã lô nông sản (Ví dụ: XL-2026-08, DT-MC-2026-11)..."
                className="w-full pl-10 pr-4 h-11 text-sm rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 font-medium"
              />
            </div>

            {/* Tra Cứu button */}
            <button
              onClick={() => setSearchedBatch(batchCode)}
              className="px-6 h-11 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
            >
              <Search size={16} />
              <span>Tra Cứu Lô Hàng</span>
            </button>

            {/* Nút 1: Mở Camera Quét Mã QR */}
            <button
              onClick={startCameraScanner}
              className="px-5 h-11 bg-emerald-950 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
            >
              <Camera size={16} className="text-emerald-400" />
              <span>Mở Camera Quét Mã QR</span>
            </button>

            {/* Nút 2: Tải Ảnh Tem QR Lên */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 h-11 bg-white border border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 text-gray-700 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0"
            >
              <Upload size={16} className="text-emerald-700" />
              <span>Tải Ảnh Tem QR</span>
            </button>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Quick Selection Pills (Lô Nông Sản Thu Hoạch Hôm Nay) */}
          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium flex items-center gap-1">
              <Calendar size={13} className="text-emerald-600" />
              Lô hàng thu hoạch kiểm định hôm nay:
            </span>

            {[
              { code: "XL-2026-08", name: "Xà lách thủy canh Đà Lạt" },
              { code: "DT-MC-2026-11", name: "Dâu tây giống Nhật Mộc Châu" },
              { code: "CS-BG-2026-03", name: "Cam sành Bố Hạ Bắc Giang" },
            ].map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setBatchCode(item.code);
                  setSearchedBatch(item.code);
                }}
                className={cn(
                  "px-3 py-1 rounded-lg border font-mono font-bold text-xs transition-colors",
                  searchedBatch === item.code
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                )}
              >
                {item.code} ({item.name})
              </button>
            ))}
          </div>
        </div>

        {/* ── Main Traceability Dossier Card ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/90 overflow-hidden space-y-6">
          {/* Top Banner with Real QR Code */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 z-10">
              <div className="inline-flex items-center gap-1.5 bg-white/15 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-xs border border-white/20">
                <CheckCircle2 size={13} /> Dữ liệu đã xác minh toàn diện từ chuỗi cung ứng
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {currentData.productName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-emerald-100">
                <span>
                  Mã Lô: <strong className="font-mono text-white text-base">#{currentData.batchCode}</strong>
                </span>
                <span>•</span>
                <span>
                  Trạng thái: <strong>{currentData.status}</strong>
                </span>
              </div>
            </div>

            {/* QR Code Container with Scan Label */}
            <div className="bg-white p-3.5 rounded-2xl shadow-xl flex flex-col items-center shrink-0 text-gray-900 z-10 self-start md:self-auto">
              <img src={currentData.qrImage} alt="QR Code" className="w-28 h-28 object-contain" />
              <span className="text-[10px] font-mono font-bold mt-1 text-emerald-800 flex items-center gap-1">
                <ShieldCheck size={11} /> Tem QR Hợp Lệ
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* ── BẢNG 1: BÁO CÁO KẾT QUẢ KIỂM NGHIỆM VSATTP ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <FileCheck size={18} className="text-emerald-700" />
                  <span>Kết Quả Kiểm Nghiệm Chất Lượng An Toàn Thực Phẩm</span>
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {currentData.labTest.overall}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
                <div className="text-xs text-gray-500 flex flex-wrap items-center justify-between gap-2">
                  <span>Cơ quan kiểm định: <strong className="text-gray-800">{currentData.labTest.agency}</strong></span>
                  <span>Ngày xét nghiệm: <strong>{currentData.labTest.testDate}</strong></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1">
                    <span className="text-gray-400 block text-[11px]">Tồn dư thuốc BVTV</span>
                    <strong className="text-emerald-700 block text-sm font-black">
                      {currentData.labTest.pesticide}
                    </strong>
                    <span className="text-[10px] text-gray-400">Âm tính tuyệt đối</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1">
                    <span className="text-gray-400 block text-[11px]">Hàm lượng Nitrat</span>
                    <strong className="text-emerald-700 block text-sm font-black">
                      {currentData.labTest.nitrate}
                    </strong>
                    <span className="text-[10px] text-gray-400">Ngưỡng cho phép</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1">
                    <span className="text-gray-400 block text-[11px]">Kim loại nặng (Pb, Cd)</span>
                    <strong className="text-emerald-700 block text-sm font-black">
                      {currentData.labTest.heavyMetals}
                    </strong>
                    <span className="text-[10px] text-gray-400">Không nhiễm độc</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1">
                    <span className="text-gray-400 block text-[11px]">Vi sinh vật (E.Coli)</span>
                    <strong className="text-emerald-700 block text-sm font-black">
                      {currentData.labTest.microbiology}
                    </strong>
                    <span className="text-[10px] text-gray-400">Đạt chuẩn y tế</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── BẢNG 2: HÀNH TRÌNH CHUỖI CUNG ỨNG MINH BẠCH ── */}
            <div className="space-y-4">
              <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-700" />
                <span>Hành Trình Chuỗi Cung Ứng Lạnh Minh Bạch</span>
              </h3>

              <div className="space-y-4">
                {/* Step 1: Nông Trại */}
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0 ring-4 ring-emerald-50">
                    1
                  </div>
                  <div className="flex-1 bg-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-100 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-emerald-700" />
                        <span>Sản Xuất Tại Nông Trại</span>
                      </h4>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {currentData.farm.cert}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-gray-800">{currentData.farm.name}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                      <div>Địa chỉ: <strong>{currentData.farm.location}</strong></div>
                      <div>Chủ hộ: <strong>{currentData.farm.farmer}</strong> (Mã: {currentData.farm.farmerId})</div>
                      <div>Ngày gieo trồng: <strong>{currentData.farm.sowingDate}</strong></div>
                      <div>Thời gian thu hoạch: <strong className="text-emerald-800">{currentData.farm.harvestDate}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Kho Lạnh FEFO */}
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm shrink-0 ring-4 ring-blue-50">
                    2
                  </div>
                  <div className="flex-1 bg-blue-50/40 p-4 sm:p-5 rounded-2xl border border-blue-100 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                        <Warehouse size={16} className="text-blue-700" />
                        <span>Nhập Kho & Bảo Quản (Tiêu Chuẩn FEFO)</span>
                      </h4>
                      <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                        FEFO Controlled
                      </span>
                    </div>

                    <p className="text-sm font-bold text-gray-800">{currentData.warehouse.warehouseName}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                      <div>Thủ kho kiểm tra: <strong>{currentData.warehouse.staff}</strong></div>
                      <div>Thời gian nhập kho: <strong>{currentData.warehouse.importDate}</strong></div>
                      <div>Nhiệt độ bảo quản: <strong className="text-blue-800">{currentData.warehouse.storageTemp}</strong> (Độ ẩm: {currentData.warehouse.humidity})</div>
                      <div>Hạn dùng tốt nhất: <strong className="text-blue-800">{currentData.warehouse.expiryDate}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Vận Chuyển Xe Lạnh */}
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm shrink-0 ring-4 ring-amber-50">
                    3
                  </div>
                  <div className="flex-1 bg-amber-50/40 p-4 sm:p-5 rounded-2xl border border-amber-100 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                        <Truck size={16} className="text-amber-700" />
                        <span>Vận Chuyển Bằng Xe Lạnh Chuyên Dụng</span>
                      </h4>
                      <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                        Cold Chain IoT
                      </span>
                    </div>

                    <p className="text-sm font-bold text-gray-800">{currentData.shipment.distributor}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                      <div>Tài xế phụ trách: <strong>{currentData.shipment.driver}</strong></div>
                      <div>Biển số xe lạnh: <strong>{currentData.shipment.plateNumber}</strong></div>
                      <div>Nhiệt độ thùng xe: <strong className="text-amber-800">{currentData.shipment.containerTemp}</strong></div>
                      <div>Trạng thái: <strong>{currentData.shipment.currentStatus}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-gray-400">
                Mã xác thực chuỗi cung ứng độc quyền AgriTrace System
              </span>

              <div className="flex items-center gap-2">
                <Link
                  href="/products"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors shadow-xs"
                >
                  Mua nông sản lô này →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: CAMERA QUÉT MÃ QR TRỰC TIẾP                        */}
      {/* ========================================================= */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-4 animate-scale-up relative">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Camera size={18} className="text-emerald-700" />
                <span>Quét Mã QR Bằng Máy Ảnh</span>
              </h3>
              <button
                onClick={stopCameraScanner}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-3 text-center">
                <ShieldAlert size={32} className="mx-auto text-red-600" />
                <p>{cameraError}</p>
                <button
                  onClick={() => {
                    stopCameraScanner();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold inline-flex items-center gap-1.5"
                >
                  <Upload size={14} /> Tải ảnh tem QR từ thiết bị
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Live Video Frame with Target Finder */}
                <div className="relative h-72 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />

                  {/* Finder Reticle Box */}
                  <div className="absolute w-52 h-52 border-2 border-emerald-400 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                    {/* Animated Scanning Laser Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse absolute top-1/2 -translate-y-1/2" />
                  </div>

                  {/* Off-screen canvas for frame processing */}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <p className="text-center text-xs text-gray-500">
                  Hướng camera vào tem mã QR in trên bao bì rau củ để hệ thống tự động nhận diện.
                </p>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      stopCameraScanner();
                      fileInputRef.current?.click();
                    }}
                    className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <Upload size={13} />
                    <span>Hoặc chọn ảnh tem QR</span>
                  </button>

                  <button
                    onClick={stopCameraScanner}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
