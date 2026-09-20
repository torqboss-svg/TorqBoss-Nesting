import { APP_NAME } from "../brand.ts";
import type { NestedPiece, Sheet } from "./types.ts";

export type CutRow = {
  lote: string;
  index: number;
  x: number;
  y: number;
  rotationDeg: number;
  pointing: NestedPiece["pointing"];
};

export type NestExportDoc = {
  app: string;
  unit: "mm";
  sheet: Sheet;
  margin: number;
  gap: number;
  pieces: CutRow[];
};

export function cutRowsFrom(placements: readonly NestedPiece[], lote: string): CutRow[] {
  return placements.map((p, i) => ({
    lote,
    index: p.index + 1 || i + 1,
    x: round3(p.pose.x),
    y: round3(p.pose.y),
    rotationDeg: round3(p.pose.rotationDeg),
    pointing: p.pointing,
  }));
}

export function buildNestExport(args: {
  sheet: Sheet;
  margin: number;
  gap: number;
  live: readonly NestedPiece[];
  jobs: readonly { name: string; placements: readonly NestedPiece[] }[];
}): NestExportDoc {
  const pieces: CutRow[] = [];
  for (const job of args.jobs) {
    pieces.push(...cutRowsFrom(job.placements, job.name));
  }
  pieces.push(...cutRowsFrom(args.live, "ao vivo"));
  return {
    app: APP_NAME,
    unit: "mm",
    sheet: { ...args.sheet },
    margin: args.margin,
    gap: args.gap,
    pieces,
  };
}

export function nestExportToCsv(doc: NestExportDoc): string {
  const head = "lote,index,x_mm,y_mm,rotacao_deg,apontamento";
  const lines = doc.pieces.map(
    (r) => `${csvCell(r.lote)},${r.index},${r.x},${r.y},${r.rotationDeg},${r.pointing}`,
  );
  return [head, ...lines].join("\n");
}

export function nestExportFilename(ext: "json" | "csv"): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `torqboss-nesting-${stamp}.${ext}`;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function csvCell(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}
