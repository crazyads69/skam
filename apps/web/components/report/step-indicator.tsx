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
      <ol className="flex w-full">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          return (
            <li key={label} className="flex flex-1 flex-col items-center">
              <div className="relative flex w-full items-center justify-center">
                {index > 0 && (
                  <div
                    className={cn(
                      "absolute top-1/2 right-1/2 left-0 h-px -translate-y-1/2",
                      stepNumber <= currentStep
                        ? "bg-neon"
                        : "bg-(--border-default)",
                    )}
                  />
                )}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-1/2 left-1/2 right-0 h-px -translate-y-1/2",
                      isCompleted ? "bg-neon" : "bg-(--border-default)",
                    )}
                  />
                )}
                <div
                  className={cn(
                    "relative z-10 flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    isCompleted && "border-neon bg-neon text-black",
                    isActive && "border-neon text-neon shadow-(--shadow-neon)",
                    !isActive &&
                      !isCompleted &&
                      "border-(--border-default) bg-surface-1 text-(--text-disabled)",
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    stepNumber
                  )}
                </div>
              </div>
              <span
                className={cn(
                  "mt-2 text-xs text-center leading-tight",
                  isActive
                    ? "text-neon font-medium"
                    : isCompleted
                      ? "text-(--text-secondary)"
                      : "text-(--text-disabled)",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
