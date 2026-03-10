import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { CaseStatus } from "@skam/shared/types";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import SearchFilters from "@/components/search/search-filters";
import { getBanks, searchCases } from "@/lib/api";
import { formatMoneyVnd } from "@/lib/utils";

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

export default async function SearchPage({
  searchParams,
}: SearchPageProps): Promise<ReactElement> {
  const params = await searchParams;
  const q: string = (params.q ?? "").trim();
  const bankCode: string | undefined = params.bankCode?.trim() || undefined;
  const page: number = Math.max(1, Number(params.page ?? "1") || 1);
  const payload = q
    ? await searchCases({ q, bankCode, page, pageSize: 10 })
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
        <Card className="p-5 text-sm text-[var(--text-secondary)]">
          Vui lòng nhập từ khóa tra cứu ở trang chủ.
        </Card>
      ) : null}
      {q ? (
        <Card className="mb-4 p-4">
          <SearchFilters
            defaultQuery={q}
            defaultBankCode={bankCode}
            banks={banks?.data ?? []}
          />
        </Card>
      ) : null}
      {q && payload?.data?.length === 0 ? (
        <Card className="p-5 text-sm text-[var(--text-secondary)]">
          Chưa có báo cáo được duyệt cho từ khóa này.
        </Card>
      ) : null}
      <div className="grid gap-4">
        {payload?.data?.map((item) => (
          <Link href={`/case/${item.id}`} key={item.id}>
            <Card className="p-5 transition-all hover:border-[var(--border-hover)]">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {item.bankName} · {item.bankCode}
                  </p>
                  <p className="font-mono text-lg">{item.bankIdentifier}</p>
                </div>
                <StatusBadge status={item.status ?? CaseStatus.PENDING} />
              </div>
              <p className="mb-3 line-clamp-2 text-sm text-[var(--text-secondary)]">
                {item.refinedDescription ?? item.originalDescription}
              </p>
              <p className="text-sm text-danger">
                Số tiền báo cáo: {formatMoneyVnd(item.amount)} VND
              </p>
            </Card>
          </Link>
        ))}
      </div>
      {q && payload && payload.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <Link
            href={previousHref}
            className={`rounded-lg px-4 py-2 text-sm ${page <= 1 ? "pointer-events-none border border-border text-[var(--text-disabled)]" : "border border-[var(--border-neon)] text-neon"}`}
          >
            Trang trước
          </Link>
          <p className="text-sm text-[var(--text-secondary)]">
            Trang {page.toLocaleString("vi-VN")} /{" "}
            {payload.totalPages.toLocaleString("vi-VN")}
          </p>
          <Link
            href={nextHref}
            className={`rounded-lg px-4 py-2 text-sm ${page >= payload.totalPages ? "pointer-events-none border border-border text-[var(--text-disabled)]" : "border border-[var(--border-neon)] text-neon"}`}
          >
            Trang sau
          </Link>
        </div>
      ) : null}
    </main>
  );
}
