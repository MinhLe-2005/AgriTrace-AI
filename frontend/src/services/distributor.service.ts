import { api, unpack } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  CreateShipmentInput,
  DistributorDashboardStats,
  DistributorShipment,
  ShipmentReceipt,
  ShipmentStatus,
  TrackingEvent,
} from "@/features/distributor/types";

type ApiPayload<T> = ApiResponse<T> | T;

function payload<T>(value: ApiPayload<T>) {
  return unpack(value);
}

export const distributorService = {
  async getDashboard(): Promise<DistributorDashboardStats> {
    const { data } = await api.get<ApiPayload<DistributorDashboardStats>>("/distributor/dashboard");
    return payload(data);
  },

  async getShipments(params?: { status?: ShipmentStatus }): Promise<DistributorShipment[]> {
    const { data } = await api.get<ApiPayload<DistributorShipment[]>>("/distributor/shipments", { params });
    return payload(data);
  },

  async getShipment(shipmentCode: string): Promise<DistributorShipment> {
    const { data } = await api.get<ApiPayload<DistributorShipment>>(
      `/distributor/shipments/${encodeURIComponent(shipmentCode)}`
    );
    return payload(data);
  },

  async createShipment(input: CreateShipmentInput): Promise<DistributorShipment> {
    const { data } = await api.post<ApiPayload<DistributorShipment>>("/distributor/shipments", input);
    return payload(data);
  },

  async updateShipmentStatus(
    shipmentCode: string,
    input: Pick<TrackingEvent, "status" | "location" | "temperatureC" | "humidityPercent" | "note">
  ): Promise<DistributorShipment> {
    const { data } = await api.put<ApiPayload<DistributorShipment>>(
      `/distributor/shipments/${encodeURIComponent(shipmentCode)}/status`,
      input
    );
    return payload(data);
  },

  async addTrackingEvent(
    shipmentCode: string,
    input: Omit<TrackingEvent, "id" | "eventTime">
  ): Promise<DistributorShipment> {
    const { data } = await api.post<ApiPayload<DistributorShipment>>(
      `/distributor/shipments/${encodeURIComponent(shipmentCode)}/tracking-events`,
      input
    );
    return payload(data);
  },

  async receiveShipment(shipmentCode: string, receipt: ShipmentReceipt): Promise<DistributorShipment> {
    const { data } = await api.post<ApiPayload<DistributorShipment>>(
      `/distributor/shipments/${encodeURIComponent(shipmentCode)}/receive`,
      receipt
    );
    return payload(data);
  },

  async getHistory(): Promise<DistributorShipment[]> {
    const { data } = await api.get<ApiPayload<DistributorShipment[]>>("/distributor/shipments/history");
    return payload(data);
  },
};
