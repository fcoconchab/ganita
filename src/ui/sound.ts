// Sonidos sutiles con Web Audio. El iPhone no permite vibrar desde una app web,
// así que la respuesta táctil se reemplaza con sonido y animación.
let ctx: AudioContext | null = null;
let enabled = true;

export const setSound = (on: boolean) => { enabled = on; };

function tone(freq: number, start: number, dur: number, gain = 0.06, type: OscillatorType = "sine") {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.02);
}

function ensure() {
  if (!enabled) return false;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return true;
  } catch {
    return false;
  }
}

export const sfx = {
  tap() { if (ensure()) tone(520, 0, 0.05, 0.02, "triangle"); },
  ok() { if (ensure()) { tone(660, 0, 0.12); tone(990, 0.07, 0.16); } },
  fast() { if (ensure()) { tone(660, 0, 0.1); tone(880, 0.06, 0.1); tone(1320, 0.12, 0.18); } },
  bad() { if (ensure()) tone(196, 0, 0.22, 0.07, "triangle"); },
  done() { if (ensure()) [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, 0.05)); },
};
