import catalog from "../content/techniques.json";
import { LESSONS } from "../content/lessons/x11";
import type { Progress } from "../core/storage";
import { IconChevron, IconLock } from "../ui/icons";

interface Props {
  progress: Progress;
  onLesson: (id: string) => void;
}

/** Próximas lecciones (Fase 1). Se muestran bloqueadas hasta que existan. */
const SOON: { icon: string; title: string; path: string }[] = [
  { icon: "≈", title: "Compensación: redondear y ajustar", path: "Núcleo" },
  { icon: "9̄", title: "Complemento: todos de 9, el último de 10", path: "Védico" },
  { icon: "→", title: "Multiplicar de izquierda a derecha", path: "Benjamin" },
  { icon: "×5", title: "×5, ×25 y ×125", path: "Núcleo" },
  { icon: "×9", title: "×9 y ×99", path: "Trachtenberg" },
  { icon: "5²", title: "Cuadrados terminados en 5", path: "Védico" },
  { icon: "%", title: "Bloques de 10%, 5% y 1%", path: "Banquero" },
  { icon: "≡", title: "Base cercana (Nikhilam)", path: "Védico" },
  { icon: "a²", title: "Diferencia de cuadrados", path: "Védico" },
];

export function Learn({ progress, onLesson }: Props) {
  return (
    <div className="screen">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="eyebrow">Caminos</span>
        <h1 className="title-xl">Aprender</h1>
        <p className="muted">Cada técnica en 6 pasos: el truco, por qué funciona, la regla, práctica guiada, práctica libre y el jefe.</p>
      </div>

      <div className="path-head">
        <span className="eyebrow">Disponible</span>
      </div>
      {LESSONS.map((l) => {
        const done = progress.lessons[l.id];
        return (
          <button key={l.id} className="card lesson-card" onClick={() => onLesson(l.id)}>
            <span className="lesson-icon">×11</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="eyebrow">Trachtenberg · {l.minutes} min</span>
              <b style={{ fontFamily: "var(--display)", fontSize: 19, fontWeight: 600 }}>{l.title}</b>
              <span className="small muted">{done ? `Dominada · jefe ${done.bestBoss}/10` : l.subtitle}</span>
            </span>
            {done ? <span className="pill good">Hecha</span> : <IconChevron />}
          </button>
        );
      })}

      <div className="path-head" style={{ marginTop: 6 }}>
        <span className="eyebrow">Próximamente · Fase 1</span>
      </div>
      <div className="card" style={{ gap: 4, padding: "8px 18px" }}>
        {SOON.map((s) => (
          <div key={s.title} className="lesson-card locked" style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
            <span className="lesson-icon" style={{ width: 44, height: 44, fontSize: 18 }}>{s.icon}</span>
            <span style={{ display: "flex", flexDirection: "column" }}>
              <span className="eyebrow" style={{ fontSize: 11 }}>{s.path}</span>
              <span style={{ fontWeight: 650 }}>{s.title}</span>
            </span>
            <IconLock />
          </div>
        ))}
      </div>

      <a className="card" href="./atlas.html" target="_blank" rel="noopener" style={{ textDecoration: "none", color: "inherit" }}>
        <span className="eyebrow">El mapa completo</span>
        <div className="row between">
          <h3 style={{ fontSize: 20 }}>Atlas: {catalog.techniques.length} técnicas</h3>
          <IconChevron />
        </div>
        <p className="small muted">{catalog.branches.length} ramas, 5 niveles. Todo lo que la app va a enseñar.</p>
      </a>
    </div>
  );
}
