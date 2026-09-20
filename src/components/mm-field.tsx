import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMm } from "@/lib/nest/geometry";

const SHORT: Record<string, string> = {
  Largura: "Larg.",
  Comprimento: "Comp.",
  Espessura: "Esp.",
  "Borda da chapa": "Borda",
  "Folga entre peças": "Folga",
  Peso: "Peso",
  "Peças neste lote": "Peças",
  "Cateto A": "Cat. A",
  "Cateto B": "Cat. B",
  Diâmetro: "Ø",
  "Ø externo": "Ø ext.",
  "Ø interno": "Ø int.",
  "Base maior": "Base +",
  "Base menor": "Base −",
  Envergadura: "Enverg.",
  Corda: "Corda",
  Barriga: "Barriga",
};

export function CompactLabel({ htmlFor, text }: { htmlFor: string; text: string }) {
  const [word, axis] = splitAxis(text);
  const short = SHORT[word] ?? word;
  return (
    <Label htmlFor={htmlFor} title={text} className="flex h-4 min-w-0 items-center gap-1">
      <span className="min-w-0 truncate">{short}</span>
      {axis ? (
        <span className="shrink-0 font-mono text-[10px] font-medium normal-case tracking-normal text-faint">
          {axis}
        </span>
      ) : null}
    </Label>
  );
}

function splitAxis(text: string): [string, string | null] {
  const i = text.indexOf("·");
  if (i < 0) return [text.trim(), null];
  return [text.slice(0, i).trim(), text.slice(i + 1).trim() || null];
}

type MmFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  hint?: string;
};

export function MmField({ id, label, value, onChange, min, max, unit = "mm", hint }: MmFieldProps) {
  const [text, setText] = useState(() => formatMm(value));

  useEffect(() => {
    setText(formatMm(value));
  }, [value]);

  function commit(raw: string) {
    const n = Number(String(raw).replace(",", "."));
    if (!Number.isFinite(n)) {
      setText(formatMm(value));
      return;
    }
    let next = n;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChange(next);
    setText(formatMm(next));
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <CompactLabel htmlFor={id} text={label} />
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="pr-10"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[11px] text-faint">
          {unit}
        </span>
      </div>
      {hint ? <p className="text-xs text-faint">{hint}</p> : null}
    </div>
  );
}