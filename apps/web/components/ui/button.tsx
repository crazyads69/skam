import { type VariantProps, cva } from "class-variance-authority";
import { type ButtonHTMLAttributes, type ReactElement } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-neon-light hover:shadow-[var(--shadow-neon)]",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // SKAM custom variants
        neon: [
          "bg-[var(--neon-green)] text-black font-semibold",
          "shadow-[var(--shadow-neon)]",
          "hover:bg-[var(--neon-green-light)]",
          "hover:shadow-[var(--shadow-neon-strong)]",
          "active:bg-[var(--neon-green-dark)]",
          "transition-all duration-200",
        ].join(" "),
        "neon-outline": [
          "border border-[var(--neon-green)] text-[var(--neon-green)]",
          "bg-transparent",
          "hover:bg-[var(--neon-green-ghost)]",
          "hover:shadow-[var(--shadow-neon)]",
          "active:bg-[var(--neon-green-ghost)]",
        ].join(" "),
        danger: [
          "bg-destructive text-destructive-foreground font-semibold",
          "shadow-[var(--shadow-danger)]",
          "hover:bg-destructive/90",
        ].join(" "),
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-lg px-8 text-base has-[>svg]:px-5",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps): ReactElement {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { buttonVariants };
