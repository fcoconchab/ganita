import { describe, expect, it } from "vitest";
import { DAY, newItem, review, type ItemState } from "../src/core/srs";
import {
  LEGACY_KEYS, LOG_MAX, STORAGE_KEY, UNDO_KEY, appendLog, emptyProgress, load, loadUndo, migrate, save, saveUndo,
  type LogEntry,
} from "../src/core/storage";

const T0 = Date.UTC(2026, 9, 20, 12);
const memKV = () => {
  const mem: Record<string, string> = {};
  return { mem, kv: { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => void (mem[k] = v) } };
};

/** Progreso tal como lo guardaba la versión 1 (fase 0). */
function v1Progress() {
  let s: ItemState = newItem(T0);
  s = review(s, { ok: false, ms: 4200, at: T0 }, 1500);
  s = review(s, { ok: true, ms: 1800, at: T0 + 60_000 }, 1500);
  s = review(s, { ok: true, ms: 1300, at: T0 + DAY }, 1500);
  return {
    version: 1,
    items: { "f:7x8": s, "s:x11": review(newItem(T0), { ok: true, ms: 3000, at: T0 }, 4000) },
    lessons: { x11: { completedAt: T0, bestBoss: 10 } },
    stats: { days: ["2026-10-20", "2026-10-21"], sessions: 3, answers: 61 },
    settings: { sessionLength: 15, sound: false },
  };
}

describe("migración v1 → v2", () => {
  it("conserva ítems, lecciones, estadísticas y ajustes", () => {
    const v1 = v1Progress();
    const p = migrate(JSON.parse(JSON.stringify(v1)), T0 + 2 * DAY);
    expect(p.version).toBe(2);
    expect(p.items).toEqual(v1.items);
    expect(p.lessons).toEqual(v1.lessons);
    expect(p.stats).toEqual(v1.stats);
    expect(p.settings).toEqual({ sessionLength: 15, sound: false, theme: "sistema" });
    expect(p.meta).toEqual({ createdAt: T0, lastBackupAt: null });
  });
  it("recupera los tiempos del historial como registro 'previo'", () => {
    const p = migrate(v1Progress(), T0 + 2 * DAY);
    expect(p.log).toHaveLength(4); // 3 de 7×8 + 1 de ×11
    expect(p.log.every((e) => e.mode === "previo")).toBe(true);
    expect(p.log.map((e) => e.at)).toEqual([...p.log.map((e) => e.at)].sort((a, b) => a - b));
    const f = p.log.filter((e) => e.key === "f:7x8");
    expect(f.map((e) => [e.a, e.b, e.ms, e.ok])).toEqual([[7, 8, 4200, false], [7, 8, 1800, true], [7, 8, 1300, true]]);
  });
  it("lee la clave v1 si no hay v2, y al guardar no la toca", () => {
    const { mem, kv } = memKV();
    mem[LEGACY_KEYS[0]] = JSON.stringify(v1Progress());
    const p = load(kv, T0);
    expect(p.items["f:7x8"].history).toHaveLength(3);
    save(p, kv);
    expect(JSON.parse(mem[STORAGE_KEY]).version).toBe(2);
    expect(JSON.parse(mem[LEGACY_KEYS[0]]).version).toBe(1); // la copia v1 sigue ahí
  });
  it("prefiere v2 sobre v1", () => {
    const { mem, kv } = memKV();
    mem[LEGACY_KEYS[0]] = JSON.stringify(v1Progress());
    const p2 = emptyProgress(T0);
    p2.stats.answers = 999;
    mem[STORAGE_KEY] = JSON.stringify(p2);
    expect(load(kv, T0).stats.answers).toBe(999);
  });
  it("si v2 está dañado, cae a v1 en vez de partir de cero", () => {
    const { mem, kv } = memKV();
    mem[STORAGE_KEY] = "{roto";
    mem[LEGACY_KEYS[0]] = JSON.stringify(v1Progress());
    expect(load(kv, T0).stats.answers).toBe(61);
  });
  it("migrar dos veces da lo mismo", () => {
    const once = migrate(v1Progress(), T0);
    expect(migrate(JSON.parse(JSON.stringify(once)), T0 + 5 * DAY)).toEqual(once);
  });
  it("valida ajustes fuera de rango", () => {
    const p = migrate({ settings: { sessionLength: 9999, sound: "sí", theme: "rosado" } }, T0);
    expect(p.settings).toEqual({ sessionLength: 25, sound: true, theme: "sistema" });
  });
});

describe("registro de tiempos", () => {
  const e = (i: number): LogEntry => ({ at: T0 + i, key: "f:7x8", a: 7, b: 8, ms: 1000 + i, ok: true, mode: "review" });
  it("agrega sin mutar", () => {
    const a: LogEntry[] = [];
    const b = appendLog(a, e(1));
    expect(a).toHaveLength(0);
    expect(b).toEqual([e(1)]);
  });
  it("respeta el máximo, botando lo más antiguo", () => {
    let log: LogEntry[] = Array.from({ length: LOG_MAX }, (_, i) => e(i));
    log = appendLog(log, e(LOG_MAX));
    expect(log).toHaveLength(LOG_MAX);
    expect(log[0].at).toBe(T0 + 1);
    expect(log[log.length - 1].at).toBe(T0 + LOG_MAX);
  });
  it("descarta entradas mal formadas al migrar", () => {
    const p = migrate({ version: 2, log: [e(1), { at: "x" }, { ...e(2), mode: "otro" }, { ...e(3), retry: true }] }, T0);
    expect(p.log).toEqual([e(1), { ...e(3), retry: true }]);
  });
});

describe("deshacer importación", () => {
  it("guarda y recupera la copia", () => {
    const { mem, kv } = memKV();
    const p = emptyProgress(T0);
    p.stats.answers = 42;
    expect(saveUndo(p, kv)).toBe(true);
    expect(mem[UNDO_KEY]).toBeTruthy();
    expect(loadUndo(kv)?.progress.stats.answers).toBe(42);
  });
  it("sin copia devuelve null", () => {
    expect(loadUndo(memKV().kv)).toBeNull();
  });
  it("si el almacenamiento falla, save avisa con false", () => {
    const kv = { getItem: () => null, setItem: () => { throw new Error("lleno"); } };
    expect(save(emptyProgress(T0), kv)).toBe(false);
  });
});

describe("deshacer solo si no se practicó después", () => {
  it("bloquea deshacer cuando hay respuestas posteriores a la importación", async () => {
    const { canUndo } = await import("../src/core/storage");
    const p = emptyProgress(T0);
    const u = { savedAt: T0 + 10 };
    expect(canUndo(p, null)).toBe(false);
    expect(canUndo(p, u)).toBe(true);
    p.log.push({ at: T0 + 5, key: "f:2x2", a: 2, b: 2, ms: 500, ok: true, mode: "review" }); // importada, anterior
    expect(canUndo(p, u)).toBe(true);
    p.log.push({ at: T0 + 20, key: "f:2x2", a: 2, b: 2, ms: 500, ok: true, mode: "review" }); // practicó después
    expect(canUndo(p, u)).toBe(false);
  });
});
