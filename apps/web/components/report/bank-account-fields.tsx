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
      <Input placeholder="Số tài khoản" {...register("bankIdentifier")} />
      {errors.bankIdentifier ? (
        <p className="text-xs text-danger">{errors.bankIdentifier.message}</p>
      ) : null}

      <Input placeholder="Tên chủ tài khoản" {...register("bankName")} />
      {errors.bankName ? (
        <p className="text-xs text-danger">{errors.bankName.message}</p>
      ) : null}

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
