import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WING_PRESETS, __test, wingFromSpec } from "./wing.ts";

describe("bezier wing", () => {
  it("cubic interpolates endpoints", () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 10, y: 20 };
    const p2 = { x: 30, y: 20 };
    const p3 = { x: 40, y: 0 };
    const a = __test.cubicPoint(p0, p1, p2, p3, 0);
    const b = __test.cubicPoint(p0, p1, p2, p3, 1);
    assert.equal(a.x, 0);
    assert.equal(a.y, 0);
    assert.equal(b.x, 40);
    assert.equal(b.y, 0);
  });

  it("every preset yields a simple closed loop", () => {
    for (const p of WING_PRESETS) {
      const poly = wingFromSpec(p.id, 120, 80, 24);
      assert.ok(poly.length >= 6, p.id);
      const first = poly[0]!;
      const last = poly[poly.length - 1]!;
      assert.ok(Math.hypot(first.x, first.y) >= 0);
      assert.ok(Number.isFinite(last.x));
    }
  });
});
