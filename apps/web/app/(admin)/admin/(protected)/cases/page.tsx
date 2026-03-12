import type { ReactElement } from "react";
import Link from "next/link";
import { CaseStatus } from "@skam/shared/types";
import { listAdminCases } from "@/lib/api";
import { requireAdminToken } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Inbox } from "lucide-react";

interface AdminCasesPageProps {
  readonly searchParams: Promise<{ status?: CaseStatus; page?: string }>;
}

export default async function AdminCasesPage({
  searchParams,
}: AdminCasesPageProps): Promise<ReactElement> {
  const token = await requireAdminToken();
  const { status, page: pageParam } = await searchParams;
  const currentPage: number = Math.max(1, Number(pageParam) || 1);
  const pageSize: number = 50;
  const payload = await listAdminCases(
    token,
    status,
    currentPage,
    pageSize,
  ).catch(() => null);
  const selectedStatus: string = status ?? "all";
  const totalPages: number = payload?.totalPages ?? 1;
  return (
    <section className="grid gap-3">
      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/cases">
            <Button
              variant={selectedStatus === "all" ? "neon" : "ghost"}
              size="sm"
            >
              Tất cả
            </Button>
          </Link>
          <Link href={`/admin/cases?status=${CaseStatus.PENDING}`}>
            <Button
              variant={
                selectedStatus === CaseStatus.PENDING ? "neon" : "neon-outline"
              }
              size="sm"
            >
              Chờ duyệt
            </Button>
          </Link>
          <Link href={`/admin/cases?status=${CaseStatus.APPROVED}`}>
            <Button
              variant={
                selectedStatus === CaseStatus.APPROVED ? "neon" : "ghost"
              }
              size="sm"
            >
              Đã duyệt
            </Button>
          </Link>
          <Link href={`/admin/cases?status=${CaseStatus.REJECTED}`}>
            <Button
              variant={
                selectedStatus === CaseStatus.REJECTED ? "danger" : "ghost"
              }
              size="sm"
            >
              Từ chối
            </Button>
          </Link>
        </div>
      </GlassCard>

      {payload?.data?.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-3 p-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-(--status-warning-bg)">
            <Inbox className="size-5 text-warning" aria-hidden="true" />
          </div>
          <p className="text-sm text-(--text-secondary)">
            Không có vụ việc theo bộ lọc hiện tại.
          </p>
        </GlassCard>
      ) : null}

      {payload?.data?.map((item) => (
        <Link href={`/admin/cases/${item.id}`} key={item.id}>
          <GlassCard className="transition-all duration-200 hover:border-neon/30 hover:shadow-[0_0_12px_rgba(0,255,128,0.08)]">
            <div className="p-5">
              <div className="mb-2 flex items-center justify-between gap-4">
                <p className="font-mono text-sm font-medium">
                  {item.bankCode} · {item.bankIdentifier}
                </p>
                <StatusBadge status={item.status} />
              </div>
              <p className="line-clamp-2 text-sm leading-relaxed text-(--text-secondary)">
                {item.originalDescription}
              </p>
            </div>
          </GlassCard>
        </Link>
      ))}

      {totalPages > 1 ? (
        <GlassCard className="flex items-center justify-center gap-2 p-4">
          {currentPage > 1 ? (
            <Link
              href={`/admin/cases?${new URLSearchParams({ ...(status ? { status } : {}), page: String(currentPage - 1) }).toString()}`}
            >
              <Button variant="ghost" size="sm">
                &larr; Trước
              </Button>
            </Link>
          ) : null}
          <span className="text-sm text-(--text-secondary)">
            Trang {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link
              href={`/admin/cases?${new URLSearchParams({ ...(status ? { status } : {}), page: String(currentPage + 1) }).toString()}`}
            >
              <Button variant="ghost" size="sm">
                Sau &rarr;
              </Button>
            </Link>
          ) : null}
        </GlassCard>
      ) : null}
    </section>
  );
}
