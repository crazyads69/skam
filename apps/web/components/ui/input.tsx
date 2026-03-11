import type { InputHTMLAttributes, ReactElement } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({
  className,
  error,
  ...props
}: InputProps): ReactElement {
  return (
    <input
      aria-invalid={error || undefined}
      className={cn(
        "h-11 w-full rounded-lg border border-border bg-surface-1 px-3 text-sm leading-5 text-foreground placeholder:text-(--text-disabled)",
        "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-neon",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-danger focus:border-danger focus:ring-danger/20",
        className,
      )}
      {...props}
    />
  );
}
