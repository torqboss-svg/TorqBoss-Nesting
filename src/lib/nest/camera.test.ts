import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fitCamera, keepWorldCenter, panCamera, pinchCamera, toScreen, toWorld, zoomAt, zoomPercent } from "./camera.ts";

const SHEET = { width: 1000, length: 500, thickness: 2 };

describe("viewport camera", () => {
  it("fit places the sheet origin at the bottom-left of the fitted rect", () => {
    const cam = fitCamera(800, 600, SHEET, 0);
    const o = toScreen(cam, 0, 0);
    const tr = toScreen(cam, 1000, 500);
    assert.ok(Math.abs(o.y - 600) < 1e-6 || o.y > tr.y);
    assert.ok(tr.x > o.x);
    const back = toWorld(cam, o.x, o.y);
    assert.ok(Math.abs(back.x) < 1e-6);
    assert.ok(Math.abs(back.y) < 1e-6);
  });

  it("zoom at cursor keeps the world point under the cursor", () => {
    const cam = fitCamera(800, 600, SHEET, 0);
    const sx = 400;
    const sy = 300;
    const before = toWorld(cam, sx, sy);
    const zoomed = zoomAt(cam, sx, sy, 2, 0.001, 100);
    const after = toWorld(zoomed, sx, sy);
    assert.ok(Math.abs(after.x - before.x) < 1e-6);
    assert.ok(Math.abs(after.y - before.y) < 1e-6);
    assert.ok(Math.abs(zoomed.scale - cam.scale * 2) < 1e-9);
  });

  it("pan shifts screen origin without changing scale", () => {
    const cam = fitCamera(400, 400, SHEET, 0);
    const moved = panCamera(cam, 20, -10);
    assert.equal(moved.scale, cam.scale);
    assert.equal(moved.ox, cam.ox + 20);
    assert.equal(moved.oy, cam.oy - 10);
  });

  it("keepWorldCenter preserves the world point at the screen center", () => {
    const cam = panCamera(fitCamera(400, 300, SHEET, 0), 40, 20);
    const world = toWorld(cam, 200, 150);
    const next = keepWorldCenter(cam, 400, 300, 800, 600);
    const world2 = toWorld(next, 400, 300);
    assert.ok(Math.abs(world2.x - world.x) < 1e-6);
    assert.ok(Math.abs(world2.y - world.y) < 1e-6);
  });

  it("zoomPercent is 100 at fit", () => {
    const cam = fitCamera(640, 480, SHEET);
    assert.equal(zoomPercent(cam, cam), 100);
  });

  it("pinch zooms around the finger midpoint and pans when they slide", () => {
    const cam = fitCamera(800, 600, SHEET, 0);
    const a = { x: 350, y: 280 };
    const b = { x: 450, y: 320 };
    const mid = { x: 400, y: 300 };
    const before = toWorld(cam, mid.x, mid.y);
    const wider = pinchCamera(cam, a, b, { x: 300, y: 260 }, { x: 500, y: 340 }, 0.001, 100);
    const after = toWorld(wider, mid.x, mid.y);
    assert.ok(Math.abs(after.x - before.x) < 1e-6);
    assert.ok(Math.abs(after.y - before.y) < 1e-6);
    assert.ok(wider.scale > cam.scale);

    const slid = pinchCamera(cam, a, b, { x: a.x + 40, y: a.y + 10 }, { x: b.x + 40, y: b.y + 10 }, 0.001, 100);
    assert.ok(Math.abs(slid.scale - cam.scale) < 1e-9);
    assert.equal(slid.ox, cam.ox + 40);
    assert.equal(slid.oy, cam.oy + 10);
  });
});
