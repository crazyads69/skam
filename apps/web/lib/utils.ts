import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatMoneyVnd(value: number | null | undefined): string {
  if (typeof value !== "number") return "Không rõ";
  return new Intl.NumberFormat("vi-VN").format(value);
}
