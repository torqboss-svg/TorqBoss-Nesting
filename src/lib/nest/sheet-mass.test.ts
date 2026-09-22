import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sheetMassKg, thicknessFromMassKg, STAINLESS_DENSITY, massFromAreaKg, formatKg } from "./sheet-mass.ts";

describe("sheet mass (stainless)", () => {
  it("2000 × 1250 × 10 mm is 200 kg at 8 g/cm³", () => {
    const kg = sheetMassKg({ width: 2000, length: 1250, thickness: 10 });
    assert.equal(STAINLESS_DENSITY, 8000);
    assert.ok(Math.abs(kg - 200) < 1e-9);
  });

  it("mass → thickness round-trips with the same plate", () => {
    const sheet = { width: 2000, length: 1250, thickness: 10 };
    const kg = sheetMassKg(sheet);
    const t = thicknessFromMassKg(sheet.width, sheet.length, kg);
    assert.equal(t, 10);
  });

  it("typing a known mass yields thickness when t is unknown", () => {
    const t = thicknessFromMassKg(2000, 1250, 100);
    assert.equal(t, 5);
  });

  it("zero area or mass yields zero thickness", () => {
    assert.equal(thicknessFromMassKg(0, 1250, 100), 0);
    assert.equal(thicknessFromMassKg(2000, 1250, 0), 0);
  });

  it("changing thickness scales mass linearly", () => {
    const a = sheetMassKg({ width: 2000, length: 1250, thickness: 10 });
    const b = sheetMassKg({ width: 2000, length: 1250, thickness: 20 });
    assert.ok(Math.abs(b - 2 * a) < 1e-9);
  });

  it("disc Ø 700 × 10 mm uses π r² at 8 g/cm³", () => {
    const kg = sheetMassKg({ kind: "disc", width: 700, length: 700, thickness: 10 });
    const expected = (Math.PI * 350 * 350 * 10 * 8000) / 1_000_000_000;
    assert.ok(Math.abs(kg - expected) < 1e-9);
    const t = thicknessFromMassKg(700, 700, kg, STAINLESS_DENSITY, "disc");
    assert.equal(t, 10);
  });

  it("piece mass is area × thickness at the same density", () => {
    const triangle = massFromAreaKg(60_000, 10);
    assert.ok(Math.abs(triangle - 4.8) < 1e-9);
    const disc = massFromAreaKg(Math.PI * 140 * 140, 10);
    assert.ok(Math.abs(disc - ((Math.PI * 140 * 140 * 10 * 8000) / 1_000_000_000)) < 1e-9);
    assert.equal(massFromAreaKg(0, 10), 0);
    assert.equal(formatKg(4.8), "4,8 kg");
    assert.equal(formatKg(0.492), "492 g");
  });
});
