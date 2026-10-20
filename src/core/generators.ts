// Generadores de problemas por habilidad. Cada uno devuelve un problema nuevo
// con su respuesta, usando un generador aleatorio inyectable (para tests).
import { fmt } from "./facts";

/** Parte de la ayuda de la práctica guiada: texto normal o destacado. */
export type HintPart = string | { hl: string };

export interface Problem {
  a: number;
  /** segundo factor; en un cuadrado es igual a `a` */
  b: number;
  /** "×" se muestra a × b; "²" se muestra a² */
  op: "×" | "²";
  answer: number;
  /** Cómo se resuelve con la técnica, paso a paso. El último es "= resultado". */
  steps: string[];
  /** Ayuda visible antes de responder en la práctica guiada. */
  hint: HintPart[];
}

/**
 * `hard` elige el caso: false = el del truco, true = el de la regla completa.
 * Sin `hard`, el generador mezcla ambos.
 */
export type Generator = (rand: () => number, opts?: { hard?: boolean }) => Problem;

const int = (rand: () => number, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = <T,>(rand: () => number, xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
const pad2 = (n: number) => String(n).padStart(2, "0");

/** Repite hasta cumplir `ok` (máximo 200 intentos; siempre hay casos válidos). */
function draw(make: () => number, ok: (n: number) => boolean): number {
  let n = make();
  for (let i = 0; i < 200 && !ok(n); i++) n = make();
  return n;
}

// ---------------------------------------------------------------- ×11

/** ×11 de 2 cifras: d1 | d1+d2 | d2, llevando si la suma pasa de 9. */
export function x11Steps(n: number): string[] {
  const t = Math.floor(n / 10), u = n % 10, s = t + u;
  if (s < 10) return [`${t} | ${t} + ${u} | ${u}`, `${t} | ${s} | ${u}`, `= ${n * 11}`];
  return [`${t} | ${t} + ${u} | ${u}`, `${t} | ${s} | ${u}`, `se lleva 1: ${t + 1} | ${s - 10} | ${u}`, `= ${n * 11}`];
}

export const hasCarry11 = (n: number) => Math.floor(n / 10) + (n % 10) >= 10;

export const x11: Generator = (rand, opts = {}) => {
  const n = draw(() => int(rand, 12, 99), (k) => k % 10 !== 0 && (opts.hard === undefined || hasCarry11(k) === opts.hard));
  const t = Math.floor(n / 10), u = n % 10;
  return {
    a: n, b: 11, op: "×", answer: n * 11, steps: x11Steps(n),
    hint: [{ hl: String(t) }, "·", `${t} + ${u} = ${t + u}`, "·", { hl: String(u) }],
  };
};

// ---------------------------------------------------------------- ×5, ×25, ×125

/** ×5 = ×10 ÷ 2 · ×25 = ×100 ÷ 4 · ×125 = ×1000 ÷ 8 */
export const QUARTERS = [
  { m: 5, zeros: 1, div: 2, halves: 1 },
  { m: 25, zeros: 2, div: 4, halves: 2 },
  { m: 125, zeros: 3, div: 8, halves: 3 },
] as const;

const quarterOf = (m: number) => QUARTERS.find((q) => q.m === m)!;

/** Caso del truco: el número se divide justo y después se agregan los ceros. */
export const x5Exact = (n: number, m: number) => n % quarterOf(m).div === 0;

/** Rangos: ×5 de 12 a 198 · ×25 de 12 a 99 · ×125 pares de 8 a 96. Nunca múltiplos de 10. */
export function x5Valid(n: number, m: number): boolean {
  if (n % 10 === 0) return false;
  if (m === 5) return n >= 12 && n <= 198;
  if (m === 25) return n >= 12 && n <= 99;
  return n >= 8 && n <= 96 && n % 2 === 0;
}

export function x5Steps(n: number, m: number): string[] {
  const q = quarterOf(m);
  const ans = n * m;
  const zeros = "0".repeat(q.zeros);
  if (x5Exact(n, m)) {
    const k = n / q.div;
    return [`${n} ÷ ${q.div} = ${k}`, `agrega ${zeros}`, `= ${fmt(ans)}`];
  }
  const out = [`${n} con ${zeros}: ${fmt(n * 10 ** q.zeros)}`];
  let v = n * 10 ** q.zeros;
  for (let h = 0; h < q.halves; h++) {
    v /= 2;
    out.push(`mitad: ${fmt(v)}`);
  }
  out.push(`= ${fmt(ans)}`);
  return out;
}

export const x5: Generator = (rand, opts = {}) => {
  const q = pick(rand, QUARTERS);
  const n = draw(() => (q.m === 5 ? int(rand, 12, 198) : q.m === 25 ? int(rand, 12, 99) : 2 * int(rand, 4, 48)),
    (k) => x5Valid(k, q.m) && (opts.hard === undefined || x5Exact(k, q.m) !== opts.hard));
  const zeros = "0".repeat(q.zeros);
  const hint: HintPart[] = x5Exact(n, q.m)
    ? [{ hl: `${n} ÷ ${q.div} = ${n / q.div}` }, "·", `agrega ${zeros}`]
    : [`${fmt(n * 10 ** q.zeros)}`, "·", { hl: Array(q.halves).fill("mitad").join(", ") }];
  return { a: n, b: q.m, op: "×", answer: n * q.m, steps: x5Steps(n, q.m), hint };
};

// ---------------------------------------------------------------- ×9, ×99

/** ×99 de 2 cifras: (n − 1) | (100 − n), siempre con 2 cifras a la derecha. */
export function x99Steps(n: number): string[] {
  return [`${n} − 1 = ${n - 1}`, `100 − ${n} = ${pad2(100 - n)}`, `pega: ${n - 1} | ${pad2(100 - n)}`, `= ${fmt(n * 99)}`];
}

/** ×9: por 10 y restar el número. */
export function x9Steps(n: number): string[] {
  return [`${n} × 10 = ${fmt(n * 10)}`, `${fmt(n * 10)} − ${n}`, `= ${fmt(n * 9)}`];
}

/** hard = false: ×99 (el truco) · hard = true: ×9 (la regla completa). */
export const x9: Generator = (rand, opts = {}) => {
  const nine = opts.hard ?? rand() < 0.5;
  if (nine) {
    const n = draw(() => int(rand, 12, 99), (k) => k % 10 !== 0);
    return { a: n, b: 9, op: "×", answer: n * 9, steps: x9Steps(n), hint: [{ hl: `${fmt(n * 10)} − ${n}` }] };
  }
  const n = int(rand, 12, 99);
  return { a: n, b: 99, op: "×", answer: n * 99, steps: x99Steps(n), hint: [{ hl: String(n - 1) }, "|", `100 − ${n}`] };
};

// ---------------------------------------------------------------- cuadrados terminados en 5

/** (10a + 5)² = a × (a + 1) | 25 */
export function sq5Steps(n: number): string[] {
  const a = (n - 5) / 10;
  return [`${a} × ${a + 1} = ${a * (a + 1)}`, "pega 25", `= ${fmt(n * n)}`];
}

/** hard = false: 15 a 95 · hard = true: 105 a 195. */
export const sq5: Generator = (rand, opts = {}) => {
  const hard = opts.hard ?? rand() < 0.5;
  const a = hard ? int(rand, 10, 19) : int(rand, 1, 9);
  const n = 10 * a + 5;
  return { a: n, b: n, op: "²", answer: n * n, steps: sq5Steps(n), hint: [{ hl: `${a} × ${a + 1}` }, "·", "pega 25"] };
};

export const GENERATORS: Record<string, Generator> = {
  "mul.x11-y-x101": x11,
  "mul.x5-x25-x125": x5,
  "mul.x9-x99-x999": x9,
  "pot.cuadrados-terminados-en-5": sq5,
};
