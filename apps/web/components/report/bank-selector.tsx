"use client";

import type { ReactElement } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BankSelectorProps {
  banks: Array<{ code: string; shortName: string }>;
  value: string;
  onChange: (value: string) => void;
}

export function BankSelector({
  banks,
  value,
  onChange,
}: BankSelectorProps): ReactElement {
  return (
    <Select value={value || "VCB"} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Chọn ngân hàng" />
      </SelectTrigger>
      <SelectContent>
        {banks.map((bank) => (
          <SelectItem key={bank.code} value={bank.code}>
            {bank.shortName} ({bank.code})
          </SelectItem>
        ))}
        {banks.length === 0 ? <SelectItem value="VCB">VCB</SelectItem> : null}
      </SelectContent>
    </Select>
  );
}
