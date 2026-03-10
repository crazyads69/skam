import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "neon";
}

export function GlassCard({
  className,
  variant = "default",
  ...props
}: GlassCardProps) {
  return (
    <div
      data-slot="glass-card"
      className={cn(
        // Base glass effect
        "rounded-xl border backdrop-blur-[var(--glass-blur)]",
        "bg-[var(--glass-bg)] border-[var(--glass-border)]",
        "transition-all duration-300",
        // Variants
        variant === "default" && "shadow-[var(--shadow-sm)]",
        variant === "elevated" && [
          "bg-[var(--glass-bg-hover)]",
          "shadow-[var(--shadow-md)]",
        ],
        variant === "neon" && [
          "border-[var(--border-neon)]",
          "shadow-[var(--shadow-neon)]",
        ],
        className,
      )}
      {...props}
    />
  );
}
