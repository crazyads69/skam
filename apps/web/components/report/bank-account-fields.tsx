"use client";

import type { ReactElement } from "react";
import { useFormContext } from "react-hook-form";
import { BankSelector } from "@/components/report/bank-selector";
import type { ReportFormValues } from "@/components/report/report-form.schema";
import { Input } from "@/components/ui/input";

interface BankAccountFieldsProps {
  banks: Array<{ code: string; shortName: string }>;
}

export function BankAccountFields({
  banks,
}: BankAccountFieldsProps): ReactElement {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<ReportFormValues>();

  return (
    <>
      <p className="text-sm font-medium text-foreground">
        Bước 1: Thông tin tài khoản
      </p>
      <div className="grid gap-1.5">
        <label htmlFor="bankIdentifier" className="text-sm font-medium">
          Số tài khoản <span className="text-danger">*</span>
        </label>
        <Input
          id="bankIdentifier"
          placeholder="Số tài khoản"
          error={!!errors.bankIdentifier}
          {...register("bankIdentifier")}
        />
        {errors.bankIdentifier ? (
          <p className="text-xs text-danger">{errors.bankIdentifier.message}</p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="bankName" className="text-sm font-medium">
          Tên chủ tài khoản <span className="text-danger">*</span>
        </label>
        <Input
          id="bankName"
          placeholder="Tên chủ tài khoản"
          error={!!errors.bankName}
          {...register("bankName")}
        />
        {errors.bankName ? (
          <p className="text-xs text-danger">{errors.bankName.message}</p>
        ) : null}
      </div>

      <input type="hidden" {...register("bankCode")} />
      <BankSelector
        banks={banks}
        value={watch("bankCode") || "VCB"}
        onChange={(value: string) =>
          setValue("bankCode", value, { shouldValidate: true })
        }
      />
    </>
  );
}
