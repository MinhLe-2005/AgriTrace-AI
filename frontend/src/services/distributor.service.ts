import { api, unpack } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  CreateShipmentInput,
  DistributorDashboardStats,
  DistributorNotification,
  DistributorShipment,
  ShipmentChatMessage,
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

  async getNotifications(params?: { unreadOnly?: boolean }): Promise<DistributorNotification[]> {
    const { data } = await api.get<ApiPayload<DistributorNotification[]>>("/distributor/notifications", { params });
    return payload(data);
  },

  async getUnreadNotificationCount(): Promise<number> {
    const { data } = await api.get<ApiPayload<number>>("/distributor/notifications/unread-count");
    return payload(data);
  },

  async markNotificationRead(notificationId: string): Promise<DistributorNotification> {
    const { data } = await api.post<ApiPayload<DistributorNotification>>(
      `/distributor/notifications/${encodeURIComponent(notificationId)}/read`
    );
    return payload(data);
  },

  async markAllNotificationsRead(): Promise<number> {
    const { data } = await api.post<ApiPayload<number>>("/distributor/notifications/read-all");
    return payload(data);
  },

  async getShipmentMessages(shipmentCode: string): Promise<ShipmentChatMessage[]> {
    const { data } = await api.get<ApiPayload<ShipmentChatMessage[]>>(
      `/distributor/shipments/${encodeURIComponent(shipmentCode)}/messages`
    );
    return payload(data);
  },

  async sendShipmentMessage(shipmentCode: string, content: string): Promise<ShipmentChatMessage> {
    const { data } = await api.post<ApiPayload<ShipmentChatMessage>>(
      `/distributor/shipments/${encodeURIComponent(shipmentCode)}/messages`,
      { content }
    );
    return payload(data);
  },
};
