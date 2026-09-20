import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Tone = "neutral" | "ok" | "warn" | "danger";

const tones: Record<Tone, string> = {
  neutral: "text-muted bg-raised",
  ok: "text-ok bg-ok/10",
  warn: "text-warn bg-warn/10",
  danger: "text-danger bg-danger/10",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
