import { FACTS, TIERS } from "../core/facts";
import { atLeast, rankOf } from "../core/mastery";
import { tierProgress, unlockedTiers } from "../core/session";
import { isDue } from "../core/srs";
import { dayKey, streak, type Progress } from "../core/storage";
import { LESSONS } from "../content/lessons/x11";
import { IconChevron, IconSettings } from "../ui/icons";

interface Props {
  progress: Progress;
  now: number;
  onDiagnostic: () => void;
  onSession: () => void;
  onLesson: (id: string) => void;
  onSettings: () => void;
}

const BACKUP_NUDGE_DAYS = 14;

const fecha = (t: number) =>
  new Date(t).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });

export function Today({ progress, now, onDiagnostic, onSession, onLesson, onSettings }: Props) {
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
  // Recordatorio suave de respaldo: con algo de progreso y sin respaldo en 14 días.
  const lastBackup = progress.meta.lastBackupAt;
  const backupNudge = progress.stats.answers >= 100 && (lastBackup === null || now - lastBackup > BACKUP_NUDGE_DAYS * 86_400_000);

  return (
    <div className="screen">
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="eyebrow">{fecha(now)}</span>
          <h1 className="title-xl">Hoy</h1>
        </div>
        <button className="close" onClick={onSettings} aria-label="Ajustes"><IconSettings /></button>
      </div>

      {seen === 0 ? (
        <div className="card hero">
          <span className="pill accent">Primer paso</span>
          <h2 style={{ fontSize: 26 }}>Tu diagnóstico</h2>
          <p className="muted">36 tablas del 2 al 9. La app mide cuánto tardas en cada una para saber cuáles ya recuerdas y cuáles todavía calculas.</p>
          <p className="small muted">Unos 3 minutos. Sin presión: equivocarse acá es información.</p>
          <button className="btn block" onClick={onDiagnostic}>Empezar diagnóstico</button>
        </div>
      ) : (
        <div className="card hero">
          <div className="row between">
            <span className="pill accent">{doneToday ? "Sesión extra" : "Sesión de hoy"}</span>
            <span className="small muted">≈ {Math.round(progress.settings.sessionLength / 5)} min</span>
          </div>
          <h2 style={{ fontSize: 26 }}>{due === 1 ? "1 repaso te espera" : due > 0 ? `${due} repasos te esperan` : "Estás al día"}</h2>
          <p className="muted">
            {due > 0
              ? "Repasos vencidos, algunos hechos nuevos y lo más lento, mezclados."
              : "Nada vencido. Practicar igual afianza lo más lento."}
          </p>
          <button className="btn block" onClick={onSession}>{due > 0 ? "Empezar" : "Practicar"}</button>
        </div>
      )}

      <div className="stats3">
        <div className="stat"><b>{days}</b><span>{days === 1 ? "día seguido" : "días seguidos"}</span></div>
        <div className="stat"><b>{mastered}</b><span>de {FACTS.length} consolidados</span></div>
        <div className="stat"><b>{progress.stats.answers}</b><span>respuestas</span></div>
      </div>

      <div className="card">
        <div className="row between">
          <span className="eyebrow">Arsenal · nivel {current.id}</span>
          <span className="small muted">{tp.good}/{tp.total}</span>
        </div>
        <h3 style={{ fontSize: 20 }}>{current.name}</h3>
        <div className="meter"><i style={{ width: `${tp.share * 100}%` }} /></div>
        <p className="small muted">
          {current.id === "A4" ? "Último nivel del Arsenal." : "Con el 80% consolidado se abre el nivel siguiente."}
        </p>
      </div>

      {backupNudge && (
        <button className="card nudge" onClick={onSettings}>
          <span className="small"><b>Respalda tu progreso.</b> {lastBackup === null ? "Todavía no tienes un respaldo." : "Tu último respaldo tiene más de dos semanas."} Toma 10 segundos.</span>
          <IconChevron />
        </button>
      )}

      {nextLesson && (
        <button className="card lesson-card" onClick={() => onLesson(nextLesson.id)}>
          <span className="lesson-icon">×11</span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="eyebrow">Nueva técnica · {nextLesson.minutes} min</span>
            <b style={{ fontFamily: "var(--display)", fontSize: 19, fontWeight: 600 }}>{nextLesson.title}</b>
            <span className="small muted">{nextLesson.subtitle}</span>
          </span>
          <IconChevron />
        </button>
      )}
    </div>
  );
}
