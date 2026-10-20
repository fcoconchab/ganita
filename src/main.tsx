import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/manrope";
import "./styles/app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Funciona sin internet una vez instalada.
// En el iPhone la app instalada queda suspendida y no se recarga sola: al volver a ella
// se busca una versión nueva, y cuando el service worker nuevo toma el control, se recarga una vez.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController || reloaded) return; // primera instalación: no hace falta recargar
      reloaded = true;
      window.location.reload();
    });
    navigator.serviceWorker.register("./sw.js").then((reg) => {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") reg.update().catch(() => {});
      });
    }).catch(() => {});
  });
}
