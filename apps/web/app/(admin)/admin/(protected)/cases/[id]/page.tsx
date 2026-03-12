import type { ReactElement } from "react";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink } from "lucide-react";
import {
  approveAdminCase,
  getAdminEvidenceViewUrl,
  getAdminCase,
  rejectAdminCase,
  refineAdminCase,
} from "@/lib/api";
import { requireAdminToken } from "@/lib/admin-auth";
import { resolveEvidenceUrls } from "@/lib/evidence-urls";

interface AdminCaseDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function AdminCaseDetailPage({
  params,
}: AdminCaseDetailPageProps): Promise<ReactElement> {
  const token = await requireAdminToken();
  const { id } = await params;
  const response = await getAdminCase(token, id).catch(() => null);
  const data = response?.data;
  if (!response?.success || !data) notFound();
  const evidenceUrls = await resolveEvidenceUrls(
    data.evidenceFiles ?? [],
    (f) => getAdminEvidenceViewUrl(token, f.fileKey),
  );

  async function refineAction(formData: FormData): Promise<void> {
    "use server";
    const token = await requireAdminToken();
    const refinedDescription = String(formData.get("refinedDescription") ?? "");
    try {
      await refineAdminCase(token, id, refinedDescription);
    } catch {
      throw new Error("Không thể lưu nội dung tinh chỉnh. Vui lòng thử lại.");
    }
    revalidatePath(`/admin/cases/${id}`);
  }

  async function approveAction(): Promise<void> {
    "use server";
    const token = await requireAdminToken();
    try {
      const latestCaseResponse = await getAdminCase(token, id).catch(
        () => null,
      );
      const refinedDescription =
        latestCaseResponse?.success &&
        latestCaseResponse.data?.refinedDescription
          ? latestCaseResponse.data.refinedDescription.trim()
          : undefined;
      await approveAdminCase(token, id, refinedDescription || undefined);
    } catch {
      throw new Error("Không thể duyệt vụ việc. Vui lòng thử lại.");
    }
    revalidatePath("/admin");
    redirect("/admin");
  }

  async function rejectAction(formData: FormData): Promise<void> {
    "use server";
    const token = await requireAdminToken();
    const reason = String(formData.get("reason") ?? "").trim();
    if (!reason) return;
    try {
      await rejectAdminCase(token, id, reason);
    } catch {
      throw new Error("Không thể từ chối vụ việc. Vui lòng thử lại.");
    }
    revalidatePath("/admin");
    redirect("/admin");
  }

  return (
    <section className="grid gap-4">
      <GlassCard className="p-5">
        <p className="text-xs text-(--text-tertiary)">
          {data.bankName} · {data.bankCode}
        </p>
        <h1 className="mt-1 font-mono text-xl">{data.bankIdentifier}</h1>
        <p className="mt-3 text-sm text-(--text-secondary)">
          {data.originalDescription}
        </p>
      </GlassCard>
      <GlassCard className="p-5">
        <form action={refineAction} className="grid gap-3">
          <label htmlFor="refinedDescription" className="text-sm font-medium">
            Mô tả đã tinh chỉnh
          </label>
          <Textarea
            id="refinedDescription"
            name="refinedDescription"
            defaultValue={data.refinedDescription ?? data.originalDescription}
            rows={8}
          />
          <FormSubmitButton
            label="Lưu nội dung tinh chỉnh"
            pendingLabel="Đang lưu..."
            variant="neon-outline"
          />
        </form>
      </GlassCard>
      <GlassCard className="p-5">
        <h2 className="mb-3 text-sm font-medium">Bằng chứng</h2>
        <ul className="grid gap-2 text-sm">
          {evidenceUrls.length === 0 ? (
            <li className="text-(--text-tertiary)">Chưa có bằng chứng</li>
          ) : null}
          {evidenceUrls.map((item) => (
            <li key={item.id}>
              {item.viewUrl ? (
                <a
                  href={item.viewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-neon underline"
                >
                  {item.fileName}
                  <ExternalLink className="size-3" aria-hidden="true" />
                  <span className="sr-only">(mở trong tab mới)</span>
                </a>
              ) : (
                <span className="text-(--text-tertiary)">{item.fileName}</span>
              )}
            </li>
          ))}
        </ul>
      </GlassCard>
      <div className="grid gap-3 sm:grid-cols-2">
        <GlassCard className="p-5">
          <form action={approveAction} className="grid gap-3">
            <FormSubmitButton
              label="Duyệt vụ việc"
              pendingLabel="Đang duyệt..."
              variant="neon"
              size="lg"
              className="w-full"
            />
          </form>
        </GlassCard>
        <GlassCard className="p-5">
          <form action={rejectAction} className="grid gap-3">
            <label htmlFor="reason" className="text-sm font-medium">
              Lý do từ chối
            </label>
            <Input
              id="reason"
              name="reason"
              placeholder="Lý do từ chối"
              required
            />
            <FormSubmitButton
              label="Từ chối vụ việc"
              pendingLabel="Đang từ chối..."
              variant="danger"
              size="lg"
              className="w-full"
            />
          </form>
        </GlassCard>
      </div>
    </section>
  );
}
