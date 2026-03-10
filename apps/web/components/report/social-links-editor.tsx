"use client";

import type { ReactElement } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { SocialPlatform } from "@skam/shared/types";
import type { ReportFormValues } from "@/components/report/report-form.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SocialLinksEditor(): ReactElement {
  const { register, watch, setValue, control, formState } =
    useFormContext<ReportFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "socialLinks",
  });

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium text-foreground">
        Liên kết mạng xã hội liên quan
      </p>
      {fields.length === 0 ? (
        <p className="text-xs text-[var(--text-tertiary)]">
          Chưa có liên kết nào.
        </p>
      ) : null}
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid gap-2 rounded-lg border border-border bg-surface-1 p-3 sm:grid-cols-[140px_1fr_1fr_auto]"
        >
          <Select
            value={
              watch(`socialLinks.${index}.platform`) || SocialPlatform.FACEBOOK
            }
            onValueChange={(value: string) => {
              setValue(
                `socialLinks.${index}.platform`,
                value as SocialPlatform,
                {
                  shouldValidate: true,
                },
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
            {...register(`socialLinks.${index}.url`)}
          />
          {formState.errors.socialLinks?.[index]?.url?.message ? (
            <p className="text-xs text-danger sm:col-span-2">
              {formState.errors.socialLinks[index]?.url?.message}
            </p>
          ) : null}
          <Input
            placeholder="username (tuỳ chọn)"
            {...register(`socialLinks.${index}.username`)}
          />
          <Button type="button" variant="ghost" onClick={() => remove(index)}>
            Xoá
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="neon-outline"
        onClick={() =>
          append({ platform: SocialPlatform.FACEBOOK, url: "", username: "" })
        }
      >
        Thêm liên kết
      </Button>
    </div>
  );
}
