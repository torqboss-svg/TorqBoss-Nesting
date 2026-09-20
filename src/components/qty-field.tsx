import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompactLabel } from "@/components/mm-field";
import { MAX_QUANTITY } from "@/lib/nest/tessellate";

type QtyFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
};

export function QtyField({
  id,
  label,
  value,
  onChange,
  min = 1,
  max = MAX_QUANTITY,
}: QtyFieldProps) {
  const [text, setText] = useState(() => String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  function commit(raw: string) {
    const n = Number.parseInt(String(raw).replace(",", "."), 10);
    if (!Number.isFinite(n)) {
      setText(String(value));
      return;
    }
    const next = Math.min(max, Math.max(min, n));
    onChange(next);
    setText(String(next));
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <CompactLabel htmlFor={id} text={label} />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Diminuir quantidade"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus />
        </Button>
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="text-center"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Aumentar quantidade"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
