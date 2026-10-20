// Visuales animados de las lecciones. Cada lección referencia uno por nombre.
import { type ReactElement, useEffect, useState } from "react";

function useReplay(delay = 350) {
  const [go, setGo] = useState(false);
  const [n, setN] = useState(0);
  useEffect(() => {
    setGo(false);
    const t = setTimeout(() => setGo(true), delay);
    return () => clearTimeout(t);
  }, [n, delay]);
  return { go, replay: () => setN((x) => x + 1), n };
}

/** 72 × 11: el 7 y el 2 se separan y aparece 9 al medio. */
function X11Split() {
  const { go, replay, n } = useReplay();
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <span className="eyebrow">72 × 11</span>
        <div key={n} className={`split num${go ? " go" : ""}`}>
          <span className="d">7</span>
          <span className="mid"><span className="sum">7 + 2</span>9</span>
          <span className="d">2</span>
        </div>
      </div>
      <button className="replay" onClick={replay}>Repetir</button>
    </>
  );
}

/** 72 × 11 = 720 + 72, sumado en columnas. */
function X11Columns() {
  const { go, replay, n } = useReplay(200);
  const fade = (d: number) => ({ opacity: go ? 1 : 0, transition: `opacity .4s ${d}s` });
  return (
    <>
      <div key={n} className="cols num" aria-label="720 más 72 es 792">
        <span /><span style={fade(0)}>7</span><span className="colhl" style={fade(0)}>2</span><span style={fade(0)}>0</span><span className="note" style={fade(0)}>72 × 10</span>
        <span style={fade(0.5)}>+</span><span /><span className="colhl" style={fade(0.5)}>7</span><span style={fade(0.5)}>2</span><span className="note" style={fade(0.5)}>72 × 1</span>
        <i className="rule" style={fade(0.9)} /><span />
        <span /><span style={fade(1.2)}>7</span><span className="colhl hl" style={fade(1.2)}>9</span><span style={fade(1.2)}>2</span><span className="note" style={fade(1.2)}>72 × 11</span>
      </div>
      <button className="replay" onClick={replay}>Repetir</button>
    </>
  );
}

/** 85 × 11: 8 | 13 | 5 → el 1 se lleva → 935. */
function X11Carry() {
  const { go, replay, n } = useReplay(200);
  const line = (d: number) => ({ opacity: go ? 1 : 0, transform: go ? "none" : "translateY(8px)", transition: `all .45s ${d}s` });
  const big = { fontSize: 36, display: "flex", gap: 14, justifyContent: "center", alignItems: "baseline" } as const;
  return (
    <>
      <div key={n} className="num" style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
        <span className="eyebrow" style={line(0)}>85 × 11</span>
        <div style={{ ...big, ...line(0.3) }}><span>8</span><span className="muted">|</span><span><span style={{ color: "var(--accent)" }}>1</span>3</span><span className="muted">|</span><span>5</span></div>
        <div style={{ ...big, ...line(1.0) }}><span>8<span style={{ color: "var(--accent)" }}>+1</span></span><span className="muted">|</span><span>3</span><span className="muted">|</span><span>5</span></div>
        <div style={{ ...big, fontSize: 52, ...line(1.7) }}><span style={{ color: "var(--good)" }}>935</span></div>
      </div>
      <button className="replay" onClick={replay}>Repetir</button>
    </>
  );
}

export const VISUALS: Record<string, () => ReactElement> = {
  "x11-split": X11Split,
  "x11-columns": X11Columns,
  "x11-carry": X11Carry,
};
