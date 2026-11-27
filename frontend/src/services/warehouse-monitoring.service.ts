import { api, unpack } from "@/lib/api";
import axios from "axios";
import type { ApiResponse } from "@/types/api";
import type {
  MonitoringSettings,
  SensorDevice,
  SensorSecret,
  MonitoringRule,
  MonitoringRuleInput,
  MonitoringRuleRevision,
  SensorReading,
  TelemetryInput,
  MonitoringStatus,
  NotificationDelivery,
} from "@/types/warehouse-monitoring";
async function get<T>(url: string, params?: object) {
  return unpack((await api.get<ApiResponse<T>>(url, { params })).data);
}
async function post<T>(url: string, body?: object) {
  return unpack((await api.post<ApiResponse<T>>(url, body)).data);
}
async function put<T>(url: string, body: object) {
  return unpack((await api.put<ApiResponse<T>>(url, body)).data);
}
const path = (id: string) => "/warehouses/" + id + "/monitoring";
const sensorApi = axios.create({
  baseURL: api.defaults.baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});
export const warehouseMonitoringService = {
  settings: (id: string) => get<MonitoringSettings>(path(id) + "/settings"),
  saveSettings: (
    id: string,
    body: Pick<
      MonitoringSettings,
      "maxGapSeconds" | "telegramEnabled" | "telegramChatId"
    >
  ) => put<MonitoringSettings>(path(id) + "/settings", body),
  devices: (id: string) => get<SensorDevice[]>(path(id) + "/devices"),
  createDevice: (
    id: string,
    body: { name: string; locationId: string | null; simulated: boolean }
  ) => post<SensorSecret>(path(id) + "/devices", body),
  disableDevice: (id: string, deviceId: string) =>
    put<SensorDevice>(path(id) + "/devices/" + deviceId + "/disable", {}),
  rules: (id: string) => get<MonitoringRule[]>(path(id) + "/rules"),
  ruleHistory: (id: string, ruleId: string, page = 0) =>
    get<MonitoringRuleRevision[]>(path(id) + "/rules/" + ruleId + "/history", {
      page,
    }),
  saveRule: (id: string, body: MonitoringRuleInput, ruleId?: string) =>
    ruleId
      ? put<MonitoringRule>(path(id) + "/rules/" + ruleId, body)
      : post<MonitoringRule>(path(id) + "/rules", body),
  latest: (id: string) => get<SensorReading[]>(path(id) + "/latest"),
  readings: (id: string, deviceId: string, from: string, to: string) =>
    get<SensorReading[]>(path(id) + "/readings", { deviceId, from, to }),
  status: (id: string) => get<MonitoringStatus>(path(id) + "/status"),
  evaluate: (id: string) => post<MonitoringStatus>(path(id) + "/evaluate"),
  deliveries: (id: string, page = 0) =>
    get<NotificationDelivery[]>(path(id) + "/deliveries", { page }),
  retryDelivery: (id: string, deliveryId: string) =>
    post<NotificationDelivery>(
      path(id) + "/deliveries/" + deliveryId + "/retry"
    ),
  ingest: async (input: TelemetryInput) =>
    unpack(
      (
        await sensorApi.post<ApiResponse<SensorReading>>(
          "/warehouse-telemetry",
          input
        )
      ).data
    ),
};
