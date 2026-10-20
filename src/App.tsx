import { useCallback, useEffect, useState } from "react";
import { aggregateSkills, buildDaily, skillKey } from "./core/daily";
import { FACT_BY_ID, TIERS, factsOfTier, strategyFor, type TierId } from "./core/facts";
import { RANK_ORDER, median, rankOf } from "./core/mastery";
import { buildDiagnostic, rng, type Question } from "./core/session";
import { newItem, review } from "./core/srs";
import { dayKey, load, save, type Progress } from "./core/storage";
import { LESSONS } from "./content/lessons/x11";
import { Arsenal } from "./screens/Arsenal";
import { Learn } from "./screens/Learn";
import { LessonPlayer } from "./screens/LessonPlayer";
import { Summary } from "./screens/Summary";
import { Today } from "./screens/Today";
import { Drill, type DrillMode, type DrillQuestion, type DrillResult } from "./ui/Drill";
import { IconGrid, IconPath, IconToday } from "./ui/icons";
import { setSound } from "./ui/sound";

type Tab = "hoy" | "arsenal" | "aprender";
type View =
  | { type: "tabs" }
  | { type: "drill"; title: string; mode: DrillMode; questions: DrillQuestion[]; fastMs: number; note?: string }
  | { type: "summary"; title: string; results: DrillResult[]; fastMs: number; note?: string }
  | { type: "lesson"; id: string };

const targetOf = (factId: string) => TIERS.find((t) => t.id === FACT_BY_ID[factId]?.tier)?.targetMs ?? 1500;

function toDrill(q: Question): DrillQuestion {
  if (q.key.startsWith("f:")) {
    const s = strategyFor(q.a, q.b);
    return { ...q, steps: s.steps, stepsTitle: s.name };
  }
  const lesson = LESSONS.find((l) => skillKey(l.id) === q.key);
  return { ...q, stepsTitle: lesson?.title ?? "El camino" };
}

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => load());
  const [tab, setTab] = useState<Tab>("hoy");
  const [view, setView] = useState<View>({ type: "tabs" });
  const now = Date.now();

  useEffect(() => save(progress), [progress]);
  useEffect(() => setSound(progress.settings.sound), [progress.settings.sound]);

  /** Cada respuesta a un hecho actualiza su repaso al instante (si cierras la app, no se pierde). */
  const onAnswer = useCallback((r: DrillResult) => {
    if (!r.key.startsWith("f:")) return;
    setProgress((p) => {
      const at = Date.now();
      const prev = p.items[r.key] ?? newItem(at);
      return { ...p, items: { ...p.items, [r.key]: review(prev, { ok: r.ok, ms: r.ms, at }, targetOf(r.key)) } };
    });
  }, []);

  const finish = useCallback((title: string, fastMs: number, note?: string) => (results: DrillResult[]) => {
    const at = Date.now();
    setProgress((p) => {
      const items = { ...p.items };
      for (const [key, agg] of Object.entries(aggregateSkills(results))) {
        const lesson = LESSONS.find((l) => skillKey(l.id) === key);
        items[key] = review(items[key] ?? newItem(at), { ok: agg.ok, ms: agg.ms, at }, lesson?.targetMs ?? 4000);
      }
      const today = dayKey(at);
      return {
        ...p,
        items,
        stats: {
          days: p.stats.days.includes(today) ? p.stats.days : [...p.stats.days, today].slice(-400),
          sessions: p.stats.sessions + 1,
          answers: p.stats.answers + results.length,
        },
      };
    });
    setView({ type: "summary", title, results, fastMs, note });
  }, []);

  const startDaily = () => {
    const qs = buildDaily(progress, LESSONS, Date.now()).map(toDrill);
    setView({ type: "drill", title: "Sesión de hoy", mode: "review", questions: qs, fastMs: 1500 });
  };

  const startDiagnostic = (tier: TierId = "A1") => {
    const qs = buildDiagnostic(tier).map(toDrill);
    setView({
      type: "drill", title: `Diagnóstico ${tier}`, mode: "diagnostic", questions: qs, fastMs: 1500,
      note: "Los hechos lentos o con error quedan agendados para repasar primero. El mapa del Arsenal ya muestra tu punto de partida.",
    });
  };

  const practiceTier = (tier: TierId) => {
    const rand = rng(Date.now());
    const weak = [...factsOfTier(tier)]
      .map((f) => ({ f, r: RANK_ORDER.indexOf(rankOf(progress.items[f.id])), m: median(progress.items[f.id]?.history.slice(-3).map((h) => h.ms) ?? []) || 0, k: rand() }))
      .sort((a, b) => a.r - b.r || b.m - a.m || a.k - b.k)
      .slice(0, 20)
      .sort((a, b) => a.k - b.k)
      .map(({ f }) => {
        const flip = rand() < 0.5;
        return toDrill({ key: f.id, a: flip ? f.b : f.a, b: flip ? f.a : f.b, answer: f.answer, isNew: !progress.items[f.id]?.history.length });
      });
    setView({ type: "drill", title: `Práctica ${tier}`, mode: "review", questions: weak, fastMs: targetOf(weak[0].key) });
  };

  if (view.type === "drill") {
    return (
      <div className="app">
        <Drill
          questions={view.questions}
          mode={view.mode}
          fastMs={view.fastMs}
          onAnswer={onAnswer}
          onFinish={finish(view.title, view.fastMs, view.note)}
          onExit={() => setView({ type: "tabs" })}
        />
      </div>
    );
  }

  if (view.type === "summary") {
    return (
      <div className="app">
        <Summary title={view.title} results={view.results} fastMs={view.fastMs} note={view.note} onDone={() => setView({ type: "tabs" })} />
      </div>
    );
  }

  if (view.type === "lesson") {
    const lesson = LESSONS.find((l) => l.id === view.id)!;
    return (
      <div className="app">
        <LessonPlayer
          lesson={lesson}
          onExit={() => setView({ type: "tabs" })}
          onComplete={(correct, med) => {
            const at = Date.now();
            setProgress((p) => {
              const prev = p.lessons[lesson.id];
              return {
                ...p,
                lessons: { ...p.lessons, [lesson.id]: { completedAt: prev?.completedAt ?? at, bestBoss: Math.max(prev?.bestBoss ?? 0, correct) } },
                items: prev ? p.items : { ...p.items, [skillKey(lesson.id)]: review(newItem(at), { ok: true, ms: Number.isFinite(med) ? med : lesson.targetMs, at }, lesson.targetMs) },
              };
            });
            setView({ type: "tabs" });
            setTab("hoy");
          }}
        />
      </div>
    );
  }

  return (
    <div className="app">
      {tab === "hoy" && (
        <Today progress={progress} now={now} onDiagnostic={() => startDiagnostic("A1")} onSession={startDaily} onLesson={(id) => setView({ type: "lesson", id })} />
      )}
      {tab === "arsenal" && <Arsenal progress={progress} now={now} onPracticeTier={practiceTier} onDiagnostic={startDiagnostic} />}
      {tab === "aprender" && <Learn progress={progress} onLesson={(id) => setView({ type: "lesson", id })} />}
      <nav className="tabbar">
        <button className="tab" aria-current={tab === "hoy" ? "page" : undefined} onClick={() => setTab("hoy")}><IconToday />Hoy</button>
        <button className="tab" aria-current={tab === "arsenal" ? "page" : undefined} onClick={() => setTab("arsenal")}><IconGrid />Arsenal</button>
        <button className="tab" aria-current={tab === "aprender" ? "page" : undefined} onClick={() => setTab("aprender")}><IconPath />Aprender</button>
      </nav>
    </div>
  );
}
