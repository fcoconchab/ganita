import { describe, expect, it } from "vitest";
import { backupFileName, importDelta, mergeItem, mergeProgress, parseBackup, summarize, toBackup } from "../src/core/backup";
import { DAY, HISTORY_MAX, newItem, review, type ItemState } from "../src/core/srs";
import { LOG_MAX, emptyProgress, migrate, type LogEntry, type Progress } from "../src/core/storage";
import { rng } from "../src/core/session";
import { FACTS } from "../src/core/facts";

const T0 = Date.UTC(2026, 9, 20, 12);

/** Progreso simulado: n respuestas a hechos al azar desde `start`. */
function simulate(seed: number, n: number, start: number): Progress {
  const rand = rng(seed);
  const p = emptyProgress(start);
  for (let i = 0; i < n; i++) {
    const f = FACTS[Math.floor(rand() * 36)];
    const at = start + i * 37_000 + Math.floor(rand() * 1000);
    const ok = rand() > 0.15;
    const ms = 600 + Math.floor(rand() * 5000);
    p.items[f.id] = review(p.items[f.id] ?? newItem(at), { ok, ms, at }, 1500);
    p.log.push({ at, key: f.id, a: f.a, b: f.b, ms, ok, mode: "review" });
    const d = new Date(at).toISOString().slice(0, 10);
    if (!p.stats.days.includes(d)) p.stats.days.push(d);
  }
  p.stats.answers = n;
  p.stats.sessions = Math.ceil(n / 25);
  return p;
}

const attempts = (p: Progress) =>
  Object.entries(p.items).flatMap(([k, s]) => s.history.map((h) => `${k}|${h.at}|${h.ms}|${h.ok}`)).sort();

describe("exportar e importar", () => {
  it("ida y vuelta exacta", () => {
    const p = simulate(1, 300, T0);
    p.lessons.x11 = { completedAt: T0, bestBoss: 9 };
    p.settings = { sessionLength: 40, sound: false, haptics: false, theme: "claro" };
    p.meta.lastBackupAt = T0 + DAY;
    const r = parseBackup(toBackup(p, T0 + 2 * DAY));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.progress).toEqual(p);
    expect(r.exportedAt).toBe(T0 + 2 * DAY);
  });
  it("acepta el progreso v1 suelto", () => {
    const v1 = { version: 1, items: { "f:3x4": review(newItem(T0), { ok: true, ms: 900, at: T0 }, 1500) }, lessons: {}, stats: { days: [], sessions: 1, answers: 1 }, settings: { sessionLength: 25, sound: true } };
    const r = parseBackup(JSON.stringify(v1));
    expect(r.ok && r.progress.items["f:3x4"].history).toHaveLength(1);
  });
  it("tolera el BOM al inicio del archivo", () => {
    expect(parseBackup("﻿" + toBackup(emptyProgress(T0), T0)).ok).toBe(true);
  });
  it("rechaza archivos ajenos con un mensaje claro", () => {
    for (const txt of ["hola", "[]", "{}", '{"app":"otra"}', "null"]) {
      const r = parseBackup(txt);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/Ganita|archivo/);
    }
  });
  it("rechaza respaldos de una versión futura", () => {
    const r = parseBackup(JSON.stringify({ app: "ganita", kind: "respaldo", format: 3, exportedAt: T0, progress: {} }));
    expect(r.ok).toBe(false);
  });
  it("nombre del archivo con fecha y hora local", () => {
    const t = new Date(2026, 9, 20, 9, 5).getTime();
    expect(backupFileName(t)).toBe("ganita-respaldo-2026-10-20-0905.json");
    expect(backupFileName(t, "csv", "tiempos")).toBe("ganita-tiempos-2026-10-20-0905.csv");
  });
});

describe("fusionar sin perder datos", () => {
  const a = simulate(2, 200, T0);
  const b = simulate(3, 250, T0 + 3 * DAY);

  it("importar en un teléfono vacío restaura todo", () => {
    const m = mergeProgress(emptyProgress(T0 + 9 * DAY), a);
    expect(m.items).toEqual(a.items);
    expect(m.log).toEqual(a.log);
    expect(m.stats).toEqual(a.stats);
    expect(m.meta.createdAt).toBe(T0);
  });
  it("es idempotente: importar dos veces el mismo archivo no cambia nada", () => {
    const once = mergeProgress(a, b);
    expect(mergeProgress(once, b)).toEqual(once);
    expect(mergeProgress(a, a)).toEqual(a);
  });
  it("no pierde ningún intento ni respuesta del registro", () => {
    const m = mergeProgress(a, b);
    const all = new Set(attempts(m));
    // todo intento de a y b está, salvo los que exceden el máximo por ítem
    for (const p of [a, b]) {
      for (const [k, s] of Object.entries(p.items)) {
        const kept = m.items[k].history;
        const oldestKept = kept[0].at;
        s.history.filter((h) => h.at >= oldestKept).forEach((h) => expect(all.has(`${k}|${h.at}|${h.ms}|${h.ok}`)).toBe(true));
        expect(kept.length).toBe(Math.min(HISTORY_MAX, new Set([...a.items[k]?.history ?? [], ...(b.items[k]?.history ?? [])].map((h) => `${h.at}|${h.ms}|${h.ok}`)).size));
      }
    }
    expect(m.log).toHaveLength(a.log.length + b.log.length); // el registro no tiene máximo por ítem
    expect(m.stats.days).toEqual([...new Set([...a.stats.days, ...b.stats.days])].sort());
  });
  it("el orden no importa para intentos, registro y días", () => {
    const ab = mergeProgress(a, b), ba = mergeProgress(b, a);
    expect(attempts(ab)).toEqual(attempts(ba));
    expect(ab.log).toEqual(ba.log);
    expect(ab.stats).toEqual(ba.stats);
    expect(ab.lessons).toEqual(ba.lessons);
  });
  it("el estado de repaso viene del lado con el intento más reciente", () => {
    const old: ItemState = review(newItem(T0), { ok: true, ms: 900, at: T0 }, 1500);
    const recent: ItemState = review(review(newItem(T0), { ok: true, ms: 900, at: T0 }, 1500), { ok: false, ms: 2000, at: T0 + DAY }, 1500);
    for (const m of [mergeItem(old, recent), mergeItem(recent, old)]) {
      expect(m.interval).toBe(recent.interval);
      expect(m.due).toBe(recent.due);
      expect(m.lapses).toBe(1);
      expect(m.history).toHaveLength(2);
    }
  });
  it("lecciones: primera fecha y mejor jefe", () => {
    const x = emptyProgress(T0), y = emptyProgress(T0);
    x.lessons.x11 = { completedAt: T0 + DAY, bestBoss: 10 };
    y.lessons.x11 = { completedAt: T0, bestBoss: 9 };
    expect(mergeProgress(x, y).lessons.x11).toEqual({ completedAt: T0, bestBoss: 10 });
  });
  it("mantiene los ajustes de este teléfono", () => {
    const x = emptyProgress(T0), y = emptyProgress(T0);
    x.settings.theme = "oscuro";
    y.settings = { sessionLength: 10, sound: false, haptics: false, theme: "claro" };
    expect(mergeProgress(x, y).settings).toEqual(x.settings);
  });
  it("el registro fusionado respeta el máximo", () => {
    const mk = (i: number): LogEntry => ({ at: i, key: "f:2x2", a: 2, b: 2, ms: 500, ok: true, mode: "review" });
    const x = emptyProgress(0), y = emptyProgress(0);
    x.log = Array.from({ length: LOG_MAX }, (_, i) => mk(i));
    y.log = Array.from({ length: 10 }, (_, i) => mk(LOG_MAX + i));
    const m = mergeProgress(x, y);
    expect(m.log).toHaveLength(LOG_MAX);
    expect(m.log[m.log.length - 1].at).toBe(LOG_MAX + 9);
  });
  it("resumen y delta para mostrar antes de importar", () => {
    const s = summarize(a);
    expect(s.answers).toBe(200);
    expect(s.factsSeen).toBe(Object.keys(a.items).length);
    expect(s.lastActivity).toBe(a.log[a.log.length - 1].at);
    const d = importDelta(a, b);
    expect(d.newLog).toBe(250);
    expect(importDelta(d.merged, b).newLog).toBe(0);
    expect(summarize(emptyProgress(T0)).lastActivity).toBeNull();
  });
  it("un respaldo v1 importado sobre v2 no duplica tiempos ya registrados como 'previo'", () => {
    const v1 = { version: 1, items: { "f:3x4": review(newItem(T0), { ok: true, ms: 900, at: T0 }, 1500) }, lessons: {}, stats: { days: [], sessions: 1, answers: 1 }, settings: {} };
    const here = migrate(v1, T0);
    const m = mergeProgress(here, migrate(v1, T0 + DAY));
    expect(m.log).toHaveLength(1);
  });
});
