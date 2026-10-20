// Respaldo del progreso: exportar a un archivo e importarlo de vuelta sin perder datos.
// Importar FUSIONA con el progreso actual: nunca borra intentos, lecciones ni días.
import { FACTS } from "./facts";
import { HISTORY_MAX, type Attempt, type ItemState } from "./srs";
import { LOG_MAX, migrate, type LessonRecord, type LogEntry, type Progress } from "./storage";

export const BACKUP_APP = "ganita";
export const BACKUP_KIND = "respaldo";

export interface BackupFile {
  app: typeof BACKUP_APP;
  kind: typeof BACKUP_KIND;
  format: number; // versión del progreso
  exportedAt: number;
  progress: Progress;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "ganita-respaldo-2026-10-20-1541.json" (hora local). */
export function backupFileName(now: number, ext = "json", what = "respaldo"): string {
  const d = new Date(now);
  return `ganita-${what}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.${ext}`;
}

export function toBackup(p: Progress, now: number): string {
  const file: BackupFile = { app: BACKUP_APP, kind: BACKUP_KIND, format: p.version, exportedAt: now, progress: p };
  return JSON.stringify(file);
}

export type ParseResult =
  | { ok: true; progress: Progress; exportedAt: number | null }
  | { ok: false; error: string };

/**
 * Lee un archivo de respaldo. Acepta también el objeto de progreso suelto
 * (por ejemplo, copiado del almacenamiento de la versión 1).
 */
export function parseBackup(text: string, now = Date.now()): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text.replace(/^﻿/, ""));
  } catch {
    return { ok: false, error: "No se pudo leer el archivo. Elige el .json que exportaste desde Ganita." };
  }
  if (!raw || typeof raw !== "object") return { ok: false, error: "Este archivo no es un respaldo de Ganita." };
  const r = raw as Record<string, unknown>;

  let body: unknown;
  let exportedAt: number | null = null;
  if (r.app === BACKUP_APP && r.kind === BACKUP_KIND) {
    body = r.progress;
    exportedAt = typeof r.exportedAt === "number" ? r.exportedAt : null;
    if (typeof r.format === "number" && r.format > 2) {
      return { ok: false, error: "El respaldo viene de una versión más nueva de Ganita. Actualiza la app y vuelve a intentarlo." };
    }
  } else if (r.items && typeof r.items === "object" && "settings" in r) {
    body = r; // progreso suelto
  } else {
    return { ok: false, error: "Este archivo no es un respaldo de Ganita." };
  }
  if (!body || typeof body !== "object") return { ok: false, error: "El respaldo está vacío o dañado." };
  return { ok: true, progress: migrate(body, now), exportedAt };
}

// ---------- fusión ----------

const attemptKey = (a: Attempt) => `${a.at}|${a.ms}|${a.ok ? 1 : 0}`;
const lastAt = (s: ItemState) => (s.history.length ? s.history[s.history.length - 1].at : -Infinity);

/** Une los intentos de ambos (sin duplicar) y toma el estado de repaso del más reciente. */
export function mergeItem(a: ItemState, b: ItemState): ItemState {
  const seen = new Map<string, Attempt>();
  for (const h of [...a.history, ...b.history]) seen.set(attemptKey(h), h);
  const history = [...seen.values()].sort((x, y) => x.at - y.at).slice(-HISTORY_MAX);
  const newer = lastAt(b) > lastAt(a) ? b : a;
  return {
    interval: newer.interval,
    ease: newer.ease,
    due: newer.due,
    reps: newer.reps,
    lapses: Math.max(a.lapses, b.lapses),
    history,
  };
}

const logKey = (e: LogEntry) => `${e.at}|${e.key}|${e.a}|${e.b}|${e.ms}|${e.ok ? 1 : 0}|${e.mode}`;

export function mergeLog(a: LogEntry[], b: LogEntry[]): LogEntry[] {
  const seen = new Map<string, LogEntry>();
  for (const e of [...a, ...b]) if (!seen.has(logKey(e))) seen.set(logKey(e), e);
  return [...seen.values()].sort((x, y) => x.at - y.at).slice(-LOG_MAX);
}

function mergeLessons(a: Record<string, LessonRecord>, b: Record<string, LessonRecord>) {
  const out: Record<string, LessonRecord> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const c = out[k];
    out[k] = c ? { completedAt: Math.min(c.completedAt, v.completedAt), bestBoss: Math.max(c.bestBoss, v.bestBoss) } : { ...v };
  }
  return out;
}

/**
 * Fusiona el respaldo `incoming` en el progreso `current`.
 * - Intentos, registro de tiempos, lecciones y días: unión sin duplicados.
 * - Estado de repaso de cada ítem: el del lado con el intento más reciente.
 * - Contadores: el mayor de los dos (no se pueden sumar sin contar dos veces).
 * - Ajustes: se mantienen los de este teléfono.
 * Es idempotente: importar el mismo archivo dos veces no cambia nada la segunda vez.
 */
export function mergeProgress(current: Progress, incoming: Progress): Progress {
  const items: Record<string, ItemState> = { ...current.items };
  for (const [k, v] of Object.entries(incoming.items)) items[k] = items[k] ? mergeItem(items[k], v) : v;
  const days = [...new Set([...current.stats.days, ...incoming.stats.days])].sort().slice(-400);
  const backups = [current.meta.lastBackupAt, incoming.meta.lastBackupAt].filter((x): x is number => x !== null);
  return {
    version: 2,
    items,
    lessons: mergeLessons(current.lessons, incoming.lessons),
    stats: {
      days,
      sessions: Math.max(current.stats.sessions, incoming.stats.sessions),
      answers: Math.max(current.stats.answers, incoming.stats.answers),
    },
    settings: { ...current.settings },
    log: mergeLog(current.log, incoming.log),
    meta: {
      createdAt: Math.min(current.meta.createdAt, incoming.meta.createdAt),
      lastBackupAt: backups.length ? Math.max(...backups) : null,
    },
  };
}

// ---------- resumen para mostrar antes de importar ----------

export interface ProgressSummary {
  factsSeen: number;
  answers: number;
  lessons: number;
  days: number;
  lastActivity: number | null;
}

export function summarize(p: Progress): ProgressSummary {
  const ats = Object.values(p.items).flatMap((s) => s.history.map((h) => h.at));
  const lastLog = p.log.length ? p.log[p.log.length - 1].at : null;
  const last = Math.max(...ats, lastLog ?? -Infinity);
  return {
    factsSeen: FACTS.filter((f) => p.items[f.id]?.history.length).length,
    answers: p.stats.answers,
    lessons: Object.keys(p.lessons).length,
    days: p.stats.days.length,
    lastActivity: Number.isFinite(last) ? last : null,
  };
}

/** Qué agrega el respaldo a lo que ya hay: intentos y lecciones nuevas. */
export function importDelta(current: Progress, incoming: Progress) {
  const merged = mergeProgress(current, incoming);
  const count = (p: Progress) => Object.values(p.items).reduce((n, s) => n + s.history.length, 0);
  return {
    merged,
    newAttempts: count(merged) - count(current),
    newLessons: Object.keys(merged.lessons).length - Object.keys(current.lessons).length,
    newLog: merged.log.length - current.log.length,
  };
}
