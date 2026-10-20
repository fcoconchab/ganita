import { FACT_BY_ID, fmt, strategyFor } from "../core/facts";
import { median } from "../core/mastery";
import type { DrillResult } from "../ui/Drill";

interface Props {
  title: string;
  results: DrillResult[];
  fastMs: number;
  note?: string;
  onDone: () => void;
}

const sec = (ms: number) => (Number.isFinite(ms) ? (ms / 1000).toFixed(1).replace(".", ",") : "–");

export function Summary({ title, results, fastMs, note, onDone }: Props) {
  // primer intento por pregunta (los reintentos no cuentan para el puntaje)
  const first = new Map<string, DrillResult>();
  results.forEach((r) => {
    const k = r.key.startsWith("f:") ? r.key : `${r.key}|${r.a}|${r.b}`;
    if (!first.has(k)) first.set(k, r);
  });
  const rs = [...first.values()];
  const ok = rs.filter((r) => r.ok);
  const acc = rs.length ? Math.round((ok.length / rs.length) * 100) : 0;
  const med = median(ok.map((r) => r.ms));
  const fast = ok.filter((r) => r.ms <= fastMs).length;
  const worst = [...rs]
    .filter((r) => r.key.startsWith("f:"))
    .sort((a, b) => (a.ok === b.ok ? b.ms - a.ms : a.ok ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="drill">
      <div className="lesson-body">
        <span className="eyebrow">{title}</span>
        <div className="row" style={{ alignItems: "baseline", gap: 10 }}>
          <span className="result-big num">{acc}%</span>
          <span className="muted">de acierto</span>
        </div>
        <div className="stats3">
          <div className="stat"><b>{rs.length}</b><span>preguntas</span></div>
          <div className="stat"><b>{sec(med)}</b><span>s, mediana</span></div>
          <div className="stat"><b>{fast}</b><span>bajo {sec(fastMs)} s</span></div>
        </div>
        {note && <p className="muted">{note}</p>}
        {worst.length > 0 && (
          <div className="card" style={{ gap: 4 }}>
            <span className="eyebrow">Para repasar</span>
            <div className="list">
              {worst.map((r) => {
                const f = FACT_BY_ID[r.key];
                const s = strategyFor(f.a, f.b);
                return (
                  <div key={r.key}>
                    <span style={{ display: "flex", flexDirection: "column" }}>
                      <span className="num" style={{ fontSize: 22 }}>{f.a} × {f.b} = {fmt(f.answer)}</span>
                      <span className="small muted">{s.name}: {s.steps[0]}</span>
                    </span>
                    <span className={`pill ${r.ok ? "" : "accent"}`}>{r.ok ? `${sec(r.ms)} s` : "error"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="lesson-foot">
        <button className="btn block" onClick={onDone}>Listo</button>
      </div>
    </div>
  );
}
