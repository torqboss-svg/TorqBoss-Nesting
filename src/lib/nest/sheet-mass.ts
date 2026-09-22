import type { Sheet } from "./types.ts";

/** Densidade comercial do aço inox: 8 g/cm³ (8000 kg/m³). AISI 304 de laboratório é ~7,93. */
export const STAINLESS_DENSITY = 8000;
export const STAINLESS_LABEL = "Aço inox";

const MM3_TO_M3 = 1_000_000_000;

/** Área da face da chapa, mm². Disco usa π r². */
export function sheetFaceAreaMm2(sheet: Pick<Sheet, "width" | "length" | "kind">): number {
  if (sheet.kind === "disc") {
    const r = Math.max(0, sheet.width) / 2;
    return Math.PI * r * r;
  }
  return Math.max(0, sheet.width) * Math.max(0, sheet.length);
}

/** Massa da chapa inteira, kg. */
export function sheetMassKg(
  sheet: Pick<Sheet, "width" | "length" | "thickness" | "kind">,
  density = STAINLESS_DENSITY,
): number {
  const area = sheetFaceAreaMm2(sheet);
  const t = Math.max(0, sheet.thickness);
  if (!Number.isFinite(area * t * density)) return 0;
  return (area * t * density) / MM3_TO_M3;
}

/** Massa a partir da área da face, kg. Mesma densidade comercial da chapa. */
export function massFromAreaKg(
  areaMm2: number,
  thicknessMm: number,
  density = STAINLESS_DENSITY,
): number {
  const a = Math.max(0, areaMm2);
  const t = Math.max(0, thicknessMm);
  if (!Number.isFinite(a * t * density)) return 0;
  return (a * t * density) / MM3_TO_M3;
}

/** Peso para leitura de chão de fábrica: g abaixo de 1 kg. */
export function formatKg(kg: number): string {
  if (!Number.isFinite(kg) || kg <= 0) return "—";
  if (kg < 1) {
    const g = kg * 1000;
    const digits = g < 10 ? 1 : 0;
    return `${g.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: 0 })} g`;
  }
  const digits = kg >= 100 ? 1 : 2;
  return `${kg.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: 0 })} kg`;
}
export function thicknessFromMassKg(
  width: number,
  length: number,
  massKg: number,
  density = STAINLESS_DENSITY,
  kind: Sheet["kind"] = "rect",
): number {
  const area = kind === "disc" ? Math.PI * (Math.max(0, width) / 2) ** 2 : Math.max(0, width) * Math.max(0, length);
  const denom = area * density;
  if (denom <= 0 || !Number.isFinite(massKg) || massKg <= 0) return 0;
  const t = (massKg * MM3_TO_M3) / denom;
  if (!Number.isFinite(t) || t < 0) return 0;
  return Math.round(t * 100) / 100;
}