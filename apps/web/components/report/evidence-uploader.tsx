"use client";

import type { ReactElement } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { ReportFormValues } from "@/components/report/report-form.schema";
import { Upload, X } from "lucide-react";

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
      <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-sm text-(--text-secondary) transition-colors hover:border-neon/50 hover:bg-neon/5">
        <Upload className="size-5 text-neon" />
        <span className="text-center text-foreground font-medium">
          Tải bằng chứng (tối đa 5 tệp)
        </span>
        <span className="text-xs text-(--text-tertiary)">
          Hình ảnh, video, PDF, Word — nhấn để chọn tệp
        </span>
        <input
          type="file"
          accept="image/*,video/mp4,video/webm,audio/mpeg,audio/wav,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple
          className="sr-only"
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
        <ul className="grid gap-2">
          {fields.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-1 px-3 py-2"
            >
              <span className="truncate text-xs text-(--text-secondary)">
                {item.fileName}{" "}
                <span className="text-(--text-tertiary)">
                  · {(item.fileSize / 1024).toFixed(1)} KB
                </span>
              </span>
              <button
                type="button"
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-(--text-tertiary) transition-colors hover:bg-danger/10 hover:text-danger"
                onClick={() => remove(index)}
                aria-label={`Xoá ${item.fileName}`}
              >
                <X className="size-3.5" />
              </button>
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
