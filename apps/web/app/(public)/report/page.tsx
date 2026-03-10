"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { SocialPlatform } from "@skam/shared/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCase, getBanks, presignUpload } from "@/lib/api";

const reportSchema = z.object({
  bankIdentifier: z.string().min(6).max(40),
  bankName: z.string().min(2).max(120),
  bankCode: z.string().min(2).max(10),
  amount: z.coerce.number().min(0).optional(),
  scammerName: z.string().min(2).max(120).optional().or(z.literal("")),
  originalDescription: z.string().min(50).max(5000),
});

type ReportFormValues = z.infer<typeof reportSchema>;
type UploadItem = {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileKey: string;
  fileHash: string;
};
type SocialLinkInput = {
  platform: SocialPlatform;
  url: string;
  username: string;
};

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
  const [uploaded, setUploaded] = useState<UploadItem[]>([]);
  const [status, setStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [banks, setBanks] = useState<
    Array<{ code: string; shortName: string }>
  >([]);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [socialLinks, setSocialLinks] = useState<SocialLinkInput[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      bankCode: "VCB",
    },
  });

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

  async function onUploadFiles(files: FileList | null): Promise<void> {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 5);
    const nextUploads: UploadItem[] = [];
    setStatus("Đang tải bằng chứng...");
    for (const file of list) {
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
    setUploaded((prev) => [...prev, ...nextUploads].slice(0, 5));
    setStatus("Tải bằng chứng thành công");
  }

  async function onSubmit(values: ReportFormValues): Promise<void> {
    setIsSubmitting(true);
    setStatus("");
    try {
      if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
        throw new Error("Vui lòng xác minh Turnstile trước khi gửi");
      }
      const response = await createCase({
        bankIdentifier: values.bankIdentifier.trim(),
        bankName: values.bankName.trim(),
        bankCode: values.bankCode.trim().toUpperCase(),
        amount: values.amount,
        scammerName: values.scammerName || undefined,
        originalDescription: values.originalDescription.trim(),
        turnstileToken: turnstileToken || undefined,
        socialLinks: socialLinks
          .map((item) => ({
            platform: item.platform,
            url: item.url.trim(),
            username: item.username.trim() || undefined,
          }))
          .filter((item) => item.url),
        evidenceFiles: uploaded.map((item) => ({
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
      setUploaded([]);
      setSocialLinks([]);
      reset({
        bankCode: watch("bankCode"),
      });
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Gửi báo cáo thất bại",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="skam-container py-8">
      <Card className="mx-auto max-w-3xl p-6">
        <h1 className="mb-2 text-2xl font-semibold">
          Báo cáo tài khoản lừa đảo
        </h1>
        <p className="mb-6 text-sm text-[var(--text-secondary)]">
          Thông tin sẽ được kiểm duyệt trước khi công khai.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <p className="text-sm font-medium text-foreground">
            Bước 1: Thông tin tài khoản
          </p>
          <Input placeholder="Số tài khoản" {...register("bankIdentifier")} />
          {errors.bankIdentifier ? (
            <p className="text-xs text-danger">
              {errors.bankIdentifier.message}
            </p>
          ) : null}

          <Input placeholder="Tên chủ tài khoản" {...register("bankName")} />
          {errors.bankName ? (
            <p className="text-xs text-danger">{errors.bankName.message}</p>
          ) : null}

          <input type="hidden" {...register("bankCode")} />
          <Select
            value={watch("bankCode") || "VCB"}
            onValueChange={(value: string) =>
              setValue("bankCode", value, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn ngân hàng" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((bank) => (
                <SelectItem key={bank.code} value={bank.code}>
                  {bank.shortName} ({bank.code})
                </SelectItem>
              ))}
              {banks.length === 0 ? (
                <SelectItem value="VCB">VCB</SelectItem>
              ) : null}
            </SelectContent>
          </Select>

          <p className="mt-2 text-sm font-medium text-foreground">
            Bước 2: Chi tiết vụ việc
          </p>
          <Input
            type="number"
            min={0}
            placeholder="Số tiền bị lừa (VND)"
            {...register("amount")}
          />
          <Input
            placeholder="Tên kẻ lừa đảo (nếu có)"
            {...register("scammerName")}
          />
          <Textarea
            rows={6}
            placeholder="Mô tả vụ việc chi tiết (tối thiểu 50 ký tự)"
            {...register("originalDescription")}
          />
          {errors.originalDescription ? (
            <p className="text-xs text-danger">
              {errors.originalDescription.message}
            </p>
          ) : null}
          <div className="grid gap-2">
            <p className="text-sm font-medium text-foreground">
              Liên kết mạng xã hội liên quan
            </p>
            {socialLinks.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)]">
                Chưa có liên kết nào.
              </p>
            ) : null}
            {socialLinks.map((item, index) => (
              <div
                key={`${item.platform}-${index}`}
                className="grid gap-2 rounded-lg border border-border bg-surface-1 p-3 sm:grid-cols-[140px_1fr_1fr_auto]"
              >
                <Select
                  value={item.platform}
                  onValueChange={(value: string) => {
                    const platform = value as SocialPlatform;
                    setSocialLinks((prev) =>
                      prev.map((entry, idx) =>
                        idx === index ? { ...entry, platform } : entry,
                      ),
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SocialPlatform).map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="https://..."
                  value={item.url}
                  onChange={(event) =>
                    setSocialLinks((prev) =>
                      prev.map((entry, idx) =>
                        idx === index
                          ? { ...entry, url: event.target.value }
                          : entry,
                      ),
                    )
                  }
                />
                <Input
                  placeholder="username (tuỳ chọn)"
                  value={item.username}
                  onChange={(event) =>
                    setSocialLinks((prev) =>
                      prev.map((entry, idx) =>
                        idx === index
                          ? { ...entry, username: event.target.value }
                          : entry,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setSocialLinks((prev) =>
                      prev.filter((_, idx) => idx !== index),
                    )
                  }
                >
                  Xoá
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="neon-outline"
              onClick={() =>
                setSocialLinks((prev) => [
                  ...prev,
                  { platform: SocialPlatform.FACEBOOK, url: "", username: "" },
                ])
              }
            >
              Thêm liên kết
            </Button>
          </div>

          <p className="mt-2 text-sm font-medium text-foreground">
            Bước 3: Bằng chứng và xác minh
          </p>
          <label className="block rounded-lg border border-dashed border-border p-4 text-sm text-[var(--text-secondary)]">
            <span className="mb-2 inline-flex items-center gap-2 text-foreground">
              <Upload className="size-4 text-neon" />
              Tải bằng chứng (tối đa 5 tệp)
            </span>
            <Input
              type="file"
              accept="image/*,video/mp4,video/webm,audio/mpeg,audio/wav,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              multiple
              className="mt-2 block w-full"
              onChange={(event) => {
                onUploadFiles(event.target.files).catch((error) =>
                  setStatus(
                    error instanceof Error ? error.message : "Tải tệp thất bại",
                  ),
                );
              }}
            />
          </label>
          {uploaded.length > 0 ? (
            <ul className="grid gap-1 text-xs text-[var(--text-tertiary)]">
              {uploaded.map((item) => (
                <li key={item.fileKey}>
                  {item.fileName} · {(item.fileSize / 1024).toFixed(1)} KB
                </li>
              ))}
            </ul>
          ) : null}
          <div id="turnstile-widget" />

          <Button
            type="submit"
            variant="neon"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
          </Button>
        </form>
        {status ? (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">{status}</p>
        ) : null}
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">
          Nền tảng hỗ trợ liên kết mạng xã hội loại:{" "}
          {Object.values(SocialPlatform).join(", ")}.
        </p>
      </Card>
    </main>
  );
}
