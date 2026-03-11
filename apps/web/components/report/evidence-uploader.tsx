"use client";

import type { ReactElement } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { ReportFormValues } from "@/components/report/report-form.schema";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface UploadItem {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileKey: string;
  fileHash: string;
}

interface EvidenceUploaderProps {
  onUploadFiles: (files: FileList | null) => Promise<UploadItem[]>;
  onError: (message: string) => void;
}

export function EvidenceUploader({
  onUploadFiles,
  onError,
}: EvidenceUploaderProps): ReactElement {
  const { control, formState } = useFormContext<ReportFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "evidenceFiles",
  });

  return (
    <>
      <label className="block rounded-lg border border-dashed border-border p-4 text-sm text-(--text-secondary)">
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
            onUploadFiles(event.target.files)
              .then((uploaded) => {
                if (uploaded.length > 0) {
                  append(uploaded);
                }
                event.currentTarget.value = "";
              })
              .catch((error) =>
                onError(
                  error instanceof Error ? error.message : "Tải tệp thất bại",
                ),
              );
          }}
        />
      </label>
      {fields.length > 0 ? (
        <ul className="grid gap-1 text-xs text-(--text-tertiary)">
          {fields.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2"
            >
              <span>
                {item.fileName} · {(item.fileSize / 1024).toFixed(1)} KB
              </span>
              <Button
                type="button"
                size="default"
                variant="ghost"
                onClick={() => remove(index)}
              >
                Xoá
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {formState.errors.evidenceFiles?.message ? (
        <p className="text-xs text-danger">
          {formState.errors.evidenceFiles.message}
        </p>
      ) : null}
    </>
  );
}
