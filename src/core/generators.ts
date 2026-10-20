// Generadores de problemas por habilidad. Cada uno devuelve un problema nuevo
// con su respuesta, usando un generador aleatorio inyectable (para tests).

export interface Problem {
  a: number;
  b: number;
  op: "×";
  answer: number;
  /** Cómo se resuelve con la técnica, paso a paso. */
  steps: string[];
}

export type Generator = (rand: () => number, opts?: { carry?: boolean }) => Problem;

const int = (rand: () => number, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));

/** ×11 de 2 cifras: d1 | d1+d2 | d2, llevando si la suma pasa de 9. */
export function x11Steps(n: number): string[] {
  const t = Math.floor(n / 10), u = n % 10, s = t + u;
  if (s < 10) return [`${t} | ${t} + ${u} | ${u}`, `${t} | ${s} | ${u}`, `= ${n * 11}`];
  return [`${t} | ${t} + ${u} | ${u}`, `${t} | ${s} | ${u}`, `se lleva 1: ${t + 1} | ${s - 10} | ${u}`, `= ${n * 11}`];
}

export const hasCarry11 = (n: number) => Math.floor(n / 10) + (n % 10) >= 10;

export const x11: Generator = (rand, opts = {}) => {
  let n = 0;
  for (let i = 0; i < 50; i++) {
    n = int(rand, 12, 99);
    if (n % 10 === 0) continue;
    if (opts.carry === undefined || hasCarry11(n) === opts.carry) break;
  }
  return { a: n, b: 11, op: "×", answer: n * 11, steps: x11Steps(n) };
};

export const GENERATORS: Record<string, Generator> = {
  "mul.x11-y-x101": x11,
};
