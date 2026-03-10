import type { ReactElement } from "react";

export function AmbientGlow(): ReactElement {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Neon green orb — top left */}
      <div
        className="absolute -top-1/4 -left-1/4 size-[600px] rounded-full opacity-[0.04]"
        style={{
          background:
            "radial-gradient(circle, var(--neon-green), transparent 70%)",
        }}
      />
      {/* Cyan orb — bottom right */}
      <div
        className="absolute -bottom-1/4 -right-1/4 size-[500px] rounded-full opacity-[0.03]"
        style={{
          background:
            "radial-gradient(circle, var(--status-info), transparent 70%)",
        }}
      />
    </div>
  );
}
