import { useMemo, useState } from "react";
import { backupFileName } from "../core/backup";
import { TIERS, fmt, type TierId } from "../core/facts";
import {
  BUCKETS, BUCKET_LABELS, FAST_MS, FLUENT_MS, READY_ANSWERS, READY_SPAN_DAYS, logToCSV, timingReport, type TimeStats,
} from "../core/timing";
import type { Progress } from "../core/storage";
import { IconBack, IconUp } from "../ui/icons";
import { shareFile } from "../ui/share";

interface Props {
  progress: Progress;
  now: number;
  onBack: () => void;
}

const sec = (ms: number) => (Number.isFinite(ms) ? (ms / 1000).toFixed(1).replace(".", ",") : "–");
const pct = (x: number) => (Number.isFinite(x) ? `${Math.round(x * 100)}%` : "–");

/** Color de cada tramo según el rango que daría ese tiempo. */
const zone = (lo: number) => (lo < FAST_MS ? "var(--r-automatico)" : lo < FLUENT_MS ? "var(--r-fluido)" : "var(--r-aprendiz)");

function Histogram({ s }: { s: TimeStats }) {
  const max = Math.max(1, ...s.histogram);
  return (
    <div className="hist" role="img" aria-label={`Aciertos por tiempo: ${BUCKET_LABELS.map((l, i) => `${l} s, ${s.histogram[i]}`).join("; ")}`}>
      <div className="hist-bars">
        {s.histogram.map((n, i) => (
          <div key={i} className="hist-col">
            <span className="hist-n">{n || ""}</span>
            <i style={{ height: `${(n / max) * 100}%`, background: zone(BUCKETS[i]) }} />
          </div>
        ))}
      </div>
      <div className="hist-axis">
        {BUCKET_LABELS.map((l) => <span key={l}>{l}</span>)}
      </div>
      <div className="hist-legend small">
        <span><i style={{ background: "var(--r-automatico)" }} />bajo 1,5 s</span>
        <span><i style={{ background: "var(--r-fluido)" }} />1,5 a 3 s</span>
        <span><i style={{ background: "var(--r-aprendiz)" }} />sobre 3 s</span>
      </div>
    </div>
  );
}

export function Times({ progress, now, onBack }: Props) {
  const r = useMemo(() => timingReport(progress.log, now), [progress.log, now]);
  const [tier, setTier] = useState<TierId | "todo">("todo");
  const s = tier === "todo" ? r.all : r.byTier[tier];
  const [msg, setMsg] = useState<string | null>(null);

  const exportCSV = async () => {
    const out = await shareFile(backupFileName(Date.now(), "csv", "tiempos"), logToCSV(progress.log), "text/csv");
    if (out === "failed") setMsg("No se pudo crear la planilla.");
  };

  const answersShare = Math.min(1, r.all.n / READY_ANSWERS);
  const daysShare = Math.min(1, r.spanDays / READY_SPAN_DAYS);

  return (
    <div className="drill">
      <div className="subhead">
        <button className="close" onClick={onBack} aria-label="Volver"><IconBack /></button>
        <h1 className="title-m">Tus tiempos</h1>
      </div>

      <div className="screen">
        <section className={`card${r.ready ? " hero" : ""}`}>
          <span className={`pill ${r.ready ? "good" : "accent"}`}>{r.ready ? "Listo para calibrar" : "Juntando datos"}</span>
          <p className="muted">
            {r.ready
              ? "Ya hay datos suficientes para revisar si 1,5 s y 3 s son los umbrales correctos para ti. Exporta la planilla y la revisamos."
              : `Los umbrales se revisan con ${READY_SPAN_DAYS} días y ${READY_ANSWERS} respuestas. Solo sigue practicando: la app mide sola.`}
          </p>
          <div className="ready-row"><span className="small">Días</span><div className="meter"><i style={{ width: `${daysShare * 100}%` }} /></div><span className="small num">{Math.min(r.spanDays, 99)}/{READY_SPAN_DAYS}</span></div>
          <div className="ready-row"><span className="small">Respuestas</span><div className="meter"><i style={{ width: `${answersShare * 100}%` }} /></div><span className="small num">{fmt(r.all.n)}/{READY_ANSWERS}</span></div>
        </section>

        {r.all.n === 0 ? (
          <p className="muted">Todavía no hay respuestas registradas. Haz una sesión y vuelve.</p>
        ) : (
          <>
            <div className="seg" role="tablist">
              {(["todo", ...TIERS.map((t) => t.id)] as const).map((t) => (
                <button key={t} aria-pressed={tier === t} onClick={() => setTier(t)} disabled={t !== "todo" && r.byTier[t].n === 0}>
                  {t === "todo" ? "Todo" : t}
                </button>
              ))}
            </div>

            <section className="card">
              <div className="stats3">
                <div className="stat"><b>{sec(s.p50)}</b><span>s, mediana</span></div>
                <div className="stat"><b>{pct(s.underFast)}</b><span>bajo 1,5 s</span></div>
                <div className="stat"><b>{pct(s.underFluent)}</b><span>bajo 3 s</span></div>
              </div>
              <Histogram s={s} />
              <p className="small muted">
                {s.correct} aciertos de {s.n} ({pct(s.accuracy)}). La mitad de tus aciertos va entre {sec(s.p25)} y {sec(s.p75)} s; el 90% bajo {sec(s.p90)} s.
              </p>
            </section>

            {r.byDigits.length > 1 && (
              <section className="card">
                <span className="eyebrow">Cuánto pesa teclear</span>
                <div className="list">
                  {r.byDigits.map(({ digits, stats }) => (
                    <div key={digits}>
                      <span>Respuestas de {digits} {digits === 1 ? "cifra" : "cifras"}</span>
                      <span className="small muted">{stats.n} resp. · <b className="num" style={{ fontSize: 18, color: "var(--ink)" }}>{sec(stats.p50)} s</b></span>
                    </div>
                  ))}
                </div>
                <p className="small muted">Si las respuestas largas tardan bastante más, parte del tiempo es escribir, no recordar. Eso puede justificar umbrales distintos por largo.</p>
              </section>
            )}
          </>
        )}

        <button className="btn line block" onClick={exportCSV} disabled={progress.log.length === 0}><IconUp />Exportar planilla (CSV)</button>
        {msg && <p className="notice bad">{msg}</p>}
        <p className="small muted">Cuentan solo los primeros intentos de hechos del Arsenal: no los reintentos después de un error ni los "No sé". La planilla trae todo, separado por punto y coma.</p>
      </div>
    </div>
  );
}
