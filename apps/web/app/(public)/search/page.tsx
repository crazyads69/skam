import { AmbientGlow } from "@/components/ambient-glow";
import { ResultCard } from "@/components/result-card";
import SearchFilters from "@/components/search/search-filters";
import { GlassCard } from "@/components/ui/glass-card";
import { Pagination } from "@/components/ui/pagination";
import { getBanks, searchCases } from "@/lib/api";
import { normalizeUserText } from "@/lib/sanitize";
import { CaseStatus } from "@skam/shared/types";
import { SearchX, Shield } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "Kết quả tra cứu",
  description:
    "Tra cứu theo số tài khoản, tên hoặc ngân hàng để kiểm tra dấu hiệu lừa đảo.",
};

interface SearchPageProps {
  readonly searchParams: Promise<{
    q?: string;
    bankCode?: string;
    page?: string;
  }>;
}

const SEARCH_PAGE_SIZE = 10;

export default async function SearchPage({
  searchParams,
}: SearchPageProps): Promise<ReactElement> {
  const params = await searchParams;
  const q: string = normalizeUserText(params.q ?? "");
  const bankCode: string | undefined = params.bankCode?.trim() || undefined;
  const page: number = Math.max(1, Number(params.page ?? "1") || 1);
  const payload = q
    ? await searchCases({ q, bankCode, page, pageSize: SEARCH_PAGE_SIZE })
    : null;
  const banks = await getBanks().catch(() => null);
  const totalPages: number = payload?.totalPages ?? 1;
  const resultCount = payload?.data?.length ?? 0;
  const previousHref = `/search?q=${encodeURIComponent(q)}${bankCode ? `&bankCode=${encodeURIComponent(bankCode)}` : ""}&page=${Math.max(1, page - 1)}`;
  const nextHref = `/search?q=${encodeURIComponent(q)}${bankCode ? `&bankCode=${encodeURIComponent(bankCode)}` : ""}&page=${Math.min(totalPages, page + 1)}`;

  return (
    <>
      <AmbientGlow />
      <main className="skam-container relative z-10 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold tracking-tight md:text-3xl">
            Kết quả tra cứu
          </h1>
          {q ? (
            <p className="text-sm text-(--text-secondary)">
              Từ khóa: <span className="font-mono text-neon">{q}</span>
              {resultCount > 0 && (
                <span className="ml-2 text-(--text-tertiary)">
                  — {resultCount} kết quả
                </span>
              )}
            </p>
          ) : (
            <p className="text-sm text-(--text-secondary)">
              Nhập từ khóa để bắt đầu tra cứu.
            </p>
          )}
        </div>

        {/* No query state */}
        {!q && (
          <GlassCard className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-neon-ghost">
              <Shield className="size-7 text-neon" aria-hidden="true" />
            </div>
            <p className="text-(--text-secondary)">
              Vui lòng nhập số tài khoản hoặc tên người nhận ở ô tìm kiếm phía
              trên.
            </p>
          </GlassCard>
        )}

        {/* Filters */}
        {q && (
          <GlassCard className="mb-6 p-4">
            <SearchFilters
              defaultQuery={q}
              defaultBankCode={bankCode}
              banks={banks?.data ?? []}
            />
          </GlassCard>
        )}

        {/* Empty results */}
        {q && resultCount === 0 && (
          <GlassCard className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-(--status-warning-bg)">
              <SearchX className="size-7 text-warning" aria-hidden="true" />
            </div>
            <div>
              <p className="mb-1 font-medium">Không tìm thấy kết quả</p>
              <p className="text-sm text-(--text-secondary)">
                Chưa có báo cáo được duyệt cho từ khóa &ldquo;
                <span className="font-mono text-foreground">{q}</span>
                &rdquo;. Thử tìm kiếm với từ khóa khác.
              </p>
            </div>
          </GlassCard>
        )}

        {/* Results grid */}
        {resultCount > 0 && (
          <div className="stagger-children grid gap-4 sm:grid-cols-2">
            {payload?.data?.map((item) => (
              <Link
                href={`/case/${item.id}`}
                key={item.id}
                className="block cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-neon focus-visible:outline-offset-2"
              >
                <div className="group h-full transition-transform duration-300 hover:-translate-y-1">
                  <ResultCard
                    status={item.status ?? CaseStatus.PENDING}
                    bankName={item.bankName}
                    accountNumber={item.bankIdentifier}
                    reportCount={item.viewCount}
                    lastReported={new Date(item.createdAt).toLocaleDateString(
                      "vi-VN",
                    )}
                    scammerName={item.scammerName}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {q && (
          <Pagination
            page={page}
            totalPages={totalPages}
            previousHref={previousHref}
            nextHref={nextHref}
          />
        )}
      </main>
    </>
  );
}
