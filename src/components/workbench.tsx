import { useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { ControlPanel } from "@/components/control-panel";
import { NestCanvas } from "@/components/nest-canvas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { persistNestState, useNestResult, useNestStore } from "@/lib/nest/store";
import { formatMm } from "@/lib/nest/geometry";
import { MAX_QUANTITY } from "@/lib/nest/tessellate";
import { APP_BRAND, APP_PRODUCT } from "@/lib/brand";

export function Workbench() {
  useEffect(() => persistNestState(), []);
  const sheet = useNestStore((s) => s.sheet);
  const quantity = useNestStore((s) => s.quantity);
  const margin = useNestStore((s) => s.margin);
  const gap = useNestStore((s) => s.gap);
  const setQuantity = useNestStore((s) => s.setQuantity);
  const nest = useNestResult();
  const headerLabel =
    nest.remainder > 0
      ? `${nest.livePlaced}/${nest.requested} pç · ${nest.plateCount} chapa${nest.plateCount > 1 ? "s" : ""}`
      : `${nest.livePlaced} pç · ${nest.plateCount} chapa${nest.plateCount > 1 ? "s" : ""}`;

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-bg text-fg">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-[max(1rem,env(safe-area-inset-left))] py-2.5 pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.625rem,env(safe-area-inset-top))] lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Mark />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-faint">{APP_BRAND}</p>
            <h1 className="truncate text-base font-medium tracking-tight lg:text-lg">{APP_PRODUCT}</h1>
          </div>
        </div>
        <Badge tone={nest.remainder > 0 ? "warn" : "neutral"}>{headerLabel}</Badge>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(12rem,40%)] lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-1 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section className="relative min-h-0 min-w-0 overflow-hidden touch-none">
          <NestCanvas />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3 lg:p-4">
            <div className="rounded-md bg-bg/80 px-2.5 py-1.5 font-mono text-xs tabular-nums text-muted shadow-[var(--shadow-border)]">
              {formatMm(sheet.width)} × {formatMm(sheet.length)} × {formatMm(sheet.thickness)} mm
              {nest.plateCount > 1 ? ` · chapa ${nest.plateIndex + 1}/${nest.plateCount}` : ""}
              {margin > 0 ? ` · borda ${formatMm(margin)}` : ""}
              {gap > 0 ? ` · folga ${formatMm(gap)}` : ""}
            </div>
            <div className="pointer-events-auto flex items-center gap-1 rounded-md bg-bg/90 p-1 shadow-[var(--shadow-border)]">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10"
                aria-label="Diminuir quantidade"
                disabled={quantity <= 1}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus />
              </Button>
              <span className="min-w-10 text-center font-mono text-xs tabular-nums text-fg">
                {nest.livePlaced}/{quantity}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10"
                aria-label="Aumentar quantidade"
                disabled={quantity >= MAX_QUANTITY}
                onClick={() => setQuantity(Math.min(MAX_QUANTITY, quantity + 1))}
              >
                <Plus />
              </Button>
            </div>
          </div>
        </section>

        <aside className="panel-scroll min-h-0 overflow-y-auto overscroll-contain border-t border-border touch-pan-y lg:border-t-0 lg:border-l">
          <ControlPanel />
        </aside>
      </div>
    </div>
  );
}

function Mark() {
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-primary text-primary-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.48),0_0_0_1px_rgba(0,0,0,0.38)]"
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="size-[22px]">
        <polygon points="16,3.8 28.4,27.2 3.6,27.2" fill="currentColor" />
        <polygon points="16,12.2 22.8,25.4 9.2,25.4" className="fill-ok" opacity="0.85" />
      </svg>
    </span>
  );
}
