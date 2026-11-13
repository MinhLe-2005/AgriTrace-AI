import { api, unpack } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  Warehouse,
  WarehouseInput,
  StorageLocation,
  LocationInput,
  Balance,
  LotSummary,
  DocumentType,
  WarehouseDocument,
  DocumentInput,
  Reservation,
  Allocation,
  Inspection,
  RiskAlert,
  RiskRule,
  AlertAction,
  Forecast,
  Movement,
  WarehouseDashboard,
  UnitConversion,
} from "@/types/warehouse";
async function get<T>(url: string, params?: object) {
  return unpack((await api.get<ApiResponse<T>>(url, { params })).data);
}
async function post<T>(url: string, body?: object) {
  return unpack((await api.post<ApiResponse<T>>(url, body)).data);
}
async function put<T>(url: string, body?: object) {
  return unpack((await api.put<ApiResponse<T>>(url, body)).data);
}
const path = (id: string) => "/warehouses/" + id;
export const warehouseService = {
  all: () => get<Warehouse[]>("/warehouses"),
  save: (input: WarehouseInput, id?: string) =>
    id
      ? put<Warehouse>(path(id), input)
      : post<Warehouse>("/warehouses", input),
  status: (id: string, active: boolean) =>
    put<Warehouse>(path(id) + "/status", { active }),
  locations: (id: string) => get<StorageLocation[]>(path(id) + "/locations"),
  saveLocation: (id: string, input: LocationInput, locationId?: string) =>
    locationId
      ? put<StorageLocation>(path(id) + "/locations/" + locationId, input)
      : post<StorageLocation>(path(id) + "/locations", input),
  locationStatus: (id: string, locationId: string, active: boolean) =>
    put<StorageLocation>(path(id) + "/locations/" + locationId + "/status", {
      active,
    }),
  lots: (id: string) =>
    get<LotSummary[]>(path(id) + "/inbound-receipts/eligible-lots"),
  stock: async (id: string) => {
    const balances = new Map<string, Balance>();
    for (let page = 0; ; page++) {
      const rows = await get<Balance[]>(path(id) + "/inventory", {
        page,
        size: 500,
      });
      rows.forEach((row) => balances.set(row.id, row));
      if (rows.length < 500) return [...balances.values()];
    }
  },
  conversions: (id: string) =>
    get<UnitConversion[]>(path(id) + "/unit-conversions"),
  saveConversion: (
    id: string,
    input: Pick<UnitConversion, "productId" | "unit" | "kgPerUnit">
  ) => put<UnitConversion>(path(id) + "/unit-conversions", input),
  documents: (id: string, page = 0) =>
    get<WarehouseDocument[]>(path(id) + "/documents", { page }),
  createDocument: (id: string, type: DocumentType, input: DocumentInput) =>
    post<WarehouseDocument>(path(id) + "/documents/" + type, input),
  confirm: (id: string, documentId: string) =>
    put<WarehouseDocument>(path(id) + "/documents/" + documentId + "/confirm"),
  cancel: (id: string, documentId: string) =>
    put<WarehouseDocument>(path(id) + "/documents/" + documentId + "/cancel"),
  receive: (
    id: string,
    documentId: string,
    lines: { lineId: string; receivedKg: number }[],
    note: string
  ) =>
    put<WarehouseDocument>(path(id) + "/documents/" + documentId + "/receive", {
      lines,
      note,
    }),
  handover: (id: string, documentId: string, reference: string) =>
    put<WarehouseDocument>(
      path(id) + "/documents/" + documentId + "/handover",
      { reference }
    ),
  fefo: (id: string, productId: string, quantityKg: number) =>
    post<Allocation[]>(path(id) + "/fefo", { productId, quantityKg }),
  reserve: (
    id: string,
    orderId: number,
    productId: string,
    quantityKg: number,
    ttlMinutes: number
  ) =>
    post<Reservation>(path(id) + "/reservations", {
      orderId,
      productId,
      quantityKg,
      ttlMinutes,
    }),
  reservations: (id: string, page = 0) =>
    get<Reservation[]>(path(id) + "/reservations", { page }),
  release: (id: string, reservationId: string) =>
    put<Reservation>(path(id) + "/reservations/" + reservationId + "/release"),
  reconcile: (id: string, reservationId: string) =>
    put<Reservation>(
      path(id) + "/reservations/" + reservationId + "/reconcile"
    ),
  inspect: (id: string, balanceId: string, held: boolean, note: string) =>
    post<Inspection>(path(id) + "/inspections", { balanceId, held, note }),
  inspections: (id: string, page = 0) =>
    get<Inspection[]>(path(id) + "/inspections", { page }),
  rules: (id: string) => get<RiskRule>(path(id) + "/risk-rules"),
  saveRules: (id: string, rules: RiskRule) =>
    put<RiskRule>(path(id) + "/risk-rules", rules),
  alerts: (id: string) => get<RiskAlert[]>(path(id) + "/alerts"),
  refreshAlerts: (id: string) =>
    post<RiskAlert[]>(path(id) + "/alerts/refresh"),
  act: (id: string, alertId: string, status: string, note: string) =>
    put<RiskAlert>(path(id) + "/alerts/" + alertId, { status, note }),
  alertHistory: (id: string, alertId: string) =>
    get<AlertAction[]>(path(id) + "/alerts/" + alertId + "/history"),
  forecast: (id: string) => get<Forecast[]>(path(id) + "/forecast"),
  movements: (id: string, from: string, to: string, page = 0) =>
    get<Movement[]>(path(id) + "/movements", { from, to, page }),
  dashboard: (id: string, from: string, to: string) =>
    get<WarehouseDashboard>(path(id) + "/dashboard", { from, to }),
};
