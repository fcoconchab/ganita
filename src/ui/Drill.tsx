import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { fmt } from "../core/facts";
import { requeueIndex } from "../core/session";
import { haptic } from "./haptics";
import { IconClose } from "./icons";
import { Keypad } from "./Keypad";
import { sfx } from "./sound";

export interface DrillQuestion {
  key: string;
  a: number;
  b: number;
  answer: number;
  isNew?: boolean;
  /** pasos de la técnica, se muestran al fallar */
  steps?: string[];
  stepsTitle?: string;
  /** ayuda visible antes de responder (práctica guiada) */
  scaffold?: ReactNode;
  /** reaparición después de un error (ya vio la respuesta) */
  retry?: boolean;
}

export interface DrillResult {
  key: string;
  a: number;
  b: number;
  answer: number;
  ok: boolean;
  ms: number;
  skipped: boolean;
  retry: boolean;
  mode: DrillMode;
}

export type DrillMode = "review" | "diagnostic" | "guided" | "practice" | "boss";

/** Cómo salió cada pregunta: se dibuja como una cuenta en la fila de arriba (y en el resumen). */
export type Mark = "fast" | "ok" | "bad" | "skip";

export const markOf = (r: Pick<DrillResult, "ok" | "ms" | "skipped">, fastMs: number): Mark =>
  r.ok ? (r.ms <= fastMs ? "fast" : "ok") : r.skipped ? "skip" : "bad";

interface Props {
  questions: DrillQuestion[];
  mode: DrillMode;
  onAnswer?: (r: DrillResult) => void;
  onFinish: (results: DrillResult[]) => void;
  onExit: () => void;
  /** milisegundos que se consideran "rápido" (sonido y color especial) */
  fastMs?: number;
}

const MAX_REQUEUE = 2;
const COMBO_STEP = 5; // cada 5 seguidas hay una pequeña celebración

const sec = (ms: number) => (ms / 1000).toFixed(1).replace(".", ",");

/** Fila de cuentas: una por pregunta, se colorean al responder. */
export function Beads({ marks, current }: { marks: (Mark | null)[]; current?: number }) {
  return (
    <div className="beads" aria-hidden="true">
      {marks.map((m, k) => (
        <i key={k} className={`bead${m ? ` ${m}` : ""}${k === current ? " now" : ""}`} style={{ animationDelay: `${k * 18}ms` }} />
      ))}
    </div>
  );
}

export function Drill({ questions, mode, onAnswer, onFinish, onExit, fastMs = 1500 }: Props) {
  const [queue, setQueue] = useState<DrillQuestion[]>(questions);
  const [marks, setMarks] = useState<(Mark | null)[]>(() => questions.map(() => null));
  const [i, setI] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"ask" | "ok" | "bad">("ask");
  const [lastMs, setLastMs] = useState(0);
  const [combo, setCombo] = useState(0);
  const [cheer, setCheer] = useState(0); // número de la celebración (para reanimar)
  const [elapsed, setElapsed] = useState(0);
  const results = useRef<DrillResult[]>([]);
  const requeued = useRef<Record<string, number>>({});
  const comboRef = useRef(0);
  const t0 = useRef(performance.now());
  const inputRef = useRef("");
  const statusRef = useRef<"ask" | "ok" | "bad">("ask");
  const setSt = (st: "ask" | "ok" | "bad") => { statusRef.current = st; setStatus(st); };

  const q = queue[i];
  const target = q ? String(q.answer) : "";
  const quiet = mode === "diagnostic" || mode === "boss"; // sin reintentos ni pasos

  useEffect(() => {
    t0.current = performance.now();
    setElapsed(0);
    if (mode !== "boss") return;
    const id = setInterval(() => setElapsed(performance.now() - t0.current), 100);
    return () => clearInterval(id);
  }, [i, mode]);

  const next = useCallback(() => {
    inputRef.current = "";
    setInput("");
    setSt("ask");
    if (i + 1 >= queue.length) {
      sfx.done();
      onFinish(results.current);
    } else setI(i + 1);
  }, [i, queue.length, onFinish]);

  const settle = useCallback((ok: boolean, skipped: boolean) => {
    if (!q) return;
    const ms = Math.round(performance.now() - t0.current);
    const r: DrillResult = { key: q.key, a: q.a, b: q.b, answer: q.answer, ok, ms, skipped, retry: !!q.retry, mode };
    results.current.push(r);
    onAnswer?.(r);
    const mark = markOf(r, fastMs);
    setMarks((ms0) => { const c = [...ms0]; c[i] = mark; return c; });
    setLastMs(ms);

    if (ok) {
      const c = comboRef.current + 1;
      comboRef.current = c;
      setCombo(c);
      setSt("ok");
      if (mark === "fast") sfx.fast(c); else sfx.ok(c);
      const milestone = c % COMBO_STEP === 0;
      if (milestone) { setCheer((n) => n + 1); setTimeout(() => sfx.milestone(), 120); }
      setTimeout(next, milestone ? 620 : 380);
      return;
    }

    comboRef.current = 0;
    setCombo(0);
    setSt("bad");
    sfx.bad();
    haptic("bad");
    const n = requeued.current[q.key] ?? 0;
    if (!quiet && n < MAX_REQUEUE) {
      requeued.current[q.key] = n + 1;
      const at = requeueIndex(i, queue.length);
      setQueue((qs) => { const c = [...qs]; c.splice(at, 0, { ...q, isNew: false, retry: true }); return c; });
      setMarks((ms0) => { const c = [...ms0]; c.splice(at, 0, null); return c; });
    }
    if (quiet) setTimeout(next, 1100);
  }, [q, i, mode, next, onAnswer, fastMs, quiet, queue.length]);

  const onDigit = useCallback((d: string) => {
    const st = statusRef.current;
    if (st !== "ask") { if (st === "bad" && !quiet) next(); return; }
    const v = (inputRef.current + d).slice(0, 7);
    inputRef.current = v;
    setInput(v);
    if (v.length >= target.length) settle(v === target, false);
  }, [target, settle, next, quiet]);

  const onDelete = useCallback(() => {
    if (statusRef.current !== "ask") return;
    inputRef.current = inputRef.current.slice(0, -1);
    setInput(inputRef.current);
  }, []);
  const onSkip = useCallback(() => { if (statusRef.current === "ask") settle(false, true); }, [settle]);

  if (!q) return null;
  const shown = status === "bad" ? input || "?" : input;
  const showSteps = status === "bad" && q.steps && !quiet;
  const fast = status === "ok" && lastMs <= fastMs;
  const answerClass = status === "ok" ? (fast ? "ok fast" : "ok") : status === "bad" ? "bad" : "";

  return (
    <div className="drill">
      <div className="drill-top">
        <button className="close" onClick={onExit} aria-label="Salir"><IconClose /></button>
        <Beads marks={marks} current={i} />
        <span className="drill-count">{Math.min(i + 1, queue.length)}/{queue.length}</span>
      </div>

      <div className={`stage${status === "bad" ? " bad" : ""}`} onClick={() => status === "bad" && !quiet && next()}>
        <div className="stage-top">
          {q.isNew && status === "ask" ? <span className="pill accent">Nuevo</span> : q.retry && status === "ask" ? <span className="pill">Otra vez</span> : <span />}
          {combo >= 3 && (
            <span key={cheer} className={`combo${combo % COMBO_STEP === 0 && status === "ok" ? " pop" : ""}`}>
              <b className="num">{combo}</b> seguidas
            </span>
          )}
        </div>

        {q.scaffold && status === "ask" && <div className="scaffold">{q.scaffold}</div>}
        <div key={`p${i}`} className="problem num enter" aria-live="polite">
          <span>{fmt(q.a)}</span><span className="op">×</span><span>{fmt(q.b)}</span>
        </div>
        <div className={`answer num ${answerClass}`}>
          {status === "ok" ? fmt(q.answer) : shown}
          {status === "ask" && <span className="caret" />}
          {fast && <span key={`g${i}`} className="glow" aria-hidden="true" />}
        </div>
        <div className="under">
          {status === "ok" && <span key={`t${i}`} className={`time-chip${fast ? " fast" : ""}`}>{sec(lastMs)} s</span>}
          {mode === "boss" && status === "ask" && <span className="timer num">{(elapsed / 1000).toFixed(1).replace(".", ",")} s</span>}
        </div>

        {status === "bad" && (
          <div className="reveal">
            <span className="eyebrow">{showSteps ? q.stepsTitle ?? "El camino" : "La respuesta"}</span>
            <div className="steps">
              {showSteps
                ? q.steps!.map((s, k) => <div key={k} style={{ animationDelay: `${120 + k * 160}ms` }}>{s}</div>)
                : <div>= {fmt(q.answer)}</div>}
            </div>
            {!quiet && <span className="hint">Toca para seguir. Vuelve en un rato.</span>}
          </div>
        )}
      </div>

      <Keypad onDigit={onDigit} onDelete={onDelete} onSkip={onSkip} />
    </div>
  );
}
