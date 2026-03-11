import Link from "next/link";
import type { ReactElement } from "react";
import { Button } from "./button";

interface PaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly previousHref: string;
  readonly nextHref: string;
}

export function Pagination({
  page,
  totalPages,
  previousHref,
  nextHref,
}: PaginationProps): ReactElement | null {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      {page > 1 ? (
        <Link href={previousHref}>
          <Button variant="neon-outline">Trang trước</Button>
        </Link>
      ) : null}
      <span className="text-sm text-[var(--text-secondary)]">
        Trang {page.toLocaleString("vi-VN")} /{" "}
        {totalPages.toLocaleString("vi-VN")}
      </span>
      {page < totalPages ? (
        <Link href={nextHref}>
          <Button variant="neon-outline">Trang sau</Button>
        </Link>
      ) : null}
    </div>
  );
}
