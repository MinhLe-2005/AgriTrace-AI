"use client";

import { useMemo } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ALERT_TYPE_LABELS,
  WarehouseErrorNotice,
  WarehouseStatusBadge,
  WarehouseTable,
} from "./warehouse-utils";
import type { RiskAlert, RiskRule } from "@/types/warehouse";

interface Props {
  alerts: RiskAlert[];
  rules?: RiskRule;
  alertsError: unknown;
  rulesError: unknown;
  busy: boolean;
  statusFilter: string;
  onStatusFilterChange: (next: string) => void;
  onRefreshAlerts: () => void;
  onReconcileEndOfDay: () => void;
  onConfigureRules: () => void;
  onActAlert: (alert: RiskAlert, targetStatus: "ACKNOWLEDGED" | "RESOLVED") => void;
  onViewHistory: (alertId: string) => void;
}

export function WarehouseAlertsTab({
  alerts,
  rules,
  alertsError,
  rulesError,
  busy,
  statusFilter,
  onStatusFilterChange,
  onRefreshAlerts,
  onReconcileEndOfDay,
  onConfigureRules,
  onActAlert,
  onViewHistory,
}: Props) {
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (statusFilter === "OPEN_ALL") return a.status !== "RESOLVED";
      if (statusFilter !== "ALL") return a.status === statusFilter;
      return true;
    });
  }, [alerts, statusFilter]);

  return (
    <>
      <div className="flex gap-2">
        <Button disabled={busy} onClick={onRefreshAlerts}>
          Quét cảnh báo
        </Button>
        <Button variant="secondary" disabled={busy} onClick={onReconcileEndOfDay}>
          Đối soát cuối ngày
        </Button>
        <Button variant="secondary" disabled={!rules} onClick={onConfigureRules}>
          Cấu hình ngưỡng
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            ["ALL", "Tất cả"],
            ["OPEN_ALL", "Chưa hoàn tất"],
            ["OPEN", "Chưa xử lý"],
            ["ACKNOWLEDGED", "Đang xử lý"],
            ["RESOLVED", "Đã xử lý"],
          ] as const
        ).map(([statusKey, label]) => (
          <button
            key={statusKey}
            type="button"
            onClick={() => onStatusFilterChange(statusKey)}
            className={
              "rounded-[2px] border px-2.5 py-1 text-xs font-medium transition " +
              (statusFilter === statusKey
                ? "border-emerald-700 bg-emerald-700 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50")
            }
          >
            {label}
          </button>
        ))}
      </div>
      <WarehouseErrorNotice error={alertsError} />
      <WarehouseErrorNotice error={rulesError} />
      <p className="text-xs text-slate-500">
        Nhấn Quét cảnh báo sau khi thay đổi tồn hoặc ngưỡng. Nếu điều kiện vẫn
        tồn tại, cảnh báo đã hoàn tất sẽ mở lại ở lần quét sau.
      </p>
      <WarehouseTable
        head={["Mức độ", "Loại", "Nội dung", "Trạng thái", "Thao tác"]}
        empty={!filteredAlerts.length}
      >
        {filteredAlerts.map((a) => (
          <tr key={a.id}>
            <td>
              <span
                className={
                  "inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-0.5 text-[11px] font-semibold " +
                  (a.severity === "CRITICAL"
                    ? "border-rose-300 bg-rose-50 text-rose-900"
                    : a.severity === "HIGH"
                      ? "border-orange-300 bg-orange-50 text-orange-900"
                      : "border-amber-300 bg-amber-50 text-amber-900")
                }
              >
                <ShieldAlert size={12} />
                {{
                  CRITICAL: "Khẩn cấp",
                  HIGH: "Cao",
                  MEDIUM: "Trung bình",
                }[a.severity] ?? a.severity}
              </span>
            </td>
            <td>{ALERT_TYPE_LABELS[a.type] ?? a.type}</td>
            <td>{a.message}</td>
            <td>
              <WarehouseStatusBadge value={a.status} />
            </td>
            <td>
              <div className="flex flex-wrap gap-2">
                {a.status !== "RESOLVED" &&
                  (["ACKNOWLEDGED", "RESOLVED"] as const).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant="secondary"
                      onClick={() => onActAlert(a, status)}
                    >
                      {status === "RESOLVED" ? "Hoàn tất" : "Tiếp nhận"}
                    </Button>
                  ))}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewHistory(a.id)}
                >
                  Lịch sử
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </WarehouseTable>
    </>
  );
}
