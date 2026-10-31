"use client";

import { Camera, CheckCircle2, PackageCheck, QrCode, ScanLine, Upload } from "lucide-react";
import jsQR from "jsqr";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { DistributorPageHeader, ShipmentStatusBadge, shipmentTemperature } from "@/components/distributor/distributor-ui";
import { distributorSeedShipments } from "@/features/distributor/mock-data";
import { getLocalShipments, mergeShipments, upsertLocalShipment } from "@/features/distributor/storage";
import type { DistributorShipment, ShipmentReceipt, TrackingEvent } from "@/features/distributor/types";
import { getApiErrorMessage } from "@/lib/api";
import { distributorService } from "@/services/distributor.service";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";

function shipmentCodeFromQr(value: string) {
  const match = value.toUpperCase().match(/SHIP-[A-Z0-9-]+/);
  return match?.[0] ?? value.trim().toUpperCase();
}

export default function DistributorReceivePage() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [shipments, setShipments] = useState<DistributorShipment[]>(() => mergeShipments(distributorSeedShipments, getLocalShipments()));
  const [qrValue, setQrValue] = useState("");
  const [selectedShipmentCode, setSelectedShipmentCode] = useState(searchParams.get("shipment") ?? "");
  const [receiverName, setReceiverName] = useState(user?.name ?? "");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [note, setNote] = useState("");
  const [isReceiving, setIsReceiving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const requestedShipment = searchParams.get("shipment");
    if (requestedShipment) setSelectedShipmentCode(requestedShipment);
  }, [searchParams]);

  useEffect(() => {
    distributorService
      .getShipments()
      .then((remote) => setShipments(mergeShipments(distributorSeedShipments, remote, getLocalShipments())))
      .catch(() => undefined);
  }, []);

  const selectedShipment = useMemo(
    () => shipments.find((shipment) => shipment.shipmentCode === selectedShipmentCode) ?? null,
    [selectedShipmentCode, shipments]
  );

  function applyQrValue(value: string) {
    const shipmentCode = shipmentCodeFromQr(value);
    setQrValue(value);
    const found = shipments.find((shipment) => shipment.shipmentCode === shipmentCode);
    if (found) {
      setSelectedShipmentCode(found.shipmentCode);
      toast.success(`Đã nhận diện chuyến ${found.shipmentCode}.`);
    } else {
      toast.error(`Không tìm thấy chuyến ${shipmentCode}. Vui lòng kiểm tra mã QR.`);
    }
  }

  function decodeQrImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        toast.error("Trình duyệt không hỗ trợ xử lý ảnh QR.");
        URL.revokeObjectURL(objectUrl);
        return;
      }
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
      URL.revokeObjectURL(objectUrl);
      if (!result) {
        toast.error("Không đọc được QR từ ảnh này. Hãy chọn ảnh rõ nét hơn hoặc nhập mã thủ công.");
      } else {
        applyQrValue(result.data);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast.error("Không thể mở ảnh QR đã chọn.");
    };
    image.src = objectUrl;
    event.target.value = "";
  }

  async function receiveShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedShipment) {
      toast.error("Hãy quét QR hoặc chọn một chuyến cần tiếp nhận.");
      return;
    }
    if (!receiverName.trim()) {
      toast.error("Vui lòng nhập người tiếp nhận.");
      return;
    }
    if (selectedShipment.status === "RECEIVED") {
      toast.info("Chuyến này đã được tiếp nhận trước đó.");
      return;
    }

    setIsReceiving(true);
    const now = new Date().toISOString();
    const receipt: ShipmentReceipt = {
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim() || undefined,
      note: note.trim() || undefined,
      qrValue: qrValue || `AGRITRACE-${selectedShipment.shipmentCode}`,
      receivedAt: now,
    };
    const eventItem: TrackingEvent = {
      id: `${selectedShipment.shipmentCode}-receipt-${now}`,
      location: selectedShipment.destination,
      temperatureC: selectedShipment.temperatureC,
      status: "RECEIVED",
      note: `Tiếp nhận QR bởi ${receipt.receiverName}${receipt.note ? `: ${receipt.note}` : ""}`,
      eventTime: now,
    };
    const optimistic: DistributorShipment = {
      ...selectedShipment,
      status: "RECEIVED",
      actualArrival: selectedShipment.actualArrival ?? now,
      receipt,
      trackingEvents: [...selectedShipment.trackingEvents, eventItem],
    };

    try {
      const updated = await distributorService.receiveShipment(selectedShipment.shipmentCode, receipt);
      upsertLocalShipment(updated);
      setShipments((current) => mergeShipments(current, [updated]));
      toast.success(`Đã xác nhận tiếp nhận ${updated.shipmentCode}.`);
    } catch (error) {
      upsertLocalShipment(optimistic);
      setShipments((current) => mergeShipments(current, [optimistic]));
      toast.info(`Đã lưu biên nhận tạm trên trình duyệt. API chưa đồng bộ: ${getApiErrorMessage(error)}`);
    } finally {
      setIsReceiving(false);
    }
  }

  return (
    <div className="space-y-6">
      <DistributorPageHeader title="Tiếp Nhận Hàng & QR Code" description="Quét QR chuyến hàng, đối chiếu thông tin lô và lập biên nhận tại điểm giao." icon={PackageCheck} />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <section className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2"><QrCode size={18} className="text-amber-700" /> Quét / nhập mã QR</h2>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">Tải ảnh QR của chuyến hàng hoặc nhập chuỗi mã để hệ thống chọn đúng phiếu tiếp nhận.</p>
          <div className="mt-5 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-white border border-amber-100 flex items-center justify-center text-amber-700"><ScanLine size={24} /></div>
            <p className="text-xs font-bold text-amber-950 mt-3">Quét QR từ ảnh</p>
            <p className="text-[11px] text-amber-800/70 mt-1">Hỗ trợ ảnh QR rõ nét của phiếu vận chuyển.</p>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"><Upload size={14} /> Chọn ảnh QR</button>
            <input ref={fileInputRef} onChange={decodeQrImage} type="file" accept="image/*" className="hidden" />
          </div>
          <div className="relative mt-4"><QrCode size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={qrValue} onChange={(event) => setQrValue(event.target.value)} onBlur={(event) => event.target.value && applyQrValue(event.target.value)} placeholder="Ví dụ: AGRITRACE-SHIP-9016" className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10" /></div>
          <button type="button" onClick={() => qrValue && applyQrValue(qrValue)} className="mt-2 text-xs font-bold text-amber-700 hover:underline">Xác nhận mã đã nhập</button>
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] text-blue-900 flex items-start gap-2"><Camera size={15} className="shrink-0 mt-0.5" />Để dùng camera trực tiếp, hãy mở mã QR bằng thiết bị có camera hoặc tải ảnh QR vào khung này. Mã QR được xử lý ngay trên trình duyệt.</div>
        </section>

        <section className="xl:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100"><h2 className="font-bold text-sm text-gray-900">Xác nhận tiếp nhận</h2><p className="text-xs text-gray-500 mt-1">Kiểm tra chuyến, điều kiện bảo quản và người nhận trước khi xác nhận.</p></div>
          <form onSubmit={receiveShipment} className="p-5 space-y-4">
            <label className="block space-y-1"><span className="text-[11px] font-bold text-gray-600">Chuyến hàng *</span><select value={selectedShipmentCode} onChange={(event) => setSelectedShipmentCode(event.target.value)} className="field"><option value="">Chọn chuyến hàng</option>{shipments.filter((shipment) => shipment.status !== "CANCELLED").map((shipment) => <option key={shipment.shipmentCode} value={shipment.shipmentCode}>{shipment.shipmentCode} — {shipment.destination}</option>)}</select></label>
            {selectedShipment ? <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-xs"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-mono font-bold text-amber-900">{selectedShipment.shipmentCode}</p><p className="font-semibold text-gray-900 mt-1">{selectedShipment.productSummary}</p></div><ShipmentStatusBadge status={selectedShipment.status} /></div><div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600"><p>Điểm giao: <strong className="text-gray-800">{selectedShipment.destination}</strong></p><p>Tài xế: <strong className="text-gray-800">{selectedShipment.driverName}</strong></p><p>Lô: <strong className="font-mono text-gray-800">{selectedShipment.lotCode || "—"}</strong></p><p>Nhiệt độ hiện tại: <strong className="text-blue-700">{shipmentTemperature(selectedShipment)}</strong></p></div><Link href={`/dashboard/distributor/shipments/${encodeURIComponent(selectedShipment.shipmentCode)}`} className="inline-block mt-3 text-[11px] font-bold text-amber-700 hover:underline">Xem hành trình trước khi nhận →</Link></div> : <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-xs text-gray-500">Chưa có chuyến nào được chọn.</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Input label="Người tiếp nhận *" value={receiverName} onChange={setReceiverName} placeholder="Họ và tên người nhận" /><Input label="Số điện thoại" value={receiverPhone} onChange={setReceiverPhone} placeholder="09xx xxx xxx" /></div>
            <label className="block space-y-1"><span className="text-[11px] font-bold text-gray-600">Ghi chú biên nhận</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Ví dụ: Nhận đủ hàng, bao bì nguyên vẹn, nhiệt độ đạt yêu cầu." className="field h-auto py-2 resize-y" /></label>
            <button disabled={isReceiving || !selectedShipment} className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"><CheckCircle2 size={15} />{isReceiving ? "Đang xác nhận..." : "Xác nhận tiếp nhận hàng"}</button>
          </form>
        </section>
      </div>
      <style jsx>{`.field { width: 100%; height: 2.5rem; border: 1px solid #e5e7eb; border-radius: .75rem; padding: 0 .75rem; font-size: .75rem; outline: none; background: #fff; } .field:focus { border-color: #d97706; box-shadow: 0 0 0 4px rgba(217, 119, 6, .1); }`}</style>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block space-y-1"><span className="text-[11px] font-bold text-gray-600">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="field" /></label>;
}
