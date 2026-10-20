import type { Lesson } from "./types";

export const x5Lesson: Lesson = {
  id: "x5",
  techniqueId: "mul.x5-x25-x125",
  path: "nucleo",
  icon: "×25",
  title: "×5, ×25 y ×125",
  subtitle: "Divide por 2, 4 u 8 y agrega ceros",
  minutes: 7,
  targetMs: 5000,
  steps: [
    {
      type: "hook",
      title: "48 × 25 sin multiplicar",
      body: "Divide 48 por 4: da 12. Agrega dos ceros: 1.200. Con ×5 se divide por 2 y con ×125 por 8: 240 y 6.000.",
      visual: "x5-hook",
    },
    {
      type: "why",
      title: "Por qué funciona",
      body: "25 es 100 partido en 4. Multiplicar por 25 es multiplicar por 100 y dividir por 4. Lo mismo con 5, que es 10 partido en 2, y con 125, que es 1.000 partido en 8.",
      visual: "x5-bars",
    },
    {
      type: "rule",
      title: "Cuando no divide justo",
      body: "37 no se divide justo por 4. Pon los ceros primero y saca mitades: 3.700, mitad 1.850, mitad 925. Dividir por 4 es sacar mitad dos veces; por 8, tres veces.",
      visual: "x5-halves",
    },
    {
      type: "guided",
      title: "Tu turno, con ayuda",
      body: "La guía muestra la división o las mitades. Escribe el resultado completo.",
      count: 4,
      hard: [false, false, true, true],
    },
    {
      type: "practice",
      title: "Ahora sin ayuda",
      body: "Ocho problemas mezclados, sin reloj. Si fallas, verás el camino.",
      count: 8,
    },
    {
      type: "boss",
      title: "El jefe",
      body: "Diez problemas con reloj. Necesitas 9 correctos para dominar la técnica.",
      count: 10,
      pass: 9,
      targetMs: 6000,
    },
  ],
};
