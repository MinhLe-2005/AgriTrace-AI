import type { ComponentType } from "react";
import type { DistributorShipment, ShipmentStatus } from "@/features/distributor/types";
import { shipmentStatusClass, shipmentStatusLabel } from "@/features/distributor/types";

export function DistributorPageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  actions?: React.ReactNode;
}) {
  return (
    <div className="bg-amber-950 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm border border-amber-900">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-800 flex items-center justify-center text-white shrink-0">
          <Icon size={22} />
        </div>
        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          <p className="text-xs text-amber-200/80 mt-0.5">{description}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${shipmentStatusClass[status]}`}>
      {shipmentStatusLabel[status]}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "amber",
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone?: "amber" | "emerald" | "blue" | "violet";
}) {
  const colors = {
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{value}</p>
          <p className="text-[11px] text-gray-500 mt-1">{hint}</p>
        </div>
        <span className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colors[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

export function shipmentDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function shipmentTemperature(shipment: DistributorShipment) {
  return `${Number(shipment.temperatureC).toFixed(1)}°C`;
}
