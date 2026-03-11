import type { ReactElement } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  readonly steps: readonly string[];
  readonly currentStep: number;
}

export function StepIndicator({
  steps,
  currentStep,
}: StepIndicatorProps): ReactElement {
  return (
    <nav aria-label="Tiến trình báo cáo" className="mb-6">
      <ol className="flex items-center gap-2">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    isCompleted && "border-neon bg-neon text-black",
                    isActive && "border-neon text-neon shadow-(--shadow-neon)",
                    !isActive &&
                      !isCompleted &&
                      "border-(--border-default) text-(--text-disabled)",
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs text-center leading-tight",
                    isActive
                      ? "text-neon font-medium"
                      : isCompleted
                        ? "text-(--text-secondary)"
                        : "text-(--text-disabled)",
                  )}
                >
                  {label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 -mt-5",
                    isCompleted ? "bg-neon" : "bg-(--border-default)",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
