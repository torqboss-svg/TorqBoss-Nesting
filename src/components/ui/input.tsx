import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md bg-raised px-3 font-mono text-sm tabular-nums text-fg",
        "shadow-[var(--shadow-border)] placeholder:text-faint",
        "transition-[box-shadow] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
