import type { Metadata } from "next";
import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { getCase, getPublicEvidenceViewUrl } from "@/lib/api";
import { resolveEvidenceUrls } from "@/lib/evidence-urls";
import { formatMoneyVnd } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Eye,
  ExternalLink,
  FileText,
  Shield,
  User,
} from "lucide-react";

interface CaseDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CaseDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Chi tiết vụ việc ${id}`,
    description:
      "Xem chi tiết vụ việc lừa đảo đã được duyệt, bao gồm thông tin tài khoản và bằng chứng liên quan.",
  };
}

export default async function CaseDetailPage({
  params,
}: CaseDetailPageProps): Promise<ReactElement> {
  const { id } = await params;
  const response = await getCase(id).catch(() => null);
  const data = response?.data;
  if (!response?.success || !data) notFound();
  const evidenceUrls = await resolveEvidenceUrls(
    data.evidenceFiles ?? [],
    (f) => getPublicEvidenceViewUrl(id, f.id),
  );
  return (
    <main className="skam-container py-8 md:py-12">
      {/* Back nav */}
      <div className="mb-6">
        <Link
          href="/search"
          className="group inline-flex items-center gap-1.5 text-sm text-(--text-secondary) transition-colors hover:text-neon"
        >
          <ArrowLeft
            className="size-4 transition-transform group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          Quay lại tra cứu
        </Link>
      </div>

      <div className="mx-auto max-w-3xl space-y-4">
        {/* Header card */}
        <GlassCard variant="neon" className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2 text-xs text-(--text-tertiary)">
                <Shield className="size-3.5" aria-hidden="true" />
                {data.bankName} · {data.bankCode}
              </div>
              <p className="font-mono text-2xl font-bold md:text-3xl">
                {data.bankIdentifier}
              </p>
              {data.scammerName && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-(--text-secondary)">
                  <User className="size-3.5" aria-hidden="true" />
                  {data.scammerName}
                </p>
              )}
            </div>
            <StatusBadge status={data.status} />
          </div>
        </GlassCard>

        {/* Description */}
        <GlassCard className="p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-(--text-tertiary)">
            <FileText className="size-4" aria-hidden="true" />
            Mô tả vụ việc
          </h2>
          <p className="text-sm leading-relaxed text-(--text-secondary)">
            {data.refinedDescription ?? data.originalDescription}
          </p>
        </GlassCard>

        {/* Stats row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-(--status-danger-bg)">
                <Banknote className="size-4.5 text-danger" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-(--text-tertiary)">
                  Số tiền liên quan
                </p>
                <p
                  className="font-mono text-sm font-semibold text-danger"
                  aria-label={`${(data.amount ?? 0).toLocaleString("vi-VN")} đồng Việt Nam`}
                >
                  {formatMoneyVnd(data.amount)}
                </p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-neon-ghost">
                <Eye className="size-4.5 text-neon" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-(--text-tertiary)">Lượt xem</p>
                <p className="font-mono text-sm font-semibold">
                  {data.viewCount.toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-(--status-warning-bg)">
                <FileText
                  className="size-4.5 text-warning"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-xs text-(--text-tertiary)">Số bằng chứng</p>
                <p className="font-mono text-sm font-semibold">
                  {(data.evidenceFiles?.length ?? 0).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Evidence */}
        {evidenceUrls.length > 0 && (
          <GlassCard className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-(--text-tertiary)">
              <FileText className="size-4" aria-hidden="true" />
              Bằng chứng đính kèm
            </h2>
            <ul className="space-y-2">
              {evidenceUrls.map((item) => (
                <li key={item.id}>
                  {item.viewUrl ? (
                    <a
                      href={item.viewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-neon transition-colors hover:bg-neon-ghost"
                    >
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                      {item.fileName}
                      <span className="sr-only">(mở trong tab mới)</span>
                    </a>
                  ) : (
                    <span className="px-2 py-1 text-sm text-(--text-tertiary)">
                      {item.fileName}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </GlassCard>
        )}

        {/* Report CTA */}
        <GlassCard className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--status-danger-bg)">
            <AlertTriangle className="size-5 text-danger" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              Bạn cũng là nạn nhân của tài khoản này?
            </p>
            <p className="mt-0.5 text-xs text-(--text-secondary)">
              Gửi báo cáo bổ sung để tăng độ tin cậy và cảnh báo cộng đồng.
            </p>
          </div>
          <Link href="/report">
            <Button variant="neon-outline" size="sm">
              Gửi báo cáo
            </Button>
          </Link>
        </GlassCard>
      </div>
    </main>
  );
}
