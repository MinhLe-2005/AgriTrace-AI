"use client";

import {
  Award,
  Calendar,
  CheckCircle2,
  FileCheck,
  MapPin,
  Package,
  QrCode,
  Search,
  ShieldCheck,
  Thermometer,
  Truck,
  UserCheck,
  Warehouse,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function TraceabilityPage() {
  const searchParams = useSearchParams();
  const initialBatch = searchParams.get("batch") || "XL-2026-08";
  const [batchCode, setBatchCode] = useState(initialBatch);
  const [searchedBatch, setSearchedBatch] = useState(initialBatch);

  const sampleTraceabilityData: Record<string, any> = {
    "XL-2026-08": {
      productName: "Xà Lách Thủy Canh Lô Lô Xanh",
      batchCode: "XL-2026-08",
      qrImage: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=AGRITRACE-XL-2026-08",
      status: "Đã kiểm định & Đang phân phối",
      farm: {
        name: "Nông Trại Xanh Đà Lạt (Farm ID: NT-DL-01)",
        location: "Xã Xuân Thọ, TP. Đà Lạt, Tỉnh Lâm Đồng",
        farmer: "Nguyễn Văn Hùng (Mã: FM-104)",
        sowingDate: "28/08/2026",
        harvestDate: "14/10/2026 (05:30 Sáng)",
        cert: "GlobalGAP #GG-VN-2024-910 (Hiệu lực: 2027)",
      },
      warehouse: {
        warehouseName: "Tổng Kho Trung Chuyển Miền Nam - KCN Tân Bình",
        staff: "Trần Thị Mai (Kho 02)",
        importDate: "14/10/2026 (11:15 Trưa)",
        expiryDate: "18/10/2026 (FEFO: Ưu tiên xuất kho trong 4 ngày)",
        storageTemp: "4°C - 6°C (Độ ẩm 90%)",
        condition: "Đạt chuẩn bảo quản lạnh rau ăn lá",
      },
      shipment: {
        distributor: "Công ty Vận Tải Nông Sản Xanh Express",
        driver: "Lê Hoàng Long (Biển số: 49C-184.92)",
        departTime: "14/10/2026 (14:00)",
        currentStatus: "Đang vận chuyển đến điểm phân phối Quận 1, TP.HCM",
        containerTemp: "5.2°C (Cảm biến IoT kiểm soát liên tục)",
      },
    },
    "DT-MC-2026-11": {
      productName: "Dâu Tây Giống Nhật Mộc Châu",
      batchCode: "DT-MC-2026-11",
      qrImage: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=AGRITRACE-DT-MC-2026-11",
      status: "Đã nhập kho lạnh trung tâm",
      farm: {
        name: "Hợp tác xã Nông nghiệp Mộc Châu Eco",
        location: "Thị trấn Nông Trường, Huyện Mộc Châu, Sơn La",
        farmer: "Hoàng Văn Tuấn",
        sowingDate: "15/07/2026",
        harvestDate: "13/10/2026",
        cert: "VietGAP #VG-SL-2025-442",
      },
      warehouse: {
        warehouseName: "Kho Lạnh Hà Nội - KCN Đài Tư",
        staff: "Nguyễn Minh Đức",
        importDate: "13/10/2026 (22:30)",
        expiryDate: "19/10/2026 (FEFO: Còn 6 ngày)",
        storageTemp: "2°C - 4°C",
        condition: "Hút ẩm và đóng khay màng thở",
      },
      shipment: {
        distributor: "Vận tải Bắc Nam Fresh",
        driver: "Vũ Văn Cường (Xe lạnh 29H-883.12)",
        departTime: "14/10/2026 (06:00)",
        currentStatus: "Hoàn tất bàn giao siêu thị",
        containerTemp: "3.5°C",
      },
    },
  };

  const currentData = sampleTraceabilityData[searchedBatch] || sampleTraceabilityData["XL-2026-08"];

  return (
    <div className="bg-[#f8faf8] min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Module Header */}
        <div className="mb-6 bg-emerald-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm border border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center text-emerald-200">
              <QrCode size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">Hệ Thống Truy Xuất Nguồn Gốc QR Code</h1>
                <span className="text-[11px] bg-emerald-500/30 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Module 3 & 5 (ZXing Library)
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Phụ trách: Member 3 (Kho hàng & FEFO) & Member 5 (QR Traceability & Vận chuyển)
              </p>
            </div>
          </div>
        </div>

        {/* QR Scanner / Search Box */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/80 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <QrCode size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700" />
              <input
                type="text"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                placeholder="Nhập mã lô hàng (Ví dụ: XL-2026-08, DT-MC-2026-11)..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#1a7a3a] focus:ring-1 focus:ring-[#1a7a3a]"
              />
            </div>
            <button
              onClick={() => setSearchedBatch(batchCode)}
              className="px-6 py-2.5 bg-[#1a7a3a] hover:bg-[#156e34] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Search size={16} /> Tra Cứu Lô Nông Sản
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span>Gợi ý mã thử nghiệm:</span>
            <button
              onClick={() => { setBatchCode("XL-2026-08"); setSearchedBatch("XL-2026-08"); }}
              className="underline hover:text-emerald-700 font-mono"
            >
              XL-2026-08 (Xà lách)
            </button>
            <span>•</span>
            <button
              onClick={() => { setBatchCode("DT-MC-2026-11"); setSearchedBatch("DT-MC-2026-11"); }}
              className="underline hover:text-emerald-700 font-mono"
            >
              DT-MC-2026-11 (Dâu tây)
            </button>
          </div>
        </div>

        {/* Result Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {/* Top Banner with QR Image */}
          <div className="p-6 bg-gradient-to-r from-emerald-800 to-[#105327] text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-700/80 text-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
                <CheckCircle2 size={13} /> Dữ liệu đã xác minh toàn diện
              </div>
              <h2 className="text-2xl font-bold">{currentData.productName}</h2>
              <div className="mt-1 text-sm text-emerald-100 flex items-center gap-3">
                <span>Mã Lô: <strong className="font-mono text-white">{currentData.batchCode}</strong></span>
                <span>•</span>
                <span>Trạng thái: <strong>{currentData.status}</strong></span>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-3 rounded-xl shadow-lg flex flex-col items-center flex-shrink-0 text-gray-800">
              <img src={currentData.qrImage} alt="QR Code" className="w-28 h-28" />
              <span className="text-[10px] font-mono font-bold mt-1 text-gray-600">Quét để truy xuất</span>
            </div>
          </div>

          {/* Traceability 4-Step Journey Timeline */}
          <div className="p-6 md:p-8 space-y-8">
            <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#1a7a3a]" />
              Hành Trình Chuỗi Cung Ứng Minh Bạch
            </h3>

            {/* Step 1: Farm */}
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#1a7a3a] flex items-center justify-center font-bold text-sm flex-shrink-0 ring-4 ring-emerald-50">
                1
              </div>
              <div className="flex-1 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-700" />
                    Sản Xuất Tại Nông Trại
                  </h4>
                  <span className="text-xs bg-emerald-100 text-[#1a7a3a] font-semibold px-2 py-0.5 rounded">
                    {currentData.farm.cert}
                  </span>
                </div>
                <p className="text-sm text-gray-700 font-medium">{currentData.farm.name}</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Địa chỉ: {currentData.farm.location}</div>
                  <div>Chủ hộ canh tác: {currentData.farm.farmer}</div>
                  <div>Ngày gieo trồng: {currentData.farm.sowingDate}</div>
                  <div>Ngày thu hoạch: <strong>{currentData.farm.harvestDate}</strong></div>
                </div>
              </div>
            </div>

            {/* Step 2: Warehouse & FEFO */}
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0 ring-4 ring-blue-50">
                2
              </div>
              <div className="flex-1 bg-blue-50/40 p-4 rounded-xl border border-blue-100">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Warehouse size={16} className="text-blue-700" />
                    Nhập Kho & Bảo Quản (Tiêu chuẩn FEFO)
                  </h4>
                  <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                    FEFO Applied
                  </span>
                </div>
                <p className="text-sm text-gray-700 font-medium">{currentData.warehouse.warehouseName}</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Thủ kho kiểm định: {currentData.warehouse.staff}</div>
                  <div>Thời gian nhập kho: {currentData.warehouse.importDate}</div>
                  <div>Nhiệt độ bảo quản: {currentData.warehouse.storageTemp}</div>
                  <div>Hạn sử dụng: <strong className="text-blue-700">{currentData.warehouse.expiryDate}</strong></div>
                </div>
              </div>
            </div>

            {/* Step 3: Transportation */}
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm flex-shrink-0 ring-4 ring-amber-50">
                3
              </div>
              <div className="flex-1 bg-amber-50/40 p-4 rounded-xl border border-amber-100">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Truck size={16} className="text-amber-700" />
                    Vận Chuyển & Chuỗi Lạnh
                  </h4>
                  <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                    Cold Chain Monitored
                  </span>
                </div>
                <p className="text-sm text-gray-700 font-medium">{currentData.shipment.distributor}</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Tài xế phụ trách: {currentData.shipment.driver}</div>
                  <div>Thời gian xuất phát: {currentData.shipment.departTime}</div>
                  <div>Nhiệt độ thùng xe: <strong className="text-amber-700">{currentData.shipment.containerTemp}</strong></div>
                  <div>Hiện trạng: {currentData.shipment.currentStatus}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
