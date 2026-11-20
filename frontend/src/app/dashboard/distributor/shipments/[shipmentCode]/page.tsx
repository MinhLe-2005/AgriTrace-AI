"use client";

import {
  ArrowLeft,
  ClipboardCheck,
  Crosshair,
  ExternalLink,
  MapPinned,
  Navigation,
  QrCode,
  Radio,
  Save,
  Square,
  Thermometer,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  DistributorPageHeader,
  ShipmentStatusBadge,
  shipmentDate,
  shipmentTemperature,
} from "@/components/distributor/distributor-ui";
import { subscribeToDistributorChanges } from "@/features/distributor/realtime";
import type {
  DistributorShipment,
  ShipmentStatus,
  TrackingEvent,
} from "@/features/distributor/types";
import {
  nextShipmentStatuses,
  shipmentStatusLabel,
} from "@/features/distributor/types";
import { getApiErrorMessage } from "@/lib/api";
import { distributorService } from "@/services/distributor.service";
import { toast } from "@/stores/toast-store";

const fieldClassName =
  "mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10";

const GPS_MIN_DISTANCE_METERS = 25;
const GPS_MIN_INTERVAL_MS = 15_000;

type GpsPosition = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  observedAt: string;
};

function isGpsPosition(
  event: TrackingEvent
): event is TrackingEvent &
  Required<Pick<TrackingEvent, "latitude" | "longitude">> {
  return Number.isFinite(event.latitude) && Number.isFinite(event.longitude);
}

function distanceInMeters(first: GpsPosition, second: GpsPosition) {
  const radius = 6_371_000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function gpsLocationLabel(
  position: Pick<GpsPosition, "latitude" | "longitude">
) {
  return `GPS: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;
}

function googleMapsUrl(
  position: Pick<GpsPosition, "latitude" | "longitude">,
  embed = false
) {
  const coordinates = `${position.latitude},${position.longitude}`;
  return embed
    ? `https://www.google.com/maps?q=${encodeURIComponent(coordinates)}&z=16&output=embed`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`;
}

export default function ShipmentDetailPage() {
  const params = useParams<{ shipmentCode: string }>();
  const shipmentCode = decodeURIComponent(params.shipmentCode);
  const [shipment, setShipment] = useState<DistributorShipment | null>(null);
  const [isLoadingShipment, setIsLoadingShipment] = useState(true);
  const [status, setStatus] = useState<ShipmentStatus>(
    () => shipment?.status ?? "PREPARING"
  );
  const [statusLocation, setStatusLocation] = useState("");
  const [statusTemp, setStatusTemp] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [trackingLocation, setTrackingLocation] = useState("");
  const [trackingTemp, setTrackingTemp] = useState("");
  const [trackingHumidity, setTrackingHumidity] = useState("");
  const [trackingNote, setTrackingNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);
  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsPosition, setGpsPosition] = useState<GpsPosition | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const shipmentRef = useRef<DistributorShipment | null>(null);
  const gpsWatchId = useRef<number | null>(null);
  const lastGpsSent = useRef<GpsPosition | null>(null);
  const gpsUploadInFlight = useRef(false);

  useEffect(() => {
    shipmentRef.current = shipment;
  }, [shipment]);

  useEffect(
    () => () => {
      if (gpsWatchId.current !== null)
        navigator.geolocation.clearWatch(gpsWatchId.current);
    },
    []
  );

  useEffect(() => {
    if (shipment?.status === "IN_TRANSIT" || gpsWatchId.current === null)
      return;
    navigator.geolocation.clearWatch(gpsWatchId.current);
    gpsWatchId.current = null;
    setGpsTracking(false);
  }, [shipment?.status]);

  useEffect(() => {
    setIsLoadingShipment(true);
    distributorService
      .getShipment(shipmentCode)
      .then((remote) => {
        setShipment(remote);
        setStatus(nextShipmentStatuses(remote.status)[0] ?? remote.status);
        setStatusLocation(
          remote.trackingEvents.at(-1)?.location ?? remote.origin
        );
        setStatusTemp(String(remote.temperatureC));
        setIsLoadingShipment(false);
      })
      .catch(() => {
        setShipment(null);
        setIsLoadingShipment(false);
      });
  }, [shipmentCode]);

  useEffect(
    () =>
      subscribeToDistributorChanges(() => {
        distributorService
          .getShipment(shipmentCode)
          .then((remote) => {
            setShipment(remote);
            setStatus(nextShipmentStatuses(remote.status)[0] ?? remote.status);
            setStatusLocation(
              remote.trackingEvents.at(-1)?.location ?? remote.origin
            );
            setStatusTemp(String(remote.temperatureC));
          })
          .catch(() => undefined);
      }),
    [shipmentCode]
  );

  function stopGpsTracking(showNotice = true) {
    if (gpsWatchId.current !== null)
      navigator.geolocation.clearWatch(gpsWatchId.current);
    gpsWatchId.current = null;
    setGpsTracking(false);
    if (showNotice) toast.info("Đã dừng chia sẻ vị trí GPS trực tiếp.");
  }

  async function startGpsTracking() {
    if (!navigator.geolocation) {
      setGpsError("Thiết bị/trình duyệt này không hỗ trợ định vị GPS.");
      return;
    }
    let current = shipment;
    if (current && current.status === "PREPARING") {
      try {
        const updated = await distributorService.updateShipmentStatus(
          current.shipmentCode,
          {
            location: statusLocation.trim() || current.origin || "Điểm xuất phát",
            temperatureC: current.temperatureC,
            status: "IN_TRANSIT",
            note: "Xe xuất phát và bắt đầu phát định vị GPS trực tiếp.",
          }
        );
        applyShipment(
          updated,
          "Đã chuyển sang trạng thái Đang vận chuyển và kích hoạt GPS."
        );
        current = updated;
      } catch (error) {
        toast.error(`Không thể chuyển trạng thái: ${getApiErrorMessage(error)}`);
        return;
      }
    }
    if (current?.status !== "IN_TRANSIT") {
      toast.error(
        "Chỉ bật GPS sau khi chuyến đã chuyển sang trạng thái Đang vận chuyển."
      );
      return;
    }
    setGpsError(null);
    gpsWatchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const nextPosition: GpsPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          observedAt: new Date(position.timestamp).toISOString(),
        };
        setGpsPosition(nextPosition);
        setGpsError(null);

        const previousPosition = lastGpsSent.current;
        const shouldSend =
          !previousPosition ||
          distanceInMeters(previousPosition, nextPosition) >=
            GPS_MIN_DISTANCE_METERS ||
          new Date(nextPosition.observedAt).getTime() -
            new Date(previousPosition.observedAt).getTime() >=
            GPS_MIN_INTERVAL_MS;
        if (!shouldSend || gpsUploadInFlight.current) return;

        const currentShipment = shipmentRef.current;
        if (!currentShipment || currentShipment.status !== "IN_TRANSIT") return;
        gpsUploadInFlight.current = true;
        lastGpsSent.current = nextPosition;
        const trackingEvent: Omit<TrackingEvent, "id" | "eventTime"> = {
          location: gpsLocationLabel(nextPosition),
          latitude: nextPosition.latitude,
          longitude: nextPosition.longitude,
          accuracyMeters: nextPosition.accuracyMeters,
          temperatureC: currentShipment.temperatureC,
          status: currentShipment.status,
          note: "Vị trí GPS trực tiếp từ thiết bị tài xế.",
        };
        distributorService
          .addTrackingEvent(currentShipment.shipmentCode, trackingEvent)
          .then((updated) => setShipment(updated))
          .catch((error) => {
            lastGpsSent.current = previousPosition;
            setGpsError(`Không thể đồng bộ GPS: ${getApiErrorMessage(error)}`);
          })
          .finally(() => {
            gpsUploadInFlight.current = false;
          });
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Bạn chưa cấp quyền vị trí. Hãy cho phép định vị trong trình duyệt rồi thử lại."
            : "Không lấy được vị trí GPS. Kiểm tra GPS/kết nối và thử lại.";
        setGpsError(message);
        if (error.code === error.PERMISSION_DENIED) {
          if (gpsWatchId.current !== null)
            navigator.geolocation.clearWatch(gpsWatchId.current);
          gpsWatchId.current = null;
          setGpsTracking(false);
        }
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 }
    );
    setGpsTracking(true);
    toast.info(
      "Đang chờ quyền GPS từ thiết bị. Vị trí sẽ đồng bộ khi xe di chuyển."
    );
  }

  async function simulateGps() {
    if (!shipment) return;
    let current = shipment;
    if (current.status === "PREPARING") {
      try {
        const updated = await distributorService.updateShipmentStatus(
          current.shipmentCode,
          {
            location: current.origin || "Điểm xuất phát",
            temperatureC: current.temperatureC,
            status: "IN_TRANSIT",
            note: "Xe xuất phát và phát định vị GPS.",
          }
        );
        applyShipment(updated, "Đã chuyển sang trạng thái Đang vận chuyển.");
        current = updated;
      } catch (error) {
        toast.error(`Không thể chuyển trạng thái: ${getApiErrorMessage(error)}`);
        return;
      }
    }
    const sampleLat = 11.940419;
    const sampleLng = 108.458313;
    const nextPosition: GpsPosition = {
      latitude: sampleLat,
      longitude: sampleLng,
      accuracyMeters: 10,
      observedAt: new Date().toISOString(),
    };
    setGpsPosition(nextPosition);
    try {
      const updated = await distributorService.addTrackingEvent(
        current.shipmentCode,
        {
          location: gpsLocationLabel(nextPosition),
          latitude: sampleLat,
          longitude: sampleLng,
          accuracyMeters: 10,
          temperatureC: current.temperatureC,
          status: current.status,
          note: "Tọa độ GPS mẫu phục vụ kiểm thử vị trí.",
        }
      );
      setShipment(updated);
      toast.success("Đã ghi nhận tọa độ GPS mẫu thành công!");
    } catch (error) {
      toast.error(`Không thể gửi tọa độ: ${getApiErrorMessage(error)}`);
    }
  }

  const events = useMemo(
    () =>
      [...(shipment?.trackingEvents ?? [])].sort(
        (a, b) =>
          new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()
      ),
    [shipment]
  );
  const latestRecordedGps = useMemo(() => {
    const event = events.find(isGpsPosition);
    return event
      ? {
          latitude: event.latitude,
          longitude: event.longitude,
          accuracyMeters: event.accuracyMeters,
          observedAt: event.eventTime,
        }
      : null;
  }, [events]);
  const displayedGps = gpsPosition ?? latestRecordedGps;
  const nextStatuses = shipment ? nextShipmentStatuses(shipment.status) : [];
  const canUpdateLifecycle = Boolean(
    shipment && shipment.status !== "DELIVERED" && nextStatuses.length > 0
  );

  function applyShipment(next: DistributorShipment, message: string) {
    setShipment(next);
    setStatus(nextShipmentStatuses(next.status)[0] ?? next.status);
    setStatusLocation(next.trackingEvents.at(-1)?.location ?? next.origin);
    toast.success(message);
  }

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shipment || !statusLocation.trim()) {
      toast.error("Vui lòng nhập vị trí cập nhật.");
      return;
    }
    if (!nextStatuses.includes(status)) {
      toast.error(
        "Không thể lặp lại hoặc bỏ qua trạng thái. Hãy ghi nhận hành trình nếu chỉ cập nhật vị trí/cảm biến."
      );
      return;
    }
    if (
      status === "CANCELLED" &&
      !window.confirm(
        "Hủy chuyến vận chuyển này? Thao tác này không thể đảo ngược."
      )
    ) {
      return;
    }
    setSavingStatus(true);
    const now = new Date().toISOString();
    const temp = Number(statusTemp) || shipment.temperatureC;
    const trackingEvent: TrackingEvent = {
      id: `${shipment.shipmentCode}-${now}`,
      location: statusLocation.trim(),
      temperatureC: temp,
      status,
      note: statusNote.trim() || undefined,
      eventTime: now,
    };
    try {
      const updated = await distributorService.updateShipmentStatus(
        shipment.shipmentCode,
        trackingEvent
      );
      applyShipment(
        updated,
        `Đã chuyển sang trạng thái ${shipmentStatusLabel[updated.status]}.`
      );
    } catch (error) {
      toast.error(
        `Không thể cập nhật trạng thái: ${getApiErrorMessage(error)}`
      );
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
    try {
      const updated = await distributorService.addTrackingEvent(
        shipment.shipmentCode,
        trackingEvent
      );
      applyShipment(updated, "Đã ghi nhận điểm hành trình.");
    } catch (error) {
      toast.error(
        `Không thể ghi nhận hành trình: ${getApiErrorMessage(error)}`
      );
    } finally {
      setSavingTracking(false);
      setTrackingLocation("");
      setTrackingTemp("");
      setTrackingHumidity("");
      setTrackingNote("");
    }
  }

  if (isLoadingShipment) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Đang tải dữ liệu chuyến vận chuyển...
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="space-y-5">
        <Link
          href="/dashboard/distributor/shipments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:underline"
        >
          <ArrowLeft size={15} /> Quay lại danh sách vận chuyển
        </Link>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Không tìm thấy chuyến <strong>{shipmentCode}</strong>.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/distributor/shipments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:underline"
      >
        <ArrowLeft size={15} /> Quay lại danh sách vận chuyển
      </Link>
      <DistributorPageHeader
        title={`Hành trình ${shipment.shipmentCode}`}
        description={`${shipment.productSummary} • ${shipment.origin} → ${shipment.destination}`}
        icon={Truck}
        actions={
          <>
            <ShipmentStatusBadge status={shipment.status} />
            <Link
              href={`/dashboard/distributor/receive?shipment=${encodeURIComponent(shipment.shipmentCode)}`}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-amber-950 hover:bg-amber-400"
            >
              <QrCode size={15} /> Tiếp nhận QR
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <section className="shadow-xs overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <MapPinned size={17} className="text-amber-700" /> GPS hành
                  trình trực tiếp
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Vị trí được gửi từ thiết bị tài xế và đồng bộ ngay sau khi
                  server xác nhận.
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${gpsTracking ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-500"}`}
              >
                <Radio
                  size={12}
                  className={gpsTracking ? "animate-pulse" : ""}
                />{" "}
                {gpsTracking ? "ĐANG PHÁT GPS" : "CHƯA BẬT GPS"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_13rem]">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                {displayedGps ? (
                  <iframe
                    title={`Bản đồ GPS ${shipment.shipmentCode}`}
                    src={googleMapsUrl(displayedGps, true)}
                    className="h-64 w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center px-6 text-center text-gray-500">
                    <MapPinned size={30} className="mb-2 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-700">
                      Chưa có tọa độ GPS
                    </p>
                    <p className="mt-1 text-xs leading-relaxed">
                      Tài xế cần bật GPS khi xe bắt đầu vận chuyển.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-between gap-3 text-xs">
                <div className="space-y-2 rounded-xl bg-amber-50 p-3 text-amber-950">
                  <p className="font-bold">Vị trí mới nhất</p>
                  {displayedGps ? (
                    <>
                      <p className="font-mono text-[11px]">
                        {displayedGps.latitude.toFixed(6)},{" "}
                        {displayedGps.longitude.toFixed(6)}
                      </p>
                      <p className="text-[11px]">
                        Cập nhật {shipmentDate(displayedGps.observedAt)}
                      </p>
                      {displayedGps.accuracyMeters !== undefined && (
                        <p className="text-[11px]">
                          Sai số ±{Math.round(displayedGps.accuracyMeters)} m
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[11px] leading-relaxed">
                      Chưa nhận được dữ liệu từ thiết bị.
                    </p>
                  )}
                </div>
                {gpsTracking ? (
                  <button
                    type="button"
                    onClick={() => stopGpsTracking()}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    <Square size={13} /> Dừng GPS
                  </button>
                ) : shipment.status === "IN_TRANSIT" ? (
                  <button
                    type="button"
                    onClick={startGpsTracking}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Crosshair size={14} /> Bắt đầu GPS
                  </button>
                ) : shipment.status === "PREPARING" ? (
                  <button
                    type="button"
                    onClick={startGpsTracking}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-amber-950 shadow-sm transition hover:bg-amber-400"
                  >
                    <Truck size={14} /> Xuất phát & Bật GPS
                  </button>
                ) : (
                  <p className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-[11px] leading-relaxed text-gray-500">
                    Chuyến hàng đã hoàn tất hành trình.
                  </p>
                )}
                {!gpsTracking &&
                  (shipment.status === "PREPARING" ||
                    shipment.status === "IN_TRANSIT") && (
                    <button
                      type="button"
                      onClick={simulateGps}
                      className="text-center text-[11px] text-amber-700 hover:underline"
                    >
                      Thử gửi tọa độ GPS mẫu
                    </button>
                  )}
                {displayedGps && (
                  <a
                    href={googleMapsUrl(displayedGps)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50"
                  >
                    <ExternalLink size={13} /> Mở Google Maps
                  </a>
                )}
              </div>
            </div>
            {gpsError && (
              <p className="mx-4 mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-800">
                {gpsError}
              </p>
            )}
          </section>

          <section className="shadow-xs overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Tracking hành trình
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Các mốc vị trí, nhiệt độ và ghi chú đã ghi nhận.
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-blue-700">
                <Thermometer size={15} /> Nhiệt độ hiện tại{" "}
                {shipmentTemperature(shipment)}
              </span>
            </div>
            <div className="p-5">
              {events.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Chưa có điểm hành trình nào.
                </p>
              ) : (
                <ol className="relative ms-2 space-y-5 border-s border-amber-200">
                  {events.map((item, index) => (
                    <li
                      key={`${item.id ?? index}-${item.eventTime}`}
                      className="ms-5"
                    >
                      <span className="absolute -start-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-amber-500" />
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="text-xs font-bold text-gray-900">
                          {item.location}
                        </p>
                        <time className="text-[11px] text-gray-400">
                          {shipmentDate(item.eventTime)}
                        </time>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <ShipmentStatusBadge status={item.status} />
                        {isGpsPosition(item) && (
                          <a
                            href={googleMapsUrl(item)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100"
                          >
                            <MapPinned size={11} /> Xem GPS
                          </a>
                        )}
                        {item.temperatureC !== undefined && (
                          <span className="text-[11px] font-semibold text-blue-700">
                            {Number(item.temperatureC).toFixed(1)}°C
                          </span>
                        )}
                        {item.humidityPercent !== undefined && (
                          <span className="text-[11px] text-gray-500">
                            Độ ẩm {item.humidityPercent}%
                          </span>
                        )}
                      </div>
                      {item.note && (
                        <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                          {item.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>

          <section className="shadow-xs rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Navigation size={17} className="text-amber-700" /> Ghi nhận vị
              trí & cảm biến
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Không thay đổi trạng thái chuyến hàng.
            </p>
            <form
              onSubmit={addTracking}
              className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              <Input
                label="Vị trí *"
                value={trackingLocation}
                onChange={setTrackingLocation}
                placeholder="Ví dụ: Trạm thu phí Long Thành"
              />
              <Input
                label="Nhiệt độ (°C)"
                type="number"
                value={trackingTemp}
                onChange={setTrackingTemp}
                placeholder={String(shipment.temperatureC)}
              />
              <Input
                label="Độ ẩm (%)"
                type="number"
                value={trackingHumidity}
                onChange={setTrackingHumidity}
                placeholder="Ví dụ: 85"
              />
              <Input
                label="Ghi chú"
                value={trackingNote}
                onChange={setTrackingNote}
                placeholder="Tình trạng xe / lô hàng"
              />
              <div className="flex justify-end sm:col-span-2">
                <button
                  disabled={savingTracking}
                  className="rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  {savingTracking ? "Đang lưu..." : "Ghi nhận hành trình"}
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="space-y-5">
          <section className="shadow-xs rounded-2xl border border-gray-200 bg-white p-4 text-xs">
            <h2 className="text-sm font-bold text-gray-900">
              Thông tin chuyến
            </h2>
            <dl className="mt-3 space-y-2.5 text-gray-600">
              <div>
                <dt className="text-[10px] font-bold uppercase text-gray-400">
                  Tài xế / xe
                </dt>
                <dd className="mt-0.5 font-semibold text-gray-900">
                  {shipment.driverName} · {shipment.vehicleNumber}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-gray-400">
                  Lô hàng
                </dt>
                <dd className="mt-0.5 font-mono font-semibold text-amber-900">
                  {shipment.lotCode || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-gray-400">
                  Đơn liên quan
                </dt>
                <dd className="mt-0.5">
                  {shipment.orderCodes.length
                    ? shipment.orderCodes.join(", ")
                    : "Chưa gán"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-gray-400">
                  ETA
                </dt>
                <dd className="mt-0.5">
                  {shipmentDate(shipment.estimatedArrival)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="shadow-xs rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <ClipboardCheck size={17} className="text-amber-700" /> Cập nhật
              trạng thái
            </h2>
            {shipment?.status === "DELIVERED" ? (
              <p className="mt-3 text-xs leading-relaxed text-violet-800">
                Hàng đã đến điểm giao. Người nhận cần quét QR để xác nhận tiếp
                nhận.
              </p>
            ) : !canUpdateLifecycle ? (
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                Chuyến này đã kết thúc, không thể thay đổi trạng thái.
              </p>
            ) : (
              <form onSubmit={updateStatus} className="mt-4 space-y-3">
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-gray-600">
                    Trạng thái tiếp theo
                  </span>
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as ShipmentStatus)
                    }
                    className={fieldClassName}
                  >
                    {nextStatuses.map((item) => (
                      <option key={item} value={item}>
                        {shipmentStatusLabel[item]}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="-mt-1 text-[11px] leading-relaxed text-gray-500">
                  Chỉ chọn trạng thái kế tiếp. Nếu chỉ có thay đổi về vị trí
                  hoặc nhiệt độ, hãy dùng phần “Ghi nhận vị trí & cảm biến”.
                </p>
                <Input
                  label="Vị trí *"
                  value={statusLocation}
                  onChange={setStatusLocation}
                  placeholder="Vị trí hiện tại / điểm giao"
                />
                <Input
                  label="Nhiệt độ (°C)"
                  type="number"
                  value={statusTemp}
                  onChange={setStatusTemp}
                />
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-gray-600">
                    Ghi chú
                  </span>
                  <textarea
                    value={statusNote}
                    onChange={(event) => setStatusNote(event.target.value)}
                    rows={3}
                    className={`${fieldClassName} h-auto resize-y py-2`}
                    placeholder="Mô tả việc cập nhật trạng thái"
                  />
                </label>
                <button
                  disabled={savingStatus}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  <Save size={14} />
                  {savingStatus
                    ? "Đang cập nhật..."
                    : `Xác nhận: ${shipmentStatusLabel[status]}`}
                </button>
              </form>
            )}
          </section>

          {shipment.receipt && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
              <p className="font-bold">Đã tiếp nhận hàng</p>
              <p className="mt-1">
                {shipment.receipt.receiverName} ·{" "}
                {shipmentDate(shipment.receipt.receivedAt)}
              </p>
              {shipment.receipt.receiverPhone && (
                <p className="mt-1 text-emerald-800">
                  Số điện thoại: {shipment.receipt.receiverPhone}
                </p>
              )}
              {shipment.receipt.note && (
                <p className="mt-1 text-emerald-800">{shipment.receipt.note}</p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={fieldClassName}
      />
    </label>
  );
}
