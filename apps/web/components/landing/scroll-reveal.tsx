"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";

type RevealDirection = "up" | "down" | "left" | "right" | "scale";

interface ScrollRevealProps {
  readonly children: ReactNode;
  readonly direction?: RevealDirection;
  readonly delay?: number;
  readonly duration?: number;
  readonly className?: string;
  readonly once?: boolean;
}

const directionStyles: Record<RevealDirection, string> = {
  up: "translate-y-8 opacity-0",
  down: "-translate-y-8 opacity-0",
  left: "translate-x-8 opacity-0",
  right: "-translate-x-8 opacity-0",
  scale: "scale-95 opacity-0",
};

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 600,
  className,
  once = true,
}: ScrollRevealProps): ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all",
        !isVisible && directionStyles[direction],
        className,
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </div>
  );
}
