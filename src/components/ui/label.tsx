import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block h-4 min-w-0 truncate whitespace-nowrap text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-muted",
        className,
      )}
      {...props}
    />
  );
}
