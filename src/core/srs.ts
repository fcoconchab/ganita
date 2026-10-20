// Repaso espaciado: variante simple de SM-2 calificada por tiempo de respuesta.
// Ver docs/ARQUITECTURA.md §5.

export type Grade = "again" | "hard" | "good" | "easy";

export interface Attempt {
  ok: boolean;
  ms: number;
  at: number; // epoch ms
}

export interface ItemState {
  interval: number; // días
  ease: number; // multiplicador
  due: number; // epoch ms
  reps: number; // aciertos seguidos
  lapses: number; // errores totales
  history: Attempt[]; // últimos intentos (máx. HISTORY_MAX)
}

export const DAY = 86_400_000;
export const HISTORY_MAX = 12;
export const EASE_MIN = 1.3;
export const EASE_MAX = 2.8;
export const EASE_START = 2.5;

export const newItem = (now: number): ItemState => ({
  interval: 0,
  ease: EASE_START,
  due: now,
  reps: 0,
  lapses: 0,
  history: [],
});

/** Convierte un intento en calificación según el tiempo objetivo del ítem. */
export function gradeFor(ok: boolean, ms: number, targetMs: number): Grade {
  if (!ok) return "again";
  if (ms <= targetMs) return "easy";
  if (ms <= targetMs * 2) return "good";
  return "hard";
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Aplica un intento y devuelve el nuevo estado (no muta). */
export function review(state: ItemState, attempt: Attempt, targetMs: number): ItemState {
  const g = gradeFor(attempt.ok, attempt.ms, targetMs);
  const history = [...state.history, attempt].slice(-HISTORY_MAX);
  let { interval, ease, reps, lapses } = state;

  switch (g) {
    case "again":
      interval = 0;
      reps = 0;
      lapses += 1;
      ease = clamp(ease - 0.2, EASE_MIN, EASE_MAX);
      break;
    case "hard":
      interval = Math.max(1, interval * 1.2);
      reps += 1;
      ease = clamp(ease - 0.15, EASE_MIN, EASE_MAX);
      break;
    case "good":
      interval = reps === 0 ? 1 : reps === 1 ? 3 : interval * ease;
      reps += 1;
      break;
    case "easy":
      interval = reps === 0 ? 2 : reps === 1 ? 4 : interval * ease * 1.3;
      reps += 1;
      ease = clamp(ease + 0.15, EASE_MIN, EASE_MAX);
      break;
  }

  interval = Math.round(interval * 10) / 10;
  // Un error se repite en la misma sesión: vence de inmediato.
  const due = g === "again" ? attempt.at : attempt.at + interval * DAY;
  return { interval, ease, due, reps, lapses, history };
}

export const isDue = (s: ItemState, now: number) => s.due <= now;

/** Días de atraso (positivo = vencido). */
export const overdueDays = (s: ItemState, now: number) => (now - s.due) / DAY;
