import { FACT_BY_ID, fmt, strategyFor } from "../core/facts";
import { RANK_LABEL, RANK_ORDER, median, rankOf, type Rank } from "../core/mastery";
import type { Items } from "../core/session";
import { Beads, markOf, type DrillResult } from "../ui/Drill";
import { useCountUp } from "../ui/useCountUp";

interface Props {
  title: string;
  results: DrillResult[];
  fastMs: number;
  note?: string;
  /** estado de los hechos antes y después de la sesión, para mostrar lo que subió de rango */
  before?: Items;
  after?: Items;
  onDone: () => void;
}

const sec = (ms: number) => (Number.isFinite(ms) ? (ms / 1000).toFixed(1).replace(".", ",") : "–");

export function Summary({ title, results, fastMs, note, before, after, onDone }: Props) {
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
  const shownAcc = useCountUp(acc);
  const worst = [...rs]
    .filter((r) => r.key.startsWith("f:"))
    .sort((a, b) => (a.ok === b.ok ? b.ms - a.ms : a.ok ? 1 : -1))
    .filter((r) => !r.ok || r.ms > fastMs)
    .slice(0, 5);
  const best = [...ok].filter((r) => r.key.startsWith("f:")).sort((a, b) => a.ms - b.ms)[0];

  // hechos que subieron de rango en esta sesión
  const ups: { key: string; from: Rank; to: Rank }[] = [];
  if (before && after) {
    for (const key of new Set(rs.map((r) => r.key).filter((k) => FACT_BY_ID[k]))) {
      const from = rankOf(before[key]), to = rankOf(after[key]);
      if (RANK_ORDER.indexOf(to) > RANK_ORDER.indexOf(from)) ups.push({ key, from, to });
    }
    ups.sort((x, y) => RANK_ORDER.indexOf(y.to) - RANK_ORDER.indexOf(x.to));
  }

  return (
    <div className="drill">
      <div className="lesson-body summary">
        <span className="eyebrow">{title}</span>
        <div className="row" style={{ alignItems: "baseline", gap: 10 }}>
          <span className="result-big num">{shownAcc}%</span>
          <span className="muted">de acierto</span>
        </div>
        <div className="beads-big">
          <Beads marks={results.map((r) => markOf(r, fastMs))} />
        </div>
        <div className="stats3">
          <div className="stat"><b>{rs.length}</b><span>preguntas</span></div>
          <div className="stat"><b>{sec(med)}</b><span>s, mediana</span></div>
          <div className="stat"><b className="fast-ink">{fast}</b><span>bajo {sec(fastMs)} s</span></div>
        </div>

        {ups.length > 0 && (
          <div className="card ups">
            <div className="row between">
              <span className="eyebrow">Subieron de rango</span>
              <span className="pill good">+{ups.length}</span>
            </div>
            <div className="ups-grid">
              {ups.slice(0, 12).map((u, k) => {
                const f = FACT_BY_ID[u.key];
                return (
                  <div key={u.key} className="up" style={{ animationDelay: `${400 + k * 90}ms` }}>
                    <span className={`cell r-${u.to} grow`} style={{ ["--from" as string]: `var(--r-${u.from})`, animationDelay: `${600 + k * 90}ms` }}>{f.answer}</span>
                    <span className="small"><b>{f.a} × {f.b}</b><br /><span className="muted">{RANK_LABEL[u.to]}</span></span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {best && (
          <div className="best">
            <span className="small muted">La más rápida</span>
            <span className="num">{best.a} × {best.b} = {fmt(best.answer)}</span>
            <span className="time-chip fast">{sec(best.ms)} s</span>
          </div>
        )}

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
                    <span className={`pill ${r.ok ? "" : "bad"}`}>{r.ok ? `${sec(r.ms)} s` : "error"}</span>
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
