import { describe, expect, it } from "vitest";
import { BUCKET_LABELS, BUCKETS, isCalibrationEntry, logToCSV, quantile, statsOf, timingReport } from "../src/core/timing";
import type { LogEntry } from "../src/core/storage";

const T0 = new Date(2026, 9, 20, 15, 41, 3).getTime();
const DAY = 86_400_000;
const e = (key: string, ms: number, ok = true, extra: Partial<LogEntry> = {}): LogEntry => {
  const m = key.match(/^f:(\d+)x(\d+)$/);
  return { at: T0, key, a: m ? +m[1] : 72, b: m ? +m[2] : 11, ms, ok, mode: "review", ...extra };
};

describe("cuantiles", () => {
  it("interpolación lineal (igual que numpy por defecto)", () => {
    const xs = [1000, 1200, 1500, 2100, 3000];
    expect(quantile(xs, 0.5)).toBe(1500);
    expect(quantile(xs, 0.25)).toBe(1200);
    expect(quantile(xs, 0.9)).toBe(2640); // 2100 + 0,6 × 900
    expect(quantile([800], 0.9)).toBe(800);
    expect(quantile([], 0.5)).toBeNaN();
  });
});

describe("estadísticas de tiempos", () => {
  it("histograma por tramos y fracciones bajo los umbrales", () => {
    const s = statsOf([e("f:2x3", 900), e("f:2x3", 1000), e("f:2x3", 1500), e("f:2x3", 2500), e("f:2x3", 6000), e("f:2x3", 700, false)]);
    expect(BUCKET_LABELS).toHaveLength(BUCKETS.length);
    expect(s.histogram).toEqual([1, 1, 1, 1, 0, 1]); // <1 · 1–1,5 · 1,5–2 · 2–3 · 3–5 · >5
    expect(s.n).toBe(6);
    expect(s.correct).toBe(5);
    expect(s.accuracy).toBeCloseTo(5 / 6);
    expect(s.underFast).toBeCloseTo(3 / 5); // 900, 1000, 1500 (el umbral cuenta como rápido)
    expect(s.underFluent).toBeCloseTo(4 / 5);
    expect(s.p50).toBe(1500); // solo aciertos
  });
  it("sin datos no inventa números", () => {
    const s = statsOf([]);
    expect(s.n).toBe(0);
    expect(s.p50).toBeNaN();
    expect(s.underFast).toBeNaN();
  });
});

describe("informe de calibración", () => {
  it("usa solo primeros intentos de hechos", () => {
    expect(isCalibrationEntry(e("f:7x8", 1000))).toBe(true);
    expect(isCalibrationEntry(e("f:7x8", 1000, true, { retry: true }))).toBe(false);
    expect(isCalibrationEntry(e("f:7x8", 1000, false, { skip: true }))).toBe(false);
    expect(isCalibrationEntry(e("f:7x8", 1000, true, { mode: "previo" }))).toBe(false);
    expect(isCalibrationEntry(e("s:x11", 1000))).toBe(false);
    expect(isCalibrationEntry(e("f:1x99", 1000))).toBe(false); // clave inexistente
  });
  it("separa por nivel y por cifras de la respuesta", () => {
    const log = [e("f:2x3", 800), e("f:7x8", 1600), e("f:7x8", 1800), e("f:8x13", 2600), e("f:13x17", 4100), e("f:25x25", 5200)];
    const r = timingReport(log, T0);
    expect(r.byTier.A1.n).toBe(3);
    expect(r.byTier.A2.n).toBe(1);
    expect(r.byTier.A3.n).toBe(1);
    expect(r.byTier.A4.n).toBe(1);
    // 6 → 1 cifra; 56, 56 → 2; 104, 221, 625 → 3
    expect(r.byDigits.map((d) => [d.digits, d.stats.n])).toEqual([[1, 1], [2, 2], [3, 3]]);
    expect(r.byDigits[1].stats.p50).toBe(1700);
  });
  it("listo para calibrar con 14 días y 300 respuestas", () => {
    const log = Array.from({ length: 300 }, (_, i) => ({ ...e("f:7x8", 1200), at: T0 + (i % 15) * DAY }));
    expect(timingReport(log, T0 + 13 * DAY).ready).toBe(false);
    const r = timingReport(log, T0 + 14 * DAY);
    expect(r.ready).toBe(true);
    expect(r.days).toBe(15);
    expect(timingReport(log.slice(0, 299), T0 + 30 * DAY).ready).toBe(false);
  });
});

describe("planilla", () => {
  it("punto y coma, ms enteros, BOM para Excel", () => {
    const csv = logToCSV([e("f:7x8", 1234.4), e("f:7x8", 2000, false, { retry: true, mode: "diagnostic" }), e("s:x11", 3500)]);
    expect(csv.startsWith("﻿")).toBe(true);
    const lines = csv.slice(1).trim().split("\r\n");
    expect(lines[0]).toBe("fecha_hora;clave;nivel;a;b;respuesta;correcto;ms;modo;reintento;no_se");
    expect(lines[1]).toBe("2026-10-20 15:41:03;f:7x8;A1;7;8;56;1;1234;sesion;0;0");
    expect(lines[2]).toBe("2026-10-20 15:41:03;f:7x8;A1;7;8;56;0;2000;diagnostico;1;0");
    expect(lines[3]).toBe("2026-10-20 15:41:03;s:x11;;72;11;792;1;3500;sesion;0;0");
  });
});
