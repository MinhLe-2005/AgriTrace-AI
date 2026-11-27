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
    <div className="bg-gradient-to-r from-[#16261E] via-[#1B3326] to-[#16261E] text-white p-5 sm:p-6 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-xl border border-[#243B2E]">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shrink-0">
          <Icon size={22} />
        </div>
        <div>
          <h1 className="font-serif text-lg sm:text-xl font-bold">{title}</h1>
          <p className="text-xs text-emerald-100/80 mt-0.5">{description}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold ${shipmentStatusClass[status]}`}>
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
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    emerald: "bg-emerald-50 text-[#166534] border-emerald-200",
    blue: "bg-[#F6F3EC] text-[#16261E] border-[#E4DFD5]",
    violet: "bg-[#F6F3EC] text-[#16261E] border-[#E4DFD5]",
  };
  return (
    <div className="bento-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono font-bold uppercase tracking-wide text-stone-500">{label}</p>
          <p className="text-2xl font-mono font-extrabold text-[#16261E] mt-1">{value}</p>
          <p className="text-[11px] text-stone-500 mt-1">{hint}</p>
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
