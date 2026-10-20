// Hechos del Arsenal: multiplicaciones que se deben recordar, no calcular.
// Cada hecho trae una "estrategia de respaldo" para cuando no sale de memoria.

export type TierId = "A1" | "A2" | "A3" | "A4";

export interface Fact {
  id: string; // "f:7x8" con a <= b
  a: number;
  b: number;
  answer: number;
  tier: TierId;
}

export interface Tier {
  id: TierId;
  name: string;
  description: string;
  targetMs: number; // tiempo objetivo para "Fluido"
}

export const TIERS: Tier[] = [
  { id: "A1", name: "Tablas del 2 al 9", description: "36 hechos. Memoria pura.", targetMs: 1500 },
  { id: "A2", name: "11–19 × 2–9", description: "72 hechos. Decena + unidades.", targetMs: 3000 },
  { id: "A3", name: "11–19 × 11–19", description: "45 hechos. Decenas iguales.", targetMs: 3000 },
  { id: "A4", name: "Cuadrados 20–30", description: "11 hechos. Arriba-abajo.", targetMs: 3000 },
];

const make = (a: number, b: number, tier: TierId): Fact => {
  const [x, y] = a <= b ? [a, b] : [b, a];
  return { id: `f:${x}x${y}`, a: x, b: y, answer: x * y, tier };
};

function buildFacts(): Fact[] {
  const out: Fact[] = [];
  for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) out.push(make(a, b, "A1"));
  for (let t = 11; t <= 19; t++) for (let d = 2; d <= 9; d++) out.push(make(d, t, "A2"));
  for (let a = 11; a <= 19; a++) for (let b = a; b <= 19; b++) out.push(make(a, b, "A3"));
  for (let n = 20; n <= 30; n++) out.push(make(n, n, "A4"));
  return out;
}

export const FACTS: Fact[] = buildFacts();
export const FACT_BY_ID: Record<string, Fact> = Object.fromEntries(FACTS.map((f) => [f.id, f]));

export const factsOfTier = (tier: TierId) => FACTS.filter((f) => f.tier === tier);

/** Formato chileno: miles con punto. */
export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export interface Strategy {
  name: string;
  steps: string[]; // cada paso es una línea de la cuenta
}

/**
 * Estrategia de respaldo para un hecho. Se elige la más simple disponible.
 * Toda estrategia termina en el resultado correcto (lo prueba tests/facts.test.ts).
 */
export function strategyFor(a: number, b: number): Strategy {
  const [x, y] = a <= b ? [a, b] : [b, a];
  const r = x * y;

  // Cuadrados 20–30: (n + d)(n − d) + d²
  if (x === y && x >= 20) {
    const base = Math.round(x / 10) * 10;
    const d = Math.abs(x - base);
    if (d === 0) return { name: "Decena exacta", steps: [`${x} × ${x} = ${fmt(r)}`] };
    const up = x > base ? x + d : x - d;
    return {
      name: "Arriba-abajo",
      steps: [`${x}² = ${base} × ${up} + ${d}²`, `= ${fmt(base * up)} + ${d * d}`, `= ${fmt(r)}`],
    };
  }

  // 11–19 × 11–19: decenas iguales → (x + u_y) × 10 + u_x × u_y
  if (x >= 11 && y >= 11) {
    const ux = x - 10, uy = y - 10;
    return {
      name: "Decenas iguales",
      steps: [`(${x} + ${uy}) × 10 + ${ux} × ${uy}`, `= ${(x + uy) * 10} + ${ux * uy}`, `= ${fmt(r)}`],
    };
  }

  // 11–19 × dígito: 10 × d + u × d
  if (y >= 11) {
    const u = y - 10;
    return {
      name: "Decena + unidades",
      steps: [`${y} × ${x} = 10 × ${x} + ${u} × ${x}`, `= ${10 * x} + ${u * x}`, `= ${r}`],
    };
  }

  // 2–9 × 2–9: elegir el factor más fácil
  const has = (n: number) => x === n || y === n;
  const other = (n: number) => (x === n ? y : x);

  if (has(2)) { const o = other(2); return { name: "Doble", steps: [`el doble de ${o}`, `= ${r}`] }; }
  if (has(5)) { const o = other(5); return { name: "Mitad de ×10", steps: [`${o} × 10 ÷ 2`, `= ${o * 10} ÷ 2`, `= ${r}`] }; }
  if (has(9)) { const o = other(9); return { name: "×10 menos uno", steps: [`${o} × 10 − ${o}`, `= ${o * 10} − ${o}`, `= ${r}`] }; }
  if (has(4)) { const o = other(4); return { name: "Doble del doble", steps: [`${o} → ${o * 2} → ${o * 4}`, `= ${r}`] }; }
  if (has(3)) { const o = other(3); return { name: "Doble + uno más", steps: [`${o} × 2 + ${o}`, `= ${o * 2} + ${o}`, `= ${r}`] }; }
  if (has(6)) { const o = other(6); return { name: "×5 + uno más", steps: [`${o} × 5 + ${o}`, `= ${o * 5} + ${o}`, `= ${r}`] }; }
  if (has(8)) { const o = other(8); return { name: "Doblar tres veces", steps: [`${o} → ${o * 2} → ${o * 4} → ${o * 8}`, `= ${r}`] }; }
  // solo queda 7 × 7
  return { name: "×5 + ×2", steps: [`7 × 5 + 7 × 2`, `= 35 + 14`, `= 49`] };
}

/** Resultado numérico del último paso de una estrategia (para tests). */
export function strategyResult(s: Strategy): number {
  const last = s.steps[s.steps.length - 1];
  const m = last.replace(/\./g, "").match(/(\d+)\s*$/);
  return m ? Number(m[1]) : NaN;
}
