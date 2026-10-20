// Arma la sesión diaria. Ver docs/ARQUITECTURA.md §8.
import { FACTS, TIERS, type Fact, type TierId, factsOfTier } from "./facts";
import { atLeast, median, rankOf } from "./mastery";
import { overdueDays, type ItemState } from "./srs";

export type Items = Record<string, ItemState>;

export interface Question {
  key: string; // id del ítem
  a: number; // en el orden que se muestra
  b: number;
  answer: number;
  isNew: boolean;
  steps?: string[]; // camino de la técnica (habilidades)
}

export const UNLOCK_SHARE = 0.8;

/** Niveles desbloqueados: A1 siempre; el siguiente cuando el 80% del anterior está Fluido o mejor. */
export function unlockedTiers(items: Items): TierId[] {
  const out: TierId[] = [];
  for (const t of TIERS) {
    out.push(t.id);
    const facts = factsOfTier(t.id);
    const good = facts.filter((f) => atLeast(rankOf(items[f.id], 3000, true), "fluido")).length;
    if (good / facts.length < UNLOCK_SHARE) break;
  }
  return out;
}

export const tierProgress = (items: Items, tier: TierId) => {
  const facts = factsOfTier(tier);
  const good = facts.filter((f) => atLeast(rankOf(items[f.id], 3000, true), "fluido")).length;
  return { good, total: facts.length, share: good / facts.length };
};

/** Generador pseudoaleatorio reproducible (para tests). */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const shuffle = <T,>(xs: T[], rand: () => number) => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const toQuestion = (f: Fact, isNew: boolean, rand: () => number): Question => {
  const flip = rand() < 0.5;
  return { key: f.id, a: flip ? f.b : f.a, b: flip ? f.a : f.b, answer: f.answer, isNew };
};

export interface SessionOptions {
  length?: number; // preguntas
  maxNew?: number;
  now?: number;
  seed?: number;
}

/**
 * 1. Vencidos (más atrasados primero), hasta 60% de la sesión.
 * 2. Nuevos del nivel desbloqueado más bajo que tenga nuevos, máximo maxNew.
 * 3. Relleno con los más lentos ya vistos.
 * El orden final se mezcla para intercalar.
 */
export function buildSession(items: Items, opts: SessionOptions = {}): Question[] {
  const length = opts.length ?? 25;
  const maxNew = opts.maxNew ?? 5;
  const now = opts.now ?? Date.now();
  const rand = rng(opts.seed ?? now);
  const tiers = new Set(unlockedTiers(items));
  const pool = FACTS.filter((f) => tiers.has(f.tier));

  const seen = pool.filter((f) => items[f.id]?.history.length);
  const unseen = pool.filter((f) => !items[f.id]?.history.length);

  const due = seen
    .filter((f) => overdueDays(items[f.id], now) >= 0)
    .sort((x, y) => overdueDays(items[y.id], now) - overdueDays(items[x.id], now));

  const picked: Fact[] = [];
  const add = (f: Fact) => { if (!picked.includes(f) && picked.length < length) picked.push(f); };

  due.slice(0, Math.ceil(length * 0.6)).forEach(add);
  const fresh = shuffle(unseen, rand).sort((x, y) => x.tier.localeCompare(y.tier)).slice(0, maxNew);
  fresh.forEach(add);

  const slowest = [...seen].sort((x, y) => {
    const mx = median(items[x.id].history.slice(-3).map((a) => (a.ok ? a.ms : 10_000)));
    const my = median(items[y.id].history.slice(-3).map((a) => (a.ok ? a.ms : 10_000)));
    return my - mx;
  });
  slowest.forEach(add);
  due.forEach(add);
  // Si aún falta (usuario nuevo con pocos vistos), completar con más nuevos.
  shuffle(unseen, rand).sort((x, y) => x.tier.localeCompare(y.tier)).forEach(add);

  return shuffle(picked, rand).map((f) => toQuestion(f, !items[f.id]?.history.length, rand));
}

/** Diagnóstico: todos los hechos de un nivel, en orden aleatorio. */
export function buildDiagnostic(tier: TierId, seed = Date.now()): Question[] {
  const rand = rng(seed);
  return shuffle(factsOfTier(tier), rand).map((f) => toQuestion(f, true, rand));
}

/** Posición donde reinsertar una pregunta fallada: 3 más adelante (o al final). */
export const requeueIndex = (current: number, total: number) => Math.min(current + 4, total);
