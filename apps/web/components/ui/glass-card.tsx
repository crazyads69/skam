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
        "rounded-xl border backdrop-blur-(--glass-blur)",
        "bg-(--glass-bg) border-(--glass-border)",
        "transition-all duration-300",
        // Variants
        variant === "default" && "shadow-(--shadow-sm)",
        variant === "elevated" && [
          "bg-(--glass-bg-hover)",
          "shadow-(--shadow-md)",
        ],
        variant === "neon" && [
          "border-(--border-neon)",
          "shadow-(--shadow-neon)",
        ],
        className,
      )}
      {...props}
    />
  );
}
