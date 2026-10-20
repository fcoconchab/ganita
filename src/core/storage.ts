// Guarda y carga el progreso. Un solo objeto versionado en localStorage.
// Ver docs/ARQUITECTURA.md §10 (Datos guardados).
import { HISTORY_MAX, type Attempt, type ItemState } from "./srs";

/** Clave actual. La de la versión anterior se lee al migrar y nunca se borra (queda como copia). */
export const STORAGE_KEY = "ganita:v2";
export const LEGACY_KEYS = ["ganita:v1"];
/** Copia del progreso tomada justo antes de importar un respaldo (para deshacer). */
export const UNDO_KEY = "ganita:antes-de-importar";

export const VERSION = 2;

export interface LessonRecord {
  completedAt: number;
  bestBoss: number; // aciertos en el jefe (de 10)
}

export type Theme = "sistema" | "oscuro" | "claro";
export const THEMES: Theme[] = ["sistema", "oscuro", "claro"];

/** Largos de sesión ofrecidos en Ajustes (preguntas). */
export const SESSION_LENGTHS = [10, 15, 25, 40] as const;

export interface Settings {
  sessionLength: number;
  sound: boolean;
  theme: Theme;
}

/** Modo en que se respondió. "previo": recuperado del historial de la versión 1 (sin modo conocido). */
export type LogMode = "review" | "diagnostic" | "guided" | "practice" | "boss" | "previo";

/** Una respuesta, tal como pasó. Sirve para calibrar los umbrales con datos reales. */
export interface LogEntry {
  at: number; // epoch ms
  key: string; // "f:7x8", "s:x11", "l:x11:72"
  a: number; // en el orden mostrado
  b: number;
  ms: number;
  ok: boolean;
  mode: LogMode;
  retry?: boolean; // reaparición después de un error (ya vio la respuesta)
  skip?: boolean; // tocó "No sé"
}

/** Máximo de respuestas guardadas (las más antiguas salen primero). ≈ 1 año a 50 por día. */
export const LOG_MAX = 20_000;

export interface Progress {
  version: 2;
  items: Record<string, ItemState>;
  lessons: Record<string, LessonRecord>;
  stats: {
    days: string[]; // días con sesión, "YYYY-MM-DD"
    sessions: number;
    answers: number;
  };
  settings: Settings;
  log: LogEntry[];
  meta: {
    createdAt: number;
    lastBackupAt: number | null;
  };
}

export const defaultSettings = (): Settings => ({ sessionLength: 25, sound: true, theme: "sistema" });

export const emptyProgress = (now = Date.now()): Progress => ({
  version: 2,
  items: {},
  lessons: {},
  stats: { days: [], sessions: 0, answers: 0 },
  settings: defaultSettings(),
  log: [],
  meta: { createdAt: now, lastBackupAt: null },
});

export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem?(k: string): void;
}

const store = (): KV | null => {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
};

// ---------- validación ----------

const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);

function cleanAttempt(x: unknown): Attempt | null {
  if (!isObj(x) || typeof x.ok !== "boolean" || !isNum(x.ms) || !isNum(x.at)) return null;
  return { ok: x.ok, ms: x.ms, at: x.at };
}

/** Devuelve el ítem si tiene la forma correcta; si no, null (no se inventan datos). */
export function cleanItem(x: unknown): ItemState | null {
  if (!isObj(x)) return null;
  const { interval, ease, due, reps, lapses, history } = x;
  if (![interval, ease, due, reps, lapses].every(isNum) || !Array.isArray(history)) return null;
  const h = history.map(cleanAttempt).filter((a): a is Attempt => !!a).slice(-HISTORY_MAX);
  return {
    interval: interval as number, ease: ease as number, due: due as number,
    reps: reps as number, lapses: lapses as number, history: h,
  };
}

const MODES: LogMode[] = ["review", "diagnostic", "guided", "practice", "boss", "previo"];

export function cleanLogEntry(x: unknown): LogEntry | null {
  if (!isObj(x)) return null;
  const { at, key, a, b, ms, ok, mode } = x;
  if (!isNum(at) || typeof key !== "string" || !isNum(a) || !isNum(b) || !isNum(ms) || typeof ok !== "boolean") return null;
  if (!MODES.includes(mode as LogMode)) return null;
  const e: LogEntry = { at, key, a, b, ms, ok, mode: mode as LogMode };
  if (x.retry === true) e.retry = true;
  if (x.skip === true) e.skip = true;
  return e;
}

function cleanLessons(x: unknown): Record<string, LessonRecord> {
  if (!isObj(x)) return {};
  const out: Record<string, LessonRecord> = {};
  for (const [k, v] of Object.entries(x)) {
    if (isObj(v) && isNum(v.completedAt) && isNum(v.bestBoss)) out[k] = { completedAt: v.completedAt, bestBoss: v.bestBoss };
  }
  return out;
}

function cleanSettings(x: unknown): Settings {
  const base = defaultSettings();
  if (!isObj(x)) return base;
  return {
    sessionLength: isNum(x.sessionLength) && x.sessionLength >= 5 && x.sessionLength <= 100 ? Math.round(x.sessionLength) : base.sessionLength,
    sound: typeof x.sound === "boolean" ? x.sound : base.sound,
    theme: THEMES.includes(x.theme as Theme) ? (x.theme as Theme) : base.theme,
  };
}

/** Historial de la versión 1 convertido en registro (para no perder los tiempos ya medidos). */
export function logFromHistory(items: Record<string, ItemState>): LogEntry[] {
  const out: LogEntry[] = [];
  for (const [key, st] of Object.entries(items)) {
    const m = key.match(/^f:(\d+)x(\d+)$/);
    const a = m ? Number(m[1]) : 0, b = m ? Number(m[2]) : 0;
    for (const h of st.history) out.push({ at: h.at, key, a, b, ms: h.ms, ok: h.ok, mode: "previo" });
  }
  return out.sort((x, y) => x.at - y.at);
}

/**
 * Acepta datos guardados por cualquier versión y devuelve un progreso v2 válido.
 * Lo que no tiene la forma correcta se descarta; nada válido se pierde.
 */
export function migrate(raw: unknown, now = Date.now()): Progress {
  const base = emptyProgress(now);
  if (!isObj(raw)) return base;

  const items: Record<string, ItemState> = {};
  if (isObj(raw.items)) {
    for (const [k, v] of Object.entries(raw.items)) {
      const it = cleanItem(v);
      if (it) items[k] = it;
    }
  }

  const st = isObj(raw.stats) ? raw.stats : {};
  const stats = {
    days: Array.isArray(st.days) ? st.days.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) : [],
    sessions: isNum(st.sessions) ? st.sessions : 0,
    answers: isNum(st.answers) ? st.answers : 0,
  };

  const fromV1 = raw.version !== 2 && !Array.isArray(raw.log);
  const log = fromV1
    ? logFromHistory(items)
    : (Array.isArray(raw.log) ? raw.log : []).map(cleanLogEntry).filter((e): e is LogEntry => !!e).slice(-LOG_MAX);

  const meta = isObj(raw.meta) ? raw.meta : {};
  const firstSeen = Math.min(now, ...Object.values(items).flatMap((it) => it.history.map((h) => h.at)));

  return {
    version: 2,
    items,
    lessons: cleanLessons(raw.lessons),
    stats,
    settings: cleanSettings(raw.settings),
    log,
    meta: {
      createdAt: isNum(meta.createdAt) ? meta.createdAt : firstSeen,
      lastBackupAt: isNum(meta.lastBackupAt) ? meta.lastBackupAt : null,
    },
  };
}

export function load(kv: KV | null = store(), now = Date.now()): Progress {
  for (const key of [STORAGE_KEY, ...LEGACY_KEYS]) {
    try {
      const txt = kv?.getItem(key);
      if (txt) return migrate(JSON.parse(txt), now);
    } catch {
      /* dato ilegible: probar la clave siguiente */
    }
  }
  return emptyProgress(now);
}

/** Devuelve false si no se pudo guardar (por ejemplo, almacenamiento lleno). */
export function save(p: Progress, kv: KV | null = store()): boolean {
  try {
    if (!kv) return false;
    kv.setItem(STORAGE_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false; // sin almacenamiento disponible: la app sigue funcionando en memoria
  }
}

/** Copia para deshacer una importación. */
export function saveUndo(p: Progress, kv: KV | null = store()): boolean {
  try {
    if (!kv) return false;
    kv.setItem(UNDO_KEY, JSON.stringify({ savedAt: Date.now(), progress: p }));
    return true;
  } catch {
    return false;
  }
}

export function loadUndo(kv: KV | null = store()): { savedAt: number; progress: Progress } | null {
  try {
    const txt = kv?.getItem(UNDO_KEY);
    if (!txt) return null;
    const raw = JSON.parse(txt);
    if (!isObj(raw) || !isNum(raw.savedAt)) return null;
    return { savedAt: raw.savedAt, progress: migrate(raw.progress) };
  } catch {
    return null;
  }
}

export function clearUndo(kv: KV | null = store()) {
  try {
    kv?.removeItem?.(UNDO_KEY);
  } catch {
    /* sin almacenamiento */
  }
}

/**
 * Deshacer solo es seguro si no se ha practicado después de importar:
 * si no, se perderían esas respuestas nuevas.
 */
export const canUndo = (p: Progress, undo: { savedAt: number } | null) =>
  !!undo && !(p.log.length && p.log[p.log.length - 1].at > undo.savedAt);

/** Agrega una respuesta al registro, respetando el máximo. No muta. */
export function appendLog(log: LogEntry[], e: LogEntry): LogEntry[] {
  const out = log.length >= LOG_MAX ? log.slice(log.length - LOG_MAX + 1) : log.slice();
  out.push(e);
  return out;
}

export const dayKey = (t: number) => {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/**
 * Racha con un día libre permitido: cuenta días seguidos hacia atrás desde hoy,
 * tolerando huecos de 1 día. Sin culpa: perder un día no corta la racha.
 */
export function streak(days: string[], now: number): number {
  const set = new Set(days);
  let count = 0;
  let gap = 0;
  for (let i = 0; i < 400; i++) {
    const k = dayKey(now - i * 86_400_000);
    if (set.has(k)) { count++; gap = 0; }
    else if (i === 0) continue; // hoy todavía no practicas
    else if (++gap > 1) break;
  }
  return count;
}
