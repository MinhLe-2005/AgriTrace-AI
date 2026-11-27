import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return <select ref={ref} className={cn("h-10 w-full rounded-xl border border-[#E4DFD5] bg-white px-3.5 text-sm text-[#16261E] outline-none focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/15 disabled:cursor-not-allowed disabled:bg-[#F3EFE6]", className)} {...props}>{children}</select>;
});
