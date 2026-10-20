// Visuales animados de las lecciones. Cada lección referencia uno por nombre.
// Todas las cuentas que aparecen acá están verificadas en tests/lessons.test.ts.
import { type CSSProperties, type ReactElement, useEffect, useState } from "react";

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

const Replay = ({ onClick }: { onClick: () => void }) => <button className="replay" onClick={onClick}>Repetir</button>;

/** Aparece desde abajo con retraso `d` (segundos). */
const rise = (go: boolean, d: number): CSSProperties => ({
  opacity: go ? 1 : 0, transform: go ? "none" : "translateY(8px)", transition: `opacity .45s ${d}s, transform .45s var(--ease) ${d}s`,
});
const fade = (go: boolean, d: number): CSSProperties => ({ opacity: go ? 1 : 0, transition: `opacity .4s ${d}s` });

const ACC: CSSProperties = { color: "var(--accent)" };
const GOOD: CSSProperties = { color: "var(--good)" };

// ---------------------------------------------------------------- ×11

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
      <Replay onClick={replay} />
    </>
  );
}

/** 72 × 11 = 720 + 72, sumado en columnas. */
function X11Columns() {
  const { go, replay, n } = useReplay(200);
  const f = (d: number) => fade(go, d);
  return (
    <>
      <div key={n} className="cols num" aria-label="720 más 72 es 792">
        <span /><span style={f(0)}>7</span><span className="colhl" style={f(0)}>2</span><span style={f(0)}>0</span><span className="note" style={f(0)}>72 × 10</span>
        <span style={f(0.5)}>+</span><span /><span className="colhl" style={f(0.5)}>7</span><span style={f(0.5)}>2</span><span className="note" style={f(0.5)}>72 × 1</span>
        <i className="rule" style={f(0.9)} /><span />
        <span /><span style={f(1.2)}>7</span><span className="colhl hl" style={f(1.2)}>9</span><span style={f(1.2)}>2</span><span className="note" style={f(1.2)}>72 × 11</span>
      </div>
      <Replay onClick={replay} />
    </>
  );
}

/** 85 × 11: 8 | 13 | 5 → el 1 se lleva → 935. */
function X11Carry() {
  const { go, replay, n } = useReplay(200);
  const line = (d: number) => rise(go, d);
  const big = { fontSize: 36, display: "flex", gap: 14, justifyContent: "center", alignItems: "baseline" } as const;
  return (
    <>
      <div key={n} className="num" style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
        <span className="eyebrow" style={line(0)}>85 × 11</span>
        <div style={{ ...big, ...line(0.3) }}><span>8</span><span className="muted">|</span><span><span style={ACC}>1</span>3</span><span className="muted">|</span><span>5</span></div>
        <div style={{ ...big, ...line(1.0) }}><span>8<span style={ACC}>+1</span></span><span className="muted">|</span><span>3</span><span className="muted">|</span><span>5</span></div>
        <div style={{ ...big, fontSize: 52, ...line(1.7) }}><span style={GOOD}>935</span></div>
      </div>
      <Replay onClick={replay} />
    </>
  );
}

// ---------------------------------------------------------------- ×5, ×25, ×125

/** El mismo 48 por 5, 25 y 125: dividir por 2, 4 y 8, y agregar ceros. */
function X5Hook() {
  const { go, replay, n } = useReplay(250);
  const rows: [string, string, string, string][] = [
    ["48 × 5", "÷ 2 = 24", "24", "0"],
    ["48 × 25", "÷ 4 = 12", "1.2", "00"],
    ["48 × 125", "÷ 8 = 6", "6.", "000"],
  ];
  return (
    <>
      <div key={n} className="qrows num">
        {rows.map(([p, d, head, zeros], k) => (
          <div key={p} className="qrow">
            <span style={rise(go, k * 0.9)}>{p}</span>
            <span className="qmid" style={rise(go, k * 0.9 + 0.35)}>{d}</span>
            <span style={{ ...rise(go, k * 0.9 + 0.7), ...GOOD }}>{head}<span style={ACC}>{zeros}</span></span>
          </div>
        ))}
      </div>
      <Replay onClick={replay} />
    </>
  );
}

/** 10 en 2 trozos de 5, 100 en 4 de 25, 1.000 en 8 de 125. */
function X5Bars() {
  const { go, replay, n } = useReplay(200);
  const bars = [
    { piece: "5", k: 2, total: "10" },
    { piece: "25", k: 4, total: "100" },
    { piece: "125", k: 8, total: "1.000" },
  ];
  return (
    <>
      <div key={n} className="bars">
        {bars.map((b, r) => (
          <div key={b.total} className="bar-row">
            <div className={`bar k${b.k}`}>
              {Array.from({ length: b.k }, (_, j) => (
                <span key={j} className="seg num" style={{ ...fade(go, r * 0.9 + j * 0.08), transform: go ? "none" : "scaleY(.3)", transition: `opacity .3s ${r * 0.9 + j * 0.08}s, transform .3s var(--ease) ${r * 0.9 + j * 0.08}s` }}>{b.piece}</span>
              ))}
            </div>
            <span className="bar-tot num" style={fade(go, r * 0.9 + 0.6)}>= {b.total}</span>
          </div>
        ))}
        <span className="bar-note" style={fade(go, 2.9)}>×25 es lo mismo que ×100 ÷ 4</span>
      </div>
      <Replay onClick={replay} />
    </>
  );
}

/** 37 × 25: 3.700 → mitad 1.850 → mitad 925. */
function X5Halves() {
  const { go, replay, n } = useReplay(200);
  return (
    <>
      <div key={n} className="chain num">
        <span className="eyebrow" style={rise(go, 0)}>37 × 25</span>
        <div className="chain-row" style={rise(go, 0.3)}><b>3.7<span style={ACC}>00</span></b><span className="note">37 con 00</span></div>
        <div className="chain-step" style={fade(go, 0.9)}>↓ mitad</div>
        <div className="chain-row" style={rise(go, 1.1)}><b>1.850</b></div>
        <div className="chain-step" style={fade(go, 1.6)}>↓ mitad</div>
        <div className="chain-row" style={rise(go, 1.8)}><b style={GOOD}>925</b></div>
      </div>
      <Replay onClick={replay} />
    </>
  );
}

// ---------------------------------------------------------------- ×9, ×99

/** 73 × 99: 72 | 27 → 7.227. */
function X99Hook() {
  const { go, replay, n } = useReplay(250);
  return (
    <>
      <div key={n} className="num" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <span className="eyebrow" style={rise(go, 0)}>73 × 99</span>
        <div className="pair">
          <span className="pair-cell" style={rise(go, 0.3)}><b>72</b><small>73 − 1</small></span>
          <span className="pair-bar" style={fade(go, 0.9)}>|</span>
          <span className="pair-cell" style={rise(go, 1.0)}><b style={ACC}>27</b><small>100 − 73</small></span>
        </div>
        <span style={{ fontSize: 48, ...GOOD, ...rise(go, 1.8) }}>7.227</span>
      </div>
      <Replay onClick={replay} />
    </>
  );
}

/** Recta numérica: de 7.300 se retroceden 73 y se cae en 7.227, 27 sobre 7.200. */
function X99Line() {
  const { go, replay, n } = useReplay(250);
  // escala: 7.200 en x = 20, 7.300 en x = 320 (3 px por unidad)
  const x = (v: number) => 20 + (v - 7200) * 3;
  const arc = `M ${x(7300)} 64 Q ${(x(7300) + x(7227)) / 2} 4 ${x(7227)} 64`;
  return (
    <>
      <svg key={n} className="nline" viewBox="0 0 340 130" role="img" aria-label="7.300 menos 73 es 7.227">
        <line x1={x(7200)} y1="70" x2={x(7300)} y2="70" className="axis" />
        <line x1={x(7200)} y1="70" x2={x(7227)} y2="70" className="seg27" style={{ strokeDasharray: 81, strokeDashoffset: go ? 0 : 81, transition: "stroke-dashoffset .5s 2.1s" }} />
        {[7200, 7300].map((v) => <line key={v} x1={x(v)} y1="62" x2={x(v)} y2="78" className="tick" />)}
        <text x={x(7200)} y="100" textAnchor="middle" className="lbl">7.200</text>
        <text x={x(7300)} y="100" textAnchor="middle" className="lbl">7.300</text>
        <circle cx={x(7300)} cy="70" r="6" className="dot" style={fade(go, 0)} />
        <path d={arc} className="jump" style={{ strokeDasharray: 260, strokeDashoffset: go ? 0 : 260, transition: "stroke-dashoffset .9s var(--ease) .5s" }} />
        <text x={(x(7300) + x(7227)) / 2} y="26" textAnchor="middle" className="lbl strong" style={fade(go, 0.9)}>− 73</text>
        <circle cx={x(7227)} cy="70" r="7" className="dot good" style={fade(go, 1.4)} />
        <text x={x(7227)} y="122" textAnchor="middle" className="lbl good" style={fade(go, 1.5)}>7.227</text>
        <text x={(x(7200) + x(7227)) / 2} y="56" textAnchor="middle" className="lbl acc" style={fade(go, 2.3)}>27</text>
      </svg>
      <Replay onClick={replay} />
    </>
  );
}

/** 47 × 9 = 470 − 47 = 423 · 95 × 99 = 94 | 05. */
function X9Rule() {
  const { go, replay, n } = useReplay(200);
  return (
    <>
      <div key={n} className="num" style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center", width: "100%" }}>
        <div className="mini">
          <span className="eyebrow" style={rise(go, 0)}>47 × 9</span>
          <div className="mini-line" style={rise(go, 0.3)}>470 <span className="muted">−</span> 47</div>
          <div className="mini-line" style={{ ...GOOD, ...rise(go, 0.9) }}>423</div>
        </div>
        <i className="sep" style={fade(go, 1.3)} />
        <div className="mini">
          <span className="eyebrow" style={rise(go, 1.4)}>95 × 99</span>
          <div className="mini-line" style={rise(go, 1.7)}>94 <span className="muted">|</span> <span style={ACC}>0</span>5</div>
          <div className="mini-line" style={{ ...GOOD, ...rise(go, 2.3) }}>9.405</div>
        </div>
      </div>
      <Replay onClick={replay} />
    </>
  );
}

// ---------------------------------------------------------------- cuadrados terminados en 5

/** 65²: 6 × 7 = 42, pega 25 → 4.225. */
function Sq5Hook() {
  const { go, replay, n } = useReplay(250);
  const big = { fontSize: 40, display: "flex", gap: 12, alignItems: "baseline", justifyContent: "center" } as const;
  return (
    <>
      <div key={n} className="num" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <span className="eyebrow" style={rise(go, 0)}>65²</span>
        <div style={{ ...big, ...rise(go, 0.3) }}><span>6</span><span className="muted">×</span><span>7</span><span className="muted">=</span><b style={{ fontWeight: 500 }}>42</b></div>
        <div style={{ ...big, ...rise(go, 1.0) }}><span>42</span><span className="muted">|</span><span style={ACC}>25</span></div>
        <span style={{ fontSize: 52, ...GOOD, ...rise(go, 1.7) }}>4.225</span>
      </div>
      <Replay onClick={replay} />
    </>
  );
}

/**
 * El cuadrado de 65 = 60 + 5. Las dos franjas de 60 × 5 se juntan abajo
 * y forman un rectángulo de 60 × 70; sobra la esquina de 5 × 5 = 25.
 * Escala: 1 unidad = 3 (65 → 195).
 */
function Sq5Area() {
  const { go, replay, n } = useReplay(400);
  const [moved, setMoved] = useState(false);
  useEffect(() => {
    setMoved(false);
    if (!go) return;
    const t = setTimeout(() => setMoved(true), 1300);
    return () => clearTimeout(t);
  }, [go, n]);
  const show = (on: boolean, d = 0): CSSProperties => ({ opacity: on ? 1 : 0, transition: `opacity .4s ${d}s` });
  return (
    <>
      <svg key={n} className="area" viewBox="-34 -26 296 262" role="img" aria-label="65 al cuadrado es 60 por 70 más 25">
        <rect x="0" y="0" width="180" height="180" className="sq" style={show(go)} />
        <rect x="0" y="180" width="180" height="15" className="strip" style={show(go, 0.3)} />
        <rect
          x="180" y="0" width="15" height="180" className="strip"
          style={{
            opacity: go ? 1 : 0,
            transformBox: "fill-box", transformOrigin: "center",
            transform: moved ? "translate(-97.5px, 112.5px) rotate(90deg)" : "none",
            transition: "opacity .4s .3s, transform 1s var(--ease)",
          }}
        />
        <rect x="180" y="180" width="15" height="15" className="corner" style={show(go, 0.6)} />
        {/* medidas del cuadrado */}
        <text x="90" y="-9" textAnchor="middle" className="lbl" style={show(go, 0.6)}>60</text>
        <text x="187.5" y="-9" textAnchor="middle" className="lbl acc" style={show(go && !moved, 0.6)}>5</text>
        <text x="-10" y="95" textAnchor="end" className="lbl" style={show(go && !moved, 0.6)}>60</text>
        <text x="-10" y="192" textAnchor="end" className="lbl acc" style={show(go && !moved, 0.6)}>5</text>
        {/* después de mover la franja */}
        <text x="-10" y="110" textAnchor="end" className="lbl acc" style={show(moved, 0.9)}>70</text>
        <rect x="0" y="0" width="180" height="210" className="outline" style={show(moved, 0.9)} />
        <text x="90" y="100" textAnchor="middle" className="lbl big" style={show(moved, 1.1)}>60 × 70</text>
        <text x="90" y="124" textAnchor="middle" className="lbl" style={show(moved, 1.3)}>= 4.200</text>
        <text x="203" y="193" className="lbl good" style={show(moved, 1.6)}>+ 25</text>
      </svg>
      <Replay onClick={replay} />
    </>
  );
}

/** 115²: 11 × 12 = 132, pega 25 → 13.225. */
function Sq5Rule() {
  const { go, replay, n } = useReplay(200);
  const big = { fontSize: 36, display: "flex", gap: 12, alignItems: "baseline", justifyContent: "center" } as const;
  return (
    <>
      <div key={n} className="num" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <span className="eyebrow" style={rise(go, 0)}>115²</span>
        <div style={{ ...big, ...rise(go, 0.3) }}><span style={ACC}>11</span><span className="muted">×</span><span>12</span><span className="muted">=</span><span>132</span></div>
        <div style={{ ...big, ...rise(go, 1.0) }}><span>132</span><span className="muted">|</span><span style={ACC}>25</span></div>
        <span style={{ fontSize: 48, ...GOOD, ...rise(go, 1.7) }}>13.225</span>
      </div>
      <Replay onClick={replay} />
    </>
  );
}

export const VISUALS: Record<string, () => ReactElement> = {
  "x11-split": X11Split,
  "x11-columns": X11Columns,
  "x11-carry": X11Carry,
  "x5-hook": X5Hook,
  "x5-bars": X5Bars,
  "x5-halves": X5Halves,
  "x99-hook": X99Hook,
  "x99-line": X99Line,
  "x9-rule": X9Rule,
  "sq5-hook": Sq5Hook,
  "sq5-area": Sq5Area,
  "sq5-rule": Sq5Rule,
};

