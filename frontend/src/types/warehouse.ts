export interface Warehouse {
  id: string;
  name: string;
  location: string;
  managerId?: string;
  managerName?: string;
  capacityTons: number;
  tempTargetC: number;
  humidityTarget: number;
  active: boolean;
}
export type WarehouseInput = Pick<
  Warehouse,
  "name" | "location" | "capacityTons" | "tempTargetC" | "humidityTarget"
> & { managerId?: string | null };
export interface StorageLocation {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  capacityTons: number;
  tempTargetC: number;
  humidityTarget: number;
  active: boolean;
}
export type LocationInput = Pick<
  StorageLocation,
  "code" | "name" | "capacityTons" | "tempTargetC" | "humidityTarget"
>;
export interface LotSummary {
  id: string;
  productId: string;
  lotCode: string;
  expiryDate: string;
  initialQuantity: number;
  unit: string;
  status: string;
}
export interface Balance {
  id: string;
  warehouseId: string;
  locationId: string;
  lotId: string;
  productId: string;
  lotCode: string;
  expiryDate: string;
  quantityKg: number;
  reservedKg: number;
  availableKg: number;
  held: boolean;
  receivedAt: string;
}
export type DocumentType =
  "INBOUND" | "OUTBOUND" | "COUNT" | "ADJUSTMENT" | "TRANSFER";
export interface DocumentLine {
  lotId: string;
  locationId: string;
  targetLocationId?: string | null;
  quantityKg: number;
  expectedKg?: number;
}
export interface WarehouseDocument {
  id: string;
  warehouseId: string;
  targetWarehouseId?: string;
  reservationId?: string;
  type: DocumentType;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED" | "HANDED_OVER";
  note?: string;
  handoverReference?: string;
  createdBy: string;
  confirmedBy?: string;
  createdAt: string;
  confirmedAt?: string;
  handoverBy?: string;
  handedOverAt?: string;
  lines: DocumentLine[];
}
export interface DocumentInput {
  note: string;
  targetWarehouseId?: string | null;
  reservationId?: string | null;
  lines: DocumentLine[];
}
export interface Allocation {
  balanceId: string;
  lotId: string;
  locationId: string;
  lotCode: string;
  expiryDate: string;
  quantityKg: number;
}
export interface Reservation {
  id: string;
  orderId: number;
  status: string;
  expiresAt: string;
  lines: Allocation[];
}
export interface Inspection {
  id: string;
  balanceId: string;
  held: boolean;
  note: string;
  actor: string;
  createdAt: string;
}
export interface RiskRule {
  expiryWarningDays: number;
  staleDays: number;
  lowStockKg: number;
}
export interface RiskAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  status: string;
  updatedAt: string;
}
export interface AlertAction {
  id: string;
  status: string;
  note: string;
  actor: string;
  createdAt: string;
}
export interface Forecast {
  productId: string;
  availableKg: number;
  dailyOutboundKg: number;
  daysToClear?: number;
  earliestExpiry?: string;
  evidence: string;
  recommendation: string;
}
export interface Movement {
  id: string;
  lotId: string;
  locationId: string;
  documentId: string;
  type: string;
  deltaKg: number;
  balanceAfterKg: number;
  actor: string;
  occurredAt: string;
}
export interface WarehouseDashboard {
  onHandKg: number;
  reservedKg: number;
  availableKg: number;
  inboundKg: number;
  outboundKg: number;
  capacityKg: number;
  heldBalances: number;
  expiringBalances: number;
  openAlerts: number;
  draftDocuments: number;
  from: string;
  to: string;
}

export interface UnitConversion {
  productId: string;
  unit: string;
  kgPerUnit: number;
  updatedBy: string;
  updatedAt: string;
}
