import type { ReactElement } from "react";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  approveAdminCase,
  getAdminEvidenceViewUrl,
  getAdminCase,
  rejectAdminCase,
  refineAdminCase,
} from "@/lib/api";
import { getAdminTokenFromCookie } from "@/lib/admin-auth";

interface AdminCaseDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function AdminCaseDetailPage({
  params,
}: AdminCaseDetailPageProps): Promise<ReactElement> {
  const token = await getAdminTokenFromCookie();
  if (!token) redirect("/admin/login");
  const { id } = await params;
  const response = await getAdminCase(token, id).catch(() => null);
  const data = response?.data;
  if (!response?.success || !data) notFound();
  const evidenceUrls = await Promise.all(
    (data.evidenceFiles ?? []).map(async (item) => {
      const urlResponse = await getAdminEvidenceViewUrl(
        token,
        item.fileKey,
      ).catch(() => null);
      return {
        id: item.id,
        fileName: item.fileName ?? item.fileKey,
        viewUrl: urlResponse?.data?.viewUrl ?? null,
      };
    }),
  );

  async function refineAction(formData: FormData): Promise<void> {
    "use server";
    const token = await getAdminTokenFromCookie();
    if (!token) redirect("/admin/login");
    const refinedDescription = String(formData.get("refinedDescription") ?? "");
    await refineAdminCase(token, id, refinedDescription);
    revalidatePath(`/admin/cases/${id}`);
  }

  async function approveAction(formData: FormData): Promise<void> {
    "use server";
    const token = await getAdminTokenFromCookie();
    if (!token) redirect("/admin/login");
    const refinedDescription = String(formData.get("refinedDescription") ?? "");
    await approveAdminCase(token, id, refinedDescription || undefined);
    revalidatePath("/admin");
    redirect("/admin");
  }

  async function rejectAction(formData: FormData): Promise<void> {
    "use server";
    const token = await getAdminTokenFromCookie();
    if (!token) redirect("/admin/login");
    const reason = String(formData.get("reason") ?? "").trim();
    if (!reason) return;
    await rejectAdminCase(token, id, reason);
    revalidatePath("/admin");
    redirect("/admin");
  }

  return (
    <section className="grid gap-4">
      <Card className="p-5">
        <p className="text-xs text-[var(--text-tertiary)]">
          {data.bankName} · {data.bankCode}
        </p>
        <h1 className="mt-1 font-mono text-xl">{data.bankIdentifier}</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {data.originalDescription}
        </p>
      </Card>
      <Card className="p-5">
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
          <Button type="submit" variant="neon-outline">
            Lưu nội dung tinh chỉnh
          </Button>
        </form>
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-medium">Bằng chứng</h2>
        <ul className="grid gap-2 text-sm">
          {evidenceUrls.length === 0 ? (
            <li className="text-[var(--text-tertiary)]">Chưa có bằng chứng</li>
          ) : null}
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
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <form action={approveAction} className="grid gap-3">
            <input
              type="hidden"
              name="refinedDescription"
              value={data.refinedDescription ?? data.originalDescription}
            />
            <Button type="submit" variant="neon" size="lg" className="w-full">
              Duyệt vụ việc
            </Button>
          </form>
        </Card>
        <Card className="p-5">
          <form action={rejectAction} className="grid gap-3">
            <Input
              name="reason"
              placeholder="Lý do từ chối"
              required
            />
            <Button type="submit" variant="danger" size="lg" className="w-full">
              Từ chối vụ việc
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
}
