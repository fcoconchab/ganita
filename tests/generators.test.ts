import { describe, expect, it } from "vitest";
import {
  GENERATORS, hasCarry11, sq5, sq5Steps, x11, x11Steps, x5, x5Exact, x5Steps, x5Valid, x9, x99Steps, x9Steps,
  type Problem,
} from "../src/core/generators";
import { rng } from "../src/core/session";

const num = (s: string) => Number(s.replace(/\./g, ""));

/**
 * Revisa la aritmética de cada paso escrito: toda igualdad "x op y = z"
 * se recalcula, cada "mitad" es la mitad de lo anterior y el último paso
 * es "= respuesta". Así ningún camino que ve el usuario puede estar mal.
 */
function checkSteps(p: Problem) {
  const last = p.steps[p.steps.length - 1];
  expect(num(last.replace("= ", ""))).toBe(p.answer);
  let prev: number | null = null;
  for (const s of p.steps) {
    const eq = s.match(/^([\d.]+) ([×÷−+]) ([\d.]+) = ([\d.]+)$/);
    if (eq) {
      const [x, y, z] = [num(eq[1]), num(eq[3]), num(eq[4])];
      const r = eq[2] === "×" ? x * y : eq[2] === "÷" ? x / y : eq[2] === "−" ? x - y : x + y;
      expect(r, s).toBe(z);
    }
    const half = s.match(/^mitad: ([\d.]+)$/);
    if (half) expect(num(half[1]) * 2, s).toBe(prev);
    const val = s.match(/([\d.]+)$/);
    if (val) prev = num(val[1]);
  }
}

describe("×11", () => {
  it("genera problemas correctos y respeta llevar / no llevar", () => {
    const r = rng(42);
    for (let i = 0; i < 300; i++) {
      const p = x11(r);
      expect(p.answer).toBe(p.a * 11);
      expect(p.a % 10).not.toBe(0);
      expect(p.a).toBeGreaterThanOrEqual(12);
      expect(p.a).toBeLessThanOrEqual(99);
    }
    for (let i = 0; i < 50; i++) expect(hasCarry11(x11(r, { hard: true }).a)).toBe(true);
    for (let i = 0; i < 50; i++) expect(hasCarry11(x11(r, { hard: false }).a)).toBe(false);
  });
  it("los pasos terminan en el resultado", () => {
    for (let n = 12; n <= 99; n++) {
      const s = x11Steps(n);
      expect(s[s.length - 1]).toBe(`= ${n * 11}`);
    }
    expect(x11Steps(85)).toContain("se lleva 1: 9 | 3 | 5");
  });
});

describe("×5, ×25, ×125", () => {
  it("todos los casos del rango: pasos correctos y respuesta exacta", () => {
    for (const m of [5, 25, 125]) {
      for (let n = 1; n <= 200; n++) {
        if (!x5Valid(n, m)) continue;
        checkSteps({ a: n, b: m, op: "×", answer: n * m, steps: x5Steps(n, m), hint: [] });
      }
    }
  });
  it("ejemplos de la lección", () => {
    expect(x5Steps(48, 5)).toEqual(["48 ÷ 2 = 24", "agrega 0", "= 240"]);
    expect(x5Steps(48, 25)).toEqual(["48 ÷ 4 = 12", "agrega 00", "= 1.200"]);
    expect(x5Steps(48, 125)).toEqual(["48 ÷ 8 = 6", "agrega 000", "= 6.000"]);
    expect(x5Steps(37, 25)).toEqual(["37 con 00: 3.700", "mitad: 1.850", "mitad: 925", "= 925"]);
    expect(x5Steps(47, 5)).toEqual(["47 con 0: 470", "mitad: 235", "= 235"]);
    expect(x5Steps(36, 125)).toEqual(["36 con 000: 36.000", "mitad: 18.000", "mitad: 9.000", "mitad: 4.500", "= 4.500"]);
  });
  it("el generador respeta rangos y el caso pedido", () => {
    const r = rng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 600; i++) {
      const p = x5(r);
      seen.add(p.b);
      expect(x5Valid(p.a, p.b)).toBe(true);
      expect(p.answer).toBe(p.a * p.b);
      checkSteps(p);
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([5, 25, 125]);
    for (let i = 0; i < 100; i++) { const p = x5(r, { hard: false }); expect(x5Exact(p.a, p.b)).toBe(true); }
    for (let i = 0; i < 100; i++) { const p = x5(r, { hard: true }); expect(x5Exact(p.a, p.b)).toBe(false); }
  });
});

describe("×9 y ×99", () => {
  it("×99: (n − 1) | (100 − n) para todo n de 12 a 99, con el cero de relleno", () => {
    for (let n = 12; n <= 99; n++) {
      const s = x99Steps(n);
      checkSteps({ a: n, b: 99, op: "×", answer: n * 99, steps: s, hint: [] });
      const [l, rr] = s[2].replace("pega: ", "").split(" | ");
      expect(Number(l + rr)).toBe(n * 99);
    }
    expect(x99Steps(73)).toEqual(["73 − 1 = 72", "100 − 73 = 27", "pega: 72 | 27", "= 7.227"]);
    expect(x99Steps(95)[2]).toBe("pega: 94 | 05");
  });
  it("×9: por 10 menos el número", () => {
    for (let n = 12; n <= 99; n++) {
      const s = x9Steps(n);
      expect(s[s.length - 1]).toBe(`= ${n * 9}`);
      expect(n * 10 - n).toBe(n * 9);
    }
    expect(x9Steps(47)).toEqual(["47 × 10 = 470", "470 − 47", "= 423"]);
  });
  it("el generador separa ×99 (truco) y ×9 (regla)", () => {
    const r = rng(11);
    for (let i = 0; i < 100; i++) expect(x9(r, { hard: false }).b).toBe(99);
    for (let i = 0; i < 100; i++) { const p = x9(r, { hard: true }); expect(p.b).toBe(9); expect(p.a % 10).not.toBe(0); }
    const bs = new Set<number>();
    for (let i = 0; i < 300; i++) { const p = x9(r); bs.add(p.b); expect(p.answer).toBe(p.a * p.b); checkSteps(p); }
    expect([...bs].sort((a, b) => a - b)).toEqual([9, 99]);
  });
});

describe("cuadrados terminados en 5", () => {
  it("a × (a + 1) | 25 para 15 a 195", () => {
    for (let n = 15; n <= 195; n += 10) {
      const a = (n - 5) / 10;
      expect(n * n).toBe(a * (a + 1) * 100 + 25);
      checkSteps({ a: n, b: n, op: "²", answer: n * n, steps: sq5Steps(n), hint: [] });
    }
    expect(sq5Steps(65)).toEqual(["6 × 7 = 42", "pega 25", "= 4.225"]);
    expect(sq5Steps(115)).toEqual(["11 × 12 = 132", "pega 25", "= 13.225"]);
    expect(sq5Steps(95)).toEqual(["9 × 10 = 90", "pega 25", "= 9.025"]);
  });
  it("el área: 65² = 60 × 70 + 5 × 5", () => {
    for (let a = 1; a <= 19; a++) {
      const t = 10 * a;
      expect((t + 5) ** 2).toBe(t * t + 2 * (t * 5) + 25); // cuadrado + 2 franjas + esquina
      expect(t * t + 2 * (t * 5)).toBe(t * (t + 10)); // las 2 franjas abajo: rectángulo t × (t + 10)
    }
  });
  it("el generador separa 2 y 3 cifras", () => {
    const r = rng(3);
    for (let i = 0; i < 100; i++) { const p = sq5(r, { hard: false }); expect(p.a).toBeGreaterThanOrEqual(15); expect(p.a).toBeLessThanOrEqual(95); }
    for (let i = 0; i < 100; i++) { const p = sq5(r, { hard: true }); expect(p.a).toBeGreaterThanOrEqual(105); expect(p.a).toBeLessThanOrEqual(195); }
    for (let i = 0; i < 100; i++) { const p = sq5(r); expect(p.op).toBe("²"); expect(p.b).toBe(p.a); expect(p.a % 10).toBe(5); expect(p.answer).toBe(p.a * p.a); checkSteps(p); }
  });
});

describe("todos los generadores", () => {
  it("las respuestas caben en el teclado (7 cifras) y la ayuda no está vacía", () => {
    const r = rng(99);
    for (const g of Object.values(GENERATORS)) {
      for (let i = 0; i < 200; i++) {
        const p = g(r);
        expect(String(p.answer).length).toBeLessThanOrEqual(7);
        expect(p.hint.length).toBeGreaterThan(0);
      }
    }
  });
});
