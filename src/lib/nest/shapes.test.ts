import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { area, aabbOf, aabbWidth, interiorsOverlap, isDeltaLike, isInsideSheet, minPolygonDistance } from "./geometry.ts";
import {
  FLANGE_PRESETS,
  POLY_PRESETS,
  WING_PRESETS,
  buildPiece,
  discFromDiameter,
  flangePresetPatch,
  hexFromSide,
  lFromSize,
  pieceDimLabel,
  polyFromVertices,
  rectFromSize,
  squareFromSide,
  trapFromBases,
  uFromSize,
  vFromSize,
  verticesOfPreset,
} from "./shapes.ts";
import { tessellate } from "./tessellate.ts";
import type { PieceInput } from "./types.ts";

const SHEET = { width: 200, length: 160, thickness: 1 };

function dummyInput(patch: Partial<PieceInput>): PieceInput {
  return {
    shape: "triangle",
    triangleMode: "base-height",
    polyPreset: "livre",
    flangePreset: "anel",
    wingPreset: "delta",
    base: 1,
    height: 1,
    legA: 1,
    legB: 1,
    vertices: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    side: 1,
    width: 1,
    outerDia: 1,
    innerDia: 0,
    sweepDeg: 360,
    thick: 1,
    hexSide: 1,
    baseTop: 1,
    baseBot: 1,
    ...patch,
  };
}

describe("shape constructors and nest", () => {
  it("square grid places without leaving the sheet", () => {
    const sq = squareFromSide(20);
    const result = tessellate(sq, SHEET, 12, { family: "grid", gap: 2 });
    assert.ok(result.placed >= 8);
    for (const p of result.placements) {
      assert.equal(isInsideSheet(p.world, SHEET), true);
      assert.equal(p.pack, "grid");
    }
  });

  it("rectangle prefers the rotation that fits more", () => {
    const rect = rectFromSize(40, 10);
    const result = tessellate(rect, { width: 45, length: 80, thickness: 1 }, 8, {
      family: "grid",
      gap: 0,
    });
    assert.ok(result.placed >= 6, `placed ${result.placed}`);
  });

  it("disc uses hexagonal packing", () => {
    const disc = discFromDiameter(20);
    const result = tessellate(disc, SHEET, 10, { family: "hex", gap: 2 });
    assert.equal(result.placements[0]?.pack, "hex");
    assert.ok(result.placed >= 6);
    for (const p of result.placements) {
      assert.equal(isInsideSheet(p.world, SHEET), true);
    }
  });

  it("L profile is a simple hexagon of area W·t+(H-t)·t", () => {
    const L = lFromSize(40, 30, 8);
    assert.equal(L.length, 6);
    assert.ok(Math.abs(area(L) - (40 * 8 + 22 * 8)) < 1e-6);
  });

  it("U and V nest on the inner sheet", () => {
    const U = uFromSize(30, 24, 6);
    const V = vFromSize(30, 24, 5);
    const uNest = tessellate(U, SHEET, 8, { family: "auto", gap: 1 });
    const vNest = tessellate(V, SHEET, 8, { family: "pair180", gap: 1 });
    assert.ok(uNest.placed >= 4, `U placed ${uNest.placed}`);
    assert.ok(vNest.placed >= 4, `V placed ${vNest.placed}`);
  });

  it("hexagon lattice fills more tightly than a square of the same AABB", () => {
    const hex = hexFromSide(10);
    const box = aabbOf(hex);
    const sq = squareFromSide(Math.max(aabbWidth(box), box.maxY - box.minY));
    const a = tessellate(hex, SHEET, 40, { family: "hex", gap: 0 });
    const b = tessellate(sq, SHEET, 40, { family: "grid", gap: 0 });
    assert.ok(a.placed >= b.placed);
  });

  it("trapezoid pair nest does not overlap interiors", () => {
    const trap = trapFromBases(40, 24, 30);
    const sheet = { width: 200, length: 200, thickness: 1 };
    const result = tessellate(trap, sheet, 12, {
      family: "pair180",
      gap: 2,
    });
    assert.ok(result.placed >= 6, `placed ${result.placed}`);
    let minD = Infinity;
    for (let i = 0; i < result.placements.length; i++) {
      assert.equal(isInsideSheet(result.placements[i]!.world, sheet), true);
      for (let j = i + 1; j < result.placements.length; j++) {
        assert.equal(
          interiorsOverlap(result.placements[i]!.world, result.placements[j]!.world),
          false,
          `trap ${i} overlaps ${j}`,
        );
        const d = minPolygonDistance(result.placements[i]!.world, result.placements[j]!.world);
        if (d < minD) minD = d;
        assert.ok(d >= 1.9, `trap ${i}-${j} distance ${d}`);
      }
    }
    assert.ok(minD <= 2.4, `trap min distance ${minD} should hug the 2 mm gap`);
  });

  it("irregular convex pentagon does not overlap and hugs the gap", () => {
    const poly = polyFromVertices([
      { x: 0, y: 0 },
      { x: 32, y: 0 },
      { x: 38, y: 14 },
      { x: 20, y: 28 },
      { x: 2, y: 16 },
    ]);
    const sheet = { width: 200, length: 160, thickness: 1 };
    const result = tessellate(poly, sheet, 12, { family: "pair180", gap: 2 });
    assert.ok(result.placed >= 4, `placed ${result.placed}`);
    let minD = Infinity;
    for (let i = 0; i < result.placements.length; i++) {
      for (let j = i + 1; j < result.placements.length; j++) {
        assert.equal(
          interiorsOverlap(result.placements[i]!.world, result.placements[j]!.world),
          false,
          `poly ${i} overlaps ${j}`,
        );
        const d = minPolygonDistance(result.placements[i]!.world, result.placements[j]!.world);
        if (d < minD) minD = d;
      }
    }
    assert.ok(minD >= 1.9, `poly min ${minD}`);
    assert.ok(minD <= 2.5, `poly min ${minD} should hug the 2 mm gap`);
  });

  it("ten irregular presets are valid and nest without overlap", () => {
    assert.equal(POLY_PRESETS.length, 10);
    const sheet = { width: 400, length: 400, thickness: 1 };
    for (const preset of POLY_PRESETS) {
      const verts = verticesOfPreset(preset.id);
      assert.ok(verts.length >= 3, preset.id);
      const built = buildPiece(
        dummyInput({
          shape: "poly",
          polyPreset: preset.id,
          vertices: verts,
        }),
      );
      assert.equal(built.valid, true, preset.id);
      assert.ok(area(built.piece.vertices) > 1, preset.id);
      const result = tessellate(built.piece.vertices, sheet, 4, {
        family: built.piece.family,
        gap: 2,
      });
      assert.ok(result.placed >= 1, `${preset.id} placed ${result.placed}`);
      for (let i = 0; i < result.placements.length; i++) {
        for (let j = i + 1; j < result.placements.length; j++) {
          assert.equal(
            interiorsOverlap(result.placements[i]!.world, result.placements[j]!.world),
            false,
            `${preset.id} ${i} overlaps ${j}`,
          );
          const d = minPolygonDistance(result.placements[i]!.world, result.placements[j]!.world);
          assert.ok(d >= 1.9, `${preset.id} gap ${d}`);
        }
      }
    }
  });

  it("ten flange presets are valid and nest without overlap", () => {
    assert.equal(FLANGE_PRESETS.length, 10);
    const sheet = { width: 500, length: 500, thickness: 1 };
    for (const preset of FLANGE_PRESETS) {
      const patch = flangePresetPatch(preset.id, 80);
      const built = buildPiece(
        dummyInput({
          shape: "flange",
          outerDia: 80,
          ...patch,
        }),
      );
      assert.equal(built.valid, true, `${preset.id} invalid`);
      assert.ok(area(built.piece.vertices) - built.piece.holes.reduce((s, h) => s + area(h), 0) > 1, preset.id);
      const result = tessellate(built.piece.vertices, sheet, 4, {
        family: built.piece.family,
        gap: 2,
        holes: built.piece.holes,
      });
      assert.ok(result.placed >= 1, `${preset.id} placed ${result.placed}`);
      for (let i = 0; i < result.placements.length; i++) {
        for (let j = i + 1; j < result.placements.length; j++) {
          assert.equal(
            interiorsOverlap(result.placements[i]!.world, result.placements[j]!.world),
            false,
            `${preset.id} ${i} overlaps ${j}`,
          );
        }
      }
    }
  });

  it("chevron nests at the laser gap without interior overlap", () => {
    const verts = polyFromVertices(verticesOfPreset("chevron"));
    const sheet = { width: 1200, length: 2000, thickness: 3 };
    const result = tessellate(verts, sheet, 12, { family: "pair180", gap: 3 });
    assert.ok(result.placed >= 10, `placed ${result.placed}`);
    let minD = Infinity;
    let ov = 0;
    for (let i = 0; i < result.placements.length; i++) {
      for (let j = i + 1; j < result.placements.length; j++) {
        if (interiorsOverlap(result.placements[i]!.world, result.placements[j]!.world)) ov++;
        const d = minPolygonDistance(result.placements[i]!.world, result.placements[j]!.world);
        if (d < minD) minD = d;
      }
    }
    assert.equal(ov, 0);
    assert.ok(minD >= 2.9, `min ${minD}`);
    assert.ok(minD <= 3.6, `min ${minD} should hug the 3 mm gap`);
    const nest = aabbOf(result.placements.flatMap((p) => p.world));
    const nestA = (nest.maxX - nest.minX) * (nest.maxY - nest.minY);
    const used = result.placed * area(verts);
    assert.ok(used / nestA > 0.55, `fill ${used / nestA}`);
  });

  it("delta wing nests as a 180° triangle checkerboard hugging the laser gap", () => {
    const built = buildPiece(
      dummyInput({
        shape: "wing",
        wingPreset: "delta",
        width: 420,
        height: 300,
        thick: 0,
      }),
    );
    assert.equal(built.valid, true);
    assert.equal(isDeltaLike(built.piece.vertices), true);
    const sheet = { width: 2000, length: 1250, thickness: 3 };
    const result = tessellate(built.piece.vertices, sheet, 12, {
      family: built.piece.family,
      gap: 3,
      margin: 8,
    });
    assert.ok(result.placed >= 12, `placed ${result.placed}`);
    let minD = Infinity;
    let ov = 0;
    let rot0 = 0;
    let rot180 = 0;
    for (const p of result.placements) {
      const r = ((p.pose.rotationDeg % 360) + 360) % 360;
      if (Math.abs(r - 180) < 1 || Math.abs(r - 180) > 359) rot180++;
      else if (Math.abs(r) < 1 || Math.abs(r - 360) < 1) rot0++;
    }
    for (let i = 0; i < result.placements.length; i++) {
      for (let j = i + 1; j < result.placements.length; j++) {
        if (interiorsOverlap(result.placements[i]!.world, result.placements[j]!.world)) ov++;
        const d = minPolygonDistance(result.placements[i]!.world, result.placements[j]!.world);
        if (d < minD) minD = d;
      }
    }
    assert.equal(ov, 0);
    assert.ok(rot0 >= 4 && rot180 >= 4, `rots 0=${rot0} 180=${rot180}`);
    assert.ok(minD >= 2.9, `min ${minD}`);
    assert.ok(minD <= 5.5, `min ${minD} should hug the 3 mm gap`);
    const nest = aabbOf(result.placements.flatMap((p) => p.world));
    const nestA = (nest.maxX - nest.minX) * (nest.maxY - nest.minY);
    const used = result.placed * area(built.piece.vertices);
    assert.ok(used / nestA > 0.62, `fill ${used / nestA}`);
  });

  it("cambered delta still checkerboards at the sheet thickness gap", () => {
    const built = buildPiece(
      dummyInput({
        shape: "wing",
        wingPreset: "delta",
        width: 420,
        height: 300,
        thick: 80,
      }),
    );
    assert.equal(isDeltaLike(built.piece.vertices), true);
    const sheet = { width: 2000, length: 1250, thickness: 10 };
    const result = tessellate(built.piece.vertices, sheet, 12, {
      family: built.piece.family,
      gap: 10,
      margin: 15,
    });
    assert.equal(result.placed, 12);
    let minD = Infinity;
    let ov = 0;
    let rot0 = 0;
    let rot180 = 0;
    for (const p of result.placements) {
      const r = ((p.pose.rotationDeg % 360) + 360) % 360;
      if (Math.abs(r - 180) < 1) rot180++;
      else if (Math.abs(r) < 1 || Math.abs(r - 360) < 1) rot0++;
    }
    for (let i = 0; i < result.placements.length; i++) {
      for (let j = i + 1; j < result.placements.length; j++) {
        if (interiorsOverlap(result.placements[i]!.world, result.placements[j]!.world)) ov++;
        const d = minPolygonDistance(result.placements[i]!.world, result.placements[j]!.world);
        if (d < minD) minD = d;
      }
    }
    assert.equal(ov, 0);
    assert.ok(rot0 >= 4 && rot180 >= 4, `rots 0=${rot0} 180=${rot180}`);
    assert.ok(minD >= 9.8, `min ${minD}`);
    assert.ok(minD <= 14, `min ${minD}`);
    const nest = aabbOf(result.placements.flatMap((p) => p.world));
    const nestA = (nest.maxX - nest.minX) * (nest.maxY - nest.minY);
    const used = result.placed * area(built.piece.vertices);
    assert.ok(used / nestA > 0.62, `fill ${used / nestA}`);
  });

  it("flange innerDia 0 meets at the center; innerDia > 0 opens a gap", () => {
    const meet = buildPiece(dummyInput({ shape: "flange", flangePreset: "fatia", outerDia: 100, innerDia: 0, sweepDeg: 90 }));
    const gap = buildPiece(dummyInput({ shape: "flange", flangePreset: "quarto", outerDia: 100, innerDia: 50, sweepDeg: 90 }));
    assert.equal(meet.valid, true);
    assert.equal(gap.valid, true);
    assert.equal(meet.piece.holes.length, 0);
    assert.equal(gap.piece.holes.length, 0);
    assert.ok(gap.piece.area < meet.piece.area);
  });

  it("ten wing presets are valid bezier outlines and nest without overlap", () => {
    assert.equal(WING_PRESETS.length, 10);
    const sheet = { width: 500, length: 500, thickness: 1 };
    for (const preset of WING_PRESETS) {
      const built = buildPiece(
        dummyInput({
          shape: "wing",
          wingPreset: preset.id,
          width: 80,
          height: 50,
          thick: 16,
        }),
      );
      assert.equal(built.valid, true, `${preset.id} invalid`);
      assert.ok(built.piece.vertices.length >= 8, `${preset.id} verts ${built.piece.vertices.length}`);
      assert.ok(area(built.piece.vertices) > 100, `${preset.id} area`);
      const result = tessellate(built.piece.vertices, sheet, 4, {
        family: built.piece.family,
        gap: 2,
      });
      assert.ok(result.placed >= 1, `${preset.id} placed ${result.placed}`);
      for (let i = 0; i < result.placements.length; i++) {
        assert.equal(isInsideSheet(result.placements[i]!.world, sheet), true, `${preset.id} ${i} off sheet`);
        for (let j = i + 1; j < result.placements.length; j++) {
          if (built.piece.family === "pair180") {
            assert.equal(
              interiorsOverlap(result.placements[i]!.world, result.placements[j]!.world),
              false,
              `${preset.id} ${i} overlaps ${j}`,
            );
            const d = minPolygonDistance(result.placements[i]!.world, result.placements[j]!.world);
            assert.ok(d >= 1.9, `${preset.id} gap ${d}`);
          } else {
            const A = aabbOf(result.placements[i]!.world);
            const B = aabbOf(result.placements[j]!.world);
            const aabbHit =
              A.maxX > B.minX + 1e-6 &&
              B.maxX > A.minX + 1e-6 &&
              A.maxY > B.minY + 1e-6 &&
              B.maxY > A.minY + 1e-6;
            assert.equal(aabbHit, false, `${preset.id} ${i}-${j} AABB overlap`);
          }
        }
      }
    }
  });

  it("delta camber increases area without leaving the span", () => {
    const flat = buildPiece(dummyInput({ shape: "wing", wingPreset: "delta", width: 100, height: 60, thick: 0 }));
    const fat = buildPiece(dummyInput({ shape: "wing", wingPreset: "delta", width: 100, height: 60, thick: 40 }));
    assert.equal(flat.valid, true);
    assert.equal(fat.valid, true);
    assert.ok(fat.piece.area > flat.piece.area);
    const box = aabbOf(flat.piece.vertices);
    assert.ok(Math.abs(aabbWidth(box) - 100) < 1.5);
  });

  it("pieceDimLabel lists manufacturing sizes", () => {
    assert.equal(pieceDimLabel(dummyInput({ shape: "triangle", base: 400, height: 300 })), "400 × 300");
    assert.equal(pieceDimLabel(dummyInput({ shape: "disc", outerDia: 280 })), "⌀280");
    assert.equal(
      pieceDimLabel(dummyInput({ shape: "flange", outerDia: 280, innerDia: 160 })),
      "⌀280 / ⌀160",
    );
    assert.equal(pieceDimLabel(dummyInput({ shape: "wing", width: 420, height: 300 })), "420 × 300");
  });
});
