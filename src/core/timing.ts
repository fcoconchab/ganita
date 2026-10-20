// Análisis del registro de tiempos para calibrar los umbrales (1,5 s y 3 s) con datos reales.
// Ver docs/ARQUITECTURA.md §5 y §6.
import { FACT_BY_ID, type TierId } from "./facts";
import type { LogEntry } from "./storage";

export const FAST_MS = 1500; // umbral de "rápido" / Automático en A1
export const FLUENT_MS = 3000; // umbral de Fluido

/** Tramos del histograma, en ms. El último es abierto. */
export const BUCKETS = [0, 1000, 1500, 2000, 3000, 5000] as const;
export const BUCKET_LABELS = ["< 1", "1–1,5", "1,5–2", "2–3", "3–5", "> 5"];

/** Para calibrar sirven solo los primeros intentos reales de hechos del Arsenal. */
export const isCalibrationEntry = (e: LogEntry) =>
  e.key.startsWith("f:") && !e.retry && !e.skip && e.mode !== "previo" && !!FACT_BY_ID[e.key];

/** Cuantil con interpolación lineal sobre una lista ya ordenada. */
export function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export interface TimeStats {
  n: number; // respuestas
  correct: number;
  accuracy: number; // 0..1
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  underFast: number; // aciertos bajo 1,5 s (fracción de los aciertos)
  underFluent: number; // aciertos bajo 3 s
  histogram: number[]; // aciertos por tramo
}

export function statsOf(entries: LogEntry[]): TimeStats {
  const ok = entries.filter((e) => e.ok).map((e) => e.ms).sort((a, b) => a - b);
  const histogram = BUCKETS.map((lo, i) => {
    const hi = i + 1 < BUCKETS.length ? BUCKETS[i + 1] : Infinity;
    return ok.filter((ms) => ms >= lo && ms < hi).length;
  });
  const share = (lim: number) => (ok.length ? ok.filter((ms) => ms <= lim).length / ok.length : NaN);
  return {
    n: entries.length,
    correct: ok.length,
    accuracy: entries.length ? ok.length / entries.length : NaN,
    p25: quantile(ok, 0.25),
    p50: quantile(ok, 0.5),
    p75: quantile(ok, 0.75),
    p90: quantile(ok, 0.9),
    underFast: share(FAST_MS),
    underFluent: share(FLUENT_MS),
    histogram,
  };
}

const digits = (n: number) => String(Math.abs(n)).length;

export interface TimingReport {
  all: TimeStats;
  byTier: Record<TierId, TimeStats>;
  /** Por cifras de la respuesta: separa cuánto pesa teclear. */
  byDigits: { digits: number; stats: TimeStats }[];
  days: number; // días distintos con datos
  firstAt: number | null;
  spanDays: number; // días desde la primera respuesta
  ready: boolean;
}

/** Datos mínimos para revisar los umbrales (ROADMAP: después de 2 semanas). */
export const READY_SPAN_DAYS = 14;
export const READY_ANSWERS = 300;

export function timingReport(log: LogEntry[], now: number): TimingReport {
  const es = log.filter(isCalibrationEntry);
  const byTier = {} as Record<TierId, TimeStats>;
  for (const t of ["A1", "A2", "A3", "A4"] as TierId[]) byTier[t] = statsOf(es.filter((e) => FACT_BY_ID[e.key].tier === t));
  const ds = [...new Set(es.map((e) => digits(FACT_BY_ID[e.key].answer)))].sort((a, b) => a - b);
  const firstAt = es.length ? Math.min(...es.map((e) => e.at)) : null;
  const dayOf = (t: number) => new Date(t).toDateString();
  const spanDays = firstAt === null ? 0 : Math.floor((now - firstAt) / 86_400_000);
  return {
    all: statsOf(es),
    byTier,
    byDigits: ds.map((d) => ({ digits: d, stats: statsOf(es.filter((e) => digits(FACT_BY_ID[e.key].answer) === d)) })),
    days: new Set(es.map((e) => dayOf(e.at))).size,
    firstAt,
    spanDays,
    ready: spanDays >= READY_SPAN_DAYS && es.length >= READY_ANSWERS,
  };
}

// ---------- exportar a planilla ----------

const pad = (n: number) => String(n).padStart(2, "0");
const localStamp = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const MODE_LABEL: Record<LogEntry["mode"], string> = {
  review: "sesion", diagnostic: "diagnostico", guided: "guiada", practice: "practica", boss: "jefe", previo: "previo",
};

/**
 * Planilla separada por punto y coma (así la abre Excel en Chile).
 * Tiempos en milisegundos enteros, para no chocar con la coma decimal.
 */
export function logToCSV(log: LogEntry[]): string {
  const head = ["fecha_hora", "clave", "nivel", "a", "b", "respuesta", "correcto", "ms", "modo", "reintento", "no_se"];
  const rows = log.map((e) => {
    const f = FACT_BY_ID[e.key];
    return [
      localStamp(e.at), e.key, f?.tier ?? "", e.a, e.b, e.a * e.b, e.ok ? 1 : 0, Math.round(e.ms),
      MODE_LABEL[e.mode], e.retry ? 1 : 0, e.skip ? 1 : 0,
    ].join(";");
  });
  return "﻿" + [head.join(";"), ...rows].join("\r\n") + "\r\n";
}
