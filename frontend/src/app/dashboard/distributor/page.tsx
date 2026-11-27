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
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShipmentStatusBadge,
  shipmentDate,
  shipmentTemperature,
} from "@/components/distributor/distributor-ui";
import { subscribeToDistributorChanges } from "@/features/distributor/realtime";
import type {
  DistributorDashboardStats,
  DistributorShipment,
} from "@/features/distributor/types";
import { distributorService } from "@/services/distributor.service";
import { toast } from "@/stores/toast-store";

const emptyStats: DistributorDashboardStats = {
  activeShipments: 0,
  preparingShipments: 0,
  deliveredToday: 0,
  pendingReceipts: 0,
};

export default function DistributorPortalPage() {
  const [shipments, setShipments] = useState<DistributorShipment[]>([]);
  const [dashboardStats, setDashboardStats] =
    useState<DistributorDashboardStats>(emptyStats);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const refreshDashboard = useCallback(async () => {
    try {
      const [stats, latestShipments] = await Promise.all([
        distributorService.getDashboard(),
        distributorService.getShipments(),
      ]);
      setDashboardStats(stats);
      setShipments(latestShipments);
      setLastSyncedAt(new Date());
    } catch {
      // Retain the last server-confirmed values while a temporary connection issue resolves.
    }
  }, []);

  useEffect(() => {
    void refreshDashboard();
    const unsubscribe = subscribeToDistributorChanges(refreshDashboard);
    const safetyRefresh = window.setInterval(
      () => void refreshDashboard(),
      30_000
    );
    return () => {
      unsubscribe();
      window.clearInterval(safetyRefresh);
    };
  }, [refreshDashboard]);

  const activeShipments = useMemo(
    () =>
      shipments.filter(
        (shipment) => !["RECEIVED", "CANCELLED"].includes(shipment.status)
      ),
    [shipments]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#243B2E] bg-gradient-to-r from-[#16261E] via-[#1B3326] to-[#16261E] p-6 text-white shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/20 border border-amber-300/30 text-amber-300">
            <Truck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-lg sm:text-xl font-bold">
                Cổng Nhà Phân Phối & Vận Chuyển (Distributor)
              </h1>
              <span className="rounded-full border border-amber-300/30 bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-mono font-bold text-amber-300">
                Logistics & Chuỗi Lạnh IoT
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Điều phối xe thùng lạnh, giám sát cảm biến nhiệt độ hành trình và
              quét mã QR bàn giao lô hàng
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/distributor/receive"
          onClick={() => toast.success("Mở màn hình quét QR tiếp nhận hàng...")}
          className="flex items-center gap-1.5 rounded-xl bg-amber-300 px-4 py-2.5 text-xs font-bold text-[#16261E] shadow-sm transition-all hover:bg-amber-200"
        >
          <QrCode size={15} /> Quét QR Bàn Giao Hàng
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/dashboard/distributor/orders"
          className="bento-card p-4 transition-all hover:border-[#166534]"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wide text-stone-500">
                Đơn chờ điều phối
              </p>
              <p className="mt-1 text-2xl font-mono font-extrabold text-[#16261E]">
                {dashboardStats.pendingDeliveryOrders ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-stone-500">
                Dữ liệu từ hệ thống đơn hàng
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-800">
              <ClipboardList size={18} />
            </span>
          </div>
        </Link>
        <Link
          href="/dashboard/distributor/shipments"
          className="bento-card p-4 transition-all hover:border-[#166534]"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wide text-stone-500">
                Đang vận chuyển
              </p>
              <p className="mt-1 text-2xl font-mono font-extrabold text-[#16261E]">
                {dashboardStats.activeShipments}
              </p>
              <p className="mt-1 text-[11px] text-stone-500">
                Xe lạnh đang trên lộ trình
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E4DFD5] bg-[#F6F3EC] text-[#16261E]">
              <Truck size={18} />
            </span>
          </div>
        </Link>
        <Link
          href="/dashboard/distributor/history"
          className="bento-card p-4 transition-all hover:border-[#166534]"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wide text-stone-500">
                Đã giao hôm nay
              </p>
              <p className="mt-1 text-2xl font-mono font-extrabold text-[#166534]">
                {dashboardStats.deliveredToday}
              </p>
              <p className="mt-1 text-[11px] text-stone-500">
                Xem lịch sử vận chuyển
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-[#166534]">
              <CheckCircle2 size={18} />
            </span>
          </div>
        </Link>
        <Link
          href="/dashboard/distributor/receive"
          className="bento-card p-4 transition-all hover:border-[#166534]"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wide text-stone-500">
                Tiếp nhận QR
              </p>
              <p className="mt-1 text-2xl font-mono font-extrabold text-[#16261E]">
                {dashboardStats.pendingReceipts}
              </p>
              <p className="mt-1 text-[11px] text-stone-500">
                Chuyến chờ xác nhận
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E4DFD5] bg-[#F6F3EC] text-[#16261E]">
              <PackageCheck size={18} />
            </span>
          </div>
        </Link>
      </div>

      <div className="bento-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0ECE1] p-4 bg-[#FBF9F5]">
          <h3 className="font-serif flex items-center gap-2 text-sm font-bold text-[#16261E]">
            <Truck size={18} className="text-[#166534]" /> Lộ Trình & Đơn Vận
            Chuyển Đang Xử Lý
          </h3>
          <span className="text-xs font-mono font-semibold text-[#166534]">
            ● Đồng bộ trực tiếp
            {lastSyncedAt
              ? ` · ${lastSyncedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : ""}
          </span>
        </div>
        <div className="divide-y divide-[#F0ECE1]">
          {activeShipments.map((shipment) => (
            <div
              key={shipment.shipmentCode}
              className="flex flex-col justify-between gap-4 p-5 hover:bg-gray-50/70 md:flex-row md:items-center"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-bold text-amber-900">
                    {shipment.shipmentCode}
                  </span>
                  <ShipmentStatusBadge status={shipment.status} />
                  <span className="text-xs text-gray-500">
                    Biển số:{" "}
                    <strong className="text-gray-800">
                      {shipment.vehicleNumber}
                    </strong>{" "}
                    ({shipment.driverName})
                  </span>
                </div>
                <div className="text-xs font-semibold text-gray-700">
                  {shipment.productSummary}{" "}
                  {shipment.lotCode ? `(${shipment.lotCode})` : ""}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-amber-600" />{" "}
                    {shipment.origin} → {shipment.destination}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-blue-700">
                    <Thermometer size={13} /> {shipmentTemperature(shipment)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} />{" "}
                    {shipment.status === "IN_TRANSIT"
                      ? `ETA ${shipmentDate(shipment.estimatedArrival)}`
                      : shipmentDate(
                          shipment.actualArrival ?? shipment.dispatchTime
                        )}
                  </span>
                </div>
              </div>
              <Link
                href={
                  shipment.status === "DELIVERED"
                    ? `/dashboard/distributor/receive?shipment=${encodeURIComponent(shipment.shipmentCode)}`
                    : `/dashboard/distributor/shipments/${encodeURIComponent(shipment.shipmentCode)}`
                }
                className="shadow-xs rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
              >
                {shipment.status === "PREPARING"
                  ? "Xác nhận xuất phát"
                  : shipment.status === "IN_TRANSIT"
                    ? "Xác nhận đã giao"
                    : "Tiếp nhận QR"}
              </Link>
            </div>
          ))}
          {activeShipments.length === 0 && (
            <p className="p-8 text-center text-sm text-gray-500">
              Không có chuyến đang xử lý.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="mr-1 font-bold text-gray-500">Truy cập nhanh:</span>
        <Link
          href="/dashboard/distributor/shipments"
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-700 hover:border-amber-300 hover:text-amber-800"
        >
          Quản lý chuyến
        </Link>
        <Link
          href="/dashboard/distributor/history"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-700 hover:border-amber-300 hover:text-amber-800"
        >
          <History size={13} /> Lịch sử
        </Link>
        <Link
          href="/dashboard/distributor/settings"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-700 hover:border-amber-300 hover:text-amber-800"
        >
          <Settings size={13} /> Cài đặt
        </Link>
      </div>
    </div>
  );
}
