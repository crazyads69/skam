"use client";

import type { ReactElement } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

interface FormSubmitButtonProps {
  label: string;
  pendingLabel: string;
  variant?: "neon" | "neon-outline" | "danger" | "ghost";
  size?: "default" | "lg" | "xl";
  className?: string;
}

export function FormSubmitButton({
  label,
  pendingLabel,
  variant = "neon",
  size = "default",
  className,
}: FormSubmitButtonProps): ReactElement {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={pending}
      className={className}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
