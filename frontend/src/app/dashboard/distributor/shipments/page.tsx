"use client";

import { CalendarClock, MapPin, Plus, Search, Thermometer, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { DistributorPageHeader, ShipmentStatusBadge, shipmentDate, shipmentTemperature } from "@/components/distributor/distributor-ui";
import { Modal } from "@/components/ui/modal";
import { distributorSeedShipments } from "@/features/distributor/mock-data";
import { getLocalShipments, mergeShipments, upsertLocalShipment } from "@/features/distributor/storage";
import type { CreateShipmentInput, DistributorShipment, ShipmentStatus } from "@/features/distributor/types";
import { shipmentStatusLabel } from "@/features/distributor/types";
import { getApiErrorMessage } from "@/lib/api";
import { distributorService } from "@/services/distributor.service";
import { toast } from "@/stores/toast-store";

const initialShipmentForm: CreateShipmentInput = {
  shipmentCode: "",
  orderCodes: [],
  driverName: "",
  driverPhone: "",
  vehicleNumber: "",
  origin: "",
  destination: "",
  productSummary: "",
  lotCode: "",
  temperatureC: 4.5,
  dispatchTime: "",
  estimatedArrival: "",
};

function makeShipmentCode() {
  return `SHIP-${String(Date.now()).slice(-6)}`;
}

export default function DistributorShipmentsPage() {
  const [shipments, setShipments] = useState<DistributorShipment[]>(distributorSeedShipments);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | ShipmentStatus>("ALL");
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<CreateShipmentInput>(initialShipmentForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const local = getLocalShipments();
    setShipments(mergeShipments(distributorSeedShipments, local));
    distributorService
      .getShipments()
      .then((remote) => setShipments(mergeShipments(distributorSeedShipments, remote, getLocalShipments())))
      .catch(() => undefined);
  }, []);

  const visibleShipments = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shipments.filter((shipment) => {
      const matchesStatus = status === "ALL" || shipment.status === status;
      const matchesQuery =
        !needle ||
        shipment.shipmentCode.toLowerCase().includes(needle) ||
        shipment.driverName.toLowerCase().includes(needle) ||
        shipment.destination.toLowerCase().includes(needle) ||
        shipment.lotCode.toLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [query, shipments, status]);

  function updateForm<Key extends keyof CreateShipmentInput>(key: Key, value: CreateShipmentInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function createShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.driverName.trim() || !form.vehicleNumber.trim() || !form.origin.trim() || !form.destination.trim() || !form.productSummary.trim()) {
      toast.error("Vui lòng nhập đủ tài xế, xe, điểm đi, điểm đến và hàng hóa.");
      return;
    }

    setIsSubmitting(true);
    const shipmentCode = form.shipmentCode.trim().toUpperCase() || makeShipmentCode();
    const input: CreateShipmentInput = {
      ...form,
      shipmentCode,
      orderCodes: form.orderCodes.filter(Boolean),
      temperatureC: Number(form.temperatureC) || 4.5,
    };
    const now = new Date().toISOString();
    const offlineShipment: DistributorShipment = {
      ...input,
      status: "PREPARING",
      createdAt: now,
      trackingEvents: [
        {
          id: `${shipmentCode}-created`,
          location: input.origin,
          temperatureC: input.temperatureC,
          status: "PREPARING",
          note: "Đã tạo phiếu vận chuyển, chờ xuất phát.",
          eventTime: now,
        },
      ],
    };

    try {
      const saved = await distributorService.createShipment(input);
      upsertLocalShipment(saved);
      setShipments((current) => mergeShipments(current, [saved]));
      toast.success(`Đã tạo chuyến ${saved.shipmentCode}.`);
    } catch (error) {
      upsertLocalShipment(offlineShipment);
      setShipments((current) => mergeShipments(current, [offlineShipment]));
      toast.info(`Đã lưu tạm chuyến ${shipmentCode} trên trình duyệt. API chưa sẵn sàng: ${getApiErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
      setIsCreating(false);
      setForm(initialShipmentForm);
    }
  }

  return (
    <div className="space-y-6">
      <DistributorPageHeader
        title="Quản Lý Vận Chuyển"
        description="Tạo chuyến xe lạnh, theo dõi các lô đang vận chuyển và mở hành trình chi tiết."
        icon={Truck}
        actions={
          <button onClick={() => setIsCreating(true)} className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all">
            <Plus size={15} /> Tạo chuyến vận chuyển
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-sm text-gray-900">Danh sách chuyến vận chuyển</h2>
            <p className="text-xs text-gray-500 mt-1">Nhiệt độ hiển thị là giá trị mới nhất được ghi nhận trên hành trình.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mã chuyến, tài xế, điểm đến" className="w-full sm:w-56 h-9 pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10" /></label>
            <select value={status} onChange={(event) => setStatus(event.target.value as "ALL" | ShipmentStatus)} className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 outline-none focus:border-amber-500">
              <option value="ALL">Tất cả trạng thái</option>
              {(Object.keys(shipmentStatusLabel) as ShipmentStatus[]).map((item) => <option key={item} value={item}>{shipmentStatusLabel[item]}</option>)}
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {visibleShipments.map((shipment) => (
            <div key={shipment.shipmentCode} className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:bg-gray-50/70">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5"><span className="font-mono font-bold text-sm text-amber-900">{shipment.shipmentCode}</span><ShipmentStatusBadge status={shipment.status} /><span className="text-[11px] text-gray-500">{shipment.vehicleNumber} · {shipment.driverName}</span></div>
                <p className="text-xs font-semibold text-gray-800">{shipment.productSummary}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1"><MapPin size={13} className="text-amber-600" />{shipment.origin} → {shipment.destination}</span>
                  <span className="flex items-center gap-1 font-semibold text-blue-700"><Thermometer size={13} />{shipmentTemperature(shipment)}</span>
                  <span className="flex items-center gap-1"><CalendarClock size={13} />{shipment.status === "IN_TRANSIT" ? `ETA ${shipmentDate(shipment.estimatedArrival)}` : shipmentDate(shipment.actualArrival ?? shipment.dispatchTime)}</span>
                </div>
              </div>
              <Link href={`/dashboard/distributor/shipments/${encodeURIComponent(shipment.shipmentCode)}`} className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold text-center shadow-xs">Xem hành trình</Link>
            </div>
          ))}
        </div>
        {visibleShipments.length === 0 && <p className="p-8 text-center text-sm text-gray-500">Không có chuyến vận chuyển phù hợp.</p>}
      </div>

      {isCreating && (
        <Modal title="Tạo chuyến vận chuyển mới" onClose={() => !isSubmitting && setIsCreating(false)}>
          <form onSubmit={createShipment} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Mã chuyến (tự tạo nếu bỏ trống)"><input value={form.shipmentCode} onChange={(event) => updateForm("shipmentCode", event.target.value)} placeholder="SHIP-9022" className="field" /></Field>
              <Field label="Mã đơn hàng"><input value={form.orderCodes.join(", ")} onChange={(event) => updateForm("orderCodes", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="AGRI-8841, AGRI-8842" className="field" /></Field>
              <Field label="Tài xế *"><input required value={form.driverName} onChange={(event) => updateForm("driverName", event.target.value)} placeholder="Họ tên tài xế" className="field" /></Field>
              <Field label="Số điện thoại"><input value={form.driverPhone} onChange={(event) => updateForm("driverPhone", event.target.value)} placeholder="09xx xxx xxx" className="field" /></Field>
              <Field label="Biển số xe *"><input required value={form.vehicleNumber} onChange={(event) => updateForm("vehicleNumber", event.target.value)} placeholder="49C-184.92" className="field" /></Field>
              <Field label="Nhiệt độ xuất phát (°C)"><input type="number" step="0.1" value={form.temperatureC} onChange={(event) => updateForm("temperatureC", Number(event.target.value))} className="field" /></Field>
            </div>
            <Field label="Điểm xuất phát *"><input required value={form.origin} onChange={(event) => updateForm("origin", event.target.value)} placeholder="Tên kho / địa điểm xuất phát" className="field" /></Field>
            <Field label="Điểm giao *"><input required value={form.destination} onChange={(event) => updateForm("destination", event.target.value)} placeholder="Tên khách hàng / điểm nhận" className="field" /></Field>
            <Field label="Hàng hóa *"><input required value={form.productSummary} onChange={(event) => updateForm("productSummary", event.target.value)} placeholder="Ví dụ: 240 kg Xà lách thủy canh" className="field" /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Mã lô"><input value={form.lotCode} onChange={(event) => updateForm("lotCode", event.target.value)} placeholder="XL-2026-08" className="field" /></Field>
              <Field label="Giờ xuất phát"><input type="datetime-local" value={form.dispatchTime} onChange={(event) => updateForm("dispatchTime", event.target.value)} className="field" /></Field>
              <Field label="ETA"><input type="datetime-local" value={form.estimatedArrival} onChange={(event) => updateForm("estimatedArrival", event.target.value)} className="field" /></Field>
            </div>
            <div className="flex justify-end gap-2 pt-1"><button type="button" onClick={() => setIsCreating(false)} className="px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100">Hủy</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-60">{isSubmitting ? "Đang tạo..." : "Tạo chuyến"}</button></div>
          </form>
        </Modal>
      )}
      <style jsx>{`.field { width: 100%; height: 2.5rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 0 0.75rem; font-size: 0.75rem; outline: none; background: #fff; } .field:focus { border-color: #d97706; box-shadow: 0 0 0 4px rgba(217, 119, 6, .1); }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-[11px] font-bold text-gray-600">{label}</span>{children}</label>;
}
