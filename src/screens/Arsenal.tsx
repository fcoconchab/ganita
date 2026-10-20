import { useState } from "react";
import { FACT_BY_ID, TIERS, fmt, strategyFor, type TierId } from "../core/facts";
import { RANK_LABEL, median, rankOf } from "../core/mastery";
import { tierProgress, unlockedTiers } from "../core/session";
import type { Progress } from "../core/storage";
import { FactGrid } from "../ui/FactGrid";
import { IconLock } from "../ui/icons";

interface Props {
  progress: Progress;
  now: number;
  onPracticeTier: (tier: TierId) => void;
  onDiagnostic: (tier: TierId) => void;
}

const when = (due: number, now: number) => {
  const d = Math.round((due - now) / 86_400_000);
  if (d <= 0) return "hoy";
  if (d === 1) return "mañana";
  return `en ${d} días`;
};

export function Arsenal({ progress, now, onPracticeTier, onDiagnostic }: Props) {
  const unlocked = unlockedTiers(progress.items);
  const [tier, setTier] = useState<TierId>(unlocked[unlocked.length - 1]);
  const [pick, setPick] = useState<string | null>(null);
  const t = TIERS.find((x) => x.id === tier)!;
  const open = unlocked.includes(tier);
  const tp = tierProgress(progress.items, tier);
  const prev = TIERS[TIERS.findIndex((x) => x.id === tier) - 1];

  const f = pick ? FACT_BY_ID[pick] : null;
  const st = pick ? progress.items[pick] : undefined;
  const strat = f ? strategyFor(f.a, f.b) : null;
  const okMs = st?.history.filter((h) => h.ok).slice(-3).map((h) => h.ms) ?? [];

  return (
    <div className="screen">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="eyebrow">Hechos que se recuerdan, no se calculan</span>
        <h1 className="title-xl">Arsenal</h1>
      </div>

      <div className="seg" role="tablist">
        {TIERS.map((x) => (
          <button key={x.id} aria-pressed={x.id === tier} onClick={() => setTier(x.id)}>
            {x.id} {!unlocked.includes(x.id) && <IconLock />}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="row between">
          <h3 style={{ fontSize: 20 }}>{t.name}</h3>
          <span className="small muted">{tp.good}/{tp.total} consolidados</span>
        </div>
        <p className="small muted">{t.description} Meta: bajo {String(t.targetMs / 1000).replace(".", ",")} s. Un hecho se consolida con 3 aciertos seguidos bajo 3 s.</p>
        <div className="meter two"><i style={{ width: `${tp.share * 100}%` }} /><i className="prov" style={{ width: `${tp.provShare * 100}%` }} /></div>
        {tp.provisional > 0 && (
          <p className="small muted">{tp.provisional} {tp.provisional === 1 ? "va" : "van"} en camino: se ven fluidos, pero falta repetirlos para confirmarlos.</p>
        )}
        <FactGrid tier={tier} items={progress.items} now={now} onPick={setPick} />
        <div className="legend">
          {(["nuevo", "aprendiz", "fluido", "automatico", "maquina"] as const).map((r) => (
            <span key={r}><i style={{ background: `var(--r-${r})` }} />{RANK_LABEL[r]}</span>
          ))}
          <span><i className="prov-swatch" />En camino</span>
          <span><i style={{ background: "var(--r-fluido)", opacity: 0.38 }} />Se está olvidando</span>
        </div>
        {open ? (
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" style={{ flex: 1 }} onClick={() => onPracticeTier(tier)}>Practicar {tier}</button>
            <button className="btn line" onClick={() => onDiagnostic(tier)}>Diagnóstico</button>
          </div>
        ) : (
          <p className="small muted">Se abre con el 80% de {prev?.id} consolidado.</p>
        )}
      </div>

      {f && (
        <>
          <div className="sheet-bg" onClick={() => setPick(null)} />
          <div className="sheet" role="dialog" aria-label={`${f.a} por ${f.b}`}>
            <span className="grab" />
            <div className="row between">
              <div className="num" style={{ fontSize: 44, fontWeight: 500 }}>{f.a} × {f.b} = {fmt(f.answer)}</div>
              <span className="pill">{RANK_LABEL[rankOf(st)]}</span>
            </div>
            <div className="stats3">
              <div className="stat"><b>{okMs.length ? (median(okMs) / 1000).toFixed(1).replace(".", ",") : "–"}</b><span>s, mediana</span></div>
              <div className="stat"><b>{st?.lapses ?? 0}</b><span>errores</span></div>
              <div className="stat"><b style={{ fontSize: 20 }}>{st?.history.length ? when(st.due, now) : "–"}</b><span>próximo repaso</span></div>
            </div>
            {strat && (
              <div className="reveal" style={{ maxWidth: "none" }}>
                <span className="eyebrow">Si no sale de memoria · {strat.name}</span>
                <div className="steps">{strat.steps.map((s, k) => <div key={k}>{s}</div>)}</div>
              </div>
            )}
            <button className="btn block ghost" onClick={() => setPick(null)}>Cerrar</button>
          </div>
        </>
      )}
    </div>
  );
}
