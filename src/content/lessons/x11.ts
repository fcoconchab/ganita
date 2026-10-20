import type { Lesson } from "./types";

export const x11Lesson: Lesson = {
  id: "x11",
  techniqueId: "mul.x11-y-x101",
  path: "trachtenberg",
  title: "Multiplicar por 11",
  subtitle: "Separa las cifras y suma al medio",
  minutes: 6,
  targetMs: 4000,
  steps: [
    {
      type: "hook",
      title: "72 × 11 en un segundo",
      body: "Separa el 7 y el 2. En el medio va su suma: 7 + 2 = 9. Listo: 792.",
      visual: "x11-split",
    },
    {
      type: "why",
      title: "Por qué funciona",
      body: "Multiplicar por 11 es multiplicar por 10 y sumar el número otra vez. Al sumar en columnas, la cifra del medio siempre queda como la suma de las dos cifras.",
      visual: "x11-columns",
    },
    {
      type: "rule",
      title: "Cuando la suma pasa de 9",
      body: "En 85 × 11 la suma es 8 + 5 = 13. Al medio va el 3 y el 1 se lleva a la izquierda: 8 + 1 = 9. Resultado: 935.",
      visual: "x11-carry",
    },
    {
      type: "guided",
      title: "Tu turno, con ayuda",
      body: "La guía muestra la suma del medio. Escribe el resultado completo.",
      count: 4,
      carry: [false, false, true, true],
    },
    {
      type: "practice",
      title: "Ahora sin ayuda",
      body: "Ocho problemas, sin reloj. Si fallas, verás el camino.",
      count: 8,
    },
    {
      type: "boss",
      title: "El jefe",
      body: "Diez problemas con reloj. Necesitas 9 correctos para dominar la técnica.",
      count: 10,
      pass: 9,
      targetMs: 5000,
    },
  ],
};

export const LESSONS: Lesson[] = [x11Lesson];
