import { useMemo } from "react";
import { create } from "zustand";
import { buildPiece, flangePresetPatch, verticesOfPreset } from "./shapes.ts";
import { maxSheetMargin } from "./tessellate.ts";
import { makePlate, materializePlan, planFromInput, MAX_PLATES } from "./plates.ts";
import type {
  FlangePresetId,
  NestJob,
  NestResult,
  NestedPiece,
  Piece,
  PieceInput,
  Plate,
  PolyPresetId,
  ShapeKind,
  Sheet,
  WingPresetId,
} from "./types.ts";
import { isWingPreset } from "./wing.ts";

const STORAGE_KEY = "ninho-nest-v7";
export const MAX_JOBS = 8;
export { MAX_PLATES };

export const DEFAULT_SHEET: Sheet = {
  shape: "rectangle",
  width: 2000,
  length: 1250,
  thickness: 10,
};

export const DEFAULT_INPUT: PieceInput = {
  shape: "triangle",
  triangleMode: "base-height",
  polyPreset: "livre",
  flangePreset: "anel",
  wingPreset: "delta",
  base: 400,
  height: 300,
  legA: 300,
  legB: 400,
  vertices: [
    { x: 0, y: 0 },
    { x: 320, y: 0 },
    { x: 380, y: 140 },
    { x: 200, y: 280 },
    { x: 20, y: 160 },
  ],
  side: 300,
  width: 420,
  outerDia: 280,
  innerDia: 160,
  sweepDeg: 360,
  thick: 80,
  hexSide: 140,
  baseTop: 240,
  baseBot: 400,
};

export const DEFAULT_QUANTITY = 12;
export const DEFAULT_MARGIN = 15;
export const DEFAULT_GAP = DEFAULT_SHEET.thickness;

type NestState = {
  plates: Plate[];
  activePlateId: string;
  sheet: Sheet;
  input: PieceInput;
  quantity: number;
  margin: number;
  gap: number;
  jobs: NestJob[];
  setSheet: (patch: Partial<Sheet>) => void;
  setInput: (patch: Partial<PieceInput>) => void;
  setShape: (shape: ShapeKind) => void;
  setKind: (kind: PieceInput["triangleMode"]) => void;
  setPolyPreset: (id: PolyPresetId) => void;
  setFlangePreset: (id: FlangePresetId) => void;
  setWingPreset: (id: WingPresetId) => void;
  setQuantity: (quantity: number) => void;
  setMargin: (margin: number) => void;
  setGap: (gap: number) => void;
  selectPlateAt: (index: number) => void;
  addPlate: () => void;
  removeActivePlate: () => void;
  lockCurrent: () => void;
  removeJob: (id: string) => void;
  reset: () => void;
};

function firstPlate(): Plate {
  return makePlate(DEFAULT_SHEET);
}

function mirrors(plates: Plate[], activePlateId: string): Pick<NestState, "plates" | "activePlateId" | "sheet" | "jobs"> {
  const list = plates.length > 0 ? plates : [firstPlate()];
  const p = list.find((x) => x.id === activePlateId) ?? list[0]!;
  return { plates: list, activePlateId: p.id, sheet: p.sheet, jobs: p.jobs };
}

function floorGap(gap: number, thickness: number): number {
  return Math.max(Math.max(0, thickness), Math.max(0, gap));
}

function clampMargin(margin: number, sheet: Sheet): number {
  const cap = maxSheetMargin(sheet);
  if (!Number.isFinite(margin)) return 0;
  return Math.min(Math.max(0, margin), cap);
}

function migrateInput(raw: unknown): PieceInput {
  const parsed = (raw ?? {}) as Partial<PieceInput> & { kind?: string };
  const shape =
    parsed.shape ??
    (parsed.kind === "base-height" || parsed.kind === "right" || parsed.kind === "vertices"
      ? "triangle"
      : "triangle");
  const triangleMode =
    parsed.triangleMode ??
    (parsed.kind === "right" || parsed.kind === "vertices" || parsed.kind === "base-height"
      ? parsed.kind
      : "base-height");
  const preset = (parsed as { polyPreset?: string }).polyPreset;
  const polyPreset: PolyPresetId =
    preset === "casa" ||
    preset === "seta" ||
    preset === "paralelogramo" ||
    preset === "losango" ||
    preset === "te" ||
    preset === "cruz" ||
    preset === "chevron" ||
    preset === "aba" ||
    preset === "gota" ||
    preset === "livre"
      ? preset
      : "livre";
  const fp = (parsed as { flangePreset?: string }).flangePreset;
  const flangePreset: FlangePresetId =
    fp === "meia" ||
    fp === "quarto" ||
    fp === "terco" ||
    fp === "sexto" ||
    fp === "c" ||
    fp === "fatia" ||
    fp === "meialua" ||
    fp === "gomo" ||
    fp === "crescente" ||
    fp === "anel"
      ? fp
      : "anel";
  const wingPreset: WingPresetId = isWingPreset((parsed as { wingPreset?: string }).wingPreset)
    ? (parsed as { wingPreset: WingPresetId }).wingPreset
    : "delta";
  const sweepRaw = (parsed as { sweepDeg?: number }).sweepDeg;
  const sweepDeg =
    typeof sweepRaw === "number" && Number.isFinite(sweepRaw)
      ? Math.min(360, Math.max(8, sweepRaw))
      : 360;
  return {
    ...DEFAULT_INPUT,
    ...parsed,
    shape,
    triangleMode,
    polyPreset,
    flangePreset,
    wingPreset,
    sweepDeg,
    vertices:
      Array.isArray(parsed.vertices) && parsed.vertices.length >= 3
        ? parsed.vertices
        : DEFAULT_INPUT.vertices,
  };
}

function jobId(): string {
  return `lote-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const useNestStore = create<NestState>((set) => {
  const origin = firstPlate();
  return {
    ...mirrors([origin], origin.id),
    input: DEFAULT_INPUT,
    quantity: DEFAULT_QUANTITY,
    margin: DEFAULT_MARGIN,
    gap: DEFAULT_GAP,
    setSheet: (patch) =>
      set((s) => {
        const sheet = { ...s.sheet, ...patch };
        const plates = s.plates.map((p) => (p.id === s.activePlateId ? { ...p, sheet } : p));
        return {
          ...mirrors(plates, s.activePlateId),
          gap: floorGap(s.gap, sheet.thickness),
          margin: clampMargin(s.margin, sheet),
        };
      }),
    setInput: (patch) => set((s) => ({ input: { ...s.input, ...patch } })),
    setShape: (shape) => set((s) => ({ input: { ...s.input, shape } })),
    setKind: (kind) => set((s) => ({ input: { ...s.input, triangleMode: kind } })),
    setPolyPreset: (polyPreset) =>
      set((s) => ({
        input: { ...s.input, polyPreset, vertices: verticesOfPreset(polyPreset) },
      })),
    setFlangePreset: (flangePreset) =>
      set((s) => ({
        input: { ...s.input, ...flangePresetPatch(flangePreset, s.input.outerDia) },
      })),
    setWingPreset: (wingPreset) => set((s) => ({ input: { ...s.input, wingPreset } })),
    setQuantity: (quantity) => set({ quantity }),
    setMargin: (margin) => set((s) => ({ margin: clampMargin(margin, s.sheet) })),
    setGap: (gap) => set((s) => ({ gap: floorGap(gap, s.sheet.thickness) })),
    selectPlateAt: (index) =>
      set((s) => {
        const plan = planFromInput(s.input, s.quantity, s.margin, s.gap, s.plates);
        const plates = materializePlan(s.plates, plan, index);
        const i = Math.max(0, Math.min(index, plates.length - 1));
        return mirrors(plates, plates[i]!.id);
      }),
    addPlate: () =>
      set((s) => {
        if (s.plates.length >= MAX_PLATES) return s;
        const extra = makePlate(s.sheet);
        return mirrors([...s.plates, extra], extra.id);
      }),
    removeActivePlate: () =>
      set((s) => {
        if (s.plates.length <= 1) return s;
        const current = s.plates.find((p) => p.id === s.activePlateId);
        if (current && current.jobs.length > 0) return s;
        const plates = s.plates.filter((p) => p.id !== s.activePlateId);
        return mirrors(plates, plates[0]!.id);
      }),
    lockCurrent: () =>
      set((s) => {
        const plan = planFromInput(s.input, s.quantity, s.margin, s.gap, s.plates);
        if (!plan.valid) return s;
        const idx = Math.max(
          0,
          plan.plates.findIndex((p) => p.id === s.activePlateId),
        );
        const fill = plan.plates[idx];
        if (!fill || fill.placed === 0) return s;
        const plates = fill.virtual ? materializePlan(s.plates, plan, idx) : s.plates.map((p) => ({ ...p, jobs: [...p.jobs] }));
        const activeId = plates[Math.min(idx, plates.length - 1)]!.id;
        const plate = plates.find((p) => p.id === activeId);
        if (!plate || plate.jobs.length >= MAX_JOBS) return s;
        const id = jobId();
        const job: NestJob = {
          id,
          name: plan.piece.name,
          shape: plan.piece.shape,
          input: {
            ...s.input,
            vertices: s.input.vertices.map((v) => ({ x: v.x, y: v.y })),
          },
          quantity: fill.placed,
          placements: fill.live.map((p, index) => ({ ...p, index, jobId: id })),
        };
        const nextPlates = plates.map((p) =>
          p.id === activeId ? { ...p, jobs: [...p.jobs, job] } : p,
        );
        return {
          ...mirrors(nextPlates, activeId),
          quantity: Math.max(1, s.quantity - fill.placed),
        };
      }),
    removeJob: (id) =>
      set((s) => {
        const plates = s.plates.map((p) =>
          p.id === s.activePlateId ? { ...p, jobs: p.jobs.filter((j) => j.id !== id) } : p,
        );
        return mirrors(plates, s.activePlateId);
      }),
    reset: () =>
      set(() => {
        const origin = firstPlate();
        return {
          ...mirrors([origin], origin.id),
          input: DEFAULT_INPUT,
          quantity: DEFAULT_QUANTITY,
          margin: DEFAULT_MARGIN,
          gap: DEFAULT_GAP,
        };
      }),
  };
});

export function useDerivedPiece(): { piece: Piece; valid: boolean } {
  const input = useNestStore((s) => s.input);
  return useMemo(() => buildPiece(input), [input]);
}

export function useNestResult(): NestResult & {
  piece: Piece;
  valid: boolean;
  lockedPlacements: NestedPiece[];
  lockedCount: number;
  totalPlaced: number;
  totalUtilization: number;
  plateCount: number;
  plateIndex: number;
  livePlaced: number;
  remainder: number;
  virtual: boolean;
  folios: { id: string; index: number; placed: number; locked: number; virtual: boolean; total: number }[];
} {
  const plates = useNestStore((s) => s.plates);
  const activePlateId = useNestStore((s) => s.activePlateId);
  const quantity = useNestStore((s) => s.quantity);
  const margin = useNestStore((s) => s.margin);
  const gap = useNestStore((s) => s.gap);
  const input = useNestStore((s) => s.input);
  const plan = useMemo(
    () => planFromInput(input, quantity, margin, gap, plates),
    [input, quantity, margin, gap, plates],
  );
  const plateIndex = Math.max(
    0,
    plan.plates.findIndex((p) => p.id === activePlateId),
  );
  const active = plan.plates[plateIndex] ?? plan.plates[0]!;
  const sheet = active.sheet;
  const jobs = active.jobs;
  const nest: NestResult = {
    placements: active.live,
    requested: quantity,
    placed: active.placed,
    utilization: 0,
    margin,
    gap,
  };
  const lockedPlacements = jobs.flatMap((j) => j.placements);
  const lockedArea = jobs.reduce((s, j) => s + (j.placements[0] ? areaOfJob(j) : 0), 0);
  const liveArea = nest.placed * plan.piece.area;
  const sheetArea = sheet.width * sheet.length;
  const totalPlaced = lockedPlacements.length + nest.placed;
  const totalUtilization = sheetArea > 0 ? (lockedArea + liveArea) / sheetArea : 0;
  nest.utilization = totalUtilization;

  return {
    ...nest,
    piece: plan.piece,
    valid: plan.valid,
    lockedPlacements,
    lockedCount: lockedPlacements.length,
    totalPlaced,
    totalUtilization,
    plateCount: plan.plates.length,
    plateIndex,
    livePlaced: plan.livePlaced,
    remainder: plan.remainder,
    virtual: active.virtual,
    folios: plan.plates.map((p, index) => ({
      id: p.id,
      index,
      placed: p.placed,
      locked: p.locked,
      virtual: p.virtual,
      total: p.placed + p.locked,
    })),
  };
}

function areaOfJob(job: NestJob): number {
  const built = buildPiece(job.input);
  return built.valid ? built.piece.area * job.placements.length : 0;
}

export function persistNestState(): () => void {
  if (typeof window === "undefined") return () => {};
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem("ninho-nest-v6") ??
      window.localStorage.getItem("ninho-nest-v5");
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<
        Pick<NestState, "sheet" | "input" | "quantity" | "margin" | "gap" | "jobs" | "plates" | "activePlateId">
      >;
      const migrated = migratePlates(parsed);
      const sheet = migrated.sheet;
      const gapRaw = typeof parsed.gap === "number" && Number.isFinite(parsed.gap) ? parsed.gap : sheet.thickness;
      useNestStore.setState({
        ...mirrors(migrated.plates, migrated.activePlateId),
        input: migrateInput(parsed.input),
        quantity:
          typeof parsed.quantity === "number" && Number.isFinite(parsed.quantity)
            ? parsed.quantity
            : DEFAULT_QUANTITY,
        margin: clampMargin(
          typeof parsed.margin === "number" && Number.isFinite(parsed.margin)
            ? parsed.margin
            : DEFAULT_MARGIN,
          sheet,
        ),
        gap: floorGap(gapRaw, sheet.thickness),
      });
    }
  } catch {
    // ignore corrupt storage
  }
  return useNestStore.subscribe((s) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sheet: s.sheet,
          plates: s.plates,
          activePlateId: s.activePlateId,
          input: s.input,
          quantity: s.quantity,
          margin: s.margin,
          gap: s.gap,
          jobs: s.jobs,
        }),
      );
    } catch {
      // quota
    }
  });
}

function migratePlates(parsed: {
  sheet?: Sheet;
  jobs?: NestJob[];
  plates?: Plate[];
  activePlateId?: string;
}): { plates: Plate[]; activePlateId: string; sheet: Sheet } {
  if (Array.isArray(parsed.plates) && parsed.plates.length > 0) {
    const plates = parsed.plates.map((p) => ({
      id: typeof p.id === "string" ? p.id : plateFallbackId(),
      sheet: { ...DEFAULT_SHEET, ...p.sheet },
      jobs: Array.isArray(p.jobs) ? p.jobs.filter(isJob) : [],
    }));
    const m = mirrors(plates, parsed.activePlateId ?? plates[0]!.id);
    return { plates: m.plates, activePlateId: m.activePlateId, sheet: m.sheet };
  }
  const sheet = { ...DEFAULT_SHEET, ...parsed.sheet };
  const jobs = Array.isArray(parsed.jobs) ? parsed.jobs.filter(isJob) : [];
  const plate = makePlate(sheet, jobs);
  return { plates: [plate], activePlateId: plate.id, sheet };
}

function plateFallbackId(): string {
  return `chapa-${Math.random().toString(36).slice(2, 8)}`;
}

function isJob(raw: unknown): raw is NestJob {
  if (!raw || typeof raw !== "object") return false;
  const j = raw as NestJob;
  return typeof j.id === "string" && Array.isArray(j.placements) && j.placements.length > 0;
}