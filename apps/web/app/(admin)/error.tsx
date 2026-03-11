"use client";

import type { ReactElement } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

interface AdminErrorProps {
  readonly error: Error;
  readonly reset: () => void;
}

export default function AdminError({
  error,
  reset,
}: AdminErrorProps): ReactElement {
  return (
    <main className="skam-container flex min-h-[40vh] items-center justify-center py-16">
      <GlassCard className="mx-auto max-w-md p-8 text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-(--status-danger-bg) ring-1 ring-(--status-danger)/20">
          <AlertTriangle
            className="size-7 text-danger"
            aria-hidden="true"
            strokeWidth={1.5}
          />
        </div>
        <h2 className="mb-2 text-lg font-semibold">
          Không thể tải trang quản trị
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-(--text-secondary)">
          {error.message}
        </p>
        <Button type="button" variant="neon-outline" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Thử lại
        </Button>
      </GlassCard>
    </main>
  );
}
