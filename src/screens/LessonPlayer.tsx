import { useMemo, useState } from "react";
import { GENERATORS } from "../core/generators";
import { median } from "../core/mastery";
import { rng } from "../core/session";
import type { Lesson, LessonStep } from "../content/lessons/types";
import { VISUALS } from "../content/lessons/visuals";
import { Drill, type DrillMode, type DrillQuestion, type DrillResult } from "../ui/Drill";
import { IconClose } from "../ui/icons";

interface Props {
  lesson: Lesson;
  onExit: () => void;
  onComplete: (bossCorrect: number, medianMs: number) => void;
  /** cada respuesta, para el registro de tiempos */
  onAnswer?: (r: DrillResult) => void;
}

type Phase = "intro" | "drill" | "result";

export function LessonPlayer({ lesson, onExit, onComplete, onAnswer }: Props) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [run, setRun] = useState(0);
  const [last, setLast] = useState<DrillResult[]>([]);
  const step = lesson.steps[idx];
  const gen = GENERATORS[lesson.techniqueId];

  const questions = useMemo<DrillQuestion[]>(() => {
    if (!("count" in step) || !gen) return [];
    const rand = rng(Date.now() + run * 7919);
    const seen = new Set<number>();
    const out: DrillQuestion[] = [];
    for (let k = 0; out.length < step.count && k < 200; k++) {
      const carry = step.type === "guided" ? step.carry?.[out.length] : undefined;
      const p = gen(rand, carry === undefined ? {} : { carry });
      if (seen.has(p.a)) continue;
      seen.add(p.a);
      const t = Math.floor(p.a / 10), u = p.a % 10;
      out.push({
        key: `l:${lesson.id}:${p.a}`,
        a: p.a,
        b: p.b,
        answer: p.answer,
        steps: p.steps,
        stepsTitle: "El camino",
        scaffold: step.type === "guided"
          ? <><b>{t}</b><span>·</span><span>{t} + {u} = {t + u}</span><span>·</span><b>{u}</b></>
          : undefined,
      });
    }
    return out;
  }, [step, gen, lesson.id, run]);

  const total = lesson.steps.length;
  const goNext = () => {
    if (idx + 1 < total) { setIdx(idx + 1); setPhase("intro"); }
  };

  const isDrill = (s: LessonStep) => s.type === "guided" || s.type === "practice" || s.type === "boss";

  if (phase === "drill" && isDrill(step)) {
    const mode: DrillMode = step.type;
    return (
      <Drill
        key={`${idx}-${run}`}
        questions={questions}
        mode={mode}
        fastMs={lesson.targetMs / 2}
        onAnswer={onAnswer}
        onExit={() => setPhase("intro")}
        onFinish={(rs) => {
          setLast(rs);
          if (step.type === "boss") setPhase("result");
          else goNext();
        }}
      />
    );
  }

  if (phase === "result" && step.type === "boss") {
    const correct = last.filter((r) => r.ok).length;
    const med = median(last.filter((r) => r.ok).map((r) => r.ms));
    const passed = correct >= step.pass;
    return (
      <div className="drill">
        <div className="lesson-body" style={{ justifyContent: "center", textAlign: "center", alignItems: "center" }}>
          <span className={`pill ${passed ? "good" : "accent"}`}>{passed ? "Técnica dominada" : "Casi"}</span>
          <div className="result-big num">{correct}/{step.count}</div>
          <p className="muted">
            {passed
              ? `Mediana ${Number.isFinite(med) ? (med / 1000).toFixed(1).replace(".", ",") : "–"} s. Desde mañana aparecerá en tus sesiones para que no se olvide.`
              : `Necesitas ${step.pass} correctos. Repite el jefe cuando quieras: los problemas cambian cada vez.`}
          </p>
        </div>
        <div className="lesson-foot" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {passed ? (
            <button className="btn block" onClick={() => onComplete(correct, med)}>Terminar</button>
          ) : (
            <>
              <button className="btn block" onClick={() => { setRun(run + 1); setPhase("drill"); }}>Repetir el jefe</button>
              <button className="btn block ghost" onClick={() => { setIdx(idx - 1); setRun(run + 1); setPhase("intro"); }}>Practicar más</button>
            </>
          )}
        </div>
      </div>
    );
  }

  const Visual = "visual" in step ? VISUALS[step.visual] : undefined;
  const cta =
    step.type === "hook" ? "Ver por qué funciona" :
    step.type === "why" ? "Entendido" :
    step.type === "rule" ? "Probar con ayuda" :
    "Empezar";

  return (
    <div className="drill">
      <div className="drill-top">
        <button className="close" onClick={onExit} aria-label="Salir"><IconClose /></button>
        <div className="dots"><i style={{ width: `${(idx / total) * 100}%` }} /></div>
        <span className="drill-count">{idx + 1}/{total}</span>
      </div>
      <div className="lesson-body" key={idx}>
        <span className="eyebrow">{lesson.title}</span>
        <h2 className="title-xl">{step.title}</h2>
        {Visual && <div className="visual"><Visual /></div>}
        <p className="muted" style={{ fontSize: 17 }}>{step.body}</p>
        {step.type === "boss" && <p className="small muted">Meta: {step.pass} de {step.count}. El reloj corre, pero no hay límite.</p>}
      </div>
      <div className="lesson-foot">
        <button className="btn block" onClick={() => (isDrill(step) ? setPhase("drill") : goNext())}>{cta}</button>
      </div>
    </div>
  );
}
