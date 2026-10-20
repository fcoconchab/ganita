import { FACTS, FACT_BY_ID, TIERS } from "../core/facts";
import { atLeast, rankOf } from "../core/mastery";
import { tierProgress, unlockedTiers } from "../core/session";
import { isDue } from "../core/srs";
import { dayKey, streak, type Progress } from "../core/storage";
import { LESSONS } from "../content/lessons";
import { Beads, markOf, type Mark } from "../ui/Drill";
import { MiniMap } from "../ui/FactGrid";
import { IconChevron, IconSettings } from "../ui/icons";

interface Props {
  progress: Progress;
  now: number;
  onDiagnostic: () => void;
  onSession: () => void;
  onLesson: (id: string) => void;
  onSettings: () => void;
  onArsenal: () => void;
}

const BACKUP_NUDGE_DAYS = 14;

const fecha = (t: number) =>
  new Date(t).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });

const saludo = (t: number) => {
  const h = new Date(t).getHours();
  return h < 6 ? "Buenas noches" : h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches";
};

/** Las respuestas de hoy como cuentas (máximo 40, las últimas). */
function todayMarks(p: Progress, now: number): Mark[] {
  const today = dayKey(now);
  return p.log
    .filter((e) => e.mode !== "previo" && dayKey(e.at) === today)
    .slice(-40)
    .map((e) => {
      const f = FACT_BY_ID[e.key];
      const fastMs = f ? TIERS.find((t) => t.id === f.tier)!.targetMs : 0;
      return markOf({ ok: e.ok, ms: e.ms, skipped: !!e.skip }, fastMs);
    });
}

export function Today({ progress, now, onDiagnostic, onSession, onLesson, onSettings, onArsenal }: Props) {
  const items = progress.items;
  const seen = FACTS.filter((f) => items[f.id]?.history.length).length;
  const due = Object.entries(items).filter(([, s]) => s.history.length && isDue(s, now)).length;
  const mastered = FACTS.filter((f) => atLeast(rankOf(items[f.id], 3000, true), "fluido")).length;
  const tiers = unlockedTiers(items);
  const current = TIERS.find((t) => t.id === tiers[tiers.length - 1])!;
  const tp = tierProgress(items, current.id);
  const nextLesson = LESSONS.find((l) => !progress.lessons[l.id]);
  const days = streak(progress.stats.days, now);
  const doneToday = progress.stats.days.includes(dayKey(now));
  const marks = todayMarks(progress, now);
  const planned = progress.settings.sessionLength;
  // Recordatorio suave de respaldo: con algo de progreso y sin respaldo en 14 días.
  const lastBackup = progress.meta.lastBackupAt;
  const backupNudge = progress.stats.answers >= 100 && (lastBackup === null || now - lastBackup > BACKUP_NUDGE_DAYS * 86_400_000);

  return (
    <div className="screen">
      <header className="today-head">
        <div>
          <span className="eyebrow">{fecha(now)}</span>
          <h1 className="title-xl">{saludo(now)}</h1>
        </div>
        <button className="close" onClick={onSettings} aria-label="Ajustes"><IconSettings /></button>
      </header>

      {seen === 0 ? (
        <div className="card hero">
          <span className="pill accent">Primer paso</span>
          <h2 className="hero-title">Tu diagnóstico</h2>
          <p className="muted">36 tablas del 2 al 9. La app mide cuánto tardas en cada una para saber cuáles ya recuerdas y cuáles todavía calculas.</p>
          <p className="small muted">Unos 3 minutos. Equivocarse acá es información.</p>
          <Beads marks={Array.from({ length: 36 }, () => null)} />
          <button className="btn block" onClick={onDiagnostic}>Empezar diagnóstico</button>
        </div>
      ) : (
        <div className="card hero">
          <div className="row between">
            <span className="pill accent">{doneToday ? "Sesión extra" : "Sesión de hoy"}</span>
            <span className="small muted">{planned} preguntas, unos {Math.round(planned / 5)} min</span>
          </div>
          <h2 className="hero-title">
            {due === 1 ? "1 repaso te espera" : due > 0 ? `${due} repasos te esperan` : doneToday ? "Hoy ya cumpliste" : "Estás al día"}
          </h2>
          <p className="muted">
            {due > 0
              ? "Repasos vencidos, algunos hechos nuevos y lo más lento, mezclados."
              : doneToday ? "Todo lo que toca está al día. Una vuelta extra afianza lo más lento." : "Nada vencido. Practicar igual afianza lo más lento."}
          </p>
          {marks.length > 0 ? (
            <div className="today-beads">
              <Beads marks={marks} />
              <span className="small muted">Hoy: {marks.filter((m) => m === "fast" || m === "ok").length} de {marks.length} bien, {marks.filter((m) => m === "fast").length} rápidas</span>
            </div>
          ) : (
            <Beads marks={Array.from({ length: planned }, () => null)} />
          )}
          <button className="btn block" onClick={onSession}>{due > 0 ? "Empezar" : "Practicar"}</button>
        </div>
      )}

      <div className="stats3">
        <div className="stat"><b>{days}</b><span>{days === 1 ? "día seguido" : "días seguidos"}</span></div>
        <div className="stat"><b>{mastered}</b><span>de {FACTS.length} consolidados</span></div>
        <div className="stat"><b>{progress.stats.answers.toLocaleString("es-CL")}</b><span>respuestas</span></div>
      </div>

      <button className="card arsenal-card" onClick={onArsenal}>
        <div className="arsenal-text">
          <span className="eyebrow">Arsenal, nivel {current.id}</span>
          <h3 className="card-title">{current.name}</h3>
          <span className="small muted">{tp.good} de {tp.total} consolidados{tp.provisional > 0 ? `, ${tp.provisional} en camino` : ""}</span>
          <div className="meter two"><i style={{ width: `${tp.share * 100}%` }} /><i className="prov" style={{ width: `${tp.provShare * 100}%` }} /></div>
          <span className="small muted">
            {current.id === "A4" ? "Último nivel del Arsenal." : "Con el 80% se abre el nivel siguiente."}
          </span>
        </div>
        <MiniMap tier={current.id} items={items} now={now} />
      </button>

      {backupNudge && (
        <button className="card nudge" onClick={onSettings}>
          <span className="small"><b>Respalda tu progreso.</b> {lastBackup === null ? "Todavía no tienes un respaldo." : "Tu último respaldo tiene más de dos semanas."} Toma 10 segundos.</span>
          <IconChevron />
        </button>
      )}

      {nextLesson && (
        <button className="card lesson-card" onClick={() => onLesson(nextLesson.id)}>
          <span className="lesson-icon">{nextLesson.icon}</span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="eyebrow">Nueva técnica, {nextLesson.minutes} min</span>
            <b className="card-title">{nextLesson.title}</b>
            <span className="small muted">{nextLesson.subtitle}</span>
          </span>
          <IconChevron />
        </button>
      )}
    </div>
  );
}
