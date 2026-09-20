import { buildPiece } from "./shapes.ts";
import { tessellate } from "./tessellate.ts";
import type { NestJob, NestedPiece, Piece, PieceInput, Plate, Sheet } from "./types.ts";

export const MAX_PLATES = 8;

export function plateId(): string {
  return `chapa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function makePlate(sheet: Sheet, jobs: NestJob[] = []): Plate {
  return {
    id: plateId(),
    sheet: { width: sheet.width, length: sheet.length, thickness: sheet.thickness },
    jobs: [...jobs],
  };
}

export function cloneSheet(sheet: Sheet): Sheet {
  return { width: sheet.width, length: sheet.length, thickness: sheet.thickness };
}

export type PlannedPlate = {
  id: string;
  sheet: Sheet;
  jobs: NestJob[];
  live: NestedPiece[];
  placed: number;
  locked: number;
  virtual: boolean;
};

export type PlatePlan = {
  plates: PlannedPlate[];
  remainder: number;
  livePlaced: number;
  requested: number;
};

function obstaclesOf(jobs: readonly NestJob[]): NestedPiece["world"][] {
  return jobs.flatMap((j) => j.placements.map((p) => p.world));
}

function plateGap(gap: number, sheet: Sheet): number {
  return Math.max(Math.max(0, gap), Math.max(0, sheet.thickness));
}

/** Preenche as chapas em ordem. O que não cabe na atual vai para a próxima. */
export function planPlates(
  piece: Piece,
  quantity: number,
  margin: number,
  gap: number,
  stored: readonly Plate[],
): PlatePlan {
  const requested = Math.max(0, Math.floor(quantity));
  const base = stored.length > 0 ? stored : [makePlate({ width: 1, length: 1, thickness: 0 })];
  const out: PlannedPlate[] = [];
  let remaining = requested;

  const fillOne = (plate: Plate, virtual: boolean): PlannedPlate => {
    const tried = remaining;
    const nest =
      remaining > 0
        ? tessellate(piece.vertices, plate.sheet, remaining, {
            margin,
            gap: plateGap(gap, plate.sheet),
            family: piece.family,
            holes: piece.holes,
            obstacles: obstaclesOf(plate.jobs),
          })
        : { placements: [] as NestedPiece[], placed: 0 };
    remaining = Math.max(0, remaining - nest.placed);
    return {
      id: plate.id,
      sheet: plate.sheet,
      jobs: plate.jobs,
      live: nest.placements,
      placed: nest.placed,
      locked: plate.jobs.reduce((n, j) => n + j.placements.length, 0),
      virtual,
    };
  };

  for (const plate of base) out.push(fillOne(plate, false));

  while (remaining > 0 && out.length < MAX_PLATES) {
    const last = out[out.length - 1]!;
    if (last.placed === 0 && last.jobs.length === 0) break;
    const fresh: Plate = {
      id: `virtual-${out.length}`,
      sheet: cloneSheet(last.sheet),
      jobs: [],
    };
    const next = fillOne(fresh, true);
    if (next.placed === 0) break;
    out.push(next);
  }

  return {
    plates: out,
    remainder: remaining,
    livePlaced: requested - remaining,
    requested,
  };
}

export function planFromInput(
  input: PieceInput,
  quantity: number,
  margin: number,
  gap: number,
  stored: readonly Plate[],
): PlatePlan & { piece: Piece; valid: boolean } {
  const { piece, valid } = buildPiece(input);
  if (!valid) {
    const plates = (stored.length ? stored : [makePlate({ width: 1, length: 1, thickness: 0 })]).map(
      (p) => ({
        id: p.id,
        sheet: p.sheet,
        jobs: p.jobs,
        live: [] as NestedPiece[],
        placed: 0,
        locked: p.jobs.reduce((n, j) => n + j.placements.length, 0),
        virtual: false,
      }),
    );
    return { plates, remainder: quantity, livePlaced: 0, requested: quantity, piece, valid };
  }
  return { ...planPlates(piece, quantity, margin, gap, stored), piece, valid };
}

export function materializePlan(stored: readonly Plate[], plan: PlatePlan, upToIndex: number): Plate[] {
  const plates = stored.map((p) => ({
    id: p.id,
    sheet: cloneSheet(p.sheet),
    jobs: [...p.jobs],
  }));
  const cap = Math.min(upToIndex, plan.plates.length - 1);
  for (let i = plates.length; i <= cap; i++) {
    const src = plan.plates[i]!;
    plates.push(makePlate(src.sheet));
  }
  return plates;
}