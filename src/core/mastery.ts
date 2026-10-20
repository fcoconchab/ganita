// Rangos de dominio. Ver docs/ARQUITECTURA.md §6.
import type { ItemState } from "./srs";

export type Rank = "nuevo" | "aprendiz" | "fluido" | "automatico" | "maquina";

export const RANK_LABEL: Record<Rank, string> = {
  nuevo: "Nuevo",
  aprendiz: "Aprendiz",
  fluido: "Fluido",
  automatico: "Automático",
  maquina: "Máquina",
};

export const RANK_ORDER: Rank[] = ["nuevo", "aprendiz", "fluido", "automatico", "maquina"];

export const median = (xs: number[]) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Rango según los últimos 3 intentos.
 * fluidoMs: umbral de Fluido (3 s en el Arsenal); automático = la mitad.
 */
export function rankOf(state: ItemState | undefined, fluidoMs = 3000, strict = false): Rank {
  if (!state || state.history.length === 0) return "nuevo";
  const last = state.history.slice(-3);
  if (last.some((a) => !a.ok)) return "aprendiz";
  const med = median(last.map((a) => a.ms));
  // Con menos de 3 intentos el rango es provisorio: como máximo Fluido.
  // En modo estricto (para desbloquear niveles) se exigen 3 intentos.
  if (last.length < 3) return !strict && med <= fluidoMs ? "fluido" : "aprendiz";
  if (med > fluidoMs) return "aprendiz";
  if (med > fluidoMs / 2) return "fluido";
  return state.interval >= 21 ? "maquina" : "automatico";
}

export const atLeast = (r: Rank, min: Rank) => RANK_ORDER.indexOf(r) >= RANK_ORDER.indexOf(min);

/** Un ítem vencido hace más de 2 días se muestra "apagado" en el mapa. */
export const isFading = (state: ItemState | undefined, now: number) =>
  !!state && state.history.length > 0 && now - state.due > 2 * 86_400_000;
