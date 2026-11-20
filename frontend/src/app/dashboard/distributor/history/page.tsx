"use client";

import { CalendarCheck2, ClipboardCheck, History, MapPin, Search, Thermometer, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DistributorPageHeader, MetricCard, ShipmentStatusBadge, shipmentDate, shipmentTemperature } from "@/components/distributor/distributor-ui";
import { distributorSeedShipments } from "@/features/distributor/mock-data";
import { getLocalShipments, mergeShipments } from "@/features/distributor/storage";
import type { DistributorShipment } from "@/features/distributor/types";
import { distributorService } from "@/services/distributor.service";

export default function DistributorHistoryPage() {
  const [shipments, setShipments] = useState<DistributorShipment[]>(() => mergeShipments(distributorSeedShipments, getLocalShipments()));
  const [query, setQuery] = useState("");

  useEffect(() => {
    distributorService
      .getHistory()
      .then((remote) => setShipments(mergeShipments(distributorSeedShipments, remote, getLocalShipments())))
      .catch(() => undefined);
  }, []);

  const completed = useMemo(() => shipments.filter((item) => item.status === "DELIVERED" || item.status === "RECEIVED"), [shipments]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return completed.filter((shipment) => !needle || [shipment.shipmentCode, shipment.destination, shipment.driverName, shipment.lotCode].some((item) => item.toLowerCase().includes(needle)));
  }, [completed, query]);
  const accepted = completed.filter((shipment) => shipment.status === "RECEIVED").length;
  const waiting = completed.filter((shipment) => shipment.status === "DELIVERED").length;

  return (
    <div className="space-y-6">
      <DistributorPageHeader title="Lịch Sử Vận Chuyển" description="Tra cứu các chuyến đã đến điểm giao, biên nhận QR và thông tin điều kiện bảo quản." icon={History} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Đã hoàn tất" value={completed.length} hint="Chuyến đã đến điểm giao" icon={Truck} tone="blue" />
        <MetricCard label="Đã tiếp nhận" value={accepted} hint="Có biên nhận QR hợp lệ" icon={ClipboardCheck} tone="emerald" />
        <MetricCard label="Chờ tiếp nhận" value={waiting} hint="Cần xác nhận tại điểm giao" icon={CalendarCheck2} tone="violet" />
      </div>

      <section className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><h2 className="font-bold text-sm text-gray-900">Chuyến giao đã kết thúc</h2><p className="text-xs text-gray-500 mt-1">Lưu trữ điều kiện nhiệt độ, thời gian giao và thông tin tiếp nhận.</p></div>
          <label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã chuyến, điểm giao" className="w-full sm:w-56 h-9 pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10" /></label>
        </div>
        <div className="divide-y divide-gray-100">
          {visible.map((shipment) => (
            <div key={shipment.shipmentCode} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-gray-50/70">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="font-mono font-bold text-sm text-amber-900">{shipment.shipmentCode}</span><ShipmentStatusBadge status={shipment.status} /></div>
                <p className="text-xs font-semibold text-gray-800">{shipment.productSummary}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500"><span className="flex items-center gap-1"><MapPin size={13} className="text-amber-600" />{shipment.destination}</span><span className="flex items-center gap-1"><Thermometer size={13} className="text-blue-600" />{shipmentTemperature(shipment)}</span><span>Hoàn tất: {shipmentDate(shipment.actualArrival ?? shipment.receipt?.receivedAt)}</span></div>
                {shipment.receipt && <p className="text-[11px] text-emerald-700 font-medium">Đã tiếp nhận bởi {shipment.receipt.receiverName}</p>}
              </div>
              <Link href={`/dashboard/distributor/shipments/${encodeURIComponent(shipment.shipmentCode)}`} className="shrink-0 text-xs font-bold text-amber-700 hover:underline">Xem biên nhận & hành trình →</Link>
            </div>
          ))}
        </div>
        {visible.length === 0 && <p className="p-8 text-center text-sm text-gray-500">Chưa có chuyến vận chuyển hoàn tất phù hợp.</p>}
      </section>
    </div>
  );
}
