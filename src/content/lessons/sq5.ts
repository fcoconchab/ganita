import type { Lesson } from "./types";

export const sq5Lesson: Lesson = {
  id: "sq5",
  techniqueId: "pot.cuadrados-terminados-en-5",
  path: "vedico",
  icon: "5²",
  title: "Cuadrados terminados en 5",
  subtitle: "La decena por la siguiente, y pega 25",
  minutes: 7,
  targetMs: 4000,
  steps: [
    {
      type: "hook",
      title: "65² en un segundo",
      body: "Toma el 6 y multiplícalo por el que sigue: 6 × 7 = 42. Pega 25 al final: 4.225.",
      visual: "sq5-hook",
    },
    {
      type: "why",
      title: "Por qué funciona",
      body: "Un cuadrado de 65 por lado es uno de 60, dos franjas de 60 × 5 y una esquina de 5 × 5. Si pones las dos franjas abajo, armas un rectángulo de 60 × 70 = 4.200. La esquina suma 25.",
      visual: "sq5-area",
    },
    {
      type: "rule",
      title: "Con 3 cifras, igual",
      body: "115²: toma el 11 y multiplícalo por 12: 132. Pega 25: 13.225. Sirve hasta 195², con 19 × 20 = 380: 38.025.",
      visual: "sq5-rule",
    },
    {
      type: "guided",
      title: "Tu turno, con ayuda",
      body: "La guía muestra la multiplicación. Escribe el resultado completo.",
      count: 4,
      hard: [false, false, true, true],
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
