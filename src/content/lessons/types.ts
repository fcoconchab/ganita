// Modelo de lección: 6 pasos. Ver docs/ARQUITECTURA.md §4.

export type LessonStep =
  | { type: "hook"; title: string; body: string; visual: string }
  | { type: "why"; title: string; body: string; visual: string }
  | { type: "rule"; title: string; body: string; visual: string }
  /** `hard[i]`: el problema i es del caso de la regla completa (true) o del truco (false) */
  | { type: "guided"; title: string; body: string; count: number; hard?: boolean[] }
  | { type: "practice"; title: string; body: string; count: number }
  | { type: "boss"; title: string; body: string; count: number; pass: number; targetMs: number };

export type LessonPath = "vedico" | "trachtenberg" | "benjamin" | "banquero" | "estimador" | "nucleo";

export const PATH_LABEL: Record<LessonPath, string> = {
  vedico: "Védico",
  trachtenberg: "Trachtenberg",
  benjamin: "Benjamin",
  banquero: "Banquero",
  estimador: "Estimador",
  nucleo: "Núcleo",
};

export interface Lesson {
  id: string;
  techniqueId: string; // id en techniques.json y en GENERATORS
  path: LessonPath;
  /** texto corto del ícono en las tarjetas (×11, 5²) */
  icon: string;
  title: string;
  subtitle: string;
  minutes: number;
  /** tiempo objetivo por problema cuando entra al repaso; bajo la mitad cuenta como rápida */
  targetMs: number;
  steps: LessonStep[];
}
