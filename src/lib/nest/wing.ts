import { canonicalize, point } from "./geometry.ts";
import type { Point, Polygon, WingPresetId } from "./types.ts";

type Cubic = readonly [Point, Point, Point, Point];

const ELLIPSE_K = 0.5522847498307936;

export const WING_PRESETS: {
  id: WingPresetId;
  label: string;
  mark: string;
  hint: string;
}[] = [
  {
    id: "delta",
    label: "Delta",
    mark: "⋀",
    hint: "Asa-delta — o modelo principal. Borda de ataque em Bézier, bordo de fuga quase reto.",
  },
  {
    id: "rogallo",
    label: "Rogallo",
    mark: "⋏",
    hint: "Dois lóbulos e quilha — a asa clássica de asa-delta.",
  },
  {
    id: "petala",
    label: "Pétala",
    mark: "✿",
    hint: "Pétala: ponta fina, base arredondada.",
  },
  {
    id: "lagrima",
    label: "Lágrima",
    mark: "◠",
    hint: "Gota Bézier — bulbosa embaixo, afilada no nariz.",
  },
  {
    id: "folha",
    label: "Folha",
    mark: "❦",
    hint: "Folha assimétrica, uma margem mais curva.",
  },
  {
    id: "foice",
    label: "Foice",
    mark: ")",
    hint: "Crescente / foice — arco externo e interno em Bézier.",
  },
  {
    id: "amendoa",
    label: "Amêndoa",
    mark: "⬦",
    hint: "Amêndoa: dois ápices, flancos convexos.",
  },
  {
    id: "oval",
    label: "Oval",
    mark: "⬭",
    hint: "Elipse em quatro cúbicas (κ ≈ 0,552). Barriga altera o arredondamento.",
  },
  {
    id: "gaivota",
    label: "Gaivota",
    mark: "⁀",
    hint: "Planta de gaivota — ombros altos, bordo de fuga em W raso.",
  },
  {
    id: "bumerangue",
    label: "Bumerangue",
    mark: "⊂",
    hint: "Dois braços, copa convexa e virilha côncava.",
  },
];

export function wingPresetMeta(id: WingPresetId) {
  return WING_PRESETS.find((p) => p.id === id) ?? WING_PRESETS[0]!;
}

export function isWingPreset(id: unknown): id is WingPresetId {
  return typeof id === "string" && WING_PRESETS.some((p) => p.id === id);
}

function P(x: number, y: number): Point {
  return point(x, y);
}

function cubicPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  return {
    x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
    y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y,
  };
}

function hypot2(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function sampleCubic(c: Cubic, n: number): Point[] {
  const out: Point[] = [];
  const segs = Math.max(2, Math.round(n));
  for (let i = 0; i <= segs; i++) out.push(cubicPoint(c[0], c[1], c[2], c[3], i / segs));
  return out;
}

/** Mais pontos onde a cúbica foge da corda; reta quase não gasta vértice. */
function segsForCubic(c: Cubic): number {
  const chord = hypot2(c[0], c[3]);
  const mid = cubicPoint(c[0], c[1], c[2], c[3], 0.5);
  const bow = Math.hypot(mid.x - (c[0].x + c[3].x) / 2, mid.y - (c[0].y + c[3].y) / 2);
  const q = chord < 1e-6 ? 1 : bow / chord;
  return Math.max(3, Math.min(8, Math.round(3 + q * 12)));
}

function sampleLoop(curves: readonly Cubic[]): Polygon {
  const pts: Point[] = [];
  for (const c of curves) {
    const s = sampleCubic(c, segsForCubic(c));
    pts.push(...s.slice(0, -1));
  }
  return dropColinear(canonicalize(pts));
}

function dropColinear(pts: Polygon): Polygon {
  const n = pts.length;
  if (n < 5) return pts;
  const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const p of pts) {
    if (p.x < box.minX) box.minX = p.x;
    if (p.y < box.minY) box.minY = p.y;
    if (p.x > box.maxX) box.maxX = p.x;
    if (p.y > box.maxY) box.maxY = p.y;
  }
  const span = Math.hypot(box.maxX - box.minX, box.maxY - box.minY) || 1;
  const eps = Math.max(0.35, span * 0.0018);
  const out: Point[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n]!;
    const b = pts[i]!;
    const c = pts[(i + 1) % n]!;
    const cr = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const base = hypot2(a, c) || 1;
    if (Math.abs(cr) / base > eps) out.push(b);
  }
  return out.length >= 4 ? out : pts;
}

function scaleCubics(curves: readonly Cubic[], w: number, h: number): Cubic[] {
  const sx = Math.max(w, 1);
  const sy = Math.max(h, 1);
  return curves.map(
    (c) =>
      [
        P(c[0].x * sx, c[0].y * sy),
        P(c[1].x * sx, c[1].y * sy),
        P(c[2].x * sx, c[2].y * sy),
        P(c[3].x * sx, c[3].y * sy),
      ] as const,
  );
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(0.85, Math.max(0, n));
}

function unitCurves(id: WingPresetId, k: number): Cubic[] {
  switch (id) {
    case "delta": {
      const out = k * 0.18;
      return [
        [P(0, 0), P(0.16 - out, 0.34), P(0.34 - out, 0.74), P(0.5, 1)],
        [P(0.5, 1), P(0.66 + out, 0.74), P(0.84 + out, 0.34), P(1, 0)],
        [P(1, 0), P(0.66, -k * 0.12), P(0.34, -k * 0.12), P(0, 0)],
      ];
    }
    case "rogallo":
      return [
        [P(0, 0.1), P(0, 0.52 + k * 0.18), P(0.28, 0.96), P(0.5, 1)],
        [P(0.5, 1), P(0.72, 0.96), P(1, 0.52 + k * 0.18), P(1, 0.1)],
        [P(1, 0.1), P(0.84, 0.02 + k * 0.06), P(0.64, 0.08 + k * 0.42), P(0.5, 0)],
        [P(0.5, 0), P(0.36, 0.08 + k * 0.42), P(0.16, 0.02 + k * 0.06), P(0, 0.1)],
      ];
    case "petala":
      return [
        [P(0.5, 1), P(0.22, 0.82), P(0.02, 0.58), P(0.04, 0.28)],
        [P(0.04, 0.28), P(0.06, 0.08), P(0.28, 0.0), P(0.5, 0)],
        [P(0.5, 0), P(0.72, 0.0), P(0.94, 0.08), P(0.96, 0.28)],
        [P(0.96, 0.28), P(0.98, 0.58), P(0.78, 0.82), P(0.5, 1)],
      ];
    case "lagrima":
      return [
        [P(0.5, 1), P(0.4, 0.72), P(0.02, 0.62), P(0, 0.38)],
        [P(0, 0.38), P(0, 0.12 + k * 0.04), P(0.2, 0), P(0.5, 0)],
        [P(0.5, 0), P(0.8, 0), P(1, 0.12 + k * 0.04), P(1, 0.38)],
        [P(1, 0.38), P(0.98, 0.62), P(0.6, 0.72), P(0.5, 1)],
      ];
    case "folha":
      return [
        [P(0.5, 1), P(0.12, 0.86), P(0.0, 0.58), P(0.06, 0.3)],
        [P(0.06, 0.3), P(0.1, 0.08), P(0.34, 0.0), P(0.48, 0)],
        [P(0.48, 0), P(0.62, 0.02), P(0.92, 0.16 + k * 0.1), P(0.94, 0.42)],
        [P(0.94, 0.42), P(0.96, 0.68), P(0.78, 0.9), P(0.5, 1)],
      ];
    case "foice": {
      const inner = 0.22 + k * 0.38;
      return [
        [P(0, 0.18), P(0.06, 0.68), P(0.28, 1), P(0.5, 1)],
        [P(0.5, 1), P(0.72, 1), P(0.94, 0.68), P(1, 0.18)],
        [P(1, 0.18), P(0.72, inner), P(0.58, inner * 0.72), P(0.5, inner * 0.58)],
        [P(0.5, inner * 0.58), P(0.42, inner * 0.72), P(0.28, inner), P(0, 0.18)],
      ];
    }
    case "amendoa":
      return [
        [P(0.5, 1), P(0.18, 1 - k * 0.08), P(0, 0.72), P(0, 0.5)],
        [P(0, 0.5), P(0, 0.28), P(0.18, k * 0.08), P(0.5, 0)],
        [P(0.5, 0), P(0.82, k * 0.08), P(1, 0.28), P(1, 0.5)],
        [P(1, 0.5), P(1, 0.72), P(0.82, 1 - k * 0.08), P(0.5, 1)],
      ];
    case "oval": {
      const kappa = Math.min(0.78, Math.max(0.32, ELLIPSE_K + (k - 0.3) * 0.35));
      const ox = kappa;
      const oy = kappa;
      return [
        [P(1, 0.5), P(1, 0.5 + oy * 0.5), P(0.5 + ox * 0.5, 1), P(0.5, 1)],
        [P(0.5, 1), P(0.5 - ox * 0.5, 1), P(0, 0.5 + oy * 0.5), P(0, 0.5)],
        [P(0, 0.5), P(0, 0.5 - oy * 0.5), P(0.5 - ox * 0.5, 0), P(0.5, 0)],
        [P(0.5, 0), P(0.5 + ox * 0.5, 0), P(1, 0.5 - oy * 0.5), P(1, 0.5)],
      ];
    }
    case "gaivota":
      return [
        [P(0, 0.32), P(0.04, 0.72), P(0.2, 0.96), P(0.5, 1)],
        [P(0.5, 1), P(0.8, 0.96), P(0.96, 0.72), P(1, 0.32)],
        [P(1, 0.32), P(0.78, 0.04 + k * 0.06), P(0.62, 0.14), P(0.5, 0)],
        [P(0.5, 0), P(0.38, 0.14), P(0.22, 0.04 + k * 0.06), P(0, 0.32)],
      ];
    case "bumerangue": {
      const crotch = 0.42 + k * 0.1;
      return [
        [P(0, 0.08), P(0.06, 0.52), P(0.24, 1), P(0.5, 1)],
        [P(0.5, 1), P(0.76, 1), P(0.94, 0.52), P(1, 0.08)],
        [P(1, 0.08), P(0.78, 0.18), P(0.64, crotch), P(0.5, crotch)],
        [P(0.5, crotch), P(0.36, crotch), P(0.22, 0.18), P(0, 0.08)],
      ];
    }
  }
}

export function wingFromSpec(
  preset: WingPresetId,
  width: number,
  height: number,
  camber: number,
): Polygon {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const k = clamp01(camber / h);
  const curves = scaleCubics(unitCurves(preset, k), w, h);
  return sampleLoop(curves);
}

export const __test = { cubicPoint, sampleCubic, sampleLoop };
