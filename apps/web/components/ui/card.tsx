import type { HTMLAttributes, ReactElement } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps): ReactElement {
  return (
    <div
      className={cn(
        "rounded-xl border border-(--glass-border) bg-(--glass-bg) backdrop-blur-(--glass-blur) shadow-(--shadow-md)",
        className,
      )}
      {...props}
    />
  );
}
