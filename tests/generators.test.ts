import { describe, expect, it } from "vitest";
import { hasCarry11, x11, x11Steps } from "../src/core/generators";
import { rng } from "../src/core/session";

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
    for (let i = 0; i < 50; i++) expect(hasCarry11(x11(r, { carry: true }).a)).toBe(true);
    for (let i = 0; i < 50; i++) expect(hasCarry11(x11(r, { carry: false }).a)).toBe(false);
  });
  it("los pasos terminan en el resultado", () => {
    for (let n = 12; n <= 99; n++) {
      const s = x11Steps(n);
      expect(s[s.length - 1]).toBe(`= ${n * 11}`);
    }
    expect(x11Steps(85)).toContain("se lleva 1: 9 | 3 | 5");
  });
});
