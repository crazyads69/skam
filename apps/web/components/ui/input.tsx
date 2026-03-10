import type { InputHTMLAttributes, ReactElement } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps): ReactElement {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-border bg-surface-1 px-3 text-foreground placeholder:text-[var(--text-disabled)]",
        "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-neon",
        className,
      )}
      {...props}
    />
  );
}
