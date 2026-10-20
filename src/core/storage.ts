// Guarda y carga el progreso. Un solo objeto versionado en localStorage.
import type { ItemState } from "./srs";

export const STORAGE_KEY = "ganita:v1";

export interface LessonRecord {
  completedAt: number;
  bestBoss: number; // aciertos en el jefe (de 10)
}

export interface Progress {
  version: 1;
  items: Record<string, ItemState>;
  lessons: Record<string, LessonRecord>;
  stats: {
    days: string[]; // días con sesión, "YYYY-MM-DD"
    sessions: number;
    answers: number;
  };
  settings: { sessionLength: number; sound: boolean };
}

export const emptyProgress = (): Progress => ({
  version: 1,
  items: {},
  lessons: {},
  stats: { days: [], sessions: 0, answers: 0 },
  settings: { sessionLength: 25, sound: true },
});

interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

const store = (): KV | null => {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
};

/** Acepta datos guardados por versiones anteriores y completa campos faltantes. */
export function migrate(raw: unknown): Progress {
  const base = emptyProgress();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<Progress>;
  return {
    version: 1,
    items: r.items ?? {},
    lessons: r.lessons ?? {},
    stats: { ...base.stats, ...(r.stats ?? {}) },
    settings: { ...base.settings, ...(r.settings ?? {}) },
  };
}

export function load(kv: KV | null = store()): Progress {
  try {
    const txt = kv?.getItem(STORAGE_KEY);
    return txt ? migrate(JSON.parse(txt)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function save(p: Progress, kv: KV | null = store()) {
  try {
    kv?.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* sin almacenamiento disponible: la app sigue funcionando en memoria */
  }
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
