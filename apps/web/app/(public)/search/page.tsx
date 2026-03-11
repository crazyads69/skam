import { ResultCard } from "@/components/result-card";
import SearchFilters from "@/components/search/search-filters";
import { GlassCard } from "@/components/ui/glass-card";
import { Pagination } from "@/components/ui/pagination";
import { getBanks, searchCases } from "@/lib/api";
import { normalizeUserText } from "@/lib/sanitize";
import { CaseStatus } from "@skam/shared/types";
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
  const previousHref = `/search?q=${encodeURIComponent(q)}${bankCode ? `&bankCode=${encodeURIComponent(bankCode)}` : ""}&page=${Math.max(1, page - 1)}`;
  const nextHref = `/search?q=${encodeURIComponent(q)}${bankCode ? `&bankCode=${encodeURIComponent(bankCode)}` : ""}&page=${Math.min(totalPages, page + 1)}`;

  return (
    <main className="skam-container py-8">
      <h1 className="mb-2 text-2xl font-semibold">Kết quả tra cứu</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">
        Từ khóa:{" "}
        <span className="font-mono text-foreground">{q || "trống"}</span>
      </p>
      {!q ? (
        <GlassCard className="p-5 text-sm text-[var(--text-secondary)]">
          Vui lòng nhập từ khóa tra cứu ở trang chủ.
        </GlassCard>
      ) : null}
      {q ? (
        <GlassCard className="mb-6 p-4">
          <SearchFilters
            defaultQuery={q}
            defaultBankCode={bankCode}
            banks={banks?.data ?? []}
          />
        </GlassCard>
      ) : null}
      {q && payload?.data?.length === 0 ? (
        <GlassCard className="p-5 text-sm text-[var(--text-secondary)]">
          Chưa có báo cáo được duyệt cho từ khóa này.
        </GlassCard>
      ) : null}
      <div className="grid gap-4">
        {payload?.data?.map((item) => (
          <Link href={`/case/${item.id}`} key={item.id} className="block">
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
      {q ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          previousHref={previousHref}
          nextHref={nextHref}
        />
      ) : null}
    </main>
  );
}
