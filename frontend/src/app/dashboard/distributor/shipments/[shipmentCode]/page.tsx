"use client";

import { ArrowLeft, ClipboardCheck, Navigation, QrCode, Save, Thermometer, Truck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { DistributorPageHeader, ShipmentStatusBadge, shipmentDate, shipmentTemperature } from "@/components/distributor/distributor-ui";
import { distributorSeedShipments } from "@/features/distributor/mock-data";
import { getLocalShipments, mergeShipments, upsertLocalShipment } from "@/features/distributor/storage";
import type { DistributorShipment, ShipmentStatus, TrackingEvent } from "@/features/distributor/types";
import { shipmentStatusLabel } from "@/features/distributor/types";
import { getApiErrorMessage } from "@/lib/api";
import { distributorService } from "@/services/distributor.service";
import { toast } from "@/stores/toast-store";

function initialShipment(code: string) {
  return mergeShipments(distributorSeedShipments, getLocalShipments()).find((item) => item.shipmentCode === code) ?? null;
}

export default function ShipmentDetailPage() {
  const params = useParams<{ shipmentCode: string }>();
  const shipmentCode = decodeURIComponent(params.shipmentCode);
  const [shipment, setShipment] = useState<DistributorShipment | null>(() => initialShipment(shipmentCode));
  const [status, setStatus] = useState<ShipmentStatus>(() => shipment?.status ?? "PREPARING");
  const [statusLocation, setStatusLocation] = useState("");
  const [statusTemp, setStatusTemp] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [trackingLocation, setTrackingLocation] = useState("");
  const [trackingTemp, setTrackingTemp] = useState("");
  const [trackingHumidity, setTrackingHumidity] = useState("");
  const [trackingNote, setTrackingNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);

  useEffect(() => {
    const fallback = initialShipment(shipmentCode);
    setShipment(fallback);
    if (fallback) {
      setStatus(fallback.status);
      setStatusLocation(fallback.destination);
      setStatusTemp(String(fallback.temperatureC));
    }
    distributorService
      .getShipment(shipmentCode)
      .then((remote) => {
        setShipment(remote);
        setStatus(remote.status);
        setStatusLocation(remote.destination);
        setStatusTemp(String(remote.temperatureC));
        upsertLocalShipment(remote);
      })
      .catch(() => undefined);
  }, [shipmentCode]);

  const events = useMemo(
    () => [...(shipment?.trackingEvents ?? [])].sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()),
    [shipment]
  );

  function applyShipment(next: DistributorShipment, message: string, offline = false) {
    setShipment(next);
    setStatus(next.status);
    upsertLocalShipment(next);
    if (offline) toast.info(`${message} Đã lưu tạm trên trình duyệt.`);
    else toast.success(message);
  }

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shipment || !statusLocation.trim()) {
      toast.error("Vui lòng nhập vị trí cập nhật.");
      return;
    }
    setSavingStatus(true);
    const now = new Date().toISOString();
    const temp = Number(statusTemp) || shipment.temperatureC;
    const trackingEvent: TrackingEvent = { id: `${shipment.shipmentCode}-${now}`, location: statusLocation.trim(), temperatureC: temp, status, note: statusNote.trim() || undefined, eventTime: now };
    const optimistic: DistributorShipment = {
      ...shipment,
      status,
      temperatureC: temp,
      actualArrival: status === "DELIVERED" || status === "RECEIVED" ? now : shipment.actualArrival,
      trackingEvents: [...shipment.trackingEvents, trackingEvent],
    };
    try {
      const updated = await distributorService.updateShipmentStatus(shipment.shipmentCode, trackingEvent);
      applyShipment(updated, "Đã cập nhật trạng thái chuyến hàng.");
    } catch (error) {
      applyShipment(optimistic, `Không thể đồng bộ API: ${getApiErrorMessage(error)}.`, true);
    } finally {
      setSavingStatus(false);
      setStatusNote("");
    }
  }

  async function addTracking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shipment || !trackingLocation.trim()) {
      toast.error("Vui lòng nhập vị trí hành trình.");
      return;
    }
    setSavingTracking(true);
    const now = new Date().toISOString();
    const trackingEvent: TrackingEvent = {
      id: `${shipment.shipmentCode}-tracking-${now}`,
      location: trackingLocation.trim(),
      temperatureC: trackingTemp ? Number(trackingTemp) : shipment.temperatureC,
      humidityPercent: trackingHumidity ? Number(trackingHumidity) : undefined,
      status: shipment.status,
      note: trackingNote.trim() || undefined,
      eventTime: now,
    };
    const optimistic = { ...shipment, temperatureC: trackingEvent.temperatureC ?? shipment.temperatureC, trackingEvents: [...shipment.trackingEvents, trackingEvent] };
    try {
      const updated = await distributorService.addTrackingEvent(shipment.shipmentCode, trackingEvent);
      applyShipment(updated, "Đã ghi nhận điểm hành trình.");
    } catch (error) {
      applyShipment(optimistic, `Không thể đồng bộ API: ${getApiErrorMessage(error)}.`, true);
    } finally {
      setSavingTracking(false);
      setTrackingLocation("");
      setTrackingTemp("");
      setTrackingHumidity("");
      setTrackingNote("");
    }
  }

  if (!shipment) {
    return <div className="space-y-5"><Link href="/dashboard/distributor/shipments" className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:underline"><ArrowLeft size={15} /> Quay lại danh sách vận chuyển</Link><div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Không tìm thấy chuyến <strong>{shipmentCode}</strong>.</div></div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/distributor/shipments" className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:underline"><ArrowLeft size={15} /> Quay lại danh sách vận chuyển</Link>
      <DistributorPageHeader
        title={`Hành trình ${shipment.shipmentCode}`}
        description={`${shipment.productSummary} • ${shipment.origin} → ${shipment.destination}`}
        icon={Truck}
        actions={<><ShipmentStatusBadge status={shipment.status} /><Link href={`/dashboard/distributor/receive?shipment=${encodeURIComponent(shipment.shipmentCode)}`} className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-bold rounded-xl flex items-center gap-1.5"><QrCode size={15} /> Tiếp nhận QR</Link></>}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <section className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-sm text-gray-900">Tracking hành trình</h2><p className="text-xs text-gray-500 mt-1">Các mốc vị trí, nhiệt độ và ghi chú đã ghi nhận.</p></div><span className="text-xs font-bold text-blue-700 flex items-center gap-1"><Thermometer size={15} /> Nhiệt độ hiện tại {shipmentTemperature(shipment)}</span></div>
            <div className="p-5">
              {events.length === 0 ? <p className="text-sm text-gray-500">Chưa có điểm hành trình nào.</p> : <ol className="relative border-s border-amber-200 ms-2 space-y-5">{events.map((item, index) => <li key={`${item.id ?? index}-${item.eventTime}`} className="ms-5"><span className="absolute -start-[7px] mt-1.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white" /><div className="flex flex-wrap justify-between gap-2"><p className="text-xs font-bold text-gray-900">{item.location}</p><time className="text-[11px] text-gray-400">{shipmentDate(item.eventTime)}</time></div><div className="mt-1 flex flex-wrap gap-2"><ShipmentStatusBadge status={item.status} />{item.temperatureC !== undefined && <span className="text-[11px] text-blue-700 font-semibold">{Number(item.temperatureC).toFixed(1)}°C</span>}{item.humidityPercent !== undefined && <span className="text-[11px] text-gray-500">Độ ẩm {item.humidityPercent}%</span>}</div>{item.note && <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{item.note}</p>}</li>)}</ol>}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
            <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2"><Navigation size={17} className="text-amber-700" /> Thêm điểm hành trình</h2>
            <form onSubmit={addTracking} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Vị trí *" value={trackingLocation} onChange={setTrackingLocation} placeholder="Ví dụ: Trạm thu phí Long Thành" />
              <Input label="Nhiệt độ (°C)" type="number" value={trackingTemp} onChange={setTrackingTemp} placeholder={String(shipment.temperatureC)} />
              <Input label="Độ ẩm (%)" type="number" value={trackingHumidity} onChange={setTrackingHumidity} placeholder="Ví dụ: 85" />
              <Input label="Ghi chú" value={trackingNote} onChange={setTrackingNote} placeholder="Tình trạng xe / lô hàng" />
              <div className="sm:col-span-2 flex justify-end"><button disabled={savingTracking} className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-60">{savingTracking ? "Đang lưu..." : "Ghi nhận hành trình"}</button></div>
            </form>
          </section>
        </div>

        <div className="space-y-5">
          <section className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs text-xs">
            <h2 className="font-bold text-sm text-gray-900">Thông tin chuyến</h2>
            <dl className="mt-3 space-y-2.5 text-gray-600"><div><dt className="text-[10px] uppercase text-gray-400 font-bold">Tài xế / xe</dt><dd className="mt-0.5 font-semibold text-gray-900">{shipment.driverName} · {shipment.vehicleNumber}</dd></div><div><dt className="text-[10px] uppercase text-gray-400 font-bold">Lô hàng</dt><dd className="mt-0.5 font-mono font-semibold text-amber-900">{shipment.lotCode || "—"}</dd></div><div><dt className="text-[10px] uppercase text-gray-400 font-bold">Đơn liên quan</dt><dd className="mt-0.5">{shipment.orderCodes.length ? shipment.orderCodes.join(", ") : "Chưa gán"}</dd></div><div><dt className="text-[10px] uppercase text-gray-400 font-bold">ETA</dt><dd className="mt-0.5">{shipmentDate(shipment.estimatedArrival)}</dd></div></dl>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
            <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2"><ClipboardCheck size={17} className="text-amber-700" /> Cập nhật trạng thái</h2>
            <form onSubmit={updateStatus} className="mt-4 space-y-3">
              <label className="block space-y-1"><span className="text-[11px] font-bold text-gray-600">Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value as ShipmentStatus)} className="field">{(Object.keys(shipmentStatusLabel) as ShipmentStatus[]).map((item) => <option key={item} value={item}>{shipmentStatusLabel[item]}</option>)}</select></label>
              <Input label="Vị trí *" value={statusLocation} onChange={setStatusLocation} placeholder="Vị trí hiện tại / điểm giao" />
              <Input label="Nhiệt độ (°C)" type="number" value={statusTemp} onChange={setStatusTemp} />
              <label className="block space-y-1"><span className="text-[11px] font-bold text-gray-600">Ghi chú</span><textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} rows={3} className="field h-auto py-2 resize-y" placeholder="Mô tả việc cập nhật trạng thái" /></label>
              <button disabled={savingStatus} className="w-full px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"><Save size={14} />{savingStatus ? "Đang cập nhật..." : "Lưu trạng thái"}</button>
            </form>
          </section>

          {shipment.receipt && <section className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 text-xs text-emerald-900"><p className="font-bold">Đã tiếp nhận hàng</p><p className="mt-1">{shipment.receipt.receiverName} · {shipmentDate(shipment.receipt.receivedAt)}</p>{shipment.receipt.note && <p className="mt-1 text-emerald-800">{shipment.receipt.note}</p>}</section>}
        </div>
      </div>
      <style jsx>{`.field { width: 100%; height: 2.5rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 0 0.75rem; font-size: 0.75rem; outline: none; background: #fff; } .field:focus { border-color: #d97706; box-shadow: 0 0 0 4px rgba(217, 119, 6, .1); }`}</style>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="block space-y-1"><span className="text-[11px] font-bold text-gray-600">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="field" /></label>;
}
