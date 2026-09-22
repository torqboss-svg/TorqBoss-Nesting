import type { ReactNode } from "react";
import { Download, Lock, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { MmField } from "@/components/mm-field";
import { QtyField } from "@/components/qty-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { aabbHeight, aabbOf, aabbWidth, formatArea, formatMm } from "@/lib/nest/geometry";
import { sheetMassKg, thicknessFromMassKg, STAINLESS_LABEL, sheetFaceAreaMm2, massFromAreaKg, formatKg } from "@/lib/nest/sheet-mass";
import { MAX_POLY_VERTS, FLANGE_PRESETS, POLY_PRESETS, SHAPE_META, WING_PRESETS, buildPiece, pieceDimLabel, shapeMeta, vertexLabel } from "@/lib/nest/shapes";
import { MAX_JOBS, MAX_PLATES } from "@/lib/nest/store";
import { maxSheetMargin, patternPreview } from "@/lib/nest/tessellate";
import { useDerivedPiece, useNestResult, useNestStore } from "@/lib/nest/store";
import { buildNestExport, nestExportFilename, nestExportToCsv } from "@/lib/nest/export-nest";
import type { NestJob, PieceInput, TriangleMode } from "@/lib/nest/types";

const TRI_MODES: { id: TriangleMode; label: string; title: string }[] = [
  { id: "base-height", label: "Base×alt.", title: "Base × altura" },
  { id: "right", label: "Catetos", title: "Catetos" },
  { id: "vertices", label: "Vértices", title: "Vértices" },
];

function jobLotKg(job: NestJob, thickness: number): number {
  const built = buildPiece(job.input);
  if (!built.valid) return 0;
  return massFromAreaKg(built.piece.area * job.placements.length, thickness);
}

export function ControlPanel() {
  const sheet = useNestStore((s) => s.sheet);
  const input = useNestStore((s) => s.input);
  const quantity = useNestStore((s) => s.quantity);
  const margin = useNestStore((s) => s.margin);
  const gap = useNestStore((s) => s.gap);
  const setSheet = useNestStore((s) => s.setSheet);
  const setInput = useNestStore((s) => s.setInput);
  const setShape = useNestStore((s) => s.setShape);
  const setKind = useNestStore((s) => s.setKind);
  const setPolyPreset = useNestStore((s) => s.setPolyPreset);
  const setFlangePreset = useNestStore((s) => s.setFlangePreset);
  const setWingPreset = useNestStore((s) => s.setWingPreset);
  const setQuantity = useNestStore((s) => s.setQuantity);
  const setMargin = useNestStore((s) => s.setMargin);
  const setGap = useNestStore((s) => s.setGap);
  const reset = useNestStore((s) => s.reset);
  const jobs = useNestStore((s) => s.jobs);
  const lockCurrent = useNestStore((s) => s.lockCurrent);
  const removeJob = useNestStore((s) => s.removeJob);
  const selectPlateAt = useNestStore((s) => s.selectPlateAt);
  const addPlate = useNestStore((s) => s.addPlate);
  const removeActivePlate = useNestStore((s) => s.removeActivePlate);
  const { piece, valid } = useDerivedPiece();
  const nest = useNestResult();

  const localBox = aabbOf(piece.vertices);
  const pieceArea = piece.area;
  const sheetArea = sheetFaceAreaMm2(sheet);
  const used = nest.totalUtilization * sheetArea;
  const waste = Math.max(0, sheetArea - used);
  const unitKg = valid ? massFromAreaKg(pieceArea, sheet.thickness) : 0;
  const liveKg = massFromAreaKg(pieceArea * nest.placed, sheet.thickness);
  const plateKg = massFromAreaKg(used, sheet.thickness);
  const up = nest.placements.filter((p) => p.pointing === "up").length;
  const down = nest.placements.filter((p) => p.pointing === "down").length;
  const short = nest.remainder > 0;
  const marginCap = maxSheetMargin(sheet);
  const pack = nest.placements[0]?.pack ?? (piece.family === "hex" ? "hex" : piece.family === "grid" ? "grid" : "pair");
  const canLock = valid && nest.placed > 0 && jobs.length < MAX_JOBS;
  const canRemovePlate = nest.plateCount > 1 && jobs.length === 0 && !nest.virtual;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-5">
      <section className="flex flex-col gap-3">
        <SectionTitle
          n="01"
          title="Chapa"
          extra={<span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-faint">{STAINLESS_LABEL}</span>}
        />
        <div className="flex flex-wrap items-center gap-1">
          {nest.folios.map((f) => (
            <Button
              key={f.id}
              type="button"
              variant="chip"
              size="sm"
              data-active={f.index === nest.plateIndex}
              onClick={() => selectPlateAt(f.index)}
              className="h-8 min-w-0 px-2 text-[11px] tracking-normal whitespace-nowrap"
              title={f.virtual ? `Chapa ${f.index + 1} (remanescente)` : `Chapa ${f.index + 1}`}
            >
              <span className="font-mono">{f.index + 1}</span>
              <span className="text-faint">{f.total} pç</span>
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Nova chapa"
            disabled={nest.folios.length >= MAX_PLATES}
            onClick={addPlate}
          >
            <Plus />
          </Button>
          {canRemovePlate ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Remover chapa"
              onClick={removeActivePlate}
            >
              <X />
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-faint">
          Folha {nest.plateIndex + 1} de {nest.plateCount}
          {nest.virtual ? " · remanescente — as medidas desta chapa são independentes." : "."} O
          que não cabe segue na próxima.
        </p>
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            variant="chip"
            size="sm"
            data-active={(sheet.kind ?? "rect") === "rect"}
            onClick={() => setSheet({ kind: "rect" })}
            className="h-8 min-w-0 px-2 text-[11px] tracking-normal whitespace-nowrap"
          >
            Retângulo
          </Button>
          <Button
            type="button"
            variant="chip"
            size="sm"
            data-active={sheet.kind === "disc"}
            onClick={() => setSheet({ kind: "disc", width: Math.min(sheet.width, sheet.length) })}
            className="h-8 min-w-0 px-2 text-[11px] tracking-normal whitespace-nowrap"
          >
            Disco
          </Button>
        </div>
        {(sheet.kind ?? "rect") === "disc" ? (
          <div className="grid grid-cols-2 gap-2">
            <MmField
              id="sheet-d"
              label="Diâmetro"
              value={sheet.width}
              min={1}
              onChange={(width) => setSheet({ kind: "disc", width })}
              hint="Retalho circular."
            />
            <MmField
              id="sheet-t"
              label="Espessura · Z"
              value={sheet.thickness}
              min={0}
              onChange={(thickness) => setSheet({ thickness })}
              hint="Piso da folga entre peças."
            />
          </div>
        ) : (
        <div className="grid grid-cols-3 gap-2">
          <MmField
            id="sheet-w"
            label="Largura · X"
            value={sheet.width}
            min={1}
            onChange={(width) => setSheet({ width })}
          />
          <MmField
            id="sheet-l"
            label="Comprimento · Y"
            value={sheet.length}
            min={1}
            onChange={(length) => setSheet({ length })}
          />
          <MmField
            id="sheet-t"
            label="Espessura · Z"
            value={sheet.thickness}
            min={0}
            onChange={(thickness) => setSheet({ thickness })}
            hint="Piso da folga entre peças."
          />
        </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <MmField
              id="margin"
              label="Borda da chapa"
              value={margin}
              min={0}
              max={marginCap}
              onChange={setMargin}
            />
            <Slider
              value={margin}
              min={0}
              max={Math.max(1, marginCap)}
              step={1}
              onValueChange={setMargin}
              aria-label="Borda da chapa"
            />
          </div>
          <MmField
            id="gap"
            label="Folga entre peças"
            value={gap}
            min={sheet.thickness}
            onChange={setGap}
            hint="Mínimo = espessura (laser)."
          />
          <MmField
            id="sheet-mass"
            label="Peso"
            value={sheetMassKg(sheet)}
            min={0}
            unit="kg"
            onChange={(kg) =>
              setSheet({
                thickness: thicknessFromMassKg(
                  sheet.width,
                  sheet.length,
                  kg,
                  undefined,
                  sheet.kind ?? "rect",
                ),
              })
            }
            hint="Chapa inteira."
          />
        </div>
        <p className="text-xs text-faint">
          {(sheet.kind ?? "rect") === "disc"
            ? `Recuo radial 1:1 em mm. Máx. ${formatMm(marginCap)} mm.`
            : `Recuo 1:1 em mm nos quatro lados. Máx. ${formatMm(marginCap)} mm.`}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle n="02" title="Peça" />
        <div className="flex flex-wrap gap-1">
          {SHAPE_META.map((k) => (
            <Button
              key={k.id}
              type="button"
              variant="chip"
              size="sm"
              data-active={input.shape === k.id}
              onClick={() => setShape(k.id)}
              className="h-8 min-w-0 px-2 text-[11px] tracking-normal whitespace-nowrap"
              title={k.label}
            >
              <span className="font-mono text-xs">{k.mark}</span>
              {k.label}
            </Button>
          ))}
        </div>

        {input.shape === "triangle" ? (
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-raised p-1">
            {TRI_MODES.map((k) => (
              <Button
                key={k.id}
                type="button"
                variant="chip"
                size="sm"
                data-active={input.triangleMode === k.id}
                onClick={() => setKind(k.id)}
                className="h-9 min-w-0 px-1 text-[11px] tracking-normal whitespace-nowrap"
                title={k.title}
              >
                {k.label}
              </Button>
            ))}
          </div>
        ) : null}

        {input.shape === "poly" ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap gap-1 rounded-lg bg-raised p-1">
              {POLY_PRESETS.map((k) => (
                <Button
                  key={k.id}
                  type="button"
                  variant="chip"
                  size="sm"
                  data-active={(input.polyPreset ?? "livre") === k.id}
                  onClick={() => setPolyPreset(k.id)}
                  className="h-8 min-w-0 px-2 text-[11px] tracking-normal whitespace-nowrap"
                  title={k.hint}
                >
                  <span className="font-mono text-xs">{k.mark}</span>
                  {k.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-faint">
              {POLY_PRESETS.find((p) => p.id === (input.polyPreset ?? "livre"))?.hint} Vértices
              continuam editáveis.
            </p>
          </div>
        ) : null}

        {input.shape === "flange" ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap gap-1 rounded-lg bg-raised p-1">
              {FLANGE_PRESETS.map((k) => (
                <Button
                  key={k.id}
                  type="button"
                  variant="chip"
                  size="sm"
                  data-active={(input.flangePreset ?? "anel") === k.id}
                  onClick={() => setFlangePreset(k.id)}
                  className="h-8 min-w-0 px-2 text-[11px] tracking-normal whitespace-nowrap"
                  title={k.hint}
                >
                  <span className="font-mono text-xs">{k.mark}</span>
                  {k.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-faint">
              {FLANGE_PRESETS.find((p) => p.id === (input.flangePreset ?? "anel"))?.hint} Ø interno 0
              junta os raios num ponto; maior que 0 abre distanciamento.
            </p>
          </div>
        ) : null}

        {input.shape === "wing" ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap gap-1 rounded-lg bg-raised p-1">
              {WING_PRESETS.map((k) => (
                <Button
                  key={k.id}
                  type="button"
                  variant="chip"
                  size="sm"
                  data-active={(input.wingPreset ?? "delta") === k.id}
                  onClick={() => setWingPreset(k.id)}
                  className="h-8 min-w-0 px-2 text-[11px] tracking-normal whitespace-nowrap"
                  title={k.hint}
                >
                  <span className="font-mono text-xs">{k.mark}</span>
                  {k.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-faint">
              {WING_PRESETS.find((p) => p.id === (input.wingPreset ?? "delta"))?.hint} Envergadura,
              corda e barriga continuam editáveis.
            </p>
          </div>
        ) : null}

        <ShapeFields input={input} setInput={setInput} />

        {!valid ? (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
            Peça degenerada — área nula ou furo inválido. Ajuste as dimensões.
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle n="03" title="Quantidade" />
        <p className="text-xs text-faint">
          Este lote preenche a chapa 1. O que não cabe abre a próxima folha, com
          tamanho próprio.
        </p>
        <QtyField
          id="qty"
          label="Peças neste lote"
          value={quantity}
          onChange={setQuantity}
        />
        {valid && unitKg > 0 ? (
          <p className="font-mono text-[11px] tabular-nums text-faint">
            {formatKg(unitKg)} un.
            {nest.placed > 0 ? ` · ${formatKg(liveKg)} neste lote` : ""}
            {nest.lockedCount > 0 ? ` · ${formatKg(plateKg)} na chapa` : ""}
          </p>
        ) : null}
        <p className="font-mono text-xs tracking-widest text-fg">
          {patternPreview(nest.placements, 2) || "—"}
        </p>
        {short ? (
          <p className="rounded-md bg-warn/10 px-3 py-2 text-xs text-warn">
            {nest.livePlaced === 0
              ? jobs.length
                ? "Esta chapa está cheia de lotes travados — o restante foi para a próxima."
                : "A borda comeu a área útil — a peça não cabe no retângulo interno."
              : `Coube ${nest.livePlaced} de ${nest.requested} nas ${nest.plateCount} chapa${nest.plateCount > 1 ? "s" : ""}. Faltam ${nest.remainder}.`}
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle n="04" title="Lotes nesta chapa" />
        <Button type="button" disabled={!canLock} onClick={lockCurrent}>
          <Lock />
          Consolidar chapa
        </Button>
        <p className="text-xs text-faint">
          Trava as peças desta folha. O remanescente segue nas próximas; o
          formato da chapa consolidada deixa de se rearranjar.
        </p>
        {jobs.length === 0 ? (
          <p className="rounded-md bg-raised px-3 py-2 text-xs text-muted shadow-[var(--shadow-border)]">
            Nenhum lote travado. Encaixe, depois trave.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {jobs.map((job, i) => {
              const meta = shapeMeta(job.shape);
              const dim = pieceDimLabel(job.input);
              return (
                <li
                  key={job.id}
                  className="flex items-center gap-2 rounded-md bg-raised px-2 py-1.5 shadow-[var(--shadow-border)]"
                >
                  <span className="w-4 shrink-0 font-mono text-[11px] text-faint">{i + 1}</span>
                  <span className="font-mono text-xs text-muted">{meta.mark}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-fg">{job.name}</span>
                    <span className="block truncate font-mono text-[10px] tabular-nums text-faint">
                      {dim} · {job.placements.length} pç
                      {jobLotKg(job, sheet.thickness) > 0
                        ? ` · ${formatKg(jobLotKg(job, sheet.thickness))}`
                        : ""}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Remover lote ${job.name}`}
                    onClick={() => removeJob(job.id)}
                  >
                    <X />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        {jobs.length >= MAX_JOBS ? (
          <p className="text-xs text-warn">Limite de {MAX_JOBS} lotes nesta chapa.</p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle n="05" title="Encaixe" />
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={valid ? "ok" : "danger"}>{valid ? "Válido" : "Degenerado"}</Badge>
          <Badge tone={short ? "warn" : "ok"}>
            ordem {nest.livePlaced} / {nest.requested}
          </Badge>
          <Badge>
            chapa {nest.plateIndex + 1}/{nest.plateCount}
          </Badge>
          {nest.lockedCount > 0 ? (
            <Badge>
              travadas {nest.lockedCount} · total {nest.totalPlaced}
            </Badge>
          ) : null}
          {pack === "pair" ? (
            <Badge>
              △ {up} · ▽ {down}
            </Badge>
          ) : (
            <Badge>{pack === "hex" ? "Hexagonal" : "Grade"}</Badge>
          )}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[11px] tabular-nums">
          <Row k="Área da peça" v={formatArea(pieceArea)} />
          <Row k="Peso un." v={formatKg(unitKg)} />
          <Row
            k="AABB local"
            v={`${formatMm(aabbWidth(localBox))} × ${formatMm(aabbHeight(localBox))}`}
          />
          <Row k="Borda" v={`${formatMm(margin)} mm`} />
          <Row k="Folga laser" v={`${formatMm(gap)} mm`} />
          <Row k="Aproveitamento" v={`${formatMm(nest.totalUtilization * 100, 1)} %`} />
          <Row k="Área usada" v={formatArea(used)} />
          <Row k="Peso na chapa" v={formatKg(plateKg)} />
          <Row k="Sobra da chapa" v={formatArea(waste)} />
        </dl>
        <div className="rounded-lg bg-raised p-3 font-mono text-[11px] leading-relaxed text-muted shadow-[var(--shadow-border)]">
          <PackHint pack={pack} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={nest.livePlaced + nest.lockedCount === 0}
            onClick={() =>
              downloadCutList("json", {
                sheet,
                margin,
                gap,
                live: nest.placements,
                jobs,
              })
            }
          >
            <Download />
            JSON
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={nest.livePlaced + nest.lockedCount === 0}
            onClick={() =>
              downloadCutList("csv", {
                sheet,
                margin,
                gap,
                live: nest.placements,
                jobs,
              })
            }
          >
            <Download />
            CSV
          </Button>
        </div>
      </section>

      <Button type="button" variant="secondary" onClick={reset} className="self-start">
        <RotateCcw />
        Restaurar padrão
      </Button>
    </div>
  );
}

function ShapeFields({
  input,
  setInput,
}: {
  input: PieceInput;
  setInput: (patch: Partial<PieceInput>) => void;
}) {
  switch (input.shape) {
    case "triangle":
      if (input.triangleMode === "base-height") {
        return (
          <div className="grid grid-cols-2 gap-2">
            <MmField id="base" label="Base" value={input.base} min={1} onChange={(base) => setInput({ base })} />
            <MmField id="height" label="Altura" value={input.height} min={1} onChange={(height) => setInput({ height })} />
          </div>
        );
      }
      if (input.triangleMode === "right") {
        return (
          <div className="grid grid-cols-2 gap-2">
            <MmField id="lega" label="Cateto A · X" value={input.legA} min={1} onChange={(legA) => setInput({ legA })} />
            <MmField id="legb" label="Cateto B · Y" value={input.legB} min={1} onChange={(legB) => setInput({ legB })} />
          </div>
        );
      }
      return (
        <VertexEditor
          vertices={input.vertices.slice(0, 3)}
          minCount={3}
          maxCount={3}
          onChange={(vertices) => {
            const next = [...input.vertices];
            next[0] = vertices[0]!;
            next[1] = vertices[1]!;
            next[2] = vertices[2]!;
            setInput({ vertices: next });
          }}
        />
      );
    case "square":
      return (
        <MmField id="side" label="Lado" value={input.side} min={1} onChange={(side) => setInput({ side })} />
      );
    case "rect":
      return (
        <div className="grid grid-cols-2 gap-2">
          <MmField id="rw" label="Largura" value={input.width} min={1} onChange={(width) => setInput({ width })} />
          <MmField id="rh" label="Altura" value={input.height} min={1} onChange={(height) => setInput({ height })} />
        </div>
      );
    case "disc":
      return (
        <MmField
          id="dia"
          label="Diâmetro"
          value={input.outerDia}
          min={1}
          onChange={(outerDia) => setInput({ outerDia })}
        />
      );
    case "wing":
      return (
        <div className="grid grid-cols-3 gap-2">
          <MmField
            id="wing-w"
            label="Envergadura · X"
            value={input.width}
            min={1}
            onChange={(width) => setInput({ width })}
          />
          <MmField
            id="wing-h"
            label="Corda · Y"
            value={input.height}
            min={1}
            onChange={(height) => setInput({ height })}
          />
          <MmField
            id="wing-c"
            label="Barriga"
            value={input.thick}
            min={0}
            onChange={(thick) => setInput({ thick })}
            hint="Curvatura dos Bézier."
          />
        </div>
      );
    case "flange":
      return (
        <div className="grid grid-cols-3 gap-2">
          <MmField
            id="od"
            label="Ø externo"
            value={input.outerDia}
            min={1}
            onChange={(outerDia) => setInput({ outerDia })}
          />
          <MmField
            id="id"
            label="Ø interno"
            value={input.innerDia}
            min={0}
            max={Math.max(0, input.outerDia - 1)}
            onChange={(innerDia) => setInput({ innerDia })}
            hint="0 = raios juntos no centro."
          />
          <MmField
            id="sweep"
            label="Arco"
            value={input.sweepDeg ?? 360}
            min={8}
            max={360}
            unit="°"
            onChange={(sweepDeg) => setInput({ sweepDeg })}
            hint="360° = anel. 180° = meia. 90° = quarto."
          />
        </div>
      );
    case "l":
    case "u":
    case "v":
      return (
        <div className="grid grid-cols-3 gap-2">
          <MmField id="pw" label="Largura" value={input.width} min={1} onChange={(width) => setInput({ width })} />
          <MmField id="ph" label="Altura" value={input.height} min={1} onChange={(height) => setInput({ height })} />
          <MmField
            id="pt"
            label="Espessura"
            value={input.thick}
            min={1}
            onChange={(thick) => setInput({ thick })}
            hint="Parede do perfil."
          />
        </div>
      );
    case "hex":
      return (
        <MmField
          id="hex"
          label="Lado"
          value={input.hexSide}
          min={1}
          onChange={(hexSide) => setInput({ hexSide })}
        />
      );
    case "trap":
      return (
        <div className="grid grid-cols-3 gap-2">
          <MmField id="bbot" label="Base maior" value={input.baseBot} min={1} onChange={(baseBot) => setInput({ baseBot })} />
          <MmField id="btop" label="Base menor" value={input.baseTop} min={1} onChange={(baseTop) => setInput({ baseTop })} />
          <MmField id="th" label="Altura" value={input.height} min={1} onChange={(height) => setInput({ height })} />
        </div>
      );
    case "poly":
      return (
        <VertexEditor
          vertices={input.vertices}
          minCount={3}
          maxCount={MAX_POLY_VERTS}
          onChange={(vertices) => setInput({ vertices })}
        />
      );
  }
}

function VertexEditor({
  vertices,
  minCount,
  maxCount,
  onChange,
}: {
  vertices: PieceInput["vertices"];
  minCount: number;
  maxCount: number;
  onChange: (vertices: PieceInput["vertices"]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {vertices.map((v, i) => (
        <div key={i} className="grid grid-cols-[1.5rem_1fr_1fr_auto] items-end gap-2">
          <span className="pb-2 font-mono text-sm text-muted">{vertexLabel(i)}</span>
          <MmField
            id={`vx-${i}`}
            label="x"
            value={v.x}
            onChange={(x) => {
              const next = vertices.map((p, k) => (k === i ? { ...p, x } : p));
              onChange(next);
            }}
          />
          <MmField
            id={`vy-${i}`}
            label="y"
            value={v.y}
            onChange={(y) => {
              const next = vertices.map((p, k) => (k === i ? { ...p, y } : p));
              onChange(next);
            }}
          />
          {maxCount > minCount ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mb-0.5 size-10"
              disabled={vertices.length <= minCount}
              aria-label={`Remover ${vertexLabel(i)}`}
              onClick={() => onChange(vertices.filter((_, k) => k !== i))}
            >
              <Trash2 />
            </Button>
          ) : (
            <span />
          )}
        </div>
      ))}
      {maxCount > minCount && vertices.length < maxCount ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => {
            const last = vertices[vertices.length - 1] ?? { x: 0, y: 0 };
            onChange([...vertices, { x: last.x + 40, y: last.y + 30 }]);
          }}
        >
          <Plus />
          Vértice
        </Button>
      ) : null}
      <p className="text-xs text-faint">Coordenadas locais, mm. Mínimo {minCount} pontos.</p>
    </div>
  );
}

function PackHint({ pack }: { pack: "pair" | "grid" | "hex" }) {
  if (pack === "hex") {
    return (
      <>
        <p className="text-fg">Lattice hexagonal — centros a 60°</p>
        <p className="mt-1">Disco e hexágono encostam pela folga laser</p>
        <p>Flange usa o Ø externo; o furo é só corte</p>
      </>
    );
  }
  if (pack === "grid") {
    return (
      <>
        <p className="text-fg">Grade eixo-alinhada · 0° / 90°</p>
        <p className="mt-1">Quadrado, retângulo e perfis em AABB + folga</p>
        <p>O retângulo escolhe a rotação que mais cabe</p>
      </>
    );
  }
  return (
    <>
      <p className="text-fg">Fileira par ▽△▽△ · ímpar △▽△▽</p>
      <p className="mt-1">Par = peça + 180° no ponto médio da aresta</p>
      <p>Folga = offset no lattice; o padrão não muda</p>
    </>
  );
}

function SectionTitle({
  n,
  title,
  extra,
}: {
  n: string;
  title: string;
  extra?: ReactNode;
}) {
  return (
    <h2 className="flex items-baseline gap-2 text-sm font-medium text-fg">
      <span className="font-mono text-[11px] text-faint">{n}</span>
      <span className="min-w-0 truncate">{title}</span>
      {extra ? <span className="ml-auto shrink-0">{extra}</span> : null}
    </h2>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-faint">{k}</dt>
      <dd className="text-fg">{v}</dd>
    </>
  );
}

function downloadCutList(
  kind: "json" | "csv",
  args: Parameters<typeof buildNestExport>[0],
) {
  const doc = buildNestExport(args);
  const body = kind === "json" ? JSON.stringify(doc, null, 2) : nestExportToCsv(doc);
  const blob = new Blob([body], { type: kind === "json" ? "application/json" : "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nestExportFilename(kind);
  a.click();
  URL.revokeObjectURL(url);
}
