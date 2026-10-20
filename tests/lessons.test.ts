import { describe, expect, it } from "vitest";
import catalog from "../src/content/techniques.json";
import { LESSONS } from "../src/content/lessons";
import { VISUALS } from "../src/content/lessons/visuals";
import { GENERATORS } from "../src/core/generators";
import { rng } from "../src/core/session";

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));
const evalSide = (side: string) => {
  const m = side.trim().match(/^([\d.]+)(?: ([×÷−+]) ([\d.]+))?$/);
  if (!m) return NaN;
  const x = num(m[1]);
  if (!m[2]) return x;
  const y = num(m[3]);
  return m[2] === "×" ? x * y : m[2] === "÷" ? x / y : m[2] === "−" ? x - y : x + y;
};

const texts = (l: (typeof LESSONS)[number]) => [l.title, l.subtitle, ...l.steps.flatMap((s) => [s.title, s.body])];

describe("lecciones", () => {
  it("tienen los 6 pasos en orden, generador, técnica del catálogo y visuales", () => {
    const ids = new Set(catalog.techniques.map((t) => t.id));
    for (const l of LESSONS) {
      expect(l.steps.map((s) => s.type)).toEqual(["hook", "why", "rule", "guided", "practice", "boss"]);
      expect(ids.has(l.techniqueId), l.techniqueId).toBe(true);
      expect(GENERATORS[l.techniqueId], l.techniqueId).toBeDefined();
      for (const s of l.steps) if ("visual" in s) expect(VISUALS[s.visual], s.visual).toBeDefined();
      const g = l.steps[3];
      if (g.type === "guided" && g.hard) expect(g.hard.length).toBe(g.count);
    }
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
  });

  it("cada igualdad escrita en los textos es correcta", () => {
    let checked = 0;
    const chain = /[\d.]+(?: [×÷−+] [\d.]+)?(?: = [\d.]+(?: [×÷−+] [\d.]+)?)+/g;
    for (const l of LESSONS) {
      for (const t of texts(l)) {
        for (const m of t.matchAll(chain)) {
          const vals = m[0].replace(/\.$/, "").split(" = ").map(evalSide);
          for (const v of vals) expect(v, `${l.id}: ${m[0]}`).toBe(vals[0]);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(7); // evita que el patrón deje de encontrar igualdades
  });

  it("las afirmaciones en palabras también cuadran", () => {
    // ×5, ×25, ×125
    expect([48 / 4, 48 * 25, 48 * 5, 48 * 125]).toEqual([12, 1200, 240, 6000]);
    expect([100 / 4, 10 / 2, 1000 / 8]).toEqual([25, 5, 125]);
    expect([37 % 4 !== 0, 3700 / 2, 1850 / 2, 37 * 25]).toEqual([true, 1850, 925, 925]);
    // ×9, ×99
    expect([73 - 1, 100 - 73, 73 * 99, 7300 - 73]).toEqual([72, 27, 7227, 7227]);
    expect(7227 - 7200).toBe(27);
    expect([95 * 99, 95 - 1, 100 - 95]).toEqual([9405, 94, 5]);
    // cuadrados terminados en 5
    expect([6 * 7, 65 ** 2, 60 * 60 + 2 * 60 * 5 + 25, 60 * 70]).toEqual([42, 4225, 4225, 4200]);
    expect([11 * 12, 115 ** 2, 19 * 20, 195 ** 2]).toEqual([132, 13225, 380, 38025]);
  });

  it("textos en español de Chile: sin guiones largos y miles con punto", () => {
    for (const l of LESSONS) {
      for (const t of texts(l)) {
        expect(t, t).not.toMatch(/—/);
        expect(t, t).not.toMatch(/\d{4,}/);
      }
    }
  });

  it("cada paso con problemas tiene suficientes problemas distintos", () => {
    for (const l of LESSONS) {
      const g = GENERATORS[l.techniqueId];
      const r = rng(5);
      const seen = new Set<string>();
      for (let i = 0; i < 400; i++) { const p = g(r); seen.add(`${p.a}${p.op}${p.b}`); }
      const max = Math.max(...l.steps.map((s) => ("count" in s ? s.count : 0)));
      expect(seen.size, l.id).toBeGreaterThanOrEqual(max + 5);
    }
  });
});
