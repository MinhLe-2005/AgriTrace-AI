import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn("h-10 w-full rounded-xl border border-[#E4DFD5] bg-white px-3.5 text-sm text-[#16261E] outline-none placeholder:text-stone-400 focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/15 disabled:cursor-not-allowed disabled:bg-[#F3EFE6]", className)} {...props} />;
});
