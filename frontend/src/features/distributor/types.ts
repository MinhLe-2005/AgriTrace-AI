export type ShipmentStatus =
  | "PREPARING"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "RECEIVED"
  | "CANCELLED";

export type TrackingEvent = {
  id?: string | number;
  location: string;
  temperatureC?: number;
  humidityPercent?: number;
  status: ShipmentStatus;
  note?: string;
  eventTime: string;
};

export type ShipmentReceipt = {
  receiverName: string;
  receiverPhone?: string;
  note?: string;
  qrValue?: string;
  receivedAt: string;
};

export type DistributorShipment = {
  id?: string | number;
  shipmentCode: string;
  orderCodes: string[];
  driverName: string;
  driverPhone?: string;
  vehicleNumber: string;
  origin: string;
  destination: string;
  productSummary: string;
  lotCode: string;
  temperatureC: number;
  status: ShipmentStatus;
  dispatchTime?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  createdAt?: string;
  trackingEvents: TrackingEvent[];
  receipt?: ShipmentReceipt;
};

export type CreateShipmentInput = Pick<
  DistributorShipment,
  | "shipmentCode"
  | "orderCodes"
  | "driverName"
  | "driverPhone"
  | "vehicleNumber"
  | "origin"
  | "destination"
  | "productSummary"
  | "lotCode"
  | "temperatureC"
  | "dispatchTime"
  | "estimatedArrival"
>;

export type DistributorDashboardStats = {
  activeShipments: number;
  preparingShipments: number;
  deliveredToday: number;
  pendingReceipts: number;
  averageTemperatureC?: number;
};

export const shipmentStatusLabel: Record<ShipmentStatus, string> = {
  PREPARING: "Đang chuẩn bị",
  IN_TRANSIT: "Đang vận chuyển",
  DELIVERED: "Đã giao - chờ tiếp nhận",
  RECEIVED: "Đã tiếp nhận",
  CANCELLED: "Đã hủy",
};

export const shipmentStatusClass: Record<ShipmentStatus, string> = {
  PREPARING: "bg-sky-50 text-sky-700 border-sky-200",
  IN_TRANSIT: "bg-amber-50 text-amber-800 border-amber-200",
  DELIVERED: "bg-violet-50 text-violet-700 border-violet-200",
  RECEIVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

export function toShipmentStatus(value: string | undefined): ShipmentStatus {
  const normalized = value?.toUpperCase();
  if (
    normalized === "PREPARING" ||
    normalized === "IN_TRANSIT" ||
    normalized === "DELIVERED" ||
    normalized === "RECEIVED" ||
    normalized === "CANCELLED"
  ) {
    return normalized;
  }
  return "PREPARING";
}
