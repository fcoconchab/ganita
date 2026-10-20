import type { ReactElement } from "react";
import { FACT_BY_ID, type TierId } from "../core/facts";
import { isFading, rankOf } from "../core/mastery";
import type { Items } from "../core/session";

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
const idOf = (a: number, b: number) => (a <= b ? `f:${a}x${b}` : `f:${b}x${a}`);

interface Props {
  tier: TierId;
  items: Items;
  now: number;
  onPick?: (factId: string) => void;
}

/** Grilla de hechos coloreada por rango. Lo que se está olvidando se ve apagado. */
export function FactGrid({ tier, items, now, onPick }: Props) {
  const cell = (id: string, key: string) => {
    const f = FACT_BY_ID[id];
    const st = items[id];
    const r = rankOf(st);
    return (
      <button
        key={key}
        className={`cell r-${r}${isFading(st, now) ? " fade" : ""}`}
        onClick={() => onPick?.(id)}
        aria-label={`${f.a} por ${f.b}: ${r}`}
      >
        {f.answer}
      </button>
    );
  };

  if (tier === "A4") {
    return (
      <div className="fgrid" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
        {range(20, 30).map((n) => (
          <div key={n} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="hd">{n}²</span>
            {cell(idOf(n, n), String(n))}
          </div>
        ))}
      </div>
    );
  }

  const [rows, cols] =
    tier === "A1" ? [range(2, 9), range(2, 9)] :
    tier === "A2" ? [range(11, 19), range(2, 9)] :
    [range(11, 19), range(11, 19)];

  return (
    <div className="grid-wrap">
      <div className="fgrid" style={{ gridTemplateColumns: `22px repeat(${cols.length}, minmax(0, 1fr))`, minWidth: cols.length > 8 ? 330 : undefined }}>
        <span className="hd">×</span>
        {cols.map((c) => <span key={c} className="hd">{c}</span>)}
        {rows.map((r) => (
          <Row key={r} r={r} cols={cols} render={(c) => cell(idOf(r, c), `${r}-${c}`)} />
        ))}
      </div>
    </div>
  );
}

function Row({ r, cols, render }: { r: number; cols: number[]; render: (c: number) => ReactElement }) {
  return (
    <>
      <span className="hd">{r}</span>
      {cols.map((c) => render(c))}
    </>
  );
}
