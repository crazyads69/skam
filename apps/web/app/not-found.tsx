import type { ReactElement } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFoundPage(): ReactElement {
  return (
    <main className="skam-container py-10">
      <Card className="mx-auto grid max-w-xl gap-4 p-6 text-center">
        <p className="text-xs text-[var(--text-tertiary)]">404</p>
        <h1 className="text-2xl font-semibold">Không tìm thấy trang</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Liên kết có thể đã thay đổi hoặc dữ liệu không còn khả dụng.
        </p>
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="neon-outline">Quay về trang chủ</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
