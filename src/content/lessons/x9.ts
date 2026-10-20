import type { Lesson } from "./types";

export const x9Lesson: Lesson = {
  id: "x9",
  techniqueId: "mul.x9-x99-x999",
  path: "trachtenberg",
  icon: "×99",
  title: "×9 y ×99",
  subtitle: "Por 10 o por 100, y resta el número",
  minutes: 6,
  targetMs: 5000,
  steps: [
    {
      type: "hook",
      title: "73 × 99 en un segundo",
      body: "Al 73 réstale 1: queda 72. Lo que le falta a 73 para llegar a 100 es 27. Pégalos: 7.227.",
      visual: "x99-hook",
    },
    {
      type: "why",
      title: "Por qué funciona",
      body: "99 es 100 menos 1, así que 73 × 99 es 7.300 menos 73. Al retroceder 73 desde 7.300 pasas el 7.200 y quedas 27 más arriba: 7.227.",
      visual: "x99-line",
    },
    {
      type: "rule",
      title: "Con ×9, la misma idea",
      body: "9 es 10 menos 1: 47 × 9 = 470 − 47 = 423. Y en ×99, la parte derecha siempre lleva dos cifras: 95 × 99 es 94 | 05, o sea 9.405.",
      visual: "x9-rule",
    },
    {
      type: "guided",
      title: "Tu turno, con ayuda",
      body: "La guía muestra el primer paso. Escribe el resultado completo.",
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
      targetMs: 5000,
    },
  ],
};
