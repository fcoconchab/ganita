import { describe, expect, it } from "vitest";
import { DAY, gradeFor, newItem, review } from "../src/core/srs";
import { rankOf } from "../src/core/mastery";

const T0 = Date.UTC(2026, 9, 20, 12);

describe("repaso espaciado", () => {
  it("califica por tiempo", () => {
    expect(gradeFor(false, 500, 1500)).toBe("again");
    expect(gradeFor(true, 1200, 1500)).toBe("easy");
    expect(gradeFor(true, 2500, 1500)).toBe("good");
    expect(gradeFor(true, 4000, 1500)).toBe("hard");
  });
  it("los intervalos crecen con aciertos y se reinician con un error", () => {
    let s = newItem(T0);
    s = review(s, { ok: true, ms: 2000, at: T0 }, 1500);
    expect(s.interval).toBe(1);
    s = review(s, { ok: true, ms: 2000, at: T0 + DAY }, 1500);
    expect(s.interval).toBe(3);
    s = review(s, { ok: true, ms: 2000, at: T0 + 4 * DAY }, 1500);
    expect(s.interval).toBe(7.5);
    const before = s.ease;
    s = review(s, { ok: false, ms: 2000, at: T0 + 12 * DAY }, 1500);
    expect(s.interval).toBe(0);
    expect(s.reps).toBe(0);
    expect(s.lapses).toBe(1);
    expect(s.ease).toBeCloseTo(before - 0.2);
    expect(s.due).toBe(T0 + 12 * DAY);
  });
  it("ejemplo de la arquitectura: intervalo 6, facilidad 2,5", () => {
    const s = { ...newItem(T0), interval: 6, reps: 3, ease: 2.5 };
    expect(review(s, { ok: true, ms: 2000, at: T0 }, 1500).interval).toBe(15);
    expect(review(s, { ok: true, ms: 1000, at: T0 }, 1500).interval).toBe(19.5);
    expect(review(s, { ok: true, ms: 5000, at: T0 }, 1500).interval).toBe(7.2);
  });
  it("la facilidad se mantiene entre 1,3 y 2,8", () => {
    let s = newItem(T0);
    for (let i = 0; i < 20; i++) s = review(s, { ok: false, ms: 1, at: T0 }, 1500);
    expect(s.ease).toBe(1.3);
    for (let i = 0; i < 20; i++) s = review(s, { ok: true, ms: 1, at: T0 }, 1500);
    expect(s.ease).toBe(2.8);
  });
  it("guarda como máximo 12 intentos", () => {
    let s = newItem(T0);
    for (let i = 0; i < 30; i++) s = review(s, { ok: true, ms: 1000, at: T0 }, 1500);
    expect(s.history).toHaveLength(12);
  });
});

describe("rangos", () => {
  const withHist = (ms: number[], ok = true, interval = 3) => ({
    ...newItem(T0), interval, history: ms.map((m) => ({ ok, ms: m, at: T0 })),
  });
  it("calcula el rango con los últimos 3 intentos", () => {
    expect(rankOf(undefined)).toBe("nuevo");
    expect(rankOf(withHist([1000, 1000]))).toBe("fluido"); // provisorio
    expect(rankOf(withHist([1000, 1000]), 3000, true)).toBe("aprendiz"); // estricto
    expect(rankOf(withHist([5000]))).toBe("aprendiz");
    expect(rankOf(withHist([1000, 1000, 1000], false))).toBe("aprendiz");
    expect(rankOf(withHist([4000, 4000, 4000]))).toBe("aprendiz");
    expect(rankOf(withHist([2000, 2500, 2900]))).toBe("fluido");
    expect(rankOf(withHist([900, 1000, 1400]))).toBe("automatico");
    expect(rankOf(withHist([900, 1000, 1400], true, 21))).toBe("maquina");
  });
});

describe("reintento después de un error", () => {
  it("acierto: vuelve mañana, sin entrar al historial ni subir la facilidad", async () => {
    const { relearn } = await import("../src/core/srs");
    let s = review(newItem(T0), { ok: true, ms: 1000, at: T0 }, 1500);
    s = review(s, { ok: false, ms: 2500, at: T0 + 2 * DAY }, 1500); // error: intervalo 0
    const lapsed = s;
    const r = relearn(s, { ok: true, ms: 600, at: T0 + 2 * DAY + 60_000 });
    expect(r.interval).toBe(1);
    expect(r.due).toBe(T0 + 3 * DAY + 60_000);
    expect(r.ease).toBe(lapsed.ease);
    expect(r.history).toEqual(lapsed.history);
    expect(r.lapses).toBe(lapsed.lapses);
    // al día siguiente, un acierto normal salta a 3 días (no se queda en 1)
    expect(review(r, { ok: true, ms: 2000, at: T0 + 3 * DAY }, 1500).interval).toBe(3);
  });
  it("antes: un reintento rápido daba 2 días como si se supiera de memoria", () => {
    let s = review(newItem(T0), { ok: false, ms: 2500, at: T0 }, 1500);
    s = review(s, { ok: true, ms: 600, at: T0 + 60_000 }, 1500);
    expect(s.interval).toBe(2); // por eso los reintentos pasan por relearn
  });
  it("error en el reintento: sigue vencido y no castiga dos veces", async () => {
    const { relearn } = await import("../src/core/srs");
    const s = review(newItem(T0), { ok: false, ms: 2500, at: T0 }, 1500);
    const r = relearn(s, { ok: false, ms: 900, at: T0 + 60_000 });
    expect(r.due).toBe(T0 + 60_000);
    expect(r.ease).toBe(s.ease);
    expect(r.lapses).toBe(1);
    expect(r.history).toHaveLength(1);
  });
});
