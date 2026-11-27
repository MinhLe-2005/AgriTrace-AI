import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

const headerTones = {
  forest: {
    pill: "bg-[#166534]/10 text-[#166534] border-[#166534]/25",
    iconBox: "bg-[#16261E] text-amber-300 border-[#16261E]",
    stripe: "from-[#166534] via-[#A3630A] to-[#16261E]",
  },
  ocean: {
    pill: "bg-blue-50 text-blue-800 border-blue-200",
    iconBox: "bg-blue-950 text-sky-300 border-blue-900",
    stripe: "from-blue-700 via-sky-600 to-slate-900",
  },
  violet: {
    pill: "bg-indigo-50 text-indigo-800 border-indigo-200",
    iconBox: "bg-indigo-950 text-amber-300 border-indigo-900",
    stripe: "from-indigo-700 via-purple-600 to-slate-900",
  },
  amber: {
    pill: "bg-amber-50 text-[#A3630A] border-amber-300/80",
    iconBox: "bg-[#2C1A04] text-amber-300 border-amber-900",
    stripe: "from-[#A3630A] via-amber-500 to-[#166534]",
  },
  teal: {
    pill: "bg-teal-50 text-teal-800 border-teal-200",
    iconBox: "bg-teal-950 text-emerald-300 border-teal-900",
    stripe: "from-teal-700 via-emerald-600 to-slate-900",
  },
  indigo: {
    pill: "bg-slate-100 text-slate-800 border-slate-300",
    iconBox: "bg-slate-900 text-amber-300 border-slate-800",
    stripe: "from-slate-800 via-[#166534] to-[#A3630A]",
  },
};

export function AdminPageHeader({
  eyebrow = "TRUNG TÂM ĐIỀU HÀNH AGRITRACE AI",
  title,
  description,
  icon: Icon,
  action,
  tone = "forest",
  meta,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  action?: ReactNode;
  tone?: keyof typeof headerTones;
  meta?: ReactNode;
}) {
  const t = headerTones[tone] ?? headerTones.forest;

  return (
    <header className="relative overflow-hidden rounded-2xl border border-[#E4DFD5] bg-white p-5 sm:p-7 shadow-xs">
      {/* Top Signature Editorial Accent Line */}
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", t.stripe)} />

      {/* Subtle Architectural Grid Watermark on Right */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-72 editorial-grid-bg opacity-70 [mask-image:linear-gradient(to_left,black,transparent)]"
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className={cn(
              "flex size-12 sm:size-13 shrink-0 items-center justify-center rounded-2xl border shadow-sm",
              t.iconBox
            )}
          >
            <Icon size={22} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                {eyebrow}
              </p>
              {meta && (
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold",
                    t.pill
                  )}
                >
                  {meta}
                </span>
              )}
            </div>
            <h1 className="font-serif mt-1 text-xl font-bold tracking-tight text-[#16261E] sm:text-2xl lg:text-[26px]">
              {title}
            </h1>
            <p className="mt-1 max-w-3xl text-xs sm:text-sm leading-relaxed text-stone-600">
              {description}
            </p>
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}

export function AdminStatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  helper?: string;
  icon?: LucideIcon;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
}) {
  const iconStyles = {
    neutral: "bg-[#F6F3EC] text-[#16261E] border-[#E4DFD5]",
    primary: "bg-emerald-50 text-[#166534] border-emerald-200",
    success: "bg-emerald-50 text-[#166534] border-emerald-200",
    warning: "bg-amber-50 text-[#A3630A] border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
  }[tone];

  const dotColor = {
    neutral: "bg-stone-500",
    primary: "bg-[#166534]",
    success: "bg-[#166534]",
    warning: "bg-[#A3630A]",
    danger: "bg-rose-600",
  }[tone];

  return (
    <article className="bento-card relative overflow-hidden p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full shrink-0", dotColor)} />
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-stone-500 truncate">
              {label}
            </p>
          </div>
          <p className="mt-2.5 font-mono text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#16261E]">
            {value}
          </p>
        </div>
        {Icon && (
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-xl border shrink-0",
              iconStyles
            )}
          >
            <Icon size={18} />
          </span>
        )}
      </div>
      {helper && (
        <p className="mt-3 pt-2.5 border-t border-[#F0ECE1] text-[11px] font-medium leading-4 text-stone-500">
          {helper}
        </p>
      )}
    </article>
  );
}

export function AdminSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("bento-card overflow-hidden", className)}>
      {(title || description || action) && (
        <div className="flex flex-col gap-3 border-b border-[#E4DFD5] bg-[#FBF9F5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h2 className="font-serif text-base font-bold text-[#16261E]">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-stone-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
