/**
 * Núcleo geométrico do Nesting.
 *
 * Sistema de coordenadas da chapa (CAD, não tela):
 *   origem (0, 0) no canto inferior esquerdo
 *   +X  →  direita  = largura
 *   +Y  →  cima     = comprimento
 *   unidades        = milímetros
 *   rotação         = anti-horária, em graus, em torno da origem local da peça
 *
 * A peça vive num frame local. A pose (x, y, θ) leva esse frame para a chapa:
 *   p_mundo = R(θ) · p_local + (x, y)
 */

export type Point = {
  x: number;
  y: number;
};

export type Triangle = [Point, Point, Point];

export type Polygon = Point[];

export type AABB = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type Sheet = {
  /** Largura da chapa no eixo X, mm. */
  width: number;
  /** Comprimento da chapa no eixo Y, mm. */
  length: number;
  /** Espessura no eixo Z, mm. Piso da folga laser entre peças. */
  thickness: number;
};

export type Pose = {
  /** Translação da origem local para a chapa, mm. */
  x: number;
  y: number;
  /** Rotação anti-horária em graus, em torno da origem local. */
  rotationDeg: number;
};

export type ShapeKind =
  | "triangle"
  | "square"
  | "rect"
  | "disc"
  | "flange"
  | "wing"
  | "l"
  | "u"
  | "v"
  | "hex"
  | "trap"
  | "poly";

export type TriangleMode = "base-height" | "right" | "vertices";

export type PolyPresetId =
  | "livre"
  | "casa"
  | "seta"
  | "paralelogramo"
  | "losango"
  | "te"
  | "cruz"
  | "chevron"
  | "aba"
  | "gota";

export type FlangePresetId =
  | "anel"
  | "meia"
  | "quarto"
  | "terco"
  | "sexto"
  | "c"
  | "fatia"
  | "meialua"
  | "gomo"
  | "crescente";

export type WingPresetId =
  | "delta"
  | "rogallo"
  | "petala"
  | "lagrima"
  | "folha"
  | "foice"
  | "amendoa"
  | "oval"
  | "gaivota"
  | "bumerangue";

export type NestFamily = "pair180" | "grid" | "hex" | "auto";

export type PieceInput = {
  shape: ShapeKind;
  triangleMode: TriangleMode;
  polyPreset: PolyPresetId;
  flangePreset: FlangePresetId;
  wingPreset: WingPresetId;
  base: number;
  height: number;
  legA: number;
  legB: number;
  vertices: Point[];
  side: number;
  width: number;
  outerDia: number;
  innerDia: number;
  sweepDeg: number;
  thick: number;
  hexSide: number;
  baseTop: number;
  baseBot: number;
};

export type Piece = {
  id: string;
  name: string;
  shape: ShapeKind;
  family: NestFamily;
  /** Vértices locais, CCW, AABB com min em (0, 0) na orientação 0°. */
  vertices: Polygon;
  /** Contornos internos (flange). Mesmo frame local. */
  holes: Polygon[];
  area: number;
};

export type NestedPiece = {
  index: number;
  pose: Pose;
  world: Polygon;
  holes: Polygon[];
  /** △ = ápice único no topo; ▽ = base no topo. */
  pointing: "up" | "down";
  pack: "pair" | "grid" | "hex";
  /** Lote travado na chapa; ausente = lote ao vivo. */
  jobId?: string;
};

export type NestJob = {
  id: string;
  name: string;
  shape: ShapeKind;
  input: PieceInput;
  quantity: number;
  placements: NestedPiece[];
};

/** Uma folha da ordem de corte. Dimensões independentes das demais. */
export type Plate = {
  id: string;
  sheet: Sheet;
  jobs: NestJob[];
};

export type NestClearance = {
  /** Distância mínima peça → borda da chapa, mm. */
  margin: number;
  /** Distância mínima entre peças, mm. Piso = espessura. */
  gap: number;
  family?: NestFamily;
  holes?: Polygon[];
  /** Peças já travadas (coordenadas da chapa). */
  obstacles?: Polygon[];
};

export type NestResult = {
  placements: NestedPiece[];
  requested: number;
  placed: number;
  utilization: number;
  margin: number;
  gap: number;
};

/** @deprecated use TriangleMode */
export type TriangleKind = TriangleMode;
