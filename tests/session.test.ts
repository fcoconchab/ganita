import { describe, expect, it } from "vitest";
import { FACTS, factsOfTier } from "../src/core/facts";
import { DAY, newItem, type ItemState } from "../src/core/srs";
import { buildDiagnostic, buildSession, unlockedTiers, type Items } from "../src/core/session";
import { emptyProgress, load, migrate, save, streak, dayKey } from "../src/core/storage";

const T0 = Date.UTC(2026, 9, 20, 12);
const fluent = (due = T0 + 5 * DAY): ItemState => ({
  ...newItem(T0), interval: 5, reps: 3, due,
  history: [1, 2, 3].map(() => ({ ok: true, ms: 2000, at: T0 })),
});

describe("sesión diaria", () => {
  it("usuario nuevo: solo A1 y 25 preguntas sin repetir", () => {
    const q = buildSession({}, { now: T0, seed: 1 });
    expect(q).toHaveLength(25);
    expect(new Set(q.map((x) => x.key)).size).toBe(25);
    q.forEach((x) => expect(x.key).toMatch(/^f:[2-9]x[2-9]$/));
    q.forEach((x) => expect(x.a * x.b).toBe(x.answer));
  });
  it("desbloquea A2 con 80% de A1 fluido", () => {
    const items: Items = {};
    const a1 = factsOfTier("A1");
    a1.slice(0, 28).forEach((f) => (items[f.id] = fluent()));
    expect(unlockedTiers(items)).toEqual(["A1"]);
    a1.slice(0, 29).forEach((f) => (items[f.id] = fluent()));
    expect(unlockedTiers(items)).toEqual(["A1", "A2"]);
  });
  it("prioriza los vencidos y limita los nuevos a 5", () => {
    const items: Items = {};
    FACTS.filter((f) => f.tier === "A1").forEach((f, i) => (items[f.id] = fluent(i < 10 ? T0 - DAY : T0 + 9 * DAY)));
    const q = buildSession(items, { now: T0, seed: 7 });
    const keys = new Set(q.map((x) => x.key));
    FACTS.filter((f) => f.tier === "A1").slice(0, 10).forEach((f) => expect(keys.has(f.id)).toBe(true));
    expect(q.filter((x) => x.isNew).length).toBeLessThanOrEqual(5);
    expect(q.filter((x) => x.isNew).length).toBeGreaterThan(0); // A2 desbloqueado trae nuevos
  });
  it("diagnóstico cubre todo el nivel", () => {
    const d = buildDiagnostic("A1", 3);
    expect(d).toHaveLength(36);
    expect(new Set(d.map((x) => x.key)).size).toBe(36);
  });
});

describe("almacenamiento", () => {
  it("guarda y carga sin perder datos", () => {
    const mem: Record<string, string> = {};
    const kv = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => void (mem[k] = v) };
    const p = emptyProgress();
    p.items["f:7x8"] = fluent();
    save(p, kv);
    expect(load(kv).items["f:7x8"].interval).toBe(5);
  });
  it("migra datos incompletos sin romperse", () => {
    expect(migrate(null).version).toBe(1);
    expect(migrate({ items: { x: 1 } }).settings.sessionLength).toBe(25);
  });
  it("racha tolera un día libre", () => {
    const d = (k: number) => dayKey(T0 - k * DAY);
    expect(streak([d(0), d(1), d(2)], T0)).toBe(3);
    expect(streak([d(1), d(2)], T0)).toBe(2); // hoy aún no practica
    expect(streak([d(0), d(2), d(3)], T0)).toBe(3); // un día libre
    expect(streak([d(0), d(3)], T0)).toBe(1); // dos días libres cortan
  });
});
