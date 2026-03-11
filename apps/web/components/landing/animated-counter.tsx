"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";

interface AnimatedCounterProps {
  readonly end: number;
  readonly duration?: number;
  readonly suffix?: string;
  readonly prefix?: string;
  readonly locale?: string;
}

export function AnimatedCounter({
  end,
  duration = 2000,
  suffix,
  prefix,
  locale = "vi-VN",
}: AnimatedCounterProps): ReactElement {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) setHasStarted(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted || end === 0) return;
    const startTime = performance.now();
    let rafId: number;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [hasStarted, end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString(locale)}
      {suffix}
    </span>
  );
}
