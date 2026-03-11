"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Tra cứu tài khoản lừa đảo bằng cách nào?",
    answer:
      "Chỉ cần nhập số tài khoản ngân hàng hoặc tên người nhận vào ô tìm kiếm. Hệ thống sẽ đối chiếu với cơ sở dữ liệu các vụ lừa đảo đã được xác minh và trả về kết quả ngay lập tức.",
  },
  {
    question: "Báo cáo có được ẩn danh không?",
    answer:
      "Có. SKAM không yêu cầu tạo tài khoản hay cung cấp thông tin cá nhân. Mọi báo cáo và tra cứu đều hoàn toàn ẩn danh. Địa chỉ IP được mã hóa SHA-256 để chống spam.",
  },
  {
    question: "Mất bao lâu để báo cáo được duyệt?",
    answer:
      "Đội ngũ kiểm duyệt xem xét các báo cáo thường xuyên. Thông thường, một báo cáo sẽ được xử lý trong vòng 24-48 giờ sau khi gửi.",
  },
  {
    question: "Dữ liệu lừa đảo lấy từ đâu?",
    answer:
      "Toàn bộ dữ liệu đến từ cộng đồng — những nạn nhân thực sự bị lừa đảo gửi báo cáo. Mỗi báo cáo đều được đội ngũ quản trị viên xác minh và tinh chỉnh trước khi công khai.",
  },
  {
    question: "Dịch vụ có mất phí không?",
    answer:
      "Hoàn toàn miễn phí. SKAM là nền tảng cộng đồng phi lợi nhuận, được xây dựng nhằm bảo vệ người Việt Nam khỏi nạn lừa đảo ngân hàng.",
  },
  {
    question: "Tôi có thể gửi bằng chứng kèm theo không?",
    answer:
      "Có. Khi gửi báo cáo, bạn có thể đính kèm tối đa 5 tệp bằng chứng (ảnh chụp màn hình, video, tài liệu) với dung lượng tối đa 100MB mỗi tệp.",
  },
];

export function FaqSection(): ReactElement {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className={cn(
              "rounded-xl border backdrop-blur-(--glass-blur) transition-all duration-300",
              "bg-(--glass-bg) border-(--glass-border)",
              isOpen && "border-(--border-neon) shadow-(--shadow-neon)",
            )}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium text-foreground md:text-base">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "size-5 shrink-0 text-(--text-tertiary) transition-transform duration-300",
                  isOpen && "rotate-180 text-neon",
                )}
                aria-hidden="true"
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300",
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-(--text-secondary)">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
