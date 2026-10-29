export type MonitoringRuleKind =
  | "TEMPERATURE_HIGH"
  | "TEMPERATURE_LOW"
  | "HUMIDITY_HIGH"
  | "HUMIDITY_LOW"
  | "NEAR_EXPIRY_HIGH_STOCK";
export interface MonitoringSettings {
  maxGapSeconds: number;
  telegramEnabled: boolean;
  telegramChatId: string | null;
  telegramConfigured: boolean;
}
export interface SensorDevice {
  id: string;
  warehouseId: string;
  locationId: string | null;
  name: string;
  active: boolean;
  simulated: boolean;
  createdAt: string;
  latestRecordedAt: string | null;
  lastReceivedAt: string | null;
}
export interface SensorSecret {
  device: SensorDevice;
  deviceKey: string;
}
export interface MonitoringRuleInput {
  name: string;
  kind: MonitoringRuleKind;
  locationId: string | null;
  threshold: number;
  durationMinutes: number;
  recoveryMinutes: number;
  minQuantityKg: number | null;
  severity: string;
  enabled: boolean;
}
export interface MonitoringRule extends MonitoringRuleInput {
  id: string;
  updatedBy: string;
  updatedAt: string;
}
export interface SensorReading {
  id: string;
  deviceId: string;
  locationId: string | null;
  deviceName: string;
  recordedAt: string;
  receivedAt: string;
  temperature: number;
  humidity: number;
  fresh: boolean;
  simulated: boolean;
}
export interface MonitoringRuleRevision {
  id: string;
  definition: MonitoringRuleInput;
  actor: string;
  createdAt: string;
}
export interface TelemetryInput {
  deviceId: string;
  deviceKey: string;
  messageId: string;
  recordedAt: string;
  temperature: number;
  humidity: number;
  simulated: boolean;
}
export interface MonitoringStatus {
  serverTime: string;
  activeDevices: number;
  freshDevices: number;
  maxGapSeconds: number;
}
export interface NotificationDelivery {
  id: string;
  alertId: string;
  status: string;
  attempts: number;
  lastError: string | null;
  nextAttemptAt: string;
  sentAt: string | null;
}
