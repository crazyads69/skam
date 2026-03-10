import type { Metadata } from "next";
import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCase, getPublicEvidenceViewUrl } from "@/lib/api";
import { formatMoneyVnd } from "@/lib/utils";

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
  const evidenceUrls = await Promise.all(
    (data.evidenceFiles ?? []).map(async (item) => {
      const urlResponse = await getPublicEvidenceViewUrl(id, item.id).catch(
        () => null,
      );
      return {
        id: item.id,
        fileName: item.fileName ?? item.fileKey,
        viewUrl: urlResponse?.data?.viewUrl ?? null,
      };
    }),
  );
  return (
    <main className="skam-container py-8">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[var(--text-tertiary)]">
              {data.bankName} · {data.bankCode}
            </p>
            <p className="font-mono text-2xl">{data.bankIdentifier}</p>
          </div>
          <StatusBadge status={data.status} />
        </div>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          {data.refinedDescription ?? data.originalDescription}
        </p>
        <div className="grid gap-2 text-sm text-[var(--text-secondary)]">
          <p>
            Số tiền liên quan:{" "}
            <span className="font-semibold text-danger">
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
                    className="text-neon underline"
                  >
                    {item.fileName}
                  </a>
                ) : (
                  <span className="text-[var(--text-tertiary)]">
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
