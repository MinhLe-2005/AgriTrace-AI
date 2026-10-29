"use client";

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  History,
  MapPin,
  PackageCheck,
  QrCode,
  Settings,
  Thermometer,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { distributorService } from "@/services/distributor.service";
import { toast } from "@/stores/toast-store";

export default function DistributorPortalPage() {
  const [shipments] = useState([
    {
      code: "SHIP-9021",
      driver: "Lê Hoàng Long",
      truckPlate: "49C-184.92",
      from: "Kho Tân Bình, TP.HCM",
      to: "Siêu thị WinMart+ Quận 1",
      items: "240 kg Xà lách thủy canh (XL-2026-08)",
      temp: "5.2°C (Bảo quản lạnh)",
      status: "Đang vận chuyển",
      statusColor: "#f59e0b",
      eta: "15:30 Hôm nay",
    },
    {
      code: "SHIP-9018",
      driver: "Vũ Văn Cường",
      truckPlate: "29H-883.12",
      from: "Kho KCN Đài Tư, Hà Nội",
      to: "Chuỗi Cửa Hàng Bác Tôm",
      items: "180 hộp Dâu tây Mộc Châu",
      temp: "3.5°C (Tủ mát)",
      status: "Đã giao thành công",
      statusColor: "#10b981",
      eta: "Hoàn tất lúc 11:20",
    },
  ]);

  const activeShipmentCount = shipments.filter((shipment) => shipment.status === "Đang vận chuyển").length;
  const completedShipmentCount = shipments.filter((shipment) => shipment.status === "Đã giao thành công").length;
  const [dashboardStats, setDashboardStats] = useState({
    activeShipments: activeShipmentCount,
    preparingShipments: 0,
    deliveredToday: completedShipmentCount,
    pendingReceipts: 1,
  });

  useEffect(() => {
    distributorService.getDashboard().then(setDashboardStats).catch(() => undefined);
  }, []);

  return (
    <div className="space-y-6">
      {/* Module Banner */}
      <div className="bg-amber-950 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm border border-amber-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-800 flex items-center justify-center text-white">
            <Truck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Cổng Nhà Phân Phối & Vận Chuyển (Distributor)</h1>
              <span className="text-[11px] bg-amber-500/30 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-400/30">
                Logistics & Chuỗi Lạnh IoT
              </span>
            </div>
            <p className="text-xs text-amber-200/80">
              Điều phối xe thùng lạnh, giám sát cảm biến nhiệt độ hành trình và quét mã QR bàn giao lô hàng
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/distributor/receive"
          onClick={() => toast.success("Mở màn hình quét QR tiếp nhận hàng...")}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
        >
          <QrCode size={15} /> Quét QR Bàn Giao Hàng
        </Link>
      </div>

      {/* Tổng quan nghiệp vụ Distributor - bổ sung, giữ nguyên phần danh sách chuyến cũ bên dưới */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link href="/dashboard/distributor/orders" className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs hover:border-amber-200 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between"><div><p className="text-[10px] uppercase font-bold tracking-wide text-gray-400">Đơn cần theo dõi</p><p className="text-2xl font-extrabold text-gray-900 mt-1">{shipments.length}</p><p className="text-[11px] text-gray-500 mt-1">Danh sách đơn phân phối</p></div><span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center"><ClipboardList size={18} /></span></div>
        </Link>
        <Link href="/dashboard/distributor/shipments" className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs hover:border-amber-200 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between"><div><p className="text-[10px] uppercase font-bold tracking-wide text-gray-400">Đang vận chuyển</p><p className="text-2xl font-extrabold text-gray-900 mt-1">{dashboardStats.activeShipments}</p><p className="text-[11px] text-gray-500 mt-1">Xe lạnh đang trên lộ trình</p></div><span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center"><Truck size={18} /></span></div>
        </Link>
        <Link href="/dashboard/distributor/history" className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs hover:border-amber-200 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between"><div><p className="text-[10px] uppercase font-bold tracking-wide text-gray-400">Đã giao hôm nay</p><p className="text-2xl font-extrabold text-gray-900 mt-1">{dashboardStats.deliveredToday}</p><p className="text-[11px] text-gray-500 mt-1">Xem lịch sử vận chuyển</p></div><span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center"><CheckCircle2 size={18} /></span></div>
        </Link>
        <Link href="/dashboard/distributor/receive" className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs hover:border-amber-200 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between"><div><p className="text-[10px] uppercase font-bold tracking-wide text-gray-400">Tiếp nhận QR</p><p className="text-2xl font-extrabold text-gray-900 mt-1">{dashboardStats.pendingReceipts}</p><p className="text-[11px] text-gray-500 mt-1">Chuyến chờ xác nhận</p></div><span className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center"><PackageCheck size={18} /></span></div>
        </Link>
      </div>

      {/* Shipment Orders */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Truck size={18} className="text-amber-700" />
            Lộ Trình & Đơn Vận Chuyển Đang Xử Lý
          </h3>
          <span className="text-xs text-gray-400">Kiểm soát nhiệt độ thùng xe liên tục</span>
        </div>

        <div className="divide-y divide-gray-100">
          {shipments.map((sh) => (
            <div key={sh.code} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/70">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-amber-900">{sh.code}</span>
                  <span
                    style={{ backgroundColor: sh.statusColor }}
                    className="text-[10px] text-white font-bold px-2 py-0.5 rounded"
                  >
                    {sh.status}
                  </span>
                  <span className="text-xs text-gray-500">Biển số: <strong className="text-gray-800">{sh.truckPlate}</strong> ({sh.driver})</span>
                </div>

                <div className="text-xs text-gray-700 font-semibold">{sh.items}</div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-amber-600" /> {sh.from} → {sh.to}
                  </span>
                  <span className="flex items-center gap-1 text-blue-700 font-semibold">
                    <Thermometer size={13} /> {sh.temp}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {sh.eta}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success(`Đã cập nhật trạng thái đơn [${sh.code}]!`)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Cập Nhật Giao Hàng
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-gray-500 mr-1">Truy cập nhanh:</span>
        <Link href="/dashboard/distributor/shipments" className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold hover:border-amber-300 hover:text-amber-800">Quản lý chuyến</Link>
        <Link href="/dashboard/distributor/history" className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold hover:border-amber-300 hover:text-amber-800 inline-flex items-center gap-1"><History size={13} /> Lịch sử</Link>
        <Link href="/dashboard/distributor/settings" className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold hover:border-amber-300 hover:text-amber-800 inline-flex items-center gap-1"><Settings size={13} /> Cài đặt</Link>
      </div>
    </div>
  );
}
