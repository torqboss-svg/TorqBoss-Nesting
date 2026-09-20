import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aabbOf,
  applyPose,
  applyPoseAll,
  area,
  canonicalizeTriangle,
  centroid,
  incenter,
  inflateTriangle,
  isCcw,
  isChevronLike,
  isDeltaLike,
  isDegenerate,
  isInsideSheet,
  offsetConvex,
  pointInTriangle,
  rotate,
  signedArea,
} from "./geometry.ts";
import { triangleFromBaseHeight, triangleFromLegs } from "./triangle.ts";

describe("geometry kernel", () => {
  it("shoelace: 3-4-5 right triangle has area 6", () => {
    const tri = triangleFromLegs(3, 4);
    assert.equal(area(tri), 6);
    assert.ok(isCcw(tri));
  });

  it("flips clockwise vertices to CCW and parks AABB at origin", () => {
    const cw = canonicalizeTriangle([
      { x: 10, y: 10 },
      { x: 10, y: 20 },
      { x: 20, y: 10 },
    ]);
    assert.ok(isCcw(cw));
    const box = aabbOf(cw);
    assert.equal(box.minX, 0);
    assert.equal(box.minY, 0);
  });

  it("rotate 90° CCW around origin: (1,0) → (0,1)", () => {
    const p = rotate({ x: 1, y: 0 }, 90);
    assert.ok(Math.abs(p.x) < 1e-9);
    assert.ok(Math.abs(p.y - 1) < 1e-9);
  });

  it("pose is R(θ)p + t", () => {
    const p = applyPose({ x: 10, y: 0 }, { x: 5, y: 7, rotationDeg: 90 });
    assert.ok(Math.abs(p.x - 5) < 1e-9);
    assert.ok(Math.abs(p.y - 17) < 1e-9);
  });

  it("isosceles from base/height is canonical and non-degenerate", () => {
    const tri = triangleFromBaseHeight(10, 4);
    assert.equal(aabbOf(tri).minX, 0);
    assert.equal(aabbOf(tri).minY, 0);
    assert.equal(area(tri), 20);
    assert.equal(false, isDegenerate(tri));
  });

  it("centroid of 3-4-5 at (legA/3, legB/3)", () => {
    const tri = triangleFromLegs(3, 4);
    const c = centroid(tri);
    assert.ok(Math.abs(c.x - 1) < 1e-9);
    assert.ok(Math.abs(c.y - 4 / 3) < 1e-9);
  });

  it("point-in-triangle via barycentric", () => {
    const tri = triangleFromLegs(10, 10);
    assert.equal(pointInTriangle({ x: 1, y: 1 }, tri), true);
    assert.equal(pointInTriangle({ x: 9, y: 9 }, tri), false);
  });

  it("inside-sheet diagnostic uses inclusive bounds", () => {
    const sheet = { width: 100, length: 80, thickness: 2 };
    const inside = applyPoseAll(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 0, y: 10 },
      ],
      { x: 90, y: 70, rotationDeg: 0 },
    );
    assert.equal(isInsideSheet(inside, sheet), true);
    const outside = applyPoseAll(
      [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 0, y: 10 },
      ],
      { x: 90, y: 0, rotationDeg: 0 },
    );
    assert.equal(isInsideSheet(outside, sheet), false);
  });

  it("collinear points are degenerate", () => {
    assert.equal(
      isDegenerate([
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 10, y: 0 },
      ]),
      true,
    );
  });

  it("signed area distinguishes winding", () => {
    const ccw = signedArea([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 2 },
    ]);
    const cw = signedArea([
      { x: 0, y: 0 },
      { x: 0, y: 2 },
      { x: 2, y: 0 },
    ]);
    assert.ok(ccw > 0);
    assert.ok(cw < 0);
    assert.equal(ccw, -cw);
  });

  it("inflate from incenter grows inradius by d and stays similar", () => {
    const tri = triangleFromBaseHeight(10, 8);
    const { radius } = incenter(tri);
    const fat = inflateTriangle(tri, 2);
    assert.ok(Math.abs(incenter(fat).radius - (radius + 2)) < 1e-6);
    const scale = (radius + 2) / radius;
    assert.ok(Math.abs(area(fat) / area(tri) - scale * scale) < 1e-6);
  });

  it("offsetConvex expands and shrinks reversibly on a convex quad", () => {
    const quad = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 6 },
      { x: 0, y: 6 },
    ];
    const fat = offsetConvex(quad, 2);
    assert.ok(area(fat) > area(quad));
    const back = offsetConvex(fat, -2);
    for (let i = 0; i < 4; i++) {
      assert.ok(Math.abs(back[i]!.x - quad[i]!.x) < 1e-6);
      assert.ok(Math.abs(back[i]!.y - quad[i]!.y) < 1e-6);
    }
  });

  it("inside-sheet with margin rejects vertices in the keep-out strip", () => {
    const sheet = { width: 100, length: 80, thickness: 2 };
    const verts = [
      { x: 4, y: 10 },
      { x: 20, y: 10 },
      { x: 4, y: 30 },
    ];
    assert.equal(isInsideSheet(verts, sheet, 1e-9, 0), true);
    assert.equal(isInsideSheet(verts, sheet, 1e-9, 5), false);
  });

  it("isDeltaLike accepts a curved triangle and rejects chevron/quad", () => {
    const delta = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 168, y: 70 },
      { x: 100, y: 150 },
      { x: 32, y: 70 },
    ];
    assert.equal(isDeltaLike(delta), true);
    assert.equal(isChevronLike(delta), false);
    const quad = [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 30 },
      { x: 0, y: 30 },
    ];
    assert.equal(isDeltaLike(quad), false);
    const chevron = [
      { x: 0, y: 0 },
      { x: 140, y: 0 },
      { x: 280, y: 140 },
      { x: 140, y: 280 },
      { x: 0, y: 280 },
      { x: 140, y: 140 },
    ];
    assert.equal(isDeltaLike(chevron), false);
    assert.equal(isChevronLike(chevron), true);
  });
});
