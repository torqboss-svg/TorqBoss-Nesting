import type { Point, Sheet } from "./types.ts";

export type Camera = {
  /** Pixels por milímetro. */
  scale: number;
  /** Origem do mundo (0,0) em coordenadas de tela. */
  ox: number;
  oy: number;
};

export const VIEW_PAD = 56;
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 48;

export function fitCamera(w: number, h: number, sheet: Sheet, pad = VIEW_PAD): Camera {
  const availW = Math.max(1, w - pad * 2);
  const availH = Math.max(1, h - pad * 2);
  const scale = Math.min(availW / Math.max(sheet.width, 1), availH / Math.max(sheet.length, 1));
  const sw = sheet.width * scale;
  const sh = sheet.length * scale;
  const left = (w - sw) / 2;
  const top = (h - sh) / 2;
  return { scale: Math.max(scale, 1e-6), ox: left, oy: top + sh };
}

export function toScreen(cam: Camera, x: number, y: number): Point {
  return { x: cam.ox + x * cam.scale, y: cam.oy - y * cam.scale };
}

export function toWorld(cam: Camera, sx: number, sy: number): Point {
  return {
    x: (sx - cam.ox) / cam.scale,
    y: (cam.oy - sy) / cam.scale,
  };
}

export function panCamera(cam: Camera, dx: number, dy: number): Camera {
  return { scale: cam.scale, ox: cam.ox + dx, oy: cam.oy + dy };
}

export function zoomAt(
  cam: Camera,
  sx: number,
  sy: number,
  factor: number,
  minScale: number,
  maxScale: number,
): Camera {
  const world = toWorld(cam, sx, sy);
  const scale = Math.min(maxScale, Math.max(minScale, cam.scale * factor));
  return {
    scale,
    ox: sx - world.x * scale,
    oy: sy + world.y * scale,
  };
}

export function zoomLimits(fitted: Camera): { min: number; max: number } {
  return { min: fitted.scale * MIN_ZOOM, max: fitted.scale * MAX_ZOOM };
}

export function zoomPercent(cam: Camera, fitted: Camera): number {
  if (fitted.scale <= 0) return 100;
  return Math.round((cam.scale / fitted.scale) * 100);
}

export function keepWorldCenter(cam: Camera, fromW: number, fromH: number, toW: number, toH: number): Camera {
  const world = toWorld(cam, fromW / 2, fromH / 2);
  return {
    scale: cam.scale,
    ox: toW / 2 - world.x * cam.scale,
    oy: toH / 2 + world.y * cam.scale,
  };
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Pinça: zoom em torno do ponto médio inicial e pan conforme os dedos
 * deslizam. `start` é a câmera no instante em que o segundo dedo desceu.
 */
export function pinchCamera(
  start: Camera,
  startA: Point,
  startB: Point,
  nowA: Point,
  nowB: Point,
  minScale: number,
  maxScale: number,
): Camera {
  const startDist = dist(startA, startB);
  const nowDist = dist(nowA, nowB);
  const startMid = midpoint(startA, startB);
  const nowMid = midpoint(nowA, nowB);
  const factor = startDist < 1e-6 ? 1 : nowDist / startDist;
  const zoomed = zoomAt(start, startMid.x, startMid.y, factor, minScale, maxScale);
  return panCamera(zoomed, nowMid.x - startMid.x, nowMid.y - startMid.y);
}
