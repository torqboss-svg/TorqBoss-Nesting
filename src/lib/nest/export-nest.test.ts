import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildNestExport, nestExportToCsv } from "./export-nest.ts";
import type { NestedPiece } from "./types.ts";

function piece(x: number, y: number, rotationDeg: number): NestedPiece {
  return {
    index: 0,
    pose: { x, y, rotationDeg },
    world: [
      { x, y },
      { x: x + 1, y },
      { x, y: y + 1 },
    ],
    holes: [],
    pointing: "up",
    pack: "pair",
  };
}

describe("nest export", () => {
  it("lists locked lots then live pieces, in mm", () => {
    const doc = buildNestExport({
      sheet: { width: 2000, length: 1250, thickness: 10 },
      margin: 15,
      gap: 10,
      jobs: [{ name: "Triângulo", placements: [piece(8, 8, 0)] }],
      live: [piece(120, 8, 180)],
    });
    assert.equal(doc.app, "TorqBoss Nesting");
    assert.equal(doc.unit, "mm");
    assert.equal(doc.pieces.length, 2);
    assert.equal(doc.pieces[0]?.lote, "Triângulo");
    assert.equal(doc.pieces[1]?.lote, "ao vivo");
    assert.equal(doc.pieces[1]?.rotationDeg, 180);
    const csv = nestExportToCsv(doc);
    assert.match(csv, /^lote,index,x_mm,y_mm,rotacao_deg,apontamento\n/);
    assert.match(csv, /ao vivo,1,120,8,180,up/);
  });
});
