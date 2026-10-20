import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { fmt } from "../core/facts";
import { requeueIndex } from "../core/session";
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
}

export interface DrillResult {
  key: string;
  a: number;
  b: number;
  answer: number;
  ok: boolean;
  ms: number;
  skipped: boolean;
}

export type DrillMode = "review" | "diagnostic" | "guided" | "practice" | "boss";

interface Props {
  questions: DrillQuestion[];
  mode: DrillMode;
  onAnswer?: (r: DrillResult) => void;
  onFinish: (results: DrillResult[]) => void;
  onExit: () => void;
  /** milisegundos que se consideran "rápido" (sonido especial) */
  fastMs?: number;
}

const MAX_REQUEUE = 2;

export function Drill({ questions, mode, onAnswer, onFinish, onExit, fastMs = 1500 }: Props) {
  const [queue, setQueue] = useState<DrillQuestion[]>(questions);
  const [i, setI] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"ask" | "ok" | "bad">("ask");
  const [elapsed, setElapsed] = useState(0);
  const results = useRef<DrillResult[]>([]);
  const requeued = useRef<Record<string, number>>({});
  const t0 = useRef(performance.now());
  const inputRef = useRef("");
  const statusRef = useRef<"ask" | "ok" | "bad">("ask");
  const setSt = (st: "ask" | "ok" | "bad") => { statusRef.current = st; setStatus(st); };

  const q = queue[i];
  const target = q ? String(q.answer) : "";

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
    const r: DrillResult = { key: q.key, a: q.a, b: q.b, answer: q.answer, ok, ms, skipped };
    results.current.push(r);
    onAnswer?.(r);
    if (ok) {
      setSt("ok");
      ms <= fastMs ? sfx.fast() : sfx.ok();
      setTimeout(next, 260);
      return;
    }
    setSt("bad");
    sfx.bad();
    const allowRequeue = mode === "review" || mode === "practice" || mode === "guided";
    const n = requeued.current[q.key] ?? 0;
    if (allowRequeue && n < MAX_REQUEUE) {
      requeued.current[q.key] = n + 1;
      setQueue((qs) => {
        const copy = [...qs];
        copy.splice(requeueIndex(i, copy.length), 0, { ...q, isNew: false });
        return copy;
      });
    }
    if (mode === "diagnostic" || mode === "boss") setTimeout(next, 1100);
  }, [q, i, mode, next, onAnswer, fastMs]);

  const onDigit = useCallback((d: string) => {
    const st = statusRef.current;
    if (st !== "ask") { if (st === "bad" && mode !== "diagnostic" && mode !== "boss") next(); return; }
    const v = (inputRef.current + d).slice(0, 7);
    inputRef.current = v;
    setInput(v);
    if (v.length >= target.length) settle(v === target, false);
  }, [target, settle, next, mode]);

  const onDelete = useCallback(() => {
    if (statusRef.current !== "ask") return;
    inputRef.current = inputRef.current.slice(0, -1);
    setInput(inputRef.current);
  }, []);
  const onSkip = useCallback(() => { if (statusRef.current === "ask") settle(false, true); }, [settle]);

  if (!q) return null;
  const progress = (i + (status === "ask" ? 0 : 1)) / queue.length;
  const shown = status === "bad" ? input || "?" : input;
  const showSteps = status === "bad" && q.steps && mode !== "diagnostic" && mode !== "boss";

  return (
    <div className="drill">
      <div className="drill-top">
        <button className="close" onClick={onExit} aria-label="Salir"><IconClose /></button>
        <div className="dots"><i style={{ width: `${progress * 100}%` }} /></div>
        <span className="drill-count">{Math.min(i + 1, queue.length)}/{queue.length}</span>
      </div>

      <div className="stage" onClick={() => status === "bad" && !(mode === "diagnostic" || mode === "boss") && next()}>
        {q.isNew && status === "ask" && <span className="tag-new">NUEVO</span>}
        {q.scaffold && status === "ask" && <div className="scaffold">{q.scaffold}</div>}
        <div className="problem num" aria-live="polite">
          <span>{fmt(q.a)}</span><span className="op">×</span><span>{fmt(q.b)}</span>
        </div>
        <div className={`answer num ${status === "ok" ? "ok" : status === "bad" ? "bad" : ""}`}>
          {shown}
          {status === "ask" && <span className="caret" />}
        </div>
        {status === "bad" && (
          <div className="reveal">
            <span className="eyebrow">{showSteps ? q.stepsTitle ?? "El camino" : "Respuesta"}</span>
            <div className="steps">
              {showSteps ? q.steps!.map((s, k) => <div key={k}>{s}</div>) : <div>= {fmt(q.answer)}</div>}
            </div>
            {mode !== "diagnostic" && mode !== "boss" && <span className="hint">Toca para seguir. Volverá a aparecer en un rato.</span>}
          </div>
        )}
        {mode === "boss" && status === "ask" && <span className="timer">{(elapsed / 1000).toFixed(1)} s</span>}
      </div>

      <Keypad onDigit={onDigit} onDelete={onDelete} onSkip={onSkip} />
    </div>
  );
}
