import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sheetMassKg, thicknessFromMassKg, STAINLESS_DENSITY } from "./sheet-mass.ts";

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
});
