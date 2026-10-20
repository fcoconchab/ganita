// Modelo de lección: 6 pasos. Ver docs/ARQUITECTURA.md §4.

export type LessonStep =
  | { type: "hook"; title: string; body: string; visual: string }
  | { type: "why"; title: string; body: string; visual: string }
  | { type: "rule"; title: string; body: string; visual: string }
  | { type: "guided"; title: string; body: string; count: number; carry?: boolean[] }
  | { type: "practice"; title: string; body: string; count: number }
  | { type: "boss"; title: string; body: string; count: number; pass: number; targetMs: number };

export interface Lesson {
  id: string;
  techniqueId: string; // id en techniques.json
  path: "vedico" | "trachtenberg" | "benjamin" | "banquero" | "estimador" | "nucleo";
  title: string;
  subtitle: string;
  minutes: number;
  /** tiempo objetivo por problema cuando entra al repaso */
  targetMs: number;
  steps: LessonStep[];
}
