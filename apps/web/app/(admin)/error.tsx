"use client";

import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AdminErrorProps {
  readonly error: Error;
  readonly reset: () => void;
}

export default function AdminError({
  error,
  reset,
}: AdminErrorProps): ReactElement {
  return (
    <main className="skam-container py-8">
      <Card className="grid gap-3 p-5">
        <h2 className="text-lg font-semibold">Không thể tải trang quản trị</h2>
        <p className="text-sm text-[var(--text-secondary)]">{error.message}</p>
        <div>
          <Button type="button" variant="neon-outline" onClick={reset}>
            Thử lại
          </Button>
        </div>
      </Card>
    </main>
  );
}
