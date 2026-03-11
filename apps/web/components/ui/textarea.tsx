import type { ReactElement, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps): ReactElement {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-lg border border-border bg-surface-1 px-3 py-3 text-sm leading-5 text-foreground placeholder:text-(--text-disabled)",
        "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-neon",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
