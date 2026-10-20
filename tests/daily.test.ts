import { describe, expect, it } from "vitest";
import { aggregateSkills, buildDaily, skillKey } from "../src/core/daily";
import { DAY } from "../src/core/srs";
import { emptyProgress } from "../src/core/storage";

const T0 = Date.UTC(2026, 9, 20, 12);
const L = [{ id: "x11", techniqueId: "mul.x11-y-x101" }];

describe("sesión diaria con habilidades", () => {
  it("sin lecciones completadas: solo hechos", () => {
    const q = buildDaily(emptyProgress(), L, T0, 1);
    expect(q).toHaveLength(25);
    expect(q.every((x) => x.key.startsWith("f:"))).toBe(true);
  });
  it("con ×11 aprendido y vencido: agrega 3 problemas intercalados", () => {
    const p = emptyProgress();
    p.lessons.x11 = { completedAt: T0 - DAY, bestBoss: 10 };
    const q = buildDaily(p, L, T0, 1);
    const s = q.filter((x) => x.key === skillKey("x11"));
    expect(s).toHaveLength(3);
    expect(q).toHaveLength(25);
    s.forEach((x) => expect(x.answer).toBe(x.a * 11));
    expect(q[0].key).not.toBe("s:x11");
  });
  it("habilidad no vencida no aparece", () => {
    const p = emptyProgress();
    p.lessons.x11 = { completedAt: T0, bestBoss: 10 };
    p.items["s:x11"] = { interval: 3, ease: 2.5, due: T0 + 2 * DAY, reps: 2, lapses: 0, history: [] };
    expect(buildDaily(p, L, T0, 1).some((x) => x.key === "s:x11")).toBe(false);
  });
  it("agrega resultados por habilidad", () => {
    const a = aggregateSkills([
      { key: "s:x11", ok: true, ms: 3000 },
      { key: "f:7x8", ok: false, ms: 1 },
      { key: "s:x11", ok: false, ms: 5000 },
      { key: "s:x11", ok: true, ms: 4000 },
    ]);
    expect(a["s:x11"]).toEqual({ ok: false, ms: 4000 });
    expect(a["f:7x8"]).toBeUndefined();
  });
});
