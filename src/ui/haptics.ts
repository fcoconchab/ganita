// Vibración corta al teclear y al responder.
// Android: navigator.vibrate. iPhone (iOS 18 o más): Safari no expone vibrate, pero tocar la
// etiqueta de un <input type="checkbox" switch> produce el "clic" táctil del sistema.
// Tiene que ocurrir dentro de un toque del usuario; por eso se llama desde el teclado.
let enabled = true;
let label: HTMLLabelElement | null = null;

export const setHaptics = (on: boolean) => { enabled = on; };

function iosLabel(): HTMLLabelElement | null {
  if (label) return label;
  if (typeof document === "undefined") return null;
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.id = "ganita-haptic";
  label = document.createElement("label");
  label.htmlFor = input.id;
  for (const el of [input, label]) {
    el.setAttribute("aria-hidden", "true");
    el.tabIndex = -1;
    Object.assign(el.style, { position: "fixed", left: "-200px", top: "0", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" });
  }
  document.body.append(input, label);
  return label;
}

export function haptic(kind: "tap" | "ok" | "bad" = "tap") {
  if (!enabled) return;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(kind === "bad" ? [18, 50, 18] : kind === "ok" ? 14 : 6);
      return;
    }
    const l = iosLabel();
    if (!l) return;
    l.click();
    if (kind === "bad") setTimeout(() => l.click(), 70);
  } catch {
    /* sin vibración disponible */
  }
}
