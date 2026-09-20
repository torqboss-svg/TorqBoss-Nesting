import {
  aabbOf,
  area,
  canonicalize,
  canonicalizeTriangle,
  convexHull,
  formatMm,
  isChevronLike,
  isDegenerate,
  point,
} from "./geometry.ts";
import type {
  FlangePresetId,
  NestFamily,
  Piece,
  PieceInput,
  Point,
  Polygon,
  PolyPresetId,
  ShapeKind,
  Triangle,
} from "./types.ts";
import { wingFromSpec, wingPresetMeta, WING_PRESETS } from "./wing.ts";

export { WING_PRESETS, wingFromSpec, wingPresetMeta };

export const CIRCLE_SEGS = 48;
export const MAX_POLY_VERTS = 16;

export const SHAPE_META: {
  id: ShapeKind;
  label: string;
  mark: string;
  family: NestFamily;
}[] = [
  { id: "triangle", label: "Triângulo", mark: "△", family: "pair180" },
  { id: "square", label: "Quadrado", mark: "□", family: "grid" },
  { id: "rect", label: "Retângulo", mark: "▭", family: "grid" },
  { id: "disc", label: "Disco", mark: "○", family: "hex" },
  { id: "flange", label: "Flange", mark: "◎", family: "hex" },
  { id: "wing", label: "Asa", mark: "⋀", family: "auto" },
  { id: "l", label: "L", mark: "└", family: "grid" },
  { id: "u", label: "U", mark: "∪", family: "grid" },
  { id: "v", label: "V", mark: "∨", family: "pair180" },
  { id: "hex", label: "Hexágono", mark: "⬡", family: "hex" },
  { id: "trap", label: "Trapézio", mark: "⏢", family: "pair180" },
  { id: "poly", label: "Irregular", mark: "⬠", family: "auto" },
];

export function shapeMeta(id: ShapeKind) {
  return SHAPE_META.find((s) => s.id === id) ?? SHAPE_META[0]!;
}

function dimJoin(...parts: number[]): string {
  return parts.map((n) => formatMm(n)).join(" × ");
}

/** Cota de fabricação do lote — compacta, para a lista consolidada. */
export function pieceDimLabel(input: PieceInput): string {
  switch (input.shape) {
    case "triangle":
      if (input.triangleMode === "right") return dimJoin(input.legA, input.legB);
      if (input.triangleMode === "vertices") {
        const box = aabbOf((input.vertices ?? []).slice(0, 3));
        return dimJoin(box.maxX - box.minX, box.maxY - box.minY);
      }
      return dimJoin(input.base, input.height);
    case "square":
      return dimJoin(input.side);
    case "rect":
      return dimJoin(input.width, input.height);
    case "disc":
      return `⌀${formatMm(input.outerDia)}`;
    case "flange": {
      const sweep = input.sweepDeg ?? 360;
      const hole = input.innerDia > 0.5 ? ` / ⌀${formatMm(input.innerDia)}` : "";
      const arc = sweep < 359 ? ` · ${formatMm(sweep)}°` : "";
      return `⌀${formatMm(input.outerDia)}${hole}${arc}`;
    }
    case "wing":
      return dimJoin(input.width, input.height);
    case "l":
    case "u":
    case "v":
      return dimJoin(input.width, input.height, input.thick);
    case "hex":
      return dimJoin(input.hexSide);
    case "trap":
      return dimJoin(input.baseBot, input.baseTop, input.height);
    case "poly": {
      const box = aabbOf(input.vertices ?? []);
      return dimJoin(box.maxX - box.minX, box.maxY - box.minY);
    }
  }
}

/** Dez modelos de partida para Irregular — o usuário ainda edita os vértices. */
export const POLY_PRESETS: {
  id: PolyPresetId;
  label: string;
  mark: string;
  hint: string;
  vertices: Point[];
}[] = [
  {
    id: "livre",
    label: "Livre",
    mark: "⬠",
    hint: "Pentágono assimétrico — o modelo principal.",
    vertices: [
      { x: 0, y: 0 },
      { x: 320, y: 0 },
      { x: 380, y: 140 },
      { x: 200, y: 280 },
      { x: 20, y: 160 },
    ],
  },
  {
    id: "casa",
    label: "Casa",
    mark: "⌂",
    hint: "Retângulo com frontão.",
    vertices: [
      { x: 0, y: 0 },
      { x: 360, y: 0 },
      { x: 360, y: 180 },
      { x: 180, y: 300 },
      { x: 0, y: 180 },
    ],
  },
  {
    id: "seta",
    label: "Seta",
    mark: "➤",
    hint: "Seta com haste — encaixa em grade.",
    vertices: [
      { x: 0, y: 70 },
      { x: 200, y: 70 },
      { x: 200, y: 0 },
      { x: 380, y: 140 },
      { x: 200, y: 280 },
      { x: 200, y: 210 },
      { x: 0, y: 210 },
    ],
  },
  {
    id: "paralelogramo",
    label: "Paralelo",
    mark: "▱",
    hint: "Paralelogramo — tesela no par 180°.",
    vertices: [
      { x: 0, y: 0 },
      { x: 320, y: 0 },
      { x: 400, y: 240 },
      { x: 80, y: 240 },
    ],
  },
  {
    id: "losango",
    label: "Losango",
    mark: "◇",
    hint: "Losango / pipa.",
    vertices: [
      { x: 180, y: 0 },
      { x: 360, y: 160 },
      { x: 180, y: 320 },
      { x: 0, y: 160 },
    ],
  },
  {
    id: "te",
    label: "Tê",
    mark: "⊤",
    hint: "Perfil em T.",
    vertices: [
      { x: 130, y: 0 },
      { x: 230, y: 0 },
      { x: 230, y: 180 },
      { x: 360, y: 180 },
      { x: 360, y: 280 },
      { x: 0, y: 280 },
      { x: 0, y: 180 },
      { x: 130, y: 180 },
    ],
  },
  {
    id: "cruz",
    label: "Cruz",
    mark: "✚",
    hint: "Cruz de braços iguais.",
    vertices: [
      { x: 130, y: 0 },
      { x: 230, y: 0 },
      { x: 230, y: 110 },
      { x: 360, y: 110 },
      { x: 360, y: 210 },
      { x: 230, y: 210 },
      { x: 230, y: 320 },
      { x: 130, y: 320 },
      { x: 130, y: 210 },
      { x: 0, y: 210 },
      { x: 0, y: 110 },
      { x: 130, y: 110 },
    ],
  },
  {
    id: "chevron",
    label: "Chevron",
    mark: "⟨",
    hint: "V grosso / seta recortada.",
    vertices: [
      { x: 0, y: 0 },
      { x: 140, y: 0 },
      { x: 280, y: 140 },
      { x: 140, y: 280 },
      { x: 0, y: 280 },
      { x: 140, y: 140 },
    ],
  },
  {
    id: "aba",
    label: "Aba",
    mark: "⊓",
    hint: "Retângulo com aba trapezoidal.",
    vertices: [
      { x: 0, y: 0 },
      { x: 360, y: 0 },
      { x: 360, y: 200 },
      { x: 260, y: 200 },
      { x: 220, y: 280 },
      { x: 140, y: 280 },
      { x: 100, y: 200 },
      { x: 0, y: 200 },
    ],
  },
  {
    id: "gota",
    label: "Gota",
    mark: "◉",
    hint: "Gota poligonal.",
    vertices: [
      { x: 160, y: 0 },
      { x: 280, y: 60 },
      { x: 320, y: 180 },
      { x: 240, y: 300 },
      { x: 80, y: 300 },
      { x: 0, y: 180 },
      { x: 40, y: 60 },
    ],
  },
];

export function polyPresetMeta(id: PolyPresetId) {
  return POLY_PRESETS.find((p) => p.id === id) ?? POLY_PRESETS[0]!;
}

export function verticesOfPreset(id: PolyPresetId): Point[] {
  return polyPresetMeta(id).vertices.map((p) => ({ x: p.x, y: p.y }));
}

export const FLANGE_PRESETS: {
  id: FlangePresetId;
  label: string;
  mark: string;
  hint: string;
  sweepDeg: number;
  innerRatio: number;
  kind: "ring" | "crescent";
}[] = [
  {
    id: "anel",
    label: "Anel",
    mark: "◎",
    hint: "Flange completa — furo concêntrico.",
    sweepDeg: 360,
    innerRatio: 0.57,
    kind: "ring",
  },
  {
    id: "meia",
    label: "Meia",
    mark: "◐",
    hint: "Meia flange (180°) com furo.",
    sweepDeg: 180,
    innerRatio: 0.57,
    kind: "ring",
  },
  {
    id: "quarto",
    label: "Quarto",
    mark: "◔",
    hint: "1/4 da flange (90°).",
    sweepDeg: 90,
    innerRatio: 0.57,
    kind: "ring",
  },
  {
    id: "terco",
    label: "Terço",
    mark: "◕",
    hint: "1/3 da flange (120°).",
    sweepDeg: 120,
    innerRatio: 0.57,
    kind: "ring",
  },
  {
    id: "sexto",
    label: "Sexto",
    mark: "◗",
    hint: "1/6 da flange (60°).",
    sweepDeg: 60,
    innerRatio: 0.57,
    kind: "ring",
  },
  {
    id: "c",
    label: "Aberto",
    mark: "⊃",
    hint: "Anel em C — fresta no arco.",
    sweepDeg: 300,
    innerRatio: 0.57,
    kind: "ring",
  },
  {
    id: "fatia",
    label: "Fatia",
    mark: "◓",
    hint: "Setor até o centro — raios juntos num ponto.",
    sweepDeg: 90,
    innerRatio: 0,
    kind: "ring",
  },
  {
    id: "meialua",
    label: "Meia-lua",
    mark: "◑",
    hint: "Semicírculo sólido. Ø interno 0 = pontas juntas.",
    sweepDeg: 180,
    innerRatio: 0,
    kind: "ring",
  },
  {
    id: "gomo",
    label: "Gomo",
    mark: "◝",
    hint: "Gomo 60° até o centro.",
    sweepDeg: 60,
    innerRatio: 0,
    kind: "ring",
  },
  {
    id: "crescente",
    label: "Lua",
    mark: "☾",
    hint: "Crescente: arco interno deslocado do externo.",
    sweepDeg: 180,
    innerRatio: 0.62,
    kind: "crescent",
  },
];

export function flangePresetMeta(id: FlangePresetId) {
  return FLANGE_PRESETS.find((p) => p.id === id) ?? FLANGE_PRESETS[0]!;
}

export function flangePresetPatch(id: FlangePresetId, outerDia: number): Pick<PieceInput, "flangePreset" | "sweepDeg" | "innerDia"> {
  const meta = flangePresetMeta(id);
  const od = Math.max(1, outerDia);
  return {
    flangePreset: id,
    sweepDeg: meta.sweepDeg,
    innerDia: Math.round(od * meta.innerRatio),
  };
}

export function circlePoints(cx: number, cy: number, radius: number, n: number, startDeg = 0): Polygon {
  const out: Point[] = [];
  const step = 360 / n;
  for (let i = 0; i < n; i++) {
    const a = ((startDeg + i * step) * Math.PI) / 180;
    out.push(point(cx + radius * Math.cos(a), cy + radius * Math.sin(a)));
  }
  return out;
}

export function regularPolygon(cx: number, cy: number, radius: number, n: number, startDeg = 0): Polygon {
  return canonicalize(circlePoints(cx, cy, radius, n, startDeg));
}

export function triangleFromBaseHeight(base: number, height: number): Triangle {
  return canonicalizeTriangle([point(0, 0), point(base, 0), point(base / 2, height)]);
}

export function triangleFromLegs(legA: number, legB: number): Triangle {
  return canonicalizeTriangle([point(0, 0), point(legA, 0), point(0, legB)]);
}

export function triangleFromVertices(a: Point, b: Point, c: Point): Triangle {
  return canonicalizeTriangle([a, b, c]);
}

export function squareFromSide(side: number): Polygon {
  return canonicalize([point(0, 0), point(side, 0), point(side, side), point(0, side)]);
}

export function rectFromSize(width: number, height: number): Polygon {
  return canonicalize([point(0, 0), point(width, 0), point(width, height), point(0, height)]);
}

export function discFromDiameter(diameter: number): Polygon {
  return regularPolygon(0, 0, Math.max(0, diameter) / 2, CIRCLE_SEGS, 0);
}

export function flangeFromDiameters(outer: number, inner: number): { vertices: Polygon; holes: Polygon[] } {
  return flangeFromSpec(outer, inner, 360, "anel");
}

function arcPoints(cx: number, cy: number, r: number, deg0: number, deg1: number, n: number): Polygon {
  const segs = Math.max(4, Math.round(n));
  const out: Point[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = deg0 + ((deg1 - deg0) * i) / segs;
    const a = (t * Math.PI) / 180;
    out.push(point(cx + r * Math.cos(a), cy + r * Math.sin(a)));
  }
  return out;
}

function annularSector(rOut: number, rIn: number, sweepDeg: number): Polygon {
  const sweep = Math.min(359.5, Math.max(8, sweepDeg));
  const segs = Math.max(8, Math.round((CIRCLE_SEGS * sweep) / 360));
  const a0 = -sweep / 2;
  const a1 = sweep / 2;
  if (rIn < 0.5) {
    return canonicalize([...arcPoints(0, 0, rOut, a0, a1, segs), point(0, 0)]);
  }
  const outer = arcPoints(0, 0, rOut, a0, a1, segs);
  const inner = arcPoints(0, 0, rIn, a1, a0, segs);
  return canonicalize([...outer, ...inner]);
}

function crescentFromRadii(rOut: number, rIn: number): Polygon {
  const R = Math.max(rOut, 2);
  const r = Math.min(Math.max(rIn, R * 0.2), R * 0.92);
  const d = Math.max(0.8, R - r * 0.55);
  const x = (d * d + R * R - r * r) / (2 * d);
  const y2 = R * R - x * x;
  if (y2 <= 1e-4) return annularSector(R, r, 180);
  const y = Math.sqrt(y2);
  const aA1 = (Math.atan2(y, x) * 180) / Math.PI;
  const aA2 = (Math.atan2(-y, x) * 180) / Math.PI;
  const aB1 = (Math.atan2(y, x - d) * 180) / Math.PI;
  const aB2 = (Math.atan2(-y, x - d) * 180) / Math.PI;
  const outer = arcPoints(0, 0, R, aA1, aA2 + 360, 28);
  const inner = arcPoints(d, 0, r, aB2, aB1, 20);
  return canonicalize([...outer, ...inner]);
}

export function flangeFromSpec(
  outer: number,
  inner: number,
  sweepDeg: number,
  preset: FlangePresetId = "anel",
): { vertices: Polygon; holes: Polygon[] } {
  const rOut = Math.max(0, outer) / 2;
  const rIn = Math.max(0, inner) / 2;
  const meta = flangePresetMeta(preset);
  if (meta.kind === "crescent") {
    return { vertices: crescentFromRadii(rOut, rIn < 0.5 ? rOut * 0.62 : rIn), holes: [] };
  }
  const sweep = Math.min(360, Math.max(8, sweepDeg));
  if (sweep >= 359.2) {
    const raw = circlePoints(0, 0, rOut, CIRCLE_SEGS, 0);
    const vertices = canonicalize(raw);
    if (rIn < 0.5 || rIn >= rOut - 0.5) return { vertices, holes: [] };
    const box = aabbOf(raw);
    const holes = [
      circlePoints(0, 0, rIn, CIRCLE_SEGS, 0).map((p) => ({ x: p.x - box.minX, y: p.y - box.minY })),
    ];
    return { vertices, holes };
  }
  return { vertices: annularSector(rOut, Math.min(rIn, rOut - 0.5), sweep), holes: [] };
}

export function lFromSize(width: number, height: number, thick: number): Polygon {
  const t = Math.min(thick, width - 0.5, height - 0.5);
  if (t <= 0) return squareFromSide(Math.max(width, height, 1));
  return canonicalize([
    point(0, 0),
    point(width, 0),
    point(width, t),
    point(t, t),
    point(t, height),
    point(0, height),
  ]);
}

export function uFromSize(width: number, height: number, thick: number): Polygon {
  const t = Math.min(thick, width / 2 - 0.5, height - 0.5);
  if (t <= 0) return rectFromSize(width, height);
  return canonicalize([
    point(0, 0),
    point(width, 0),
    point(width, height),
    point(width - t, height),
    point(width - t, t),
    point(t, t),
    point(t, height),
    point(0, height),
  ]);
}

export function vFromSize(width: number, height: number, thick: number): Polygon {
  const W = Math.max(width, 1);
  const H = Math.max(height, 1);
  const L = Math.hypot(W / 2, H);
  const sinA = W / 2 / L;
  if (sinA < 1e-6) return triangleFromBaseHeight(W, H);
  const inset = thick / sinA;
  if (inset >= H - 0.5 || thick >= W / 2 - 0.5) return triangleFromBaseHeight(W, H);
  const innerApexY = inset;
  const scale = (H - innerApexY) / H;
  const innerHalf = (W / 2) * scale;
  return canonicalize([
    point(0, H),
    point(W / 2 - innerHalf, H),
    point(W / 2, innerApexY),
    point(W / 2 + innerHalf, H),
    point(W, H),
    point(W / 2, 0),
  ]);
}

export function hexFromSide(side: number): Polygon {
  return regularPolygon(0, 0, Math.max(side, 0), 6, 30);
}

export function trapFromBases(baseBot: number, baseTop: number, height: number): Polygon {
  const bot = Math.max(baseBot, 0.5);
  const top = Math.max(baseTop, 0.5);
  const h = Math.max(height, 0.5);
  const left = (bot - top) / 2;
  return canonicalize([
    point(0, 0),
    point(bot, 0),
    point(left + top, h),
    point(left, h),
  ]);
}

export function polyFromVertices(verts: readonly Point[]): Polygon {
  const cleaned = verts.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (cleaned.length < 3) return triangleFromBaseHeight(10, 8);
  return canonicalize(cleaned.slice(0, MAX_POLY_VERTS));
}

function netArea(vertices: Polygon, holes: Polygon[]): number {
  return Math.max(0, area(vertices) - holes.reduce((s, h) => s + area(h), 0));
}

export function buildPiece(input: PieceInput): { piece: Piece; valid: boolean } {
  const meta = shapeMeta(input.shape);
  let vertices: Polygon = [];
  let holes: Polygon[] = [];

  switch (input.shape) {
    case "triangle":
      if (input.triangleMode === "right") vertices = triangleFromLegs(input.legA, input.legB);
      else if (input.triangleMode === "vertices") {
        const v = input.vertices;
        vertices = triangleFromVertices(v[0] ?? point(0, 0), v[1] ?? point(1, 0), v[2] ?? point(0, 1));
      } else vertices = triangleFromBaseHeight(input.base, input.height);
      break;
    case "square":
      vertices = squareFromSide(input.side);
      break;
    case "rect":
      vertices = rectFromSize(input.width, input.height);
      break;
    case "disc":
      vertices = discFromDiameter(input.outerDia);
      break;
    case "flange": {
      const f = flangeFromSpec(input.outerDia, input.innerDia, input.sweepDeg ?? 360, input.flangePreset ?? "anel");
      vertices = f.vertices;
      holes = f.holes;
      break;
    }
    case "wing":
      vertices = wingFromSpec(input.wingPreset ?? "delta", input.width, input.height, input.thick);
      break;
    case "l":
      vertices = lFromSize(input.width, input.height, input.thick);
      break;
    case "u":
      vertices = uFromSize(input.width, input.height, input.thick);
      break;
    case "v":
      vertices = vFromSize(input.width, input.height, input.thick);
      break;
    case "hex":
      vertices = hexFromSide(input.hexSide);
      break;
    case "trap":
      vertices = trapFromBases(input.baseBot, input.baseTop, input.height);
      break;
    case "poly":
      vertices = polyFromVertices(input.vertices);
      break;
  }

  const pieceArea = netArea(vertices, holes);
  let family = meta.family;
  if (input.shape === "poly") {
    const hull = convexHull(vertices);
    family =
      hull.length === 3
        ? "pair180"
        : hull.length === vertices.length
          ? "pair180"
          : isChevronLike(vertices)
            ? "pair180"
            : "grid";
  } else if (input.shape === "flange") {
    const sweep = input.sweepDeg ?? 360;
    const preset = input.flangePreset ?? "anel";
    if (preset === "anel" && sweep >= 359) family = "hex";
    else {
      const hull = convexHull(vertices);
      family = hull.length === vertices.length ? "pair180" : "grid";
    }
  } else if (input.shape === "wing") {
    const hull = convexHull(vertices);
    family = hull.length >= vertices.length - 4 ? "pair180" : "grid";
  }

  const isFullFlange =
    input.shape === "flange" && (input.flangePreset ?? "anel") === "anel" && (input.sweepDeg ?? 360) >= 359;
  const valid =
    !isDegenerate(vertices) &&
    pieceArea >= 0.01 &&
    (!isFullFlange || holes.length > 0);

  const name =
    input.shape === "poly"
      ? `Irregular · ${polyPresetMeta(input.polyPreset ?? "livre").label}`
      : input.shape === "flange"
        ? `Flange · ${flangePresetMeta(input.flangePreset ?? "anel").label}`
        : input.shape === "wing"
          ? `Asa · ${wingPresetMeta(input.wingPreset ?? "delta").label}`
          : meta.label;

  return {
    valid,
    piece: {
      id: "piece-a",
      name,
      shape: input.shape,
      family,
      vertices,
      holes,
      area: pieceArea,
    },
  };
}

export const VERTEX_LABELS = ["A", "B", "C"] as const;

export function vertexLabel(i: number): string {
  if (i < 26) return String.fromCharCode(65 + i);
  return `P${i + 1}`;
}
