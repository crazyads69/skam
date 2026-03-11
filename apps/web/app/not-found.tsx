import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export default function NotFoundPage(): ReactElement {
  return (
    <main className="skam-container flex min-h-[60vh] items-center justify-center py-16">
      <GlassCard className="mx-auto max-w-md p-8 text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-(--status-warning-bg) ring-1 ring-(--status-warning)/20">
          <SearchX
            className="size-7 text-warning"
            aria-hidden="true"
            strokeWidth={1.5}
          />
        </div>
        <p className="mb-2 font-mono text-3xl font-bold text-neon">404</p>
        <h1 className="mb-2 text-xl font-semibold">Không tìm thấy trang</h1>
        <p className="mb-6 text-sm leading-relaxed text-(--text-secondary)">
          Liên kết có thể đã thay đổi hoặc dữ liệu không còn khả dụng.
        </p>
        <Link href="/">
          <Button variant="neon-outline">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Quay về trang chủ
          </Button>
        </Link>
      </GlassCard>
    </main>
  );
}
