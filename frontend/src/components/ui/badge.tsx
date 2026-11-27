import { type ReactNode } from "react";

import { cn } from "@/utils/cn";

const tones = {
  neutral: "bg-[#F3EFE6] text-[#16261E] border border-[#E4DFD5]",
  success: "bg-emerald-50 text-[#166534] border border-emerald-200/80",
  warning: "bg-amber-50 text-[#A3630A] border border-amber-200/80",
  danger: "bg-rose-50 text-rose-700 border border-rose-200/80",
  primary: "bg-[#16261E] text-amber-300 border border-[#16261E]"
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold", tones[tone])}>{children}</span>;
}
