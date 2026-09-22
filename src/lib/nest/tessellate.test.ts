import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aabbOf, interiorsOverlap, isInsideSheet, minPolygonDistance } from "./geometry.ts";
import { buildPiece, discFromDiameter, flangePresetPatch, squareFromSide } from "./shapes.ts";
import type { PieceInput } from "./types.ts";
import {
  maxSheetMargin,
  nestHasInteriorOverlap,
  patternPreview,
  rowBands,
  tessellate,
} from "./tessellate.ts";
import { triangleFromBaseHeight, triangleFromLegs } from "./triangle.ts";

const SHEET = { width: 120, length: 80, thickness: 1 };

describe("triangle tessellation ▽△", () => {
  it("places the requested count when the sheet has room", () => {
    const tri = triangleFromBaseHeight(10, 8);
    const result = tessellate(tri, SHEET, 8);
    assert.equal(result.placed, 8);
    assert.equal(result.requested, 8);
    assert.equal(result.placements.length, 8);
  });

  it("clips to the sheet instead of overflowing", () => {
    const tri = triangleFromBaseHeight(10, 8);
    const tiny = { width: 12, length: 10, thickness: 1 };
    const result = tessellate(tri, tiny, 50);
    assert.ok(result.placed >= 1);
    assert.ok(result.placed < 50);
    for (const p of result.placements) {
      assert.equal(isInsideSheet(p.world, tiny), true);
    }
  });

  it("does not overlap interiors — shared edges only", () => {
    const tri = triangleFromBaseHeight(10, 8);
    const result = tessellate(tri, SHEET, 16);
    assert.equal(nestHasInteriorOverlap(result.placements), false);
    for (let i = 0; i < result.placements.length; i++) {
      for (let j = i + 1; j < result.placements.length; j++) {
        assert.equal(
          interiorsOverlap(result.placements[i]!.world, result.placements[j]!.world),
          false,
        );
      }
    }
  });

  it("uses only 0° and 180° — the ▽△ pair", () => {
    const tri = triangleFromBaseHeight(10, 8);
    const result = tessellate(tri, SHEET, 12);
    const angles = new Set(result.placements.map((p) => ((p.pose.rotationDeg % 360) + 360) % 360));
    for (const a of angles) {
      assert.ok(a === 0 || a === 180);
    }
    const up = result.placements.filter((p) => p.pointing === "up").length;
    const down = result.placements.filter((p) => p.pointing === "down").length;
    assert.ok(up >= 1);
    assert.ok(down >= 1);
  });

  it("first row starts with ▽ and alternates ▽△", () => {
    const tri = triangleFromBaseHeight(10, 8);
    const result = tessellate(tri, SHEET, 12);
    const rows = rowBands(result.placements);
    assert.ok(rows.length >= 1);
    const row = rows[0]!;
    assert.equal(row[0]!.pointing, "down");
    for (let i = 1; i < row.length; i++) {
      assert.notEqual(row[i]!.pointing, row[i - 1]!.pointing);
    }
  });

  it("next row starts with the opposite glyph", () => {
    const tri = triangleFromBaseHeight(10, 8);
    const result = tessellate(tri, { width: 60, length: 80, thickness: 1 }, 20);
    const rows = rowBands(result.placements);
    assert.ok(
      rows.length >= 2,
      `esperava 2+ fileiras, veio ${rows.length} (${patternPreview(result.placements, 4)})`,
    );
    assert.notEqual(rows[0]![0]!.pointing, rows[1]![0]!.pointing);
    assert.match(patternPreview(result.placements, 2), /[▽△]{2,}/);
  });

  it("keeps previous poses when quantity grows (stable BL fill)", () => {
    const tri = triangleFromLegs(6, 8);
    const a = tessellate(tri, SHEET, 5);
    const b = tessellate(tri, SHEET, 9);
    assert.equal(a.placed, 5);
    assert.ok(b.placed >= 5);
    for (let i = 0; i < a.placed; i++) {
      assert.equal(a.placements[i]!.pose.x, b.placements[i]!.pose.x);
      assert.equal(a.placements[i]!.pose.y, b.placements[i]!.pose.y);
      assert.equal(a.placements[i]!.pose.rotationDeg, b.placements[i]!.pose.rotationDeg);
    }
  });

  it("every placed triangle is inside the sheet", () => {
    const tri = triangleFromBaseHeight(20, 15);
    const result = tessellate(tri, { width: 100, length: 60, thickness: 2 }, 40);
    for (const p of result.placements) {
      assert.equal(isInsideSheet(p.world, { width: 100, length: 60, thickness: 2 }), true);
    }
  });

  it("sheet margin shifts the nest by exactly that amount", () => {
    const tri = triangleFromBaseHeight(10, 8);
    const m = 12;
    const none = tessellate(tri, SHEET, 8, { margin: 0, gap: 0 });
    const inset = tessellate(tri, SHEET, 8, { margin: m, gap: 0 });
    assert.ok(none.placed >= 1);
    assert.ok(inset.placed >= 1);
    const a = aabbOf(none.placements.flatMap((p) => p.world));
    const b = aabbOf(inset.placements.flatMap((p) => p.world));
    assert.ok(Math.abs(b.minX - a.minX - m) < 1e-6, `minX ${a.minX} → ${b.minX}`);
    assert.ok(Math.abs(b.minY - a.minY - m) < 1e-6, `minY ${a.minY} → ${b.minY}`);
    for (const p of inset.placements) {
      assert.equal(isInsideSheet(p.world, SHEET, 1e-6, m), true);
    }
  });

  it("does not jump a lattice cell when the margin is smaller than the piece", () => {
    const tri = triangleFromBaseHeight(10, 8);
    const m = 3;
    const result = tessellate(tri, SHEET, 6, { margin: m, gap: 0 });
    const box = aabbOf(result.placements.flatMap((p) => p.world));
    assert.ok(box.minX >= m - 1e-6);
    assert.ok(box.minY >= m - 1e-6);
    assert.ok(box.minX <= m + 0.05, `borda visual ${box.minX}, esperada ${m}`);
    assert.ok(box.minY <= m + 0.05, `borda visual ${box.minY}, esperada ${m}`);
  });

  it("keeps ▽△ checkerboard with margin and laser gap", () => {
    const tri = triangleFromBaseHeight(10, 8);
    const result = tessellate(tri, { width: 80, length: 80, thickness: 1 }, 20, {
      margin: 6,
      gap: 1,
    });
    const rows = rowBands(result.placements);
    assert.ok(rows.length >= 1);
    assert.equal(rows[0]![0]!.pointing, "down");
    for (let i = 1; i < rows[0]!.length; i++) {
      assert.notEqual(rows[0]![i]!.pointing, rows[0]![i - 1]!.pointing);
    }
  });

  it("laser gap separates interiors by at least that distance", () => {
    const tri = triangleFromBaseHeight(10, 8);
    const gap = 2;
    const result = tessellate(tri, SHEET, 12, { margin: 0, gap });
    assert.ok(result.placed >= 2);
    assert.equal(nestHasInteriorOverlap(result.placements), false);
    for (let i = 0; i < result.placements.length; i++) {
      for (let j = i + 1; j < result.placements.length; j++) {
        const d = minPolygonDistance(result.placements[i]!.world, result.placements[j]!.world);
        assert.ok(d >= gap - 0.08, `peças ${i + 1} e ${j + 1}: ${d} < ${gap}`);
      }
    }
  });

  it("too-large margin yields an empty nest", () => {
    const tri = triangleFromBaseHeight(10, 8);
    const result = tessellate(tri, SHEET, 4, { margin: 70, gap: 0 });
    assert.equal(result.placed, 0);
  });

  it("maxSheetMargin is just under half the short side", () => {
    assert.equal(maxSheetMargin({ width: 120, length: 80, thickness: 1 }), 39);
    assert.ok(maxSheetMargin(SHEET) < SHEET.length / 2);
  });
});

describe("mixed jobs on one sheet", () => {
  it("second geometry keeps gap from locked obstacles", () => {
    const tri = triangleFromBaseHeight(20, 16);
    const sheet = { width: 200, length: 160, thickness: 2 };
    const first = tessellate(tri, sheet, 6, { gap: 2 });
    assert.ok(first.placed >= 4);
    const sq = [
      { x: 0, y: 0 },
      { x: 18, y: 0 },
      { x: 18, y: 18 },
      { x: 0, y: 18 },
    ];
    const second = tessellate(sq, sheet, 4, {
      gap: 2,
      family: "grid",
      obstacles: first.placements.map((p) => p.world),
    });
    assert.ok(second.placed >= 1, `second placed ${second.placed}`);
    for (const a of second.placements) {
      assert.equal(isInsideSheet(a.world, sheet), true);
      for (const b of first.placements) {
        assert.equal(interiorsOverlap(a.world, b.world), false);
        const d = minPolygonDistance(a.world, b.world);
        assert.ok(d >= 1.9, `gap ${d}`);
      }
    }
    for (let i = 0; i < second.placements.length; i++) {
      for (let j = i + 1; j < second.placements.length; j++) {
        assert.equal(interiorsOverlap(second.placements[i]!.world, second.placements[j]!.world), false);
      }
    }
  });

  it("empty-sheet tessellation is unchanged when obstacles are omitted", () => {
    const tri = triangleFromBaseHeight(10, 8);
    const a = tessellate(tri, SHEET, 8);
    const b = tessellate(tri, SHEET, 8, { obstacles: [] });
    assert.equal(a.placed, b.placed);
    assert.equal(a.placements[0]?.pose.x, b.placements[0]?.pose.x);
    assert.equal(a.placements[0]?.pose.y, b.placements[0]?.pose.y);
  });

  it("flange around locked squares and traps stays fast and clear", () => {
    const big = { width: 2000, length: 1250, thickness: 10 };
    const input = (patch: Partial<PieceInput>): PieceInput => ({
      shape: "square",
      triangleMode: "base-height",
      polyPreset: "livre",
      flangePreset: "anel",
      wingPreset: "delta",
      base: 1,
      height: 1,
      legA: 1,
      legB: 1,
      vertices: [],
      side: 180,
      width: 200,
      outerDia: 160,
      innerDia: 80,
      sweepDeg: 360,
      thick: 40,
      hexSide: 1,
      baseTop: 140,
      baseBot: 220,
      ...patch,
    });
    const sq = buildPiece(input({ shape: "square", side: 180 }));
    const squares = tessellate(sq.piece.vertices, big, 8, { family: "grid", gap: 10, margin: 15 });
    const tr = buildPiece(input({ shape: "trap", height: 120 }));
    const traps = tessellate(tr.piece.vertices, big, 6, {
      family: "pair180",
      gap: 10,
      margin: 15,
      obstacles: squares.placements.map((p) => p.world),
    });
    const locked = [...squares.placements, ...traps.placements].map((p) => p.world);
    const fl = buildPiece(input({ shape: "flange" }));
    const t0 = performance.now();
    const flanges = tessellate(fl.piece.vertices, big, 12, {
      family: fl.piece.family,
      holes: fl.piece.holes,
      gap: 10,
      margin: 15,
      obstacles: locked,
    });
    const ms = performance.now() - t0;
    assert.ok(ms < 250, `flange around mixed jobs ${ms.toFixed(1)}ms`);
    assert.ok(flanges.placed >= 1, `flanges placed ${flanges.placed}`);
    let nearest = Infinity;
    for (const a of flanges.placements) {
      for (const b of locked) {
        assert.equal(interiorsOverlap(a.world, b), false);
        const d = minPolygonDistance(a.world, b);
        assert.ok(d >= 9.9);
        if (d < nearest) nearest = d;
      }
    }
    assert.ok(nearest < 45, `flanges sit ${nearest.toFixed(1)} mm away — should hug the laser gap`);
  });

  it("disc and arc flanges hug locked triangles+squares at the laser gap", () => {
    const big = { width: 2000, length: 1250, thickness: 10 };
    const base = {
      shape: "triangle" as const,
      triangleMode: "base-height" as const,
      polyPreset: "livre" as const,
      flangePreset: "anel" as const,
      wingPreset: "delta" as const,
      base: 400,
      height: 300,
      legA: 1,
      legB: 1,
      vertices: [],
      side: 300,
      width: 1,
      outerDia: 280,
      innerDia: 160,
      sweepDeg: 360,
      thick: 80,
      hexSide: 1,
      baseTop: 1,
      baseBot: 1,
    };
    const tri = buildPiece({ ...base, shape: "triangle" });
    const sq = buildPiece({ ...base, shape: "square" });
    const first = tessellate(tri.piece.vertices, big, 8, { family: tri.piece.family, gap: 10, margin: 15 });
    const second = tessellate(sq.piece.vertices, big, 6, {
      family: "grid",
      gap: 10,
      margin: 15,
      obstacles: first.placements.map((p) => p.world),
    });
    const locked = [...first.placements, ...second.placements].map((p) => p.world);
    const ids = ["anel", "meia", "c", "meialua"] as const;
    const live = [
      buildPiece({ ...base, shape: "disc", outerDia: 280 }),
      ...ids.map((id) => buildPiece({ ...base, shape: "flange", ...flangePresetPatch(id, 280) })),
    ];
    for (const b of live) {
      const r = tessellate(b.piece.vertices, big, 8, {
        family: b.piece.family,
        holes: b.piece.holes,
        gap: 10,
        margin: 15,
        obstacles: locked,
      });
      let nearest = Infinity;
      for (const a of r.placements) {
        for (const o of locked) {
          const d = minPolygonDistance(a.world, o);
          if (d < nearest) nearest = d;
        }
      }
      assert.ok(r.placed >= 1, `${b.piece.name} placed ${r.placed}`);
      assert.ok(nearest >= 9.9, `${b.piece.name} gap ${nearest}`);
      assert.ok(nearest < 25, `${b.piece.name} sits ${nearest.toFixed(1)} mm away`);
    }
  });
});

describe("circular remnant sheet", () => {
  it("fits 5 discs of 180 mm in a Ø 700 mm plate", () => {
    const plate = { kind: "disc" as const, width: 700, length: 700, thickness: 10 };
    const piece = discFromDiameter(180);
    const result = tessellate(piece, plate, 5, { family: "hex", gap: 10, margin: 15 });
    assert.equal(result.placed, 5);
    for (const p of result.placements) {
      assert.equal(isInsideSheet(p.world, plate, 1e-6, 15), true);
    }
    for (let i = 0; i < result.placements.length; i++) {
      for (let j = i + 1; j < result.placements.length; j++) {
        assert.equal(interiorsOverlap(result.placements[i]!.world, result.placements[j]!.world), false);
        assert.ok(minPolygonDistance(result.placements[i]!.world, result.placements[j]!.world) >= 9.9);
      }
    }
  });

  it("does not place a piece larger than the inner circle", () => {
    const plate = { kind: "disc" as const, width: 200, length: 200, thickness: 10 };
    const piece = discFromDiameter(180);
    const result = tessellate(piece, plate, 3, { family: "hex", gap: 10, margin: 15 });
    assert.equal(result.placed, 0);
  });

  it("shifts the hex lattice to use the leftover rim on a Ø 1250 mm plate", () => {
    const plate = { kind: "disc" as const, width: 1250, length: 1250, thickness: 10 };
    const piece = discFromDiameter(280);
    const t0 = performance.now();
    const result = tessellate(piece, plate, 20, { family: "hex", gap: 10, margin: 15 });
    const ms = performance.now() - t0;
    assert.ok(result.placed > 7, `placed ${result.placed}, expected more than the centered 1+6`);
    assert.ok(ms < 250, `rim search took ${ms.toFixed(0)} ms`);
    for (const p of result.placements) {
      assert.equal(isInsideSheet(p.world, plate, 1e-6, 15), true);
    }
    for (let i = 0; i < result.placements.length; i++) {
      for (let j = i + 1; j < result.placements.length; j++) {
        assert.equal(interiorsOverlap(result.placements[i]!.world, result.placements[j]!.world), false);
        assert.ok(minPolygonDistance(result.placements[i]!.world, result.placements[j]!.world) >= 9.9);
      }
    }
  });

  it("fits 4 right triangles 500×500 in a Ø 1250 mm plate", () => {
    const plate = { kind: "disc" as const, width: 1250, length: 1250, thickness: 10 };
    const tri = triangleFromLegs(500, 500);
    const t0 = performance.now();
    const result = tessellate(tri, plate, 4, { family: "pair180", gap: 10, margin: 15 });
    const ms = performance.now() - t0;
    assert.equal(result.placed, 4, `placed ${result.placed}`);
    assert.ok(ms < 250, `disc pair search took ${ms.toFixed(0)} ms`);
    const c = 1250 / 2;
    for (const p of result.placements) {
      assert.equal(isInsideSheet(p.world, plate, 1e-6, 15), true);
      const hub = Math.min(...p.world.map((v) => Math.hypot(v.x - c, v.y - c)));
      assert.ok(hub < 20, `right angle sits ${hub.toFixed(1)} mm from center`);
    }
    const maxR = Math.max(
      ...result.placements.flatMap((p) => p.world.map((v) => Math.hypot(v.x - c, v.y - c))),
    );
    assert.ok(maxR < 530, `pinwheel circumradius ${maxR.toFixed(1)} should be ~500 mm`);
    for (let i = 0; i < result.placements.length; i++) {
      for (let j = i + 1; j < result.placements.length; j++) {
        assert.equal(interiorsOverlap(result.placements[i]!.world, result.placements[j]!.world), false);
        assert.ok(minPolygonDistance(result.placements[i]!.world, result.placements[j]!.world) >= 9.9);
      }
    }
  });

  it("pinwheel of 4 catetos 500 mm still fits a Ø 1050 mm remnant", () => {
    const plate = { kind: "disc" as const, width: 1050, length: 1050, thickness: 10 };
    const tri = triangleFromLegs(500, 500);
    const result = tessellate(tri, plate, 4, { family: "pair180", gap: 10, margin: 15 });
    assert.equal(result.placed, 4, `placed ${result.placed}, diameter arrangement needs ~1170 mm`);
    const c = 1050 / 2;
    for (const p of result.placements) {
      assert.equal(isInsideSheet(p.world, plate, 1e-6, 15), true);
      const hub = Math.min(...p.world.map((v) => Math.hypot(v.x - c, v.y - c)));
      assert.ok(hub < 20, `right angle sits ${hub.toFixed(1)} mm from center`);
    }
  });

  it("fits 2 squares of 500 mm along the diameter of a Ø 1250 mm plate", () => {
    const plate = { kind: "disc" as const, width: 1250, length: 1250, thickness: 10 };
    const sq = squareFromSide(500);
    const result = tessellate(sq, plate, 4, { family: "grid", gap: 10, margin: 15 });
    assert.equal(result.placed, 2, `placed ${result.placed}, 2×2 corners were outside the circle`);
    for (const p of result.placements) {
      assert.equal(isInsideSheet(p.world, plate, 1e-6, 15), true);
    }
    assert.ok(minPolygonDistance(result.placements[0]!.world, result.placements[1]!.world) >= 9.9);
  });

  it("rect sheets still nest the same with kind omitted", () => {
    const a = tessellate(triangleFromBaseHeight(10, 8), SHEET, 8);
    const b = tessellate(triangleFromBaseHeight(10, 8), { ...SHEET, kind: "rect" }, 8);
    assert.equal(a.placed, b.placed);
    assert.equal(a.placements[0]?.pose.x, b.placements[0]?.pose.x);
  });

  it("numbers disc pieces 0..n-1 like the rectangular sheet", () => {
    const plate = { kind: "disc" as const, width: 1250, length: 1250, thickness: 10 };
    const result = tessellate(triangleFromLegs(200, 200), plate, 8, {
      family: "pair180",
      gap: 10,
      margin: 15,
    });
    assert.ok(result.placed >= 4);
    assert.deepEqual(
      result.placements.map((p) => p.index),
      result.placements.map((_, i) => i),
    );
    const hex = tessellate(discFromDiameter(180), { kind: "disc", width: 700, length: 700, thickness: 10 }, 5, {
      family: "hex",
      gap: 10,
      margin: 15,
    });
    assert.deepEqual(
      hex.placements.map((p) => p.index),
      hex.placements.map((_, i) => i),
    );
  });
});
