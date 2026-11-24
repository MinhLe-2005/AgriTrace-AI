import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

const headerTones = {
  forest: "from-emerald-950 via-emerald-900 to-teal-800 border-emerald-800",
  ocean: "from-slate-900 via-blue-950 to-blue-800 border-blue-800",
  violet: "from-slate-900 via-violet-950 to-violet-800 border-violet-800",
  amber: "from-stone-950 via-amber-950 to-amber-800 border-amber-800",
  teal: "from-slate-900 via-teal-950 to-cyan-800 border-teal-800",
  indigo: "from-slate-950 via-indigo-950 to-indigo-800 border-indigo-800",
};

export function AdminPageHeader({ eyebrow = "Quản trị hệ thống", title, description, icon: Icon, action, tone = "forest", meta }: { eyebrow?: string; title: string; description: string; icon: LucideIcon; action?: ReactNode; tone?: keyof typeof headerTones; meta?: ReactNode }) {
  return <header className={cn("relative overflow-hidden rounded-2xl border bg-gradient-to-r p-5 text-white shadow-sm sm:p-6", headerTones[tone])}><div aria-hidden className="absolute -right-12 -top-20 size-52 rounded-full border border-white/10 bg-white/5" /><div aria-hidden className="absolute -bottom-20 right-20 size-40 rounded-full border border-white/10" /><div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-inner"><Icon size={23} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">{eyebrow}</p>{meta && <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">{meta}</span>}</div><h1 className="mt-1.5 text-xl font-bold tracking-tight sm:text-2xl">{title}</h1><p className="mt-1.5 max-w-3xl text-sm leading-6 text-white/70">{description}</p></div></div>{action && <div className="shrink-0">{action}</div>}</div></header>;
}

export function AdminStatCard({ label, value, helper, icon: Icon, tone = "neutral" }: { label: string; value: ReactNode; helper?: string; icon?: LucideIcon; tone?: "neutral" | "primary" | "success" | "warning" | "danger" }) {
  const styles = { neutral: "bg-muted text-muted-foreground", primary: "bg-primary/10 text-primary", success: "bg-success/15 text-success", warning: "bg-warning/15 text-warning", danger: "bg-danger/15 text-danger" }[tone];
  return <article className="rounded-xl border border-border bg-card p-4 shadow-xs"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{value}</p></div>{Icon && <span className={cn("flex size-9 items-center justify-center rounded-lg", styles)}><Icon size={17} /></span>}</div>{helper && <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{helper}</p>}</article>;
}

export function AdminSection({ title, description, action, children, className }: { title?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-xs", className)}>{(title || description || action) && <div className="flex flex-col gap-3 border-b border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"><div>{title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}{description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}</div>{action}</div>}{children}</section>;
}
