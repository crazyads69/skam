"use client";

import type { ReactElement } from "react";
import { useFormContext } from "react-hook-form";
import type { ReportFormValues } from "@/components/report/report-form.schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CaseDetailsFields(): ReactElement {
  const {
    register,
    formState: { errors },
  } = useFormContext<ReportFormValues>();

  return (
    <>
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
        <p className="text-xs text-danger">{errors.originalDescription.message}</p>
      ) : null}
    </>
  );
}
