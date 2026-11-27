import { type ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#E4DFD5] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#166534]">
          AGRITRACE BOTANICAL OS
        </span>
        <h1 className="font-serif mt-1 text-2xl font-bold tracking-tight text-[#16261E] sm:text-3xl">{title}</h1>
        <p className="mt-1 text-xs sm:text-sm text-stone-600">{description}</p>
      </div>
      {action}
    </div>
  );
}
