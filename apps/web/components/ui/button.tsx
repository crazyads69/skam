import type { ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "neon"
  | "neon-outline"
  | "ghost"
  | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: "default" | "lg" | "xl";
}

const variantMap: Record<ButtonVariant, string> = {
  default:
    "bg-primary text-primary-foreground hover:bg-neon-light shadow-[var(--shadow-neon)]",
  neon:
    "bg-primary text-primary-foreground font-semibold hover:bg-neon-light shadow-[var(--shadow-neon)] hover:shadow-[var(--shadow-neon-strong)]",
  "neon-outline":
    "border border-neon text-neon hover:bg-[var(--neon-green-ghost)]",
  ghost: "bg-transparent text-foreground hover:bg-surface-3",
  danger:
    "bg-destructive text-destructive-foreground hover:opacity-90 shadow-[var(--shadow-danger)]",
};

const sizeMap: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-10 px-4 text-sm rounded-md",
  lg: "h-11 px-6 text-base rounded-lg",
  xl: "h-12 px-8 text-base rounded-xl",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps): ReactElement {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all disabled:pointer-events-none disabled:opacity-50",
        variantMap[variant],
        sizeMap[size],
        className,
      )}
      {...props}
    />
  );
}
