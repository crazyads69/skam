"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { ReactElement } from "react";

const TICKER_ITEMS = [
  "Vietcombank ****8921 — Xác nhận lừa đảo",
  "MB Bank ****3045 — 2 báo cáo mới",
  "Techcombank ****7712 — Đang kiểm duyệt",
  "TPBank ****5590 — Xác nhận lừa đảo",
  "ACB ****2233 — 3 báo cáo mới",
  "BIDV ****6618 — Xác nhận lừa đảo",
  "Sacombank ****9901 — Đang kiểm duyệt",
  "VPBank ****4477 — 1 báo cáo mới",
];

export function ScamTicker(): ReactElement {
  // Double the items for seamless infinite scroll
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="relative overflow-hidden border-y border-(--border-default) bg-(--surface-0)/60 py-3">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-linear-to-r from-(--surface-base) to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-linear-to-l from-(--surface-base) to-transparent" />

      <div className="animate-ticker flex w-max gap-8">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex shrink-0 items-center gap-2 text-xs text-(--text-tertiary)"
          >
            {item.includes("Xác nhận") ? (
              <ShieldAlert
                className="size-3.5 text-danger"
                aria-hidden="true"
              />
            ) : (
              <AlertTriangle
                className="size-3.5 text-warning"
                aria-hidden="true"
              />
            )}
            <span className="font-mono">{item}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
