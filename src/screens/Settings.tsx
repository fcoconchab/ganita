import { useRef, useState } from "react";
import pkg from "../../package.json";
import { backupFileName, importDelta, parseBackup, summarize, toBackup } from "../core/backup";
import { fmt } from "../core/facts";
import { SESSION_LENGTHS, type Progress, type Settings as SettingsT, type Theme } from "../core/storage";
import { IconBack, IconChevron, IconDown, IconUp } from "../ui/icons";
import { shareFile } from "../ui/share";
import { haptic, setHaptics } from "../ui/haptics";
import { setSound, sfx } from "../ui/sound";

interface Props {
  progress: Progress;
  now: number;
  undo: { savedAt: number } | null;
  onSettings: (s: Partial<SettingsT>) => void;
  onExported: (at: number) => void;
  onImport: (incoming: Progress) => void;
  onUndo: () => void;
  onTimes: () => void;
  onBack: () => void;
}

const THEME_LABEL: Record<Theme, string> = { sistema: "Sistema", oscuro: "Oscuro", claro: "Claro" };

const fecha = (t: number) => new Date(t).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
const hora = (t: number) => new Date(t).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });

export function ago(t: number | null, now: number): string {
  if (t === null) return "nunca";
  const d = Math.floor((now - t) / 86_400_000);
  if (d <= 0) return `hoy, ${hora(t)}`;
  if (d === 1) return "ayer";
  return `hace ${d} días`;
}

type Pending = { incoming: Progress; exportedAt: number | null; delta: ReturnType<typeof importDelta> };

export function Settings({ progress, now, undo, onSettings, onExported, onImport, onUndo, onTimes, onBack }: Props) {
  const s = progress.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);

  const exportBackup = async () => {
    const at = Date.now();
    setBusy(true);
    const out = await shareFile(backupFileName(at), toBackup({ ...progress, meta: { ...progress.meta, lastBackupAt: at } }, at), "application/json");
    setBusy(false);
    if (out === "shared" || out === "downloaded") {
      onExported(at);
      setNotice({ ok: true, text: out === "shared" ? "Respaldo listo. Guárdalo en Archivos o iCloud Drive." : "Respaldo descargado." });
    } else if (out === "failed") setNotice({ ok: false, text: "No se pudo crear el archivo. Inténtalo de nuevo." });
  };

  const pickFile = async (f: File | undefined) => {
    if (!f) return;
    setNotice(null);
    const r = parseBackup(await f.text());
    if (fileRef.current) fileRef.current.value = "";
    if (!r.ok) { setNotice({ ok: false, text: r.error }); return; }
    setPending({ incoming: r.progress, exportedAt: r.exportedAt, delta: importDelta(progress, r.progress) });
  };

  const confirmImport = () => {
    if (!pending) return;
    onImport(pending.incoming);
    const n = pending.delta.newLog;
    setNotice({ ok: true, text: n > 0 ? `Listo: se agregaron ${fmt(n)} respuestas a tu progreso.` : "Listo: ya tenías todo lo de este respaldo." });
    setPending(null);
  };

  const sum = pending ? summarize(pending.incoming) : null;
  const nothingNew = pending ? pending.delta.newLog === 0 && pending.delta.newLessons === 0 : false;

  return (
    <div className="drill">
      <div className="subhead">
        <button className="close" onClick={onBack} aria-label="Volver"><IconBack /></button>
        <h1 className="title-m">Ajustes</h1>
      </div>

      <div className="screen">
        <section className="card">
          <span className="eyebrow">Sesión diaria</span>
          <div className="seg fill" role="radiogroup" aria-label="Largo de la sesión">
            {SESSION_LENGTHS.map((n) => (
              <button key={n} role="radio" aria-checked={s.sessionLength === n} aria-pressed={s.sessionLength === n} onClick={() => onSettings({ sessionLength: n })}>
                <b className="num">{n}</b><span>≈ {Math.round(n / 5)} min</span>
              </button>
            ))}
          </div>
          <p className="small muted">Preguntas por sesión. Los repasos vencidos van primero; lo que no alcance queda para mañana.</p>
        </section>

        <section className="card">
          <div className="set-row">
            <span>
              <b>Sonido</b>
              <span className="small muted">Teclado, aciertos y errores</span>
            </span>
            <button
              className="switch" role="switch" aria-checked={s.sound} aria-label="Sonido"
              onClick={() => {
                const on = !s.sound;
                onSettings({ sound: on });
                if (on) { setSound(true); sfx.fast(); }
              }}
            />
          </div>
          <div className="set-row">
            <span>
              <b>Vibración</b>
              <span className="small muted">Un toque suave al teclear y al fallar</span>
            </span>
            <button
              className="switch" role="switch" aria-checked={s.haptics} aria-label="Vibración"
              onClick={() => { const on = !s.haptics; onSettings({ haptics: on }); if (on) { setHaptics(true); haptic("ok"); } }}
            />
          </div>
          <p className="small muted">En el iPhone, el sonido depende del interruptor de silencio del costado. La vibración necesita iOS 18 o más.</p>
        </section>

        <section className="card">
          <span className="eyebrow">Tema</span>
          <div className="seg fill" role="radiogroup" aria-label="Tema">
            {(["sistema", "oscuro", "claro"] as Theme[]).map((t) => (
              <button key={t} role="radio" aria-checked={s.theme === t} aria-pressed={s.theme === t} onClick={() => onSettings({ theme: t })}>
                {THEME_LABEL[t]}
              </button>
            ))}
          </div>
          <p className="small muted">{s.theme === "sistema" ? "Sigue el modo claro u oscuro del teléfono." : `Siempre ${THEME_LABEL[s.theme].toLowerCase()}.`}</p>
        </section>

        <section className="card">
          <div className="row between">
            <span className="eyebrow">Respaldo</span>
            <span className="small muted">Último: {ago(progress.meta.lastBackupAt, now)}</span>
          </div>
          <p className="small muted">Tu progreso vive solo en este teléfono. Exporta un respaldo de vez en cuando y guárdalo en Archivos o iCloud Drive. Importar junta el respaldo con lo que ya tienes: no se borra nada.</p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" style={{ flex: 1 }} disabled={busy} onClick={exportBackup}><IconUp />Exportar</button>
            <button className="btn line" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}><IconDown />Importar</button>
            <input ref={fileRef} type="file" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
          </div>
          {notice && <p className={`notice ${notice.ok ? "ok" : "bad"}`} role="status">{notice.text}</p>}
          {undo && (
            <button className="btn block ghost" onClick={() => { onUndo(); setNotice({ ok: true, text: "Importación deshecha: volviste al progreso anterior." }); }}>
              Deshacer la importación del {fecha(undo.savedAt)}
            </button>
          )}
        </section>

        <button className="card lesson-card" onClick={onTimes} style={{ gridTemplateColumns: "1fr auto" }}>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="eyebrow">Calibración</span>
            <b className="card-title">Tus tiempos</b>
            <span className="small muted">Cuánto tardas de verdad, comparado con los umbrales de 1,5 s y 3 s.</span>
          </span>
          <IconChevron />
        </button>

        <p className="small muted" style={{ textAlign: "center" }}>Ganita {pkg.version} · datos v{progress.version}</p>
      </div>

      {pending && sum && (
        <>
          <div className="sheet-bg" onClick={() => setPending(null)} />
          <div className="sheet" role="dialog" aria-label="Importar respaldo">
            <span className="grab" />
            <span className="eyebrow">Importar respaldo</span>
            <h2 className="title-m">{pending.exportedAt ? `Del ${fecha(pending.exportedAt)}` : "Respaldo sin fecha"}</h2>
            <div className="stats3">
              <div className="stat"><b>{fmt(sum.answers)}</b><span>respuestas</span></div>
              <div className="stat"><b>{sum.factsSeen}</b><span>hechos vistos</span></div>
              <div className="stat"><b>{sum.lessons}</b><span>{sum.lessons === 1 ? "lección" : "lecciones"}</span></div>
            </div>
            <p className="muted">
              {nothingNew
                ? "Ya tienes todo lo que trae este respaldo. Importarlo no cambia nada."
                : `Se suman ${fmt(pending.delta.newLog)} respuestas${pending.delta.newLessons ? ` y ${pending.delta.newLessons} ${pending.delta.newLessons === 1 ? "lección" : "lecciones"}` : ""} a tu progreso. No se borra nada, y puedes deshacerlo.`}
            </p>
            <button className="btn block" onClick={confirmImport}>{nothingNew ? "Importar igual" : "Importar y juntar"}</button>
            <button className="btn block ghost" onClick={() => setPending(null)}>Cancelar</button>
          </div>
        </>
      )}
    </div>
  );
}
