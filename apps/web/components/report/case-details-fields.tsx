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
      <div className="grid gap-1.5">
        <label htmlFor="amount" className="text-sm font-medium">
          Số tiền bị lừa (VND)
        </label>
        <Input
          id="amount"
          type="number"
          min={0}
          placeholder="Số tiền bị lừa (VND)"
          error={!!errors.amount}
          {...register("amount")}
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="scammerName" className="text-sm font-medium">
          Tên kẻ lừa đảo (nếu có)
        </label>
        <Input
          id="scammerName"
          placeholder="Tên kẻ lừa đảo (nếu có)"
          {...register("scammerName")}
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="originalDescription" className="text-sm font-medium">
          Mô tả vụ việc <span className="text-danger">*</span>
        </label>
        <Textarea
          id="originalDescription"
          rows={6}
          placeholder="Mô tả vụ việc chi tiết (tối thiểu 50 ký tự)"
          {...register("originalDescription")}
        />
        {errors.originalDescription ? (
          <p className="text-xs text-danger">
            {errors.originalDescription.message}
          </p>
        ) : null}
      </div>
    </>
  );
}
