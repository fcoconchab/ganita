import { describe, expect, it } from "vitest";
import { FACTS, TIERS, factsOfTier, fmt, strategyFor, strategyResult } from "../src/core/facts";

describe("hechos del Arsenal", () => {
  it("tiene las cantidades de la arquitectura", () => {
    expect(factsOfTier("A1")).toHaveLength(36);
    expect(factsOfTier("A2")).toHaveLength(72);
    expect(factsOfTier("A3")).toHaveLength(45);
    expect(factsOfTier("A4")).toHaveLength(11);
    expect(FACTS).toHaveLength(164);
    expect(TIERS.map((t) => t.id)).toEqual(["A1", "A2", "A3", "A4"]);
  });
  it("ids únicos y respuestas correctas", () => {
    expect(new Set(FACTS.map((f) => f.id)).size).toBe(FACTS.length);
    FACTS.forEach((f) => expect(f.answer).toBe(f.a * f.b));
  });
  it("toda estrategia de respaldo llega al resultado correcto", () => {
    for (const f of FACTS) {
      for (const [a, b] of [[f.a, f.b], [f.b, f.a]]) {
        const s = strategyFor(a, b);
        expect(s.steps.length).toBeGreaterThan(0);
        expect(strategyResult(s), `${a}×${b} ${s.name}: ${s.steps.join(" ")}`).toBe(f.answer);
      }
    }
  });
  it("los pasos intermedios son aritméticamente verdaderos", () => {
    // revisa cada "= X + Y" o "= X − Y" intermedio contra el resultado
    for (const f of FACTS) {
      const s = strategyFor(f.a, f.b);
      const nums = s.steps.map((x) => x.replace(/\./g, ""));
      for (const line of nums) {
        const m = line.match(/^= (\d+) ([+−÷]) (\d+)$/);
        if (!m) continue;
        const [x, op, y] = [Number(m[1]), m[2], Number(m[3])];
        const v = op === "+" ? x + y : op === "−" ? x - y : x / y;
        expect(v, `${f.id}: ${line}`).toBe(f.answer);
      }
    }
  });
  it("formato chileno de miles", () => {
    expect(fmt(1024)).toBe("1.024");
    expect(fmt(900)).toBe("900");
    expect(fmt(1441623)).toBe("1.441.623");
  });
});
