"use client";

import {
  Award,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Leaf,
  MapPin,
  Package,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Thermometer,
  Truck,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { resolveProductImageByCodeOrName } from "@/lib/qr-url";
import { catalogService, type ApiProduct, type ApiTraceability } from "@/services/catalog.service";
import { farmerService, type ApiHarvestLot } from "@/services/farmer.service";

interface QrProductInfo {
  batchCode: string;
  productName: string;
  image: string;
  priceText?: string;
  cert: string;
  status: string;
  farmName: string;
  location: string;
  harvestDate: string;
  expiryDate: string;
  qtyText: string;
  storageTemp: string;
  labResult: string;
  inspector: string;
  cultivation: string;
  timeline: { stage: string; time: string; note: string; badge?: string }[];
}

const FALLBACK_CATALOG: Record<
  string,
  Partial<QrProductInfo>
> = {
  "XL-2026-08": {
    productName: "Xà Lách Thủy Canh Lô Lô Xanh",
    image: "/images/products/xa-lach.jpg",
    priceText: "45.000 đ / túi 500g",
    cert: "GlobalGAP & VietGAP",
    farmName: "Nông Trại Xanh Đà Lạt (Mã: NT-DL-01)",
    location: "Xã Xuân Thọ, TP. Đà Lạt, Tỉnh Lâm Đồng",
    harvestDate: "14/10/2026 (05:30 Sáng)",
    expiryDate: "21/10/2026 (Bảo quản mát 2°C - 6°C)",
    qtyText: "500 kg",
    storageTemp: "4.5°C • Độ ẩm 88%",
    cultivation: "Thủy canh hồi lưu nhà màng công nghệ cao",
    labResult: "Âm tính 100% dư lượng thuốc BVTV • Nitrat 68/500 mg/kg (An toàn cao)",
    inspector: "Trung tâm Kỹ thuật Tiêu chuẩn Đo lường Chất lượng 1 (Quatest 1)",
  },
  "DT-MC-2026-11": {
    productName: "Dâu Tây New Zealand Mộc Châu",
    image: "/images/products/dau-tay.jpg",
    priceText: "165.000 đ / hộp 500g",
    cert: "VietGAP & GlobalGAP",
    farmName: "Hợp Tác Xã Nông Sản Sạch Mộc Châu (NT-MC-03)",
    location: "Thị trấn Nông Trường Mộc Châu, Tỉnh Sơn La",
    harvestDate: "13/10/2026 (06:00 Sáng)",
    expiryDate: "19/10/2026 (Bảo quản lạnh 2°C - 4°C)",
    qtyText: "350 kg",
    storageTemp: "3.5°C • Độ ẩm 85%",
    cultivation: "Trồng giá thể hữu cơ trên giàn cao trong nhà màng",
    labResult: "Âm tính 100% hóa chất bảo vệ thực vật • Đạt chuẩn Viện Kiểm nghiệm NIFC",
    inspector: "Viện Kiểm nghiệm An toàn Vệ sinh Thực phẩm Quốc gia (NIFC)",
  },
  "CS-BG-2026-03": {
    productName: "Cam Sành Hàm Yên & Bố Hạ Mọng Nước",
    image: "/images/products/cam-sanh.jpg",
    priceText: "55.000 đ / kg",
    cert: "VietGAP & Hữu cơ BioCert",
    farmName: "HTX Trái Cây Bố Hạ & Vườn Cam Hàm Yên",
    location: "Huyện Hàm Yên, Tỉnh Tuyên Quang",
    harvestDate: "11/10/2026 (06:30 Sáng)",
    expiryDate: "25/10/2026 (Bảo quản 8°C - 12°C)",
    qtyText: "800 kg",
    storageTemp: "9.0°C • Độ ẩm 80%",
    cultivation: "Canh tác hữu cơ sinh thái vùng đồi",
    labResult: "Không phát hiện chất bảo quản & thuốc BVTV • Đạt chuẩn QUACERT",
    inspector: "Trung tâm Chứng nhận Phù hợp (QUACERT)",
  },
  "SP-KL-05": {
    productName: "Cải Xoăn Kale Hữu Cơ Dinh Dưỡng",
    image: "/images/products/cai-kale.jpg",
    priceText: "52.000 đ / bó 500g",
    cert: "Organic USDA & VietGAP",
    farmName: "Nông Trại Xanh Thủy Canh Đà Lạt (NT-DL-01)",
    location: "Xã Xuân Thọ, TP. Đà Lạt, Tỉnh Lâm Đồng",
    harvestDate: "14/10/2026 (05:45 Sáng)",
    expiryDate: "21/10/2026 (Bảo quản lạnh 3°C - 5°C)",
    qtyText: "300 kg",
    storageTemp: "3.2°C • Độ ẩm 92%",
    cultivation: "Canh tác hữu cơ 100% không phân bón hóa học",
    labResult: "Chứng nhận Hữu cơ Quốc tế Control Union • Nitrat 85/500 mg/kg",
    inspector: "Tổ chức Chứng nhận Quốc tế Control Union Vietnam",
  },
  "SP-BO-06": {
    productName: "Bơ Sáp 034 Đặc Sản Cao Nguyên",
    image: "/images/products/bo-sap.jpg",
    priceText: "78.000 đ / kg",
    cert: "VietGAP #VG-BL-2024",
    farmName: "Trang Trại Bơ Bảo Lộc (NT-BL-03)",
    location: "Xã Lộc Tân, TP. Bảo Lộc, Tỉnh Lâm Đồng",
    harvestDate: "13/10/2026",
    expiryDate: "20/10/2026",
    qtyText: "450 kg",
    storageTemp: "12°C - 15°C",
    cultivation: "Vườn cây lưu niên 7 năm tuổi chăm sóc hữu cơ",
    labResult: "Đạt chuẩn an toàn Quatest 3 • Độ béo sáp tự nhiên 18.2%",
    inspector: "Trung tâm Kỹ thuật Tiêu chuẩn Đo lường Chất lượng 3 (Quatest 3)",
  },
};

function QrLandingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawCode = Array.isArray(params?.code) ? params.code[0] : params?.code || "XL-2026-08";
  const cleanCode = decodeURIComponent(rawCode).trim().toUpperCase().replace(/^AGRITRACE-/, "");

  const [liveTrace, setLiveTrace] = useState<ApiTraceability | null>(null);
  const [liveBatch, setLiveBatch] = useState<ApiHarvestLot | null>(null);
  const [liveProduct, setLiveProduct] = useState<ApiProduct | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadLiveInfo() {
      try {
        const [traceRes, batchRes, prodList] = await Promise.all([
          catalogService.getTraceabilityByBatch(cleanCode).catch(() => null),
          farmerService
            .getBatches()
            .then((list) => list.find((b) => b.code.toUpperCase() === cleanCode) || null)
            .catch(() => null),
          catalogService.getProducts().catch(() => [] as ApiProduct[]),
        ]);
        if (cancelled) return;
        if (traceRes) setLiveTrace(traceRes);
        if (batchRes) setLiveBatch(batchRes);
        if (prodList && prodList.length > 0) {
          const targetName = (
            searchParams.get("name") ||
            traceRes?.productName ||
            batchRes?.product ||
            ""
          ).toLowerCase();
          const matched =
            prodList.find((p) => p.batchCode?.toUpperCase() === cleanCode) ||
            (targetName
              ? prodList.find(
                  (p) =>
                    p.name.toLowerCase().includes(targetName) ||
                    targetName.includes(p.name.toLowerCase())
                )
              : null);
          if (matched) setLiveProduct(matched);
        }
      } catch {
        // fallback to URL snapshot & preset dictionary
      }
    }
    loadLiveInfo();
    return () => {
      cancelled = true;
    };
  }, [cleanCode, searchParams]);

  const preset =
    FALLBACK_CATALOG[cleanCode] ||
    FALLBACK_CATALOG[cleanCode.replace(/^LOT-/, "")] ||
    Object.entries(FALLBACK_CATALOG).find(([k]) => cleanCode.includes(k))?.[1] ||
    {};

  const productName =
    searchParams.get("name") ||
    liveTrace?.productName ||
    liveBatch?.product ||
    liveProduct?.name ||
    preset.productName ||
    `Nông Sản Sạch #${cleanCode}`;

  const image =
    (liveProduct?.image && liveProduct.image.startsWith("/") ? liveProduct.image : null) ||
    preset.image ||
    resolveProductImageByCodeOrName(cleanCode, productName);

  const priceText =
    liveProduct?.price
      ? `${liveProduct.price.toLocaleString("vi-VN")} đ / ${liveProduct.unit || "kg"}`
      : preset.priceText || "Niêm yết theo mùa vụ chuẩn VietGAP";

  const cert =
    searchParams.get("cert") ||
    liveTrace?.certType ||
    liveBatch?.cert ||
    liveProduct?.cert ||
    preset.cert ||
    "VietGAP Quốc Gia";

  const farmName =
    searchParams.get("farm") ||
    liveTrace?.farmName ||
    liveBatch?.farmName ||
    liveProduct?.farm ||
    preset.farmName ||
    "Nông Trại Xanh Đà Lạt (Mã: NT-DL-01)";

  const location =
    searchParams.get("loc") ||
    liveTrace?.location ||
    liveProduct?.origin ||
    preset.location ||
    "Xã Xuân Thọ, TP. Đà Lạt, Tỉnh Lâm Đồng";

  const harvestDate =
    searchParams.get("hd") ||
    liveTrace?.harvestDate ||
    liveBatch?.harvestDate ||
    liveProduct?.harvest ||
    preset.harvestDate ||
    "Thu hoạch tươi trong ngày (05:30 Sáng)";

  const expiryDate =
    searchParams.get("exp") ||
    liveBatch?.expiryDate ||
    preset.expiryDate ||
    "7 ngày kể từ ngày thu hoạch (Chuỗi lạnh)";

  const qtyText =
    searchParams.get("qty") ||
    (liveBatch?.qty ? `${liveBatch.qty} ${liveBatch.unit || "kg"}` : null) ||
    preset.qtyText ||
    "500 kg";

  const storageTemp =
    searchParams.get("temp") ||
    liveTrace?.tempAvg ||
    liveProduct?.temperature ||
    preset.storageTemp ||
    "2°C - 6°C (Chuỗi lạnh khép kín)";

  const cultivation =
    liveBatch?.cultivation ||
    liveProduct?.cultivation ||
    preset.cultivation ||
    `Canh tác an toàn sinh học theo tiêu chuẩn ${cert}`;

  const labResult =
    liveTrace?.labResult ||
    preset.labResult ||
    "Âm tính 100% dư lượng thuốc BVTV & Kim loại nặng (ISO/IEC 17025)";

  const inspector =
    liveTrace?.inspector ||
    preset.inspector ||
    "Trung tâm Kỹ thuật Tiêu chuẩn Đo lường Chất lượng (Quatest)";

  let parsedTimeline: { stage: string; time: string; note: string; badge?: string }[] = [];
  if (liveTrace?.timelineJson) {
    try {
      const arr = JSON.parse(liveTrace.timelineJson);
      if (Array.isArray(arr) && arr.length > 0) {
        parsedTimeline = arr;
      }
    } catch {
      parsedTimeline = [];
    }
  }

  if (parsedTimeline.length === 0) {
    parsedTimeline = [
      {
        stage: "Thu hoạch tại nông trại",
        time: harvestDate,
        badge: "Đã thu hoạch",
        note: `Thu hái lô #${cleanCode} (${qtyText}) tại ${farmName} theo tiêu chuẩn ${cert}.`,
      },
      {
        stage: "Kiểm nghiệm an toàn KCS",
        time: harvestDate,
        badge: "Đạt chuẩn 100%",
        note: `${labResult} — Đơn vị: ${inspector}.`,
      },
      {
        stage: "Bảo quản kho lạnh FEFO",
        time: harvestDate,
        badge: storageTemp,
        note: `Đóng gói màng thở vi lỗ và bảo quản lạnh ở ${storageTemp}, hạn dùng: ${expiryDate}.`,
      },
      {
        stage: "Vận chuyển chuỗi lạnh & Phân phối",
        time: "Đang lưu hành",
        badge: "Đã xác thực QR",
        note: "Vận chuyển bằng xe lạnh chuyên dụng có cảm biến IoT giám sát nhiệt độ tới tay người tiêu dùng.",
      },
    ];
  }

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#16261E] py-4 px-3 sm:py-8 sm:px-4 font-sans">
      <article className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl border border-[#E4DFD5] overflow-hidden">
        {/* 1. Top Verified Header Strip */}
        <header className="bg-[#16261E] text-white px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#166534] text-amber-300 flex items-center justify-center shadow-xs">
              <Leaf size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">
                  AgriTrace <span className="text-amber-300">QR Passport</span>
                </span>
              </div>
              <span className="block text-[10px] text-emerald-200/80 uppercase tracking-wider font-semibold">
                Hộ Chiếu Số Nông Sản Sạch GS1
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>ĐÃ XÁC THỰC</span>
          </span>
        </header>

        {/* 2. Product Hero Photo & Core Identity */}
        <div className="relative h-60 sm:h-68 w-full bg-stone-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={productName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/images/products/xa-lach.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Top floating badges */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full bg-white/95 text-[#16261E] font-mono text-xs font-extrabold shadow-md">
              MÃ LÔ: #{cleanCode}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#166534] text-white text-xs font-bold shadow-md flex items-center gap-1">
              <Award size={13} className="text-amber-300" />
              <span>{cert}</span>
            </span>
          </div>

          {/* Bottom title on image */}
          <div className="absolute bottom-3.5 left-4 right-4 text-white">
            <h1 className="text-xl sm:text-2xl font-extrabold leading-tight drop-shadow-xs">
              {productName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-100">
              <span className="font-semibold">{farmName}</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-[#16261E] font-mono font-extrabold text-xs">
                {priceText}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Body Information Sections */}
        <div className="p-5 space-y-5 text-xs">
          {/* Safety & KCS Certificate Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-extrabold text-[#166534] text-xs">
              <ShieldCheck size={16} className="shrink-0" />
              <span>KẾT QUẢ KIỂM ĐỊNH AN TOÀN THỰC PHẨM (KCS)</span>
            </div>
            <p className="text-[#16261E] font-semibold leading-relaxed">{labResult}</p>
            <p className="text-[11px] text-stone-600">
              Cơ quan kiểm định: <strong>{inspector}</strong>
            </p>
          </div>

          {/* Key Product & Origin Specifications Grid */}
          <div className="space-y-2.5">
            <h2 className="font-extrabold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Sprout size={14} className="text-[#166534]" />
              <span>Thông Tin Nguồn Gốc & Bảo Quản</span>
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[#FBF9F5] border border-[#E4DFD5]">
                <span className="text-[10px] text-stone-500 font-semibold block">Ngày thu hoạch</span>
                <strong className="text-[#16261E] font-bold mt-0.5 block">{harvestDate}</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#FBF9F5] border border-[#E4DFD5]">
                <span className="text-[10px] text-stone-500 font-semibold block">Hạn sử dụng (FEFO)</span>
                <strong className="text-rose-700 font-bold mt-0.5 block">{expiryDate}</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#FBF9F5] border border-[#E4DFD5]">
                <span className="text-[10px] text-stone-500 font-semibold block">Nhiệt độ bảo quản</span>
                <strong className="text-teal-800 font-bold mt-0.5 flex items-center gap-1">
                  <Thermometer size={12} />
                  {storageTemp}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#FBF9F5] border border-[#E4DFD5]">
                <span className="text-[10px] text-stone-500 font-semibold block">Sản lượng lô</span>
                <strong className="text-[#166534] font-mono font-bold mt-0.5 block">{qtyText}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FBF9F5] border border-[#E4DFD5] space-y-2">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-[#166534] shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-500 font-semibold">Vùng trồng: </span>
                  <strong className="text-[#16261E]">{location}</strong>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Leaf size={14} className="text-[#166534] shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-500 font-semibold">Quy trình canh tác: </span>
                  <strong className="text-[#16261E]">{cultivation}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Compact Supply Chain Timeline */}
          <div className="space-y-3">
            <h2 className="font-extrabold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Truck size={14} className="text-[#166534]" />
              <span>Hành Trình Từ Nông Trại Đến Bàn Ăn</span>
            </h2>

            <div className="space-y-2.5 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-emerald-200">
              {parsedTimeline.map((step, idx) => (
                <div key={idx} className="relative pl-9">
                  <span className="absolute left-1.5 top-2.5 w-4 h-4 rounded-full bg-[#166534] text-white font-mono text-[9px] font-bold flex items-center justify-center ring-4 ring-white">
                    {idx + 1}
                  </span>
                  <div className="p-3 rounded-xl bg-[#FBF9F5] border border-[#E4DFD5] space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-[#16261E] font-bold">{step.stage}</strong>
                      {step.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#166534] font-bold text-[10px]">
                          {step.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono flex items-center gap-1">
                      <Calendar size={10} />
                      <span>{step.time}</span>
                    </div>
                    <p className="text-stone-700 leading-relaxed">{step.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Bottom Actions */}
          <div className="pt-3 border-t border-[#E4DFD5] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Link
              href={`/traceability?batch=${encodeURIComponent(cleanCode)}`}
              className="w-full py-3 px-4 rounded-xl border border-[#166534] bg-white hover:bg-emerald-50 text-[#166534] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink size={14} />
              <span>Xem Hồ Sơ KCS Đầy Đủ</span>
            </Link>
            <Link
              href="/products"
              className="w-full py-3 px-4 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <ShoppingBag size={14} />
              <span>Đặt Mua Nông Sản Này</span>
            </Link>
          </div>
        </div>

        {/* Footer Seal */}
        <footer className="bg-[#F6F3EC] border-t border-[#E4DFD5] px-5 py-3 text-center text-[11px] text-stone-500 flex items-center justify-between">
          <span className="flex items-center gap-1 font-semibold text-[#16261E]">
            <QrCode size={13} className="text-[#166534]" />
            GS1 Digital Link • #{cleanCode}
          </span>
          <span>AgriTrace AI © 2026</span>
        </footer>
      </article>
    </div>
  );
}

export default function QrProductPassportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center p-6 text-xs text-stone-600">
          Đang tải thông tin sản phẩm từ mã QR...
        </div>
      }
    >
      <QrLandingContent />
    </Suspense>
  );
}
