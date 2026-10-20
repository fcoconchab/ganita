// Aplica el tema elegido en Ajustes. "sistema" sigue al teléfono.
import type { Theme } from "../core/storage";

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "oscuro") root.dataset.theme = "dark";
  else if (theme === "claro") root.dataset.theme = "light";
  else delete root.dataset.theme;
  // color de la barra del navegador acorde al fondo
  const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => bg && m.setAttribute("content", bg));
}

/** Escucha cambios del tema del teléfono (solo importa en modo "sistema"). */
export function onSystemThemeChange(fn: () => void): () => void {
  if (typeof matchMedia === "undefined") return () => {};
  const mq = matchMedia("(prefers-color-scheme: light)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
}
