import type { Sheet } from "./types.ts";

/** Densidade comercial do aço inox: 8 g/cm³ (8000 kg/m³). AISI 304 de laboratório é ~7,93. */
export const STAINLESS_DENSITY = 8000;
export const STAINLESS_LABEL = "Aço inox";

const MM3_TO_M3 = 1_000_000_000;

/** Massa da chapa inteira, kg. */
export function sheetMassKg(
  sheet: Pick<Sheet, "width" | "length" | "thickness">,
  density = STAINLESS_DENSITY,
): number {
  const w = Math.max(0, sheet.width);
  const l = Math.max(0, sheet.length);
  const t = Math.max(0, sheet.thickness);
  if (!Number.isFinite(w * l * t * density)) return 0;
  return (w * l * t * density) / MM3_TO_M3;
}

/** Espessura em mm a partir da massa conhecida da chapa. */
export function thicknessFromMassKg(
  width: number,
  length: number,
  massKg: number,
  density = STAINLESS_DENSITY,
): number {
  const area = Math.max(0, width) * Math.max(0, length);
  const denom = area * density;
  if (denom <= 0 || !Number.isFinite(massKg) || massKg <= 0) return 0;
  const t = (massKg * MM3_TO_M3) / denom;
  if (!Number.isFinite(t) || t < 0) return 0;
  return Math.round(t * 100) / 100;
}