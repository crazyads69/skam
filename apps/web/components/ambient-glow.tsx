import type { ReactElement } from "react";

export function AmbientGlow(): ReactElement {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Neon green orb — top left */}
      <div
        className="absolute -top-1/4 -left-1/4 size-150 rounded-full opacity-[0.04]"
        style={{
          background:
            "radial-gradient(circle, var(--neon-green), transparent 70%)",
        }}
      />
      {/* Cyan orb — bottom right */}
      <div
        className="absolute -bottom-1/4 -right-1/4 size-125 rounded-full opacity-[0.03]"
        style={{
          background:
            "radial-gradient(circle, var(--status-info), transparent 70%)",
        }}
      />
      {/* Subtle center accent */}
      <div
        className="absolute top-1/2 left-1/2 size-200 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.015]"
        style={{
          background:
            "radial-gradient(circle, var(--neon-green), transparent 60%)",
        }}
      />
    </div>
  );
}
