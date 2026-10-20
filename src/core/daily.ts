// Sesión diaria completa: hechos del Arsenal + habilidades aprendidas que toca repasar.
import { GENERATORS } from "./generators";
import { median } from "./mastery";
import { buildSession, rng, type Question } from "./session";
import type { Progress } from "./storage";

export interface SkillRef {
  id: string; // id de la lección
  techniqueId: string;
}

export const SKILL_PROBLEMS = 3;
export const skillKey = (lessonId: string) => `s:${lessonId}`;

export function skillsDue(p: Progress, lessons: SkillRef[], now: number): SkillRef[] {
  return lessons.filter((l) => {
    if (!p.lessons[l.id] || !GENERATORS[l.techniqueId]) return false;
    const st = p.items[skillKey(l.id)];
    return !st || st.due <= now;
  });
}

export function buildDaily(p: Progress, lessons: SkillRef[], now: number, seed = now): Question[] {
  const rand = rng(seed + 17);
  const skillQs: Question[] = skillsDue(p, lessons, now).flatMap((l) =>
    Array.from({ length: SKILL_PROBLEMS }, () => {
      const pr = GENERATORS[l.techniqueId](rand);
      return { key: skillKey(l.id), a: pr.a, b: pr.b, answer: pr.answer, isNew: false, steps: pr.steps };
    }),
  );
  const length = Math.max(10, p.settings.sessionLength - skillQs.length);
  const facts = buildSession(p.items, { length, now, seed });
  // repartir las habilidades a lo largo de la sesión (intercalado)
  const out = [...facts];
  skillQs.forEach((q, k) => {
    const pos = Math.floor(((k + 1) * out.length) / (skillQs.length + 1)) + k;
    out.splice(Math.min(pos, out.length), 0, q);
  });
  return out;
}

/** Una habilidad se califica una vez por sesión: ok si todos sus problemas salieron bien. */
export function aggregateSkills(results: { key: string; ok: boolean; ms: number }[]) {
  const by: Record<string, { ok: boolean; ms: number[] }> = {};
  for (const r of results) {
    if (!r.key.startsWith("s:")) continue;
    by[r.key] ??= { ok: true, ms: [] };
    by[r.key].ok &&= r.ok;
    by[r.key].ms.push(r.ms);
  }
  return Object.fromEntries(Object.entries(by).map(([k, v]) => [k, { ok: v.ok, ms: median(v.ms) }]));
}
