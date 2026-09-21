import { useCallback, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { Minus, Plus, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { centroid, formatMm } from "@/lib/nest/geometry";
import {
  type Camera,
  fitCamera,
  keepWorldCenter,
  panCamera,
  pinchCamera,
  toScreen,
  zoomAt,
  zoomLimits,
  zoomPercent,
} from "@/lib/nest/camera";
import { useNestResult, useNestStore } from "@/lib/nest/store";
import type { NestedPiece, Point, Sheet } from "@/lib/nest/types";
const C = {
  well: "#0c0d0e",
  sheet: "#1e2124",
  sheetLip: "#262a2e",
  gridMinor: "rgba(236, 234, 228, 0.04)",
  gridMajor: "rgba(236, 234, 228, 0.09)",
  axisX: "#8a5a50",
  axisY: "#4f6d58",
  up: "rgba(132, 142, 138, 0.92)",
  down: "rgba(58, 66, 64, 0.96)",
  stroke: "#101214",
  ink: "#c8ccd0",
  dim: "#6a7078",
  label: "#eceae4",
  chevron: "rgba(236, 234, 228, 0.42)",
  keepout: "rgba(0, 0, 0, 0.28)",
  keepoutLine: "rgba(236, 234, 228, 0.22)",
  dimLine: "rgba(236, 234, 228, 0.40)",
  liveStroke: "#d4cfc4",
};

const JOB_FILL = [
  { up: "rgba(108, 118, 124, 0.88)", down: "rgba(46, 52, 56, 0.94)" },
  { up: "rgba(124, 114, 104, 0.88)", down: "rgba(54, 48, 44, 0.94)" },
  { up: "rgba(104, 120, 112, 0.88)", down: "rgba(44, 54, 50, 0.94)" },
  { up: "rgba(118, 110, 122, 0.88)", down: "rgba(50, 46, 56, 0.94)" },
];

function pathPoly(ctx: CanvasRenderingContext2D, cam: Camera, verts: readonly Point[]) {
  const s0 = toScreen(cam, verts[0]!.x, verts[0]!.y);
  ctx.beginPath();
  ctx.moveTo(s0.x, s0.y);
  for (let i = 1; i < verts.length; i++) {
    const s = toScreen(cam, verts[i]!.x, verts[i]!.y);
    ctx.lineTo(s.x, s.y);
  }
  ctx.closePath();
}

function drawGrid(ctx: CanvasRenderingContext2D, cam: Camera, sheet: Sheet) {
  const minor = cam.scale * 50 >= 10 ? 50 : 0;
  const major = cam.scale * 100 >= 12 ? 100 : cam.scale * 200 >= 12 ? 200 : 500;
  const tl = toScreen(cam, 0, sheet.length);
  const br = toScreen(cam, sheet.width, 0);

  ctx.save();
  ctx.beginPath();
  ctx.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
  ctx.clip();

  if (minor) {
    ctx.strokeStyle = C.gridMinor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= sheet.width + 0.01; x += minor) {
      const a = toScreen(cam, x, 0);
      const b = toScreen(cam, x, sheet.length);
      ctx.moveTo(a.x + 0.5, a.y);
      ctx.lineTo(b.x + 0.5, b.y);
    }
    for (let y = 0; y <= sheet.length + 0.01; y += minor) {
      const a = toScreen(cam, 0, y);
      const b = toScreen(cam, sheet.width, y);
      ctx.moveTo(a.x, a.y + 0.5);
      ctx.lineTo(b.x, b.y + 0.5);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = C.gridMajor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= sheet.width + 0.01; x += major) {
    const a = toScreen(cam, x, 0);
    const b = toScreen(cam, x, sheet.length);
    ctx.moveTo(a.x + 0.5, a.y);
    ctx.lineTo(b.x + 0.5, b.y);
  }
  for (let y = 0; y <= sheet.length + 0.01; y += major) {
    const a = toScreen(cam, 0, y);
    const b = toScreen(cam, sheet.width, y);
    ctx.moveTo(a.x, a.y + 0.5);
    ctx.lineTo(b.x, b.y + 0.5);
  }
  ctx.stroke();
  ctx.restore();
}

function drawSheet(ctx: CanvasRenderingContext2D, cam: Camera, sheet: Sheet) {
  const origin = toScreen(cam, 0, 0);
  const topRight = toScreen(cam, sheet.width, sheet.length);
  const w = topRight.x - origin.x;
  const h = origin.y - topRight.y;
  const lip = 5;

  if (sheet.shape === "circle") {
    const diameter = sheet.diameter ?? Math.min(sheet.width, sheet.length);
    const radius = (diameter * cam.scale) / 2;
    const center = toScreen(cam, diameter / 2, diameter / 2);

    ctx.fillStyle = C.sheetLip;
    ctx.beginPath();
    ctx.arc(center.x + lip, center.y + lip, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = C.sheet;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(236,234,228,0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(center.x, center.y, Math.max(0, radius - 0.5), 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  ctx.fillStyle = C.sheetLip;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(origin.x + lip, origin.y + lip);
  ctx.lineTo(origin.x + w + lip, origin.y + lip);
  ctx.lineTo(origin.x + w + lip, origin.y - h + lip);
  ctx.lineTo(origin.x + w, origin.y - h);
  ctx.lineTo(origin.x + w, origin.y);
  ctx.fill();

  ctx.fillStyle = C.sheet;
  ctx.fillRect(origin.x, origin.y - h, w, h);

  ctx.strokeStyle = "rgba(236,234,228,0.10)";
  ctx.lineWidth = 1;
  ctx.strokeRect(origin.x + 0.5, origin.y - h + 0.5, w - 1, h - 1);
}
function drawKeepout(ctx: CanvasRenderingContext2D, cam: Camera, sheet: Sheet, margin: number) {
  if (margin <= 0) return;

  const px = margin * cam.scale;

  if (sheet.shape === "circle") {
    const diameter = sheet.diameter ?? Math.min(sheet.width, sheet.length);
    const radius = (diameter * cam.scale) / 2;
    const innerRadius = Math.max(0, radius - px);
    const center = toScreen(cam, diameter / 2, diameter / 2);

    ctx.save();
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.arc(center.x, center.y, innerRadius, 0, Math.PI * 2, true);
    ctx.clip("evenodd");
    ctx.fillStyle = C.keepout;
    ctx.fill();
    ctx.restore();

    if (innerRadius > 0.5) {
      ctx.strokeStyle = C.keepoutLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(center.x, center.y, innerRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (px < 12) return;

    const label = formatMm(margin);
    ctx.fillStyle = C.ink;
    ctx.strokeStyle = C.dimLine;
    ctx.lineWidth = 1;
    ctx.font = "500 10px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const bottomOuter = toScreen(cam, diameter / 2, 0);
    const bottomInner = toScreen(cam, diameter / 2, margin);
    ctx.beginPath();
    ctx.moveTo(bottomOuter.x, bottomOuter.y);
    ctx.lineTo(bottomInner.x, bottomInner.y);
    ctx.stroke();
    ctx.fillText(
      label,
      (bottomOuter.x + bottomInner.x) / 2 + 14,
      (bottomOuter.y + bottomInner.y) / 2,
    );

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    return;
  }

  const origin = toScreen(cam, 0, 0);
  const topRight = toScreen(cam, sheet.width, sheet.length);
  const w = topRight.x - origin.x;
  const h = origin.y - topRight.y;

  const innerW = Math.max(0, sheet.width - 2 * margin);
  const innerH = Math.max(0, sheet.length - 2 * margin);
  const usable = innerW > 0 && innerH > 0;
  const innerBl = toScreen(cam, margin, margin);
  const innerTr = toScreen(cam, margin + innerW, margin + innerH);
  const iw = innerTr.x - innerBl.x;
  const ih = innerBl.y - innerTr.y;

  ctx.save();
  ctx.beginPath();
  ctx.rect(origin.x, origin.y - h, w, h);
  if (usable && iw > 0.5 && ih > 0.5) ctx.rect(innerBl.x, innerTr.y, iw, ih);
  ctx.clip("evenodd");
  ctx.fillStyle = C.keepout;
  ctx.fillRect(origin.x, origin.y - h, w, h);
  ctx.restore();

  if (usable && iw > 0.5 && ih > 0.5) {
    ctx.strokeStyle = C.keepoutLine;
    ctx.lineWidth = 1;
    ctx.strokeRect(innerBl.x + 0.5, innerTr.y + 0.5, Math.max(0, iw - 1), Math.max(0, ih - 1));
  }

  if (px < 12) return;

  const label = formatMm(margin);
  ctx.fillStyle = C.ink;
  ctx.strokeStyle = C.dimLine;
  ctx.lineWidth = 1;
  ctx.font = "500 10px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const bx = sheet.width * 0.55;
  const bottomOuter = toScreen(cam, bx, 0);
  const bottomInner = toScreen(cam, bx, margin);
  ctx.beginPath();
  ctx.moveTo(bottomOuter.x, bottomOuter.y);
  ctx.lineTo(bottomInner.x, bottomInner.y);
  ctx.stroke();
  ctx.fillText(label, (bottomOuter.x + bottomInner.x) / 2 + 14, (bottomOuter.y + bottomInner.y) / 2);

  const ly = sheet.length * 0.55;
  const leftOuter = toScreen(cam, 0, ly);
  const leftInner = toScreen(cam, margin, ly);
  ctx.beginPath();
  ctx.moveTo(leftOuter.x, leftOuter.y);
  ctx.lineTo(leftInner.x, leftInner.y);
  ctx.stroke();
  ctx.save();
  ctx.translate((leftOuter.x + leftInner.x) / 2, (leftOuter.y + leftInner.y) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(label, 0, -10);
  ctx.restore();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawAxes(ctx: CanvasRenderingContext2D, cam: Camera, sheet: Sheet) {
  const len = Math.min(sheet.width, sheet.length) * 0.1;
  const o = toScreen(cam, 0, 0);
  const x = toScreen(cam, len, 0);
  const y = toScreen(cam, 0, len);

  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.strokeStyle = C.axisX;
  ctx.beginPath();
  ctx.moveTo(o.x, o.y);
  ctx.lineTo(x.x, x.y);
  ctx.stroke();
  ctx.strokeStyle = C.axisY;
  ctx.beginPath();
  ctx.moveTo(o.x, o.y);
  ctx.lineTo(y.x, y.y);
  ctx.stroke();

  ctx.font = "500 11px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.fillStyle = C.axisX;
  ctx.fillText("X", x.x + 6, x.y + 4);
  ctx.fillStyle = C.axisY;
  ctx.fillText("Y", y.x - 4, y.y - 8);

  ctx.fillStyle = C.dim;
  ctx.font = "500 10px 'IBM Plex Mono', ui-monospace, monospace";
  const midX = toScreen(cam, sheet.width / 2, 0);
  const midY = toScreen(cam, 0, sheet.length / 2);
  ctx.textAlign = "center";
  ctx.fillText(`${sheet.width} mm`, midX.x, o.y + 22);
  ctx.save();
  ctx.translate(midY.x - 22, midY.y);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${sheet.length} mm`, 0, 0);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawNested(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  piece: NestedPiece,
  showIndex: boolean,
  role: "live" | "locked",
  jobIndex = 0,
) {
  pathPoly(ctx, cam, piece.world);
  for (const hole of piece.holes) {
    if (hole.length < 3) continue;
    const s0 = toScreen(cam, hole[0]!.x, hole[0]!.y);
    ctx.moveTo(s0.x, s0.y);
    for (let i = 1; i < hole.length; i++) {
      const s = toScreen(cam, hole[i]!.x, hole[i]!.y);
      ctx.lineTo(s.x, s.y);
    }
    ctx.closePath();
  }
  if (role === "locked") {
    const tone = JOB_FILL[jobIndex % JOB_FILL.length]!;
    ctx.fillStyle = piece.pointing === "up" ? tone.up : tone.down;
  } else {
    ctx.fillStyle = piece.pointing === "up" ? C.up : C.down;
  }
  ctx.fill("evenodd");
  ctx.strokeStyle = role === "live" ? C.liveStroke : C.stroke;
  ctx.lineWidth = Math.max(0.75, Math.min(role === "live" ? 1.7 : 1.3, cam.scale * 0.8));
  pathPoly(ctx, cam, piece.world);
  ctx.stroke();
  for (const hole of piece.holes) {
    if (hole.length < 3) continue;
    pathPoly(ctx, cam, hole);
    ctx.stroke();
  }

  const c = centroid(piece.world);
  const cs = toScreen(cam, c.x, c.y);

  if (piece.world.length === 3 && role === "live") {
    const apex =
      piece.pointing === "up"
        ? piece.world.reduce((a, p) => (p.y > a.y ? p : a))
        : piece.world.reduce((a, p) => (p.y < a.y ? p : a));
    const as = toScreen(cam, apex.x, apex.y);
    ctx.strokeStyle = C.chevron;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cs.x, cs.y);
    ctx.lineTo(as.x, as.y);
    ctx.stroke();
  }

  if (!showIndex) return;
  ctx.fillStyle = C.label;
  ctx.font = "500 10px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(piece.index + 1), cs.x, cs.y);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

export function NestCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef<Camera | null>(null);
  const fittedRef = useRef<Camera | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, sw: 0, sl: 0 });
  const pointersRef = useRef(new Map<number, Point>());
  const panRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const pinchRef = useRef<{
    cam: Camera;
    a: Point;
    b: Point;
  } | null>(null);
  const sheet = useNestStore((s) => s.sheet);
  const margin = useNestStore((s) => s.margin);
  const jobs = useNestStore((s) => s.jobs);
  const { placements, lockedPlacements, valid } = useNestResult();
  const [pct, setPct] = useState(100);
  const [grabbing, setGrabbing] = useState(false);

  const syncPct = useCallback(() => {
    const cam = camRef.current;
    const fitted = fittedRef.current;
    if (!cam || !fitted) return;
    setPct(zoomPercent(cam, fitted));
  }, []);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = host.clientWidth;
    const h = host.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const prev = sizeRef.current;
    const sheetChanged = prev.sw !== sheet.width || prev.sl !== sheet.length;
    const sizeChanged = prev.w !== w || prev.h !== h;
    const fitted = fitCamera(w, h, sheet);
    fittedRef.current = fitted;

    if (!camRef.current || sheetChanged || prev.w === 0) {
      camRef.current = fitted;
    } else if (sizeChanged) {
      camRef.current = keepWorldCenter(camRef.current, prev.w, prev.h, w, h);
    }
    sizeRef.current = { w, h, sw: sheet.width, sl: sheet.length };
    const cam = camRef.current;

    ctx.fillStyle = C.well;
    ctx.fillRect(0, 0, w, h);

    drawSheet(ctx, cam, sheet);
    drawGrid(ctx, cam, sheet);
    drawKeepout(ctx, cam, sheet, margin);
    const total = lockedPlacements.length + placements.length;
    const showIndex = total <= 36 && cam.scale * 80 > 14;
    const jobIndexById = new Map(jobs.map((j, i) => [j.id, i]));
    for (const piece of lockedPlacements) {
      drawNested(ctx, cam, piece, false, "locked", jobIndexById.get(piece.jobId ?? "") ?? 0);
    }
    if (valid) {
      for (const piece of placements) {
        drawNested(ctx, cam, piece, showIndex, "live");
      }
    }
    drawAxes(ctx, cam, sheet);
  }, [sheet, margin, placements, lockedPlacements, valid, jobs]);

  const applyCam = useCallback(
    (next: Camera) => {
      camRef.current = next;
      paint();
      syncPct();
    },
    [paint, syncPct],
  );

  useLayoutEffect(() => {
    paint();
    syncPct();
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host) return;
    const ro = new ResizeObserver(() => {
      paint();
      syncPct();
    });
    ro.observe(host);
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const cam = camRef.current;
      const fitted = fittedRef.current;
      if (!cam || !fitted) return;
      const rect = host.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * 0.0018);
      const lim = zoomLimits(fitted);
      applyCam(zoomAt(cam, e.clientX - rect.left, e.clientY - rect.top, factor, lim.min, lim.max));
    };
    canvas?.addEventListener("wheel", onWheelNative, { passive: false });
    const blockPageGesture = (ev: TouchEvent) => ev.preventDefault();
    canvas?.addEventListener("touchstart", blockPageGesture, { passive: false });
    canvas?.addEventListener("touchmove", blockPageGesture, { passive: false });
    return () => {
      ro.disconnect();
      canvas?.removeEventListener("wheel", onWheelNative);
      canvas?.removeEventListener("touchstart", blockPageGesture);
      canvas?.removeEventListener("touchmove", blockPageGesture);
    };
  }, [paint, syncPct, applyCam]);

  const fitView = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    applyCam(fitCamera(host.clientWidth, host.clientHeight, sheet));
  }, [applyCam, sheet]);

  const nudgeZoom = useCallback(
    (factor: number) => {
      const host = hostRef.current;
      const cam = camRef.current;
      const fitted = fittedRef.current;
      if (!host || !cam || !fitted) return;
      const lim = zoomLimits(fitted);
      applyCam(zoomAt(cam, host.clientWidth / 2, host.clientHeight / 2, factor, lim.min, lim.max));
    },
    [applyCam],
  );

  const onPointerDown = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    if (e.pointerType !== "touch") canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
    canvas.focus();
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 1 && e.button <= 1) {
      panRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      setGrabbing(true);
    } else if (pointersRef.current.size >= 2) {
      panRef.current = null;
      const pts = [...pointersRef.current.values()];
      const rect = host.getBoundingClientRect();
      const toHost = (p: Point) => ({ x: p.x - rect.left, y: p.y - rect.top });
      pinchRef.current = {
        cam: { ...camRef.current! },
        a: toHost(pts[0]!),
        b: toHost(pts[1]!),
      };
    }
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const cam = camRef.current;
      const fitted = fittedRef.current;
      const host = hostRef.current;
      if (!cam || !fitted || !host) return;

      if (pointersRef.current.size >= 2 && pinchRef.current) {
        const pts = [...pointersRef.current.values()];
        const rect = host.getBoundingClientRect();
        const toHost = (p: Point) => ({ x: p.x - rect.left, y: p.y - rect.top });
        const lim = zoomLimits(fitted);
        const next = pinchCamera(
          pinchRef.current.cam,
          pinchRef.current.a,
          pinchRef.current.b,
          toHost(pts[0]!),
          toHost(pts[1]!),
          lim.min,
          lim.max,
        );
        camRef.current = next;
        paint();
        syncPct();
        return;
      }

      const pan = panRef.current;
      if (pan && pan.id === e.pointerId) {
        applyCam(panCamera(cam, e.clientX - pan.x, e.clientY - pan.y));
        panRef.current = { id: pan.id, x: e.clientX, y: e.clientY };
      }
    },
    [applyCam, paint, syncPct],
  );

  const endPointer = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (panRef.current?.id === e.pointerId) panRef.current = null;
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) setGrabbing(false);
  }, []);

  return (
    <div ref={hostRef} className="relative h-full min-h-0 w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className={`block h-full w-full touch-none select-none focus-visible:outline-none ${grabbing ? "cursor-grabbing" : "cursor-grab"}`}
        aria-label="Vista da chapa de corte. Pinça: zoom. Arraste: pan. Duplo toque: enquadrar."
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={fitView}
        onKeyDown={(e) => {
          if (e.key === "+" || e.key === "=") {
            e.preventDefault();
            nudgeZoom(1.2);
          } else if (e.key === "-" || e.key === "_") {
            e.preventDefault();
            nudgeZoom(1 / 1.2);
          } else if (e.key === "0" || e.key === "f" || e.key === "F") {
            e.preventDefault();
            fitView();
          }
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 lg:p-4">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-md bg-bg/90 p-1 shadow-[var(--shadow-border)]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label="Reduzir zoom"
            onClick={() => nudgeZoom(1 / 1.25)}
          >
            <Minus />
          </Button>
          <button
            type="button"
            className="min-w-14 px-1 text-center font-mono text-xs tabular-nums text-fg"
            aria-label="Enquadrar a chapa"
            onClick={fitView}
          >
            {pct}%
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label="Aumentar zoom"
            onClick={() => nudgeZoom(1.25)}
          >
            <Plus />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label="Enquadrar a chapa"
            onClick={fitView}
          >
            <Scan />
          </Button>
        </div>
      </div>
    </div>
  );
}
