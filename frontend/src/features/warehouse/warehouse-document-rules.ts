import type {
  Allocation,
  Balance,
  DocumentLine,
  DocumentType,
  StorageLocation,
} from "@/types/warehouse";

export function warehouseToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (name: string) =>
    parts.find((item) => item.type === name)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function eligibleIssueBalances(
  warehouseId: string,
  balances: Balance[],
  locations: StorageLocation[],
  today: string
) {
  const activeLocations = new Set(
    locations
      .filter(
        (location) => location.active && location.warehouseId === warehouseId
      )
      .map((location) => location.id)
  );
  return balances.filter(
    (balance) =>
      balance.warehouseId === warehouseId &&
      activeLocations.has(balance.locationId) &&
      !balance.held &&
      balance.expiryDate >= today &&
      balance.availableKg > 0
  );
}

function invalidPrecision(quantityKg: number, allowZero: boolean) {
  if (!Number.isFinite(quantityKg)) return true;
  if (allowZero ? quantityKg < 0 : quantityKg <= 0) return true;
  return Math.abs(quantityKg * 1000 - Math.round(quantityKg * 1000)) > 0.000001;
}

export function issueLineError(lines: DocumentLine[], balances: Balance[]) {
  const seen = new Set<string>();
  for (const [index, line] of lines.entries()) {
    const label = `Dòng ${index + 1}`;
    const key = `${line.lotId}:${line.locationId}`;
    const balance = balances.find(
      (item) => item.lotId === line.lotId && item.locationId === line.locationId
    );
    if (!balance) {
      return `${label}: vị trí đã chọn không có lô đủ điều kiện xuất. Hãy chọn lại lô và vị trí.`;
    }
    if (invalidPrecision(line.quantityKg, false)) {
      return `${label}: số lượng phải lớn hơn 0 và có tối đa 3 chữ số thập phân.`;
    }
    if (
      Math.round(line.quantityKg * 1000) >
      Math.round(balance.availableKg * 1000)
    ) {
      return `${label}: chỉ còn ${balance.availableKg.toLocaleString("vi-VN")} kg khả dụng tại vị trí này.`;
    }
    if (seen.has(key)) {
      return `${label}: lô và vị trí đã có ở dòng trước. Hãy gộp số lượng vào một dòng.`;
    }
    seen.add(key);
  }
  return lines.length ? null : "Thêm ít nhất một dòng hàng trước khi lưu.";
}

export function documentLineError(
  type: DocumentType,
  lines: DocumentLine[],
  warehouseId: string,
  targetWarehouseId: string,
  issueStock: Balance[]
) {
  if (!lines.length) return "Thêm ít nhất một dòng hàng trước khi lưu.";
  if (type === "OUTBOUND" || type === "TRANSFER") {
    const issueErr = issueLineError(lines, issueStock);
    if (issueErr) return issueErr;
    if (type === "TRANSFER") {
      if (!targetWarehouseId) return "Vui lòng chọn kho nhận.";
      for (const [index, line] of lines.entries()) {
        if (!line.targetLocationId) {
          return `Dòng ${index + 1}: vui lòng chọn vị trí nhận ở kho đích.`;
        }
        if (
          warehouseId === targetWarehouseId &&
          line.locationId === line.targetLocationId
        ) {
          return `Dòng ${index + 1}: vị trí nguồn và vị trí đích không được trùng nhau.`;
        }
      }
    }
    return null;
  }

  const count = type === "COUNT" || type === "ADJUSTMENT";
  const seen = new Set<string>();
  for (const [index, line] of lines.entries()) {
    const label = `Dòng ${index + 1}`;
    const lotId = line.lotId.trim();
    if (!lotId) {
      return `${label}: vui lòng chọn lô nông sản hoặc quét mã tem.`;
    }
    if (type === "INBOUND" && !/^[1-9][0-9]*$/.test(lotId)) {
      return `${label}: ID lô nhập kho phải là số nguyên dương hợp lệ.`;
    }
    if (!line.locationId) {
      return `${label}: vui lòng chọn vị trí lưu trữ.`;
    }
    if (invalidPrecision(line.quantityKg, count)) {
      return count
        ? `${label}: số lượng phải lớn hơn hoặc bằng 0 và có tối đa 3 chữ số thập phân.`
        : `${label}: số lượng phải lớn hơn 0 và có tối đa 3 chữ số thập phân.`;
    }
    const key = `${lotId}:${line.locationId}`;
    if (seen.has(key)) {
      return `${label}: lô và vị trí đã có ở dòng trước. Hãy gộp số lượng vào một dòng.`;
    }
    seen.add(key);
  }
  return null;
}

export function matchesFefoLines(
  lines: DocumentLine[],
  allocations: Allocation[]
) {
  const quantities = (
    items: { lotId: string; locationId: string; quantityKg: number }[]
  ) => {
    const result = new Map<string, number>();
    for (const item of items) {
      const key = `${item.lotId}:${item.locationId}`;
      result.set(
        key,
        (result.get(key) ?? 0) + Math.round(item.quantityKg * 1000)
      );
    }
    return result;
  };
  const actual = quantities(lines);
  const expected = quantities(allocations);
  return (
    actual.size === expected.size &&
    [...actual].every(([key, quantity]) => expected.get(key) === quantity)
  );
}
