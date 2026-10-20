// Sonido con Web Audio, sin archivos: tonos tipo marimba (fundamental + sobretono ×4 que se apaga rápido).
// Los aciertos seguidos suben por una escala pentatónica: la racha se escucha.
let ctx: AudioContext | null = null;
let out: GainNode | null = null;
let enabled = true;

export const setSound = (on: boolean) => { enabled = on; };

// Pentatónica mayor desde Do5 (Hz): do re mi sol la, dos octavas.
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

function ensure() {
  if (!enabled) return false;
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      out = ctx.createGain();
      out.gain.value = 0.9;
      out.connect(comp).connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
    return true;
  } catch {
    return false;
  }
}

/** Una nota "de madera": ataque corto, cuerpo sinusoidal y un brillo ×4 que dura poco. */
function mallet(freq: number, start = 0, dur = 0.5, gain = 0.07) {
  if (!ctx || !out) return;
  const t = ctx.currentTime + start;
  const partial = (mult: number, g: number, d: number) => {
    const o = ctx!.createOscillator();
    const v = ctx!.createGain();
    o.type = "sine";
    o.frequency.value = freq * mult;
    v.gain.setValueAtTime(0, t);
    v.gain.linearRampToValueAtTime(g, t + 0.006);
    v.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(v).connect(out!);
    o.start(t);
    o.stop(t + d + 0.02);
  };
  partial(1, gain, dur);
  partial(4, gain * 0.28, dur * 0.18);
  partial(2.01, gain * 0.12, dur * 0.4);
}

/** Golpecito seco para las teclas: ruido filtrado de 18 ms. */
function click() {
  if (!ctx || !out) return;
  const len = Math.floor(ctx.sampleRate * 0.018);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2400;
  bp.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.value = 0.22;
  src.connect(bp).connect(g).connect(out);
  src.start();
}

const note = (combo: number) => SCALE[Math.min(Math.max(combo - 1, 0), SCALE.length - 1)];

export const sfx = {
  tap() { if (ensure()) click(); },
  /** acierto; `combo` = aciertos seguidos (1, 2, 3…) */
  ok(combo = 1) { if (ensure()) mallet(note(combo), 0, 0.45); },
  /** acierto rápido: la nota de la racha más un brillo una quinta arriba */
  fast(combo = 1) {
    if (!ensure()) return;
    const f = note(combo);
    mallet(f, 0, 0.45);
    mallet(f * 1.5, 0.07, 0.5, 0.05);
  },
  bad() {
    if (!ensure()) return;
    mallet(293.66, 0, 0.35, 0.06);
    mallet(261.63, 0.11, 0.5, 0.06);
  },
  /** cada 5 seguidas */
  milestone() {
    if (!ensure()) return;
    [1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => mallet(f, 0.08 + i * 0.06, 0.6, 0.045));
  },
  done() {
    if (!ensure()) return;
    [523.25, 659.25, 783.99, 1046.5, 1567.98].forEach((f, i) => mallet(f, i * 0.085, 0.9, 0.055));
  },
};
