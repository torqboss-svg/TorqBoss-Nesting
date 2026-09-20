import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isInsideSheet } from "./geometry.ts";
import { planPlates, makePlate, MAX_PLATES } from "./plates.ts";
import { triangleFromBaseHeight } from "./triangle.ts";
import type { Piece } from "./types.ts";

function triPiece(): Piece {
  const vertices = triangleFromBaseHeight(40, 30);
  return {
    id: "p",
    name: "Triângulo",
    shape: "triangle",
    family: "pair180",
    vertices,
    holes: [],
    area: 600,
  };
}

describe("multi-plate overflow", () => {
  it("keeps a single plate when everything fits", () => {
    const piece = triPiece();
    const plates = [makePlate({ width: 400, length: 400, thickness: 2 })];
    const plan = planPlates(piece, 8, 0, 2, plates);
    assert.equal(plan.plates.length, 1);
    assert.equal(plan.remainder, 0);
    assert.equal(plan.livePlaced, 8);
    assert.equal(plan.plates[0]!.virtual, false);
  });

  it("opens a second plate of the same size for leftovers", () => {
    const piece = triPiece();
    const sheet = { width: 90, length: 70, thickness: 1 };
    const plates = [makePlate(sheet)];
    const plan = planPlates(piece, 40, 0, 1, plates);
    assert.ok(plan.plates.length >= 2, `plates ${plan.plates.length}`);
    assert.equal(plan.plates[1]!.virtual, true);
    assert.equal(plan.plates[1]!.sheet.width, sheet.width);
    assert.equal(plan.plates[1]!.sheet.length, sheet.length);
    assert.ok(plan.plates[0]!.placed > 0);
    assert.ok(plan.plates[0]!.placed < 40);
    const first = plan.plates[0]!.placed;
    assert.equal(plan.plates[1]!.placed > 0, true);
    assert.equal(plan.livePlaced, first + plan.plates.slice(1).reduce((n, p) => n + p.placed, 0));
  });

  it("does not reshuffle plate 1 when plate 2 is larger", () => {
    const piece = triPiece();
    const a = makePlate({ width: 90, length: 70, thickness: 1 });
    const b = makePlate({ width: 800, length: 800, thickness: 1 });
    const one = planPlates(piece, 30, 0, 1, [a]);
    const two = planPlates(piece, 30, 0, 1, [a, b]);
    assert.equal(two.plates[0]!.placed, one.plates[0]!.placed);
    assert.ok(two.plates[1]!.placed > 0);
    assert.equal(two.remainder, 0);
  });

  it("keeps every piece inside its own sheet", () => {
    const piece = triPiece();
    const plates = [makePlate({ width: 90, length: 70, thickness: 1 })];
    const plan = planPlates(piece, 20, 5, 1, plates);
    for (const p of plan.plates) {
      for (const live of p.live) {
        assert.equal(isInsideSheet(live.world, p.sheet, 1e-6, 5), true);
      }
    }
  });

  it("stops at MAX_PLATES and reports remainder", () => {
    const piece = triPiece();
    const plates = [makePlate({ width: 70, length: 50, thickness: 1 })];
    const plan = planPlates(piece, 400, 0, 1, plates);
    assert.ok(plan.plates.length <= MAX_PLATES);
    if (plan.livePlaced < 400) assert.ok(plan.remainder > 0);
  });

  it("skips a sealed-full first plate and uses the next", () => {
    const piece = triPiece();
    const filler = planPlates(piece, 8, 0, 1, [makePlate({ width: 90, length: 70, thickness: 1 })]);
    const jobs = [
      {
        id: "lote-1",
        name: "Triângulo",
        shape: "triangle" as const,
        input: {
          shape: "triangle" as const,
          triangleMode: "base-height" as const,
          polyPreset: "livre" as const,
          flangePreset: "anel" as const,
          wingPreset: "delta" as const,
          base: 40,
          height: 30,
          legA: 1,
          legB: 1,
          vertices: [],
          side: 1,
          width: 1,
          outerDia: 1,
          innerDia: 0,
          sweepDeg: 360,
          thick: 1,
          hexSide: 1,
          baseTop: 1,
          baseBot: 1,
        },
        quantity: filler.plates[0]!.placed,
        placements: filler.plates[0]!.live,
      },
    ];
    const a = makePlate({ width: 90, length: 70, thickness: 1 }, jobs);
    const plan = planPlates(piece, 6, 0, 1, [a]);
    assert.equal(plan.plates[0]!.placed, 0);
    assert.ok(plan.plates.length >= 2);
    assert.ok(plan.plates[1]!.placed > 0);
  });
});
