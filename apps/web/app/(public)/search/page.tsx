import { AmbientGlow } from "@/components/ambient-glow";
import { ResultCard } from "@/components/result-card";
import SearchFilters from "@/components/search/search-filters";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Pagination } from "@/components/ui/pagination";
import { getBanks, searchCases } from "@/lib/api";
import { normalizeUserText } from "@/lib/sanitize";
import { CaseStatus } from "@skam/shared/types";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Search,
  SearchX,
  Shield,
  ShieldCheck,
} from "lucide-react";
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
  const totalResults = payload?.total ?? 0;
  const previousHref = `/search?q=${encodeURIComponent(q)}${bankCode ? `&bankCode=${encodeURIComponent(bankCode)}` : ""}&page=${Math.max(1, page - 1)}`;
  const nextHref = `/search?q=${encodeURIComponent(q)}${bankCode ? `&bankCode=${encodeURIComponent(bankCode)}` : ""}&page=${Math.min(totalPages, page + 1)}`;

  return (
    <>
      <AmbientGlow />
      <main className="relative z-10">
        {/* ─── Search Hero ─── */}
        <section className="hero-scanline relative overflow-hidden border-b border-(--border-default) py-10 md:py-14">
          <div
            className="hero-grid pointer-events-none absolute inset-0"
            aria-hidden="true"
          />
          <div className="skam-container relative">
            <div className="mx-auto max-w-3xl">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-neon-ghost ring-1 ring-(--border-neon)">
                  <Search className="size-5 text-neon" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                    Tra cứu tài khoản
                  </h1>
                  <p className="text-xs text-(--text-tertiary)">
                    Kiểm tra dấu hiệu lừa đảo theo số tài khoản, tên hoặc ngân
                    hàng
                  </p>
                </div>
              </div>
              <GlassCard variant="neon" className="p-4 md:p-5">
                <SearchFilters
                  defaultQuery={q}
                  defaultBankCode={bankCode}
                  banks={banks?.data ?? []}
                />
              </GlassCard>
            </div>
          </div>
        </section>

        {/* ─── Results Area ─── */}
        <section className="skam-container py-8 md:py-10">
          {/* No query state */}
          {!q && (
            <div className="mx-auto max-w-2xl py-12 text-center">
              <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-neon-ghost ring-1 ring-(--border-neon)/40">
                <Shield
                  className="size-10 text-neon"
                  aria-hidden="true"
                  strokeWidth={1.5}
                />
              </div>
              <h2 className="mb-2 text-lg font-semibold">Tra cứu để bắt đầu</h2>
              <p className="mb-6 text-sm leading-relaxed text-(--text-secondary)">
                Nhập số tài khoản ngân hàng, tên người nhận, hoặc chọn ngân hàng
                để kiểm tra dấu hiệu lừa đảo từ cơ sở dữ liệu cộng đồng.
              </p>
              <div className="mx-auto grid max-w-md gap-3 sm:grid-cols-3">
                <GlassCard className="p-4 text-center">
                  <ShieldCheck
                    className="mx-auto mb-2 size-5 text-safe"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-(--text-secondary)">Đã xác minh</p>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                  <Search
                    className="mx-auto mb-2 size-5 text-info"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-(--text-secondary)">
                    Kết quả tức thì
                  </p>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                  <Shield
                    className="mx-auto mb-2 size-5 text-neon"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-(--text-secondary)">
                    Hoàn toàn ẩn danh
                  </p>
                </GlassCard>
              </div>
            </div>
          )}

          {/* Results header with count */}
          {q && (
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-(--text-secondary)">
                  {resultCount > 0 ? (
                    <>
                      Hiển thị{" "}
                      <span className="font-medium text-foreground">
                        {resultCount}
                      </span>{" "}
                      {totalResults > resultCount && (
                        <>/ {totalResults.toLocaleString("vi-VN")} </>
                      )}
                      kết quả cho{" "}
                      <span className="font-mono text-neon">
                        &quot;{q}&quot;
                      </span>
                    </>
                  ) : (
                    <>
                      Kết quả cho{" "}
                      <span className="font-mono text-neon">
                        &quot;{q}&quot;
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Empty results */}
          {q && resultCount === 0 && (
            <div className="mx-auto max-w-lg py-8 text-center">
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-(--status-warning-bg) ring-1 ring-(--status-warning)/20">
                <SearchX
                  className="size-8 text-warning"
                  aria-hidden="true"
                  strokeWidth={1.5}
                />
              </div>
              <h2 className="mb-2 text-lg font-semibold">
                Không tìm thấy kết quả
              </h2>
              <p className="mb-6 text-sm text-(--text-secondary)">
                Chưa có báo cáo được duyệt cho từ khóa &ldquo;
                <span className="font-mono text-foreground">{q}</span>
                &rdquo;
              </p>
              <GlassCard className="mx-auto max-w-sm p-5">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-(--text-tertiary)">
                  Gợi ý
                </p>
                <ul className="space-y-2 text-left text-sm text-(--text-secondary)">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 block size-1.5 shrink-0 rounded-full bg-neon" />
                    Kiểm tra lại chính tả hoặc thử số tài khoản khác
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 block size-1.5 shrink-0 rounded-full bg-neon" />
                    Thử tìm theo tên người nhận thay vì số tài khoản
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 block size-1.5 shrink-0 rounded-full bg-neon" />
                    Chọn ngân hàng cụ thể để thu hẹp kết quả
                  </li>
                </ul>
              </GlassCard>
              <div className="mt-6">
                <Link href="/report">
                  <Button variant="neon-outline" size="default">
                    <FileText className="size-4" aria-hidden="true" />
                    Gửi báo cáo mới
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Results grid */}
          {resultCount > 0 && (
            <>
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
                        lastReported={new Date(
                          item.createdAt,
                        ).toLocaleDateString("vi-VN")}
                        scammerName={item.scammerName}
                      />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                page={page}
                totalPages={totalPages}
                previousHref={previousHref}
                nextHref={nextHref}
              />
            </>
          )}

          {/* Not found? Report CTA */}
          {q && resultCount > 0 && (
            <GlassCard className="mt-8 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--status-danger-bg)">
                <AlertTriangle
                  className="size-5 text-danger"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Bạn là nạn nhân của tài khoản này?
                </p>
                <p className="mt-0.5 text-xs text-(--text-secondary)">
                  Gửi báo cáo để cảnh báo cộng đồng và giúp ngăn chặn lừa đảo.
                </p>
              </div>
              <Link href="/report">
                <Button variant="neon-outline" size="sm">
                  Gửi báo cáo
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </Link>
            </GlassCard>
          )}
        </section>
      </main>
    </>
  );
}
