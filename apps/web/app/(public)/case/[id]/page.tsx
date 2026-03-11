import type { Metadata } from "next";
import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCase, getPublicEvidenceViewUrl } from "@/lib/api";
import { resolveEvidenceUrls } from "@/lib/evidence-urls";
import { formatMoneyVnd } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

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
    <main className="skam-container py-8">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-(--text-tertiary)">
              {data.bankName} · {data.bankCode}
            </p>
            <p className="font-mono text-2xl">{data.bankIdentifier}</p>
          </div>
          <StatusBadge status={data.status} />
        </div>
        <p className="mb-4 text-sm text-(--text-secondary)">
          {data.refinedDescription ?? data.originalDescription}
        </p>
        <div className="grid gap-2 text-sm text-(--text-secondary)">
          <p>
            Số tiền liên quan:{" "}
            <span
              className="font-semibold text-danger"
              aria-label={`${(data.amount ?? 0).toLocaleString("vi-VN")} đồng Việt Nam`}
            >
              {formatMoneyVnd(data.amount)}
            </span>
          </p>
          <p>Lượt xem: {data.viewCount.toLocaleString("vi-VN")}</p>
          <p>
            Số bằng chứng:{" "}
            {(data.evidenceFiles?.length ?? 0).toLocaleString("vi-VN")}
          </p>
        </div>
        {evidenceUrls.length > 0 ? (
          <ul className="mt-4 grid gap-2 text-sm">
            {evidenceUrls.map((item) => (
              <li key={item.id}>
                {item.viewUrl ? (
                  <a
                    href={item.viewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-neon underline"
                  >
                    {item.fileName}
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">(mở trong tab mới)</span>
                  </a>
                ) : (
                  <span className="text-(--text-tertiary)">
                    {item.fileName}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
    </main>
  );
}
