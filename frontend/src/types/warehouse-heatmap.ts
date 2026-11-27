import type { Balance, RiskAlert } from "./warehouse";
import type { SensorReading } from "./warehouse-monitoring";
export type HeatmapState = "GOOD" | "WARNING" | "DANGER" | "UNKNOWN" | "EMPTY";
export interface HeatmapSignal {
  state: HeatmapState;
  label: string;
}
export interface LocationCoordinates {
  row: number;
  column: number;
  level: number;
}
export interface HeatmapCell {
  locationId: string;
  code: string;
  name: string;
  active: boolean;
  layout:
    (LocationCoordinates & { updatedBy: string; updatedAt: string }) | null;
  capacityKg: number;
  quantityKg: number;
  heldKg: number;
  reservedKg: number;
  availableKg: number;
  occupancyPercent: number;
  earliestExpiry: string | null;
  capacity: HeatmapSignal;
  expiry: HeatmapSignal;
  temperature: HeatmapSignal;
  overall: HeatmapSignal;
  reading: SensorReading | null;
  measurementScope: "LOCATION" | "WAREHOUSE" | "NONE";
  temperaturePolicy: string;
  lots: Balance[];
  alerts: RiskAlert[];
}
export interface WarehouseHeatmap {
  warehouseId: string;
  generatedAt: string;
  expiryWarningDays: number;
  cells: HeatmapCell[];
  warehouseAlerts: number;
}
