"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { SocialPlatform } from "@skam/shared/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { BankAccountFields } from "@/components/report/bank-account-fields";
import { CaseDetailsFields } from "@/components/report/case-details-fields";
import {
  EvidenceUploader,
  type UploadItem,
} from "@/components/report/evidence-uploader";
import {
  reportSchema,
  type ReportFormValues,
} from "@/components/report/report-form.schema";
import { SocialLinksEditor } from "@/components/report/social-links-editor";
import { ReportFormSummary } from "@/components/report/report-form-summary";
import { StepIndicator } from "@/components/report/step-indicator";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { createCase, getBanks, presignUpload } from "@/lib/api";
import { normalizeUserText } from "@/lib/sanitize";
import { AlertTriangle, Lock } from "lucide-react";

const maxEvidenceFiles: number = 5;
const maxEvidenceFileSize: number = 100 * 1024 * 1024;

interface TurnstileWindow extends Window {
  turnstile?: {
    render(
      target: string | HTMLElement,
      options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback"?: () => void;
      },
    ): void;
  };
}

async function sha256(file: File): Promise<string> {
  const buffer: ArrayBuffer = await file.arrayBuffer();
  const digest: ArrayBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const bytes: Uint8Array = new Uint8Array(digest);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default function ReportPage(): ReactElement {
  const [status, setStatus] = useState<string>("");
  const [banks, setBanks] = useState<
    Array<{ code: string; shortName: string }>
  >([]);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const methods = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    mode: "onBlur",
    defaultValues: {
      bankCode: "VCB",
      socialLinks: [],
      evidenceFiles: [],
    },
  });
  const { handleSubmit, reset, formState, getValues } = methods;

  useEffect(() => {
    getBanks()
      .then((response) => {
        if (!response.success || !response.data) return;
        setBanks(
          response.data.map((item) => ({
            code: item.code,
            shortName: item.shortName || item.short_name || item.code,
          })),
        );
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const siteKey: string | undefined =
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return;
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const turnstileApi = (window as TurnstileWindow).turnstile;
      if (!turnstileApi) return;
      turnstileApi.render("#turnstile-widget", {
        sitekey: siteKey,
        callback: (token: string) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(""),
      });
    };
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  async function onUploadFiles(files: FileList | null): Promise<UploadItem[]> {
    if (!files?.length) return [];
    const existingCount: number = getValues("evidenceFiles").length;
    const remainingSlots: number = Math.max(
      0,
      maxEvidenceFiles - existingCount,
    );
    if (remainingSlots === 0) {
      throw new Error("Chỉ được tải tối đa 5 tệp");
    }
    const list = Array.from(files).slice(0, remainingSlots);
    const nextUploads: UploadItem[] = [];
    setStatus("Đang tải bằng chứng...");
    for (const file of list) {
      if (file.size > maxEvidenceFileSize) {
        throw new Error(`Tệp ${file.name} vượt quá 100MB`);
      }
      const fileHash = await sha256(file);
      const presign = await presignUpload({
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        fileHash,
      });
      if (!presign.success || !presign.data) {
        throw new Error(presign.error ?? "Không thể lấy URL tải tệp");
      }
      const put = await fetch(presign.data.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!put.ok) {
        throw new Error(`Tải tệp thất bại: ${file.name}`);
      }
      nextUploads.push({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileKey: presign.data.fileKey,
        fileHash,
      });
    }
    setStatus("Tải bằng chứng thành công");
    return nextUploads;
  }

  async function onSubmit(values: ReportFormValues): Promise<void> {
    setStatus("");
    try {
      if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
        throw new Error("Vui lòng xác minh Turnstile trước khi gửi");
      }
      const response = await createCase({
        bankIdentifier: normalizeUserText(values.bankIdentifier),
        bankName: normalizeUserText(values.bankName),
        bankCode: normalizeUserText(values.bankCode).toUpperCase(),
        amount: values.amount,
        scammerName: normalizeUserText(values.scammerName ?? "") || undefined,
        originalDescription: normalizeUserText(values.originalDescription),
        turnstileToken: turnstileToken || undefined,
        socialLinks: values.socialLinks
          .map((item) => ({
            platform: item.platform,
            url: normalizeUserText(item.url),
            username: normalizeUserText(item.username) || undefined,
          }))
          .filter((item) => item.url),
        evidenceFiles: values.evidenceFiles.map((item) => ({
          fileType: item.fileType.startsWith("image/")
            ? "chat_screenshot"
            : "other",
          fileKey: item.fileKey,
          fileName: item.fileName,
          fileSize: item.fileSize,
          fileHash: item.fileHash,
        })),
      });
      if (!response.success) {
        throw new Error(response.error ?? "Gửi báo cáo thất bại");
      }
      setStatus("Gửi báo cáo thành công, vụ việc đang chờ duyệt");
      reset({
        bankIdentifier: "",
        bankName: "",
        bankCode: values.bankCode,
        amount: undefined,
        scammerName: "",
        originalDescription: "",
        socialLinks: [],
        evidenceFiles: [],
      });
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Gửi báo cáo thất bại",
      );
    }
  }

  return (
    <main className="relative z-10">
      {/* ─── Report Hero ─── */}
      <section className="hero-scanline relative overflow-hidden border-b border-(--border-default) py-10 md:py-14">
        <div
          className="hero-grid pointer-events-none absolute inset-0"
          aria-hidden="true"
        />
        <div className="skam-container relative">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-(--status-danger-bg) ring-1 ring-(--status-danger)/20">
                <AlertTriangle
                  className="size-5 text-danger"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                  Báo cáo tài khoản lừa đảo
                </h1>
                <p className="text-xs text-(--text-tertiary)">
                  Thông tin sẽ được kiểm duyệt trước khi công khai
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Form ─── */}
      <section className="skam-container py-8 md:py-10">
        <GlassCard className="mx-auto max-w-3xl p-6 md:p-8">
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <StepIndicator
                steps={["Tài khoản", "Chi tiết", "Bằng chứng"]}
                currentStep={
                  formState.dirtyFields.originalDescription
                    ? 3
                    : formState.dirtyFields.bankIdentifier
                      ? 2
                      : 1
                }
              />
              <BankAccountFields banks={banks} />
              <CaseDetailsFields />
              <SocialLinksEditor />
              <p className="mt-2 text-sm font-medium text-foreground">
                Bước 3: Bằng chứng và xác minh
              </p>
              <EvidenceUploader
                onUploadFiles={onUploadFiles}
                onError={(message) => setStatus(message)}
              />
              <div id="turnstile-widget" />

              <Button
                type="submit"
                variant="neon"
                size="lg"
                disabled={formState.isSubmitting}
              >
                {formState.isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
              </Button>
            </form>
          </FormProvider>
          <ReportFormSummary
            status={status}
            platformsLabel={Object.values(SocialPlatform).join(", ")}
          />
        </GlassCard>

        {/* Info note */}
        <GlassCard className="mx-auto mt-4 max-w-3xl p-4">
          <div className="flex items-start gap-3">
            <Lock
              className="mt-0.5 size-4 shrink-0 text-neon"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-(--text-secondary)">
              Mọi thông tin bạn cung cấp đều được bảo mật. Báo cáo chỉ được công
              khai sau khi đội ngũ quản trị viên xác minh và kiểm duyệt.
            </p>
          </div>
        </GlassCard>
      </section>
    </main>
  );
}
