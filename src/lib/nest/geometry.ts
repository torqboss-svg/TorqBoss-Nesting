import type { AABB, Point, Pose, Sheet, Triangle } from "./types.ts";

/** TolerÃ¢ncia linear, mm. */
export const EPS = 1e-6;

/** Ãrea mÃ­nima aceita para um triÃ¢ngulo nÃ£o degenerado, mmÂ². */
export const MIN_AREA = 0.01;

export function point(x: number, y: number): Point {
  return { x, y };
}

export function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(p: Point, s: number): Point {
  return { x: p.x * s, y: p.y * s };
}

export function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

export function hypot(p: Point): number {
  return Math.hypot(p.x, p.y);
}

export function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function normalizeDeg(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  const wrapped = deg % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

/** Matriz de rotaÃ§Ã£o 2D anti-horÃ¡ria. */
export function rotationMatrix(deg: number): { c: number; s: number } {
  const r = degToRad(deg);
  return { c: Math.cos(r), s: Math.sin(r) };
}

/** Rotaciona `p` em torno de `pivot` (padrÃ£o: origem). */
export function rotate(p: Point, deg: number, pivot: Point = { x: 0, y: 0 }): Point {
  const { c, s } = rotationMatrix(deg);
  const q = sub(p, pivot);
  return add({ x: q.x * c - q.y * s, y: q.x * s + q.y * c }, pivot);
}

/** p' = R(Î¸) p + t */
export function applyPose(p: Point, pose: Pose): Point {
  return add(rotate(p, pose.rotationDeg), { x: pose.x, y: pose.y });
}

export function applyPoseAll(verts: readonly Point[], pose: Pose): Point[] {
  return verts.map((v) => applyPose(v, pose));
}

/**
 * Ãrea com sinal (shoelace). Positiva = CCW, negativa = CW.
 */
export function signedArea(verts: readonly Point[]): number {
  let a = 0;
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const p = verts[i]!;
    const q = verts[(i + 1) % n]!;
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

export function area(verts: readonly Point[]): number {
  return Math.abs(signedArea(verts));
}

export function isCcw(verts: readonly Point[]): boolean {
  return signedArea(verts) > 0;
}

export function isDegenerate(verts: readonly Point[]): boolean {
  return area(verts) < MIN_AREA;
}

/** NÃºmero de vÃ©rtices reflexos (Ã¢ngulo interno > 180Â°) em polÃ­gono CCW. */
export function reflexVertexCount(poly: readonly Point[]): number {
  const n = poly.length;
  if (n < 3) return 0;
  let reflex = 0;
  for (let i = 0; i < n; i++) {
    const a = poly[(i - 1 + n) % n]!;
    const b = poly[i]!;
    const c = poly[(i + 1) % n]!;
    const cr = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (cr < -1e-6) reflex++;
  }
  return reflex;
}

/** Chevron / seta: um Ãºnico recorte. Tesela por translaÃ§Ã£o (mesma orientaÃ§Ã£o), nÃ£o pelo par 180Â°. */
export function isChevronLike(poly: readonly Point[]): boolean {
  return poly.length >= 5 && poly.length <= 8 && reflexVertexCount(poly) === 1;
}

/**
 * Asa-delta / triÃ¢ngulo de lados suaves: convexo, um Ãºnico Ã¡pice, Ã¡rea
 * prÃ³xima do triÃ¢ngulo dos trÃªs extremos. Tesela no par 180Â° â–½â–³.
 */
export function isDeltaLike(poly: readonly Point[]): boolean {
  if (poly.length < 5 || poly.length > 16) return false;
  if (reflexVertexCount(poly) !== 0) return false;
  const box = aabbOf(poly);
  const h = box.maxY - box.minY;
  const w = box.maxX - box.minX;
  if (h < 1 || w < 1) return false;
  const band = Math.max(h, 1) * 0.08;
  let nMax = 0;
  let nMin = 0;
  let apexMax: Point | null = null;
  let apexMin: Point | null = null;
  for (const p of poly) {
    if (Math.abs(p.y - box.maxY) <= band) {
      nMax++;
      apexMax = p;
    }
    if (Math.abs(p.y - box.minY) <= band) {
      nMin++;
      apexMin = p;
    }
  }
  const up = nMax === 1 && apexMax;
  const down = nMin === 1 && apexMin;
  if (!!up === !!down) return false;
  const T: Triangle = up
    ? [
        { x: box.minX, y: box.minY },
        { x: box.maxX, y: box.minY },
        { x: apexMax!.x, y: apexMax!.y },
      ]
    : [
        { x: box.minX, y: box.maxY },
        { x: box.maxX, y: box.maxY },
        { x: apexMin!.x, y: apexMin!.y },
      ];
  const tA = Math.abs(signedArea(T));
  const pA = Math.abs(signedArea(poly));
  if (tA < MIN_AREA) return false;
  const ratio = pA / tA;
  return ratio >= 0.92 && ratio <= 1.28;
}

export function aabbOf(verts: readonly Point[]): AABB {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of verts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  return { minX, minY, maxX, maxY };
}

export function aabbWidth(b: AABB): number {
  return b.maxX - b.minX;
}

export function aabbHeight(b: AABB): number {
  return b.maxY - b.minY;
}

/** DistÃ¢ncia entre caixas (0 se se tocam ou sobrepÃµem). Limite inferior da distÃ¢ncia dos polÃ­gonos. */
export function aabbSeparation(a: AABB, b: AABB): number {
  const dx = a.minX > b.maxX ? a.minX - b.maxX : b.minX > a.maxX ? b.minX - a.maxX : 0;
  const dy = a.minY > b.maxY ? a.minY - b.maxY : b.minY > a.maxY ? b.minY - a.maxY : 0;
  if (dx === 0) return dy;
  if (dy === 0) return dx;
  return Math.hypot(dx, dy);
}

/**
 * CentrÃ³ide de um polÃ­gono. Para triÃ¢ngulo coincide com a mÃ©dia dos vÃ©rtices,
 * mas usamos a fÃ³rmula geral (jÃ¡ precisamos dela no Passo 3).
 */
export function centroid(verts: readonly Point[]): Point {
  const a = signedArea(verts);
  if (Math.abs(a) < EPS) {
    const n = verts.length || 1;
    let x = 0;
    let y = 0;
    for (const p of verts) {
      x += p.x;
      y += p.y;
    }
    return { x: x / n, y: y / n };
  }
  let cx = 0;
  let cy = 0;
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const p = verts[i]!;
    const q = verts[(i + 1) % n]!;
    const cross = p.x * q.y - q.x * p.y;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  }
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

/** Garante winding CCW invertendo Bâ†”C (preserva o vÃ©rtice A). */
export function ensureCcw(tri: Triangle): Triangle {
  if (signedArea(tri) >= 0) return [tri[0], tri[1], tri[2]];
  return [tri[0], tri[2], tri[1]];
}

/** PolÃ­gono CCW com AABB no canto inferior esquerdo. */
export function convexHull(points: readonly Point[]): Point[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length <= 1) return pts.map((p) => ({ x: p.x, y: p.y }));
  const cr = (o: Point, a: Point, b: Point) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Point[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cr(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: Point[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    while (upper.length >= 2 && cr(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

/** PolÃ­gono CCW com AABB no canto inferior esquerdo. */
export function canonicalize(verts: readonly Point[]): Point[] {
  if (verts.length === 0) return [];
  const copy = verts.map((p) => ({ x: p.x, y: p.y }));
  if (copy.length >= 3 && signedArea(copy) < 0) copy.reverse();
  const box = aabbOf(copy);
  return copy.map((p) => ({ x: p.x - box.minX, y: p.y - box.minY }));
}

/**
 * Frame local canÃ´nico: CCW e translaÃ§Ã£o para que o canto inferior esquerdo
 * da AABB fique em (0, 0). A origem local Ã© esse canto â€” no Passo 3 o
 * Bottom-Left posiciona exatamente essa origem.
 */
export function canonicalizeTriangle(tri: Triangle): Triangle {
  const p = canonicalize(tri);
  return [p[0] ?? { x: 0, y: 0 }, p[1] ?? { x: 0, y: 0 }, p[2] ?? { x: 0, y: 0 }];
}

export function pointInTriangle(p: Point, tri: Triangle, eps = EPS): boolean {
  const [a, b, c] = tri;
  const v0 = sub(c, a);
  const v1 = sub(b, a);
  const v2 = sub(p, a);
  const den = v0.x * v1.y - v1.x * v0.y;
  if (Math.abs(den) < eps) return false;
  const u = (v2.x * v1.y - v1.x * v2.y) / den;
  const v = (v0.x * v2.y - v2.x * v0.y) / den;
  return u >= -eps && v >= -eps && u + v <= 1 + eps;
}

export function pointInAabb(p: Point, box: AABB, eps = EPS): boolean {
  return (
    p.x >= box.minX - eps &&
    p.x <= box.maxX + eps &&
    p.y >= box.minY - eps &&
    p.y <= box.maxY + eps
  );
}

export function sheetAabb(sheet: Sheet): AABB {
  return { minX: 0, minY: 0, maxX: sheet.width, maxY: sheet.length };
}

/** Recuo interno da chapa. Se o recuo esgota a Ã¡rea, max < min. */
export function insetAabb(sheet: Sheet, inset: number): AABB {
  const m = Math.max(0, inset);
  return { minX: m, minY: m, maxX: sheet.width - m, maxY: sheet.length - m };
}

export function aabbUsable(box: AABB, eps = EPS): boolean {
  return box.maxX - box.minX > eps && box.maxY - box.minY > eps;
}

export function isInsideAabb(verts: readonly Point[], box: AABB, eps = EPS): boolean {
  return verts.every((p) => pointInAabb(p, box, eps));
}

/**
 * DiagnÃ³stico do Passo 1: a peÃ§a estÃ¡ inteira na chapa (com borda opcional)?
 */
export function isInsideSheet(
  worldVerts: readonly Point[],
  sheet: Sheet,
  eps = EPS,
  margin = 0,
): boolean {
  // Chapa retangular: preserva exatamente a valida??o original.
  if (sheet.shape !== "circle") {
    return isInsideAabb(worldVerts, insetAabb(sheet, margin), eps);
  }

  const diameter = sheet.diameter ?? Math.min(sheet.width, sheet.length);
  const radius = diameter / 2;
  const center = {
    x: diameter / 2,
    y: diameter / 2,
  };

  const usableRadius = radius;

  if (usableRadius <= eps || worldVerts.length === 0) {
    return false;
  }

  const radiusSq = usableRadius * usableRadius;

  // Todos os v?rtices precisam estar dentro do disco.
  for (const p of worldVerts) {
    const dx = p.x - center.x;
    const dy = p.y - center.y;

    if (dx * dx + dy * dy > radiusSq + eps) {
      return false;
    }
  }

  // Tamb?m verifica cada segmento da pe?a.
  // Isso evita que uma aresta atravesse a circunfer?ncia
  // mesmo que seus v?rtices estejam dentro dela.
  const n = worldVerts.length;

  if (n >= 2) {
    for (let i = 0; i < n; i++) {
      const a = worldVerts[i]!;
      const b = worldVerts[(i + 1) % n]!;

      const ab = sub(b, a);
      const abLenSq = dot(ab, ab);

      if (abLenSq <= EPS * EPS) continue;

      const t = Math.max(
        0,
        Math.min(1, dot(sub(center, a), ab) / abLenSq),
      );

      const closest = add(a, scale(ab, t));
      const dx = closest.x - center.x;
      const dy = closest.y - center.y;

      if (dx * dx + dy * dy > radiusSq + eps) {
        return false;
      }
    }
  }

  return true;
}

/** Incentro e inraio. r = A / s. */
export function incenter(tri: Triangle): { center: Point; radius: number } {
  const [A, B, C] = tri;
  const a = hypot(sub(B, C));
  const b = hypot(sub(A, C));
  const c = hypot(sub(A, B));
  const peri = a + b + c;
  if (peri < EPS) return { center: centroid(tri), radius: 0 };
  return {
    center: {
      x: (a * A.x + b * B.x + c * C.x) / peri,
      y: (a * A.y + b * B.y + c * C.y) / peri,
    },
    radius: (2 * area(tri)) / peri,
  };
}

/**
 * Offset paralelo: o triÃ¢ngulo permanece semelhante, centrado no incentro.
 * d > 0 expande (slot da folga laser); d < 0 contrai.
 */
export function inflateTriangle(tri: Triangle, distance: number): Triangle {
  if (Math.abs(distance) <= EPS) return [tri[0], tri[1], tri[2]];
  const { center, radius } = incenter(tri);
  if (radius <= EPS) return [tri[0], tri[1], tri[2]];
  const nextR = radius + distance;
  if (nextR <= EPS) return [tri[0], tri[1], tri[2]];
  const s = nextR / radius;
  return tri.map((v) => ({
    x: center.x + s * (v.x - center.x),
    y: center.y + s * (v.y - center.y),
  })) as Triangle;
}

/**
 * Offset paralelo de polÃ­gono convexo CCW. d > 0 expande, d < 0 contrai.
 * Cada aresta corre na normal exterior â€” a folga laser fica constante.
 */
export function offsetConvex(poly: readonly Point[], distance: number): Point[] {
  const n = poly.length;
  if (n < 3 || Math.abs(distance) <= EPS) {
    return poly.map((p) => ({ x: p.x, y: p.y }));
  }
  const normals: Point[] = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % n]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    normals.push({ x: dy / len, y: -dx / len });
  }
  const out: Point[] = [];
  for (let i = 0; i < n; i++) {
    const n0 = normals[(i - 1 + n) % n]!;
    const n1 = normals[i]!;
    const P = poly[i]!;
    const det = n0.x * n1.y - n0.y * n1.x;
    const r0 = n0.x * P.x + n0.y * P.y + distance;
    const r1 = n1.x * P.x + n1.y * P.y + distance;
    if (Math.abs(det) < 1e-12) {
      out.push({ x: P.x + n0.x * distance, y: P.y + n0.y * distance });
    } else {
      out.push({
        x: (r0 * n1.y - n0.y * r1) / det,
        y: (n0.x * r1 - r0 * n1.x) / det,
      });
    }
  }
  return out;
}

export function distPointToSegment(p: Point, a: Point, b: Point): number {
  const ab = sub(b, a);
  const len2 = dot(ab, ab);
  if (len2 < EPS * EPS) return hypot(sub(p, a));
  const t = Math.min(1, Math.max(0, dot(sub(p, a), ab) / len2));
  return hypot(sub(p, add(a, scale(ab, t))));
}

/** DistÃ¢ncia mÃ­nima entre polÃ­gonos (0 se os interiores se sobrepÃµem). */
export function minPolygonDistance(a: readonly Point[], b: readonly Point[]): number {
  if (interiorsOverlap(a, b, 1e-7)) return 0;
  let min = Infinity;
  const na = a.length;
  const nb = b.length;
  for (let i = 0; i < na; i++) {
    const p = a[i]!;
    for (let j = 0; j < nb; j++) {
      min = Math.min(min, distPointToSegment(p, b[j]!, b[(j + 1) % nb]!));
    }
  }
  for (let j = 0; j < nb; j++) {
    const p = b[j]!;
    for (let i = 0; i < na; i++) {
      min = Math.min(min, distPointToSegment(p, a[i]!, a[(i + 1) % na]!));
    }
  }
  return min;
}

function edgeAxes(verts: readonly Point[]): Point[] {
  const axes: Point[] = [];
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const e = sub(verts[(i + 1) % n]!, verts[i]!);
    axes.push({ x: -e.y, y: e.x });
  }
  return axes;
}

function projectOn(verts: readonly Point[], axis: Point): { min: number; max: number } {
  const len = hypot(axis) || 1;
  const ax = axis.x / len;
  const ay = axis.y / len;
  let min = Infinity;
  let max = -Infinity;
  for (const p of verts) {
    const d = p.x * ax + p.y * ay;
    if (d < min) min = d;
    if (d > max) max = d;
  }
  return { min, max };
}

/**
 * Ponto estritamente no interior (nÃ£o na fronteira).
 */
export function pointInPolygonInterior(p: Point, poly: readonly Point[], eps = 1e-7): boolean {
  const n = poly.length;
  if (n < 3) return false;
  for (let i = 0; i < n; i++) {
    if (distPointToSegment(p, poly[i]!, poly[(i + 1) % n]!) <= eps) return false;
  }
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    const dy = b.y - a.y;
    if (Math.abs(dy) <= eps) continue;
    if ((a.y > p.y) === (b.y > p.y)) continue;
    const x = a.x + ((b.x - a.x) * (p.y - a.y)) / dy;
    if (p.x < x - eps) inside = !inside;
  }
  return inside;
}

function properSegmentIntersect(a: Point, b: Point, c: Point, d: Point, eps = 1e-8): boolean {
  const cr = (o: Point, p: Point, q: Point) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
  const d1 = cr(c, d, a);
  const d2 = cr(c, d, b);
  const d3 = cr(a, b, c);
  const d4 = cr(a, b, d);
  return (
    ((d1 > eps && d2 < -eps) || (d1 < -eps && d2 > eps)) &&
    ((d3 > eps && d4 < -eps) || (d3 < -eps && d4 > eps))
  );
}

/**
 * SobreposiÃ§Ã£o de interiores. SAT rejeita rÃ¡pido (e Ã© exato no convexo);
 * polÃ­gonos cÃ´ncavos confirmam com ponto-em-polÃ­gono e cruzamento de arestas
 * â€” o SAT sozinho gera falso positivo no chevron e bloqueia o encaixe 180Â°.
 * Arestas compartilhadas nÃ£o contam.
 */
export function interiorsOverlap(a: readonly Point[], b: readonly Point[], eps = 1e-4): boolean {
  for (const axis of [...edgeAxes(a), ...edgeAxes(b)]) {
    const pa = projectOn(a, axis);
    const pb = projectOn(b, axis);
    const overlap = Math.min(pa.max, pb.max) - Math.max(pa.min, pb.min);
    if (overlap <= eps) return false;
  }
  for (const p of a) {
    if (pointInPolygonInterior(p, b, Math.min(eps, 1e-6))) return true;
  }
  for (const p of b) {
    if (pointInPolygonInterior(p, a, Math.min(eps, 1e-6))) return true;
  }
  const na = a.length;
  const nb = b.length;
  for (let i = 0; i < na; i++) {
    const a1 = a[i]!;
    const a2 = a[(i + 1) % na]!;
    for (let j = 0; j < nb; j++) {
      if (properSegmentIntersect(a1, a2, b[j]!, b[(j + 1) % nb]!)) return true;
    }
  }
  return false;
}

export function formatMm(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "â€”";
  const v = Number(n.toFixed(digits));
  return Number.isInteger(v) ? String(v) : v.toFixed(digits);
}

export function formatArea(mm2: number): string {
  if (!Number.isFinite(mm2)) return "â€”";
  const fmt = (n: number, digits: number) =>
    n.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
  if (mm2 >= 1_000_000) return `${fmt(mm2 / 1_000_000, 3)} mÂ²`;
  if (mm2 >= 100) return `${fmt(mm2 / 100, 1)} cmÂ²`;
  return `${fmt(mm2, 2)} mmÂ²`;
}

