import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-[#16261E] text-white hover:bg-[#166534] focus-visible:ring-[#166534] shadow-2xs",
  secondary: "border border-[#E4DFD5] bg-white text-[#16261E] hover:bg-[#F3EFE6] focus-visible:ring-[#166534]",
  danger: "bg-danger text-danger-foreground hover:bg-danger/90 focus-visible:ring-danger",
  ghost: "text-stone-600 hover:bg-[#F3EFE6] hover:text-[#16261E] focus-visible:ring-[#166534]"
};
const sizes: Record<ButtonSize, string> = { sm: "h-9 px-3.5 text-xs font-bold", md: "h-10 px-4 text-xs font-bold" };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...props },
  ref
) {
  return (
    <button ref={ref} className={cn("inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60", variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      {children}
    </button>
  );
});
