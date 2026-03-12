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
        {errors.amount ? (
          <p className="text-xs text-danger">{errors.amount.message}</p>
        ) : null}
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
          error={!!errors.originalDescription}
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
