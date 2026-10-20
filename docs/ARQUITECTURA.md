# Ganita · Arquitectura

Cómo está pensada la app, de lo pedagógico a lo técnico. Si algo del código no calza con este documento, manda este documento (o se actualiza a propósito).

---

## 1. La idea en una frase

**Anki + Duolingo para cálculo mental:** lecciones que enseñan cada técnica y explican por qué funciona, más repaso espaciado para que nada se olvide.

Público: primero Francisco (parte desde cero, con tablas lentas bajo presión). Después, quizás, estudiantes de PAES, GMAT y GRE, y profesionales de finanzas.

---

## 2. El mapa de la app

```
┌──────────────── HOY · sesión diaria armada por la app ────────────────┐
│  calentamiento  →  repasos vencidos  →  algo nuevo  →  desafío        │
└───────────────────────────────────────────────────────────────────────┘
      │                   │                    │                  │
 ┌────▼─────┐      ┌──────▼──────┐      ┌──────▼─────┐     ┌──────▼──────┐
 │ CAMINOS  │      │  ARSENAL    │      │   SHOWS    │     │ MUNDO REAL  │
 │ aprender │      │ automatizar │      │ impresionar│     │  aplicar    │
 └────┬─────┘      └──────┬──────┘      └──────┬─────┘     └──────┬──────┘
      └───────────────────┴──── MAPA ─────────┴───────────────────┘
```

| Pilar | Qué hace | Unidad de contenido | Ejemplo |
|---|---|---|---|
| **Caminos** | Enseña técnicas, una lección a la vez | Lección de 6 pasos | Camino Védico → Nikhilam |
| **Arsenal** | Automatiza hechos para recordarlos en menos de 1,5 s | Hecho (pregunta → respuesta fija) | 7 × 8 = 56 |
| **Shows** | Entrena hazañas para impresionar, con guion | Show (técnica + guion + modo público) | Raíz cúbica de 6 dígitos |
| **Mundo real** | Aplica todo a situaciones con contexto | Escenario (texto + generador) | "35 UF en dólares" |
| **Mapa** | Muestra el progreso: lo dominado brilla, lo que se olvida se apaga | Vista del catálogo | Matriz rama × nivel |
| **Hoy** | Arma la sesión diaria, sin que tengas que decidir | Cola de ítems | 12 minutos mezclados |

---

## 3. Modelo de contenido

Todo el contenido son **datos**, no pantallas. Una pantalla de lección sabe mostrar cualquier lección; agregar una técnica nueva es agregar datos.

```
TÉCNICA (catálogo)          "Base cercana (Nikhilam)"  · rama MUL · nivel N3
   │ se enseña con
   ▼
LECCIÓN (6 pasos)           truco → por qué → regla → guiada → práctica → jefe
   │ al aprobar el jefe crea
   ▼
HABILIDAD (skill)           tiene estado de repaso: cuándo toca, qué tan dominada
   │ se practica con
   ▼
GENERADOR                   crea problemas nuevos: 96 × 97, 103 × 108…
```

Los hechos del Arsenal son el caso más simple: no tienen lección ni generador. Cada hecho es su propio ítem de repaso.

| Concepto | Dónde vive | Qué guarda |
|---|---|---|
| Técnica | `src/content/techniques.json` | id, rama, nivel, nombre, ejemplo, escuelas, si es show |
| Hecho | `src/core/facts.ts` | a, b, respuesta, nivel (tier), estrategia de respaldo |
| Lección | `src/content/lessons/*.ts` | pasos, textos, visual del "por qué", generador |
| Estado de repaso | almacenamiento del teléfono | por ítem: intervalo, facilidad, próxima fecha, historial |

---

## 4. Cómo se aprende: la lección en 6 pasos

| # | Paso | Para qué | Ejemplo con ×11 |
|---|---|---|---|
| 1 | **El truco** | Engancha: muestra el resultado mágico primero | 72 × 11 = 792: el 7 y el 2 se separan y el 9 cae al medio |
| 2 | **Por qué funciona** | Entender hace que no se olvide | 72 × 11 = 720 + 72, sumado en columnas: la cifra del medio es 7 + 2 |
| 3 | **La regla completa** | Cubre los casos difíciles | 85 × 11: 8 + 5 = 13 → se lleva 1 → 935 |
| 4 | **Práctica guiada** | Hacerlo con ayuda visible | Primero la cifra del medio, después el resultado |
| 5 | **Práctica libre** | Sin ayuda, sin tiempo | 8 problemas generados |
| 6 | **Jefe** | Demostrar dominio | 10 problemas con reloj; 9 de 10 para aprobar |

Al aprobar el jefe, la técnica entra al repaso espaciado como **habilidad**: desde ese día aparece mezclada en las sesiones diarias.

---

## 5. Cómo no se olvida: el repaso espaciado

Cada ítem (un hecho o una habilidad) tiene un **intervalo**: los días que faltan para volver a preguntarlo. Si respondes bien, el intervalo crece. Si fallas, vuelve a empezar.

```
Respuesta        Qué pasa con el intervalo         Ejemplo (intervalo actual 6 días)
─────────────    ──────────────────────────────    ─────────────────────────────────
Error            vuelve a 0, repite en la sesión   0 días
Lenta (> 3 s)    × 1,2                             7 días
Bien             × facilidad (≈ 2,5)               15 días
Rápida (< 1,5 s) × facilidad × 1,3                 20 días
```

- La **calificación sale del tiempo**: no tienes que decir "me costó". La app lo mide.
- Los umbrales (1,5 s y 3 s) son para hechos del Arsenal. Cada habilidad tiene su propio tiempo objetivo.
- Un error dentro de la sesión vuelve a aparecer 3 preguntas después, hasta acertarlo.
- Es una variante simple de SM-2, el algoritmo de Anki. Si la investigación muestra algo mejor (por ejemplo FSRS), se cambia en un solo archivo: `src/core/srs.ts`.

---

## 6. Cómo se mide el dominio

Cada hecho y cada habilidad tiene un rango. Se calcula con los últimos 3 intentos:

| Rango | Condición | Color en el mapa |
|---|---|---|
| Nuevo | Sin intentos | Gris |
| Aprendiz | Algún error, o más lento que 3 s | Ámbar |
| Fluido | 3 aciertos, mediana bajo 3 s | Verde suave |
| Automático | 3 aciertos, mediana bajo 1,5 s | Verde intenso |
| Máquina | Automático y con un intervalo de 21 días o más | Dorado |

Con menos de 3 intentos el rango es **provisorio** (máximo Fluido), para que el diagnóstico ya muestre diferencias. Para desbloquear niveles se exigen los 3 intentos.

Un ítem que ya venció y no se repasa **se apaga** en el mapa: así se ve el olvido antes de que pase.

---

## 7. El Arsenal: qué tablas y por qué

La tabla del 12 es una convención escolar sin base cognitiva. El Arsenal llega hasta 19 × 19 y se desbloquea por niveles:

| Nivel | Hechos | Cantidad | Cómo se domina |
|---|---|---|---|
| A1 | 2–9 × 2–9 | 36 | Memoria pura, meta < 1,5 s |
| A2 | 11–19 × 2–9 | 72 | Técnica: 17 × 8 = 80 + 56. Meta < 3 s |
| A3 | 11–19 × 11–19 | 45 | Decenas iguales: 13 × 17 = 200 + 21. Meta < 3 s |
| A4 | Cuadrados 20–30 | 11 | Arriba-abajo. Meta < 3 s |

- El 10 y el 1 no se entrenan, porque son triviales.
- Un nivel se desbloquea cuando el 80% del anterior está en Fluido o mejor.
- 7 × 8 y 8 × 7 son el mismo hecho; la app muestra los dos órdenes al azar.
- Cada hecho tiene una **estrategia de respaldo** que se muestra al fallar: 7 × 9 → "7 × 10 − 7 = 63". La idea es que nunca te quedes en blanco.

---

## 8. La sesión diaria

```
1. Repasos vencidos (los más atrasados primero)    hasta 60% de la sesión
2. Hechos nuevos del nivel actual                  máximo 5 por sesión
3. Relleno con los más lentos                      hasta completar
4. Errores de la sesión                            reaparecen 3 preguntas después
```

Largo por defecto: 25 preguntas (unos 5 minutos). Se cambia en Ajustes: 10, 15, 25 o 40.

---

## 9. Fases

| Fase | Contenido | Estado |
|---|---|---|
| **0 · Arsenal** | Diagnóstico, repaso espaciado de hechos, mapa del Arsenal, sesión diaria, primera lección (×11) | **En construcción** |
| 1 · Núcleo | Unas 10 lecciones del nivel N2 (compensación, complemento, distributiva, ×5, ×9, cuadrados en 5, %) | Pendiente |
| 2 · Mundo real | Escenarios: Chile (UF, IVA, dólar del día), finanzas, entrevistas | Pendiente |
| 3 · Shows | Raíces de potencias perfectas, calendario, 1/7, dígito escondido, con modo público | Pendiente |
| 4 · Modos | Modo oído (la app dicta), modo presión, modo conversación | Pendiente |
| 5 · Avanzado | N3 a N5, código fonético, 3 × 3 | Pendiente |

---

## 10. Arquitectura técnica

### Stack

| Pieza | Elección | Por qué |
|---|---|---|
| Tipo de app | PWA (app web instalable) | Se instala en el iPhone desde Safari, funciona sin internet, no necesita App Store |
| Interfaz | React 19 + TypeScript | Componentes reutilizables y tipos que evitan errores |
| Build | Vite | Rápido y simple |
| Tests | Vitest | Toda la lógica (repaso, generadores, estrategias) se prueba con código |
| Datos | `localStorage` del teléfono | Simple, sin servidor. Si se publica, se agrega sincronización |
| Publicación | GitHub Pages, con GitHub Actions | Gratis; cada push a `main` publica la versión nueva |
| Fuentes | Fraunces (números y títulos), Manrope (texto) | Empaquetadas en la app, funcionan sin internet |

### Carpetas

```
ganita/
├── CLAUDE.md                 instrucciones para Claude al trabajar en el repo
├── README.md
├── docs/
│   ├── ARQUITECTURA.md       este documento
│   ├── INSTRUCCIONES_PROYECTO.md
│   ├── INVESTIGACION_PROMPT.md
│   └── atlas.html            el mapa de técnicas (se abre en el navegador)
├── public/                   íconos, manifest, service worker
├── src/
│   ├── core/                 lógica pura, sin interfaz (con tests)
│   │   ├── srs.ts            repaso espaciado
│   │   ├── mastery.ts        rangos de dominio
│   │   ├── facts.ts          hechos del Arsenal y estrategias de respaldo
│   │   ├── session.ts        arma la sesión diaria
│   │   ├── storage.ts        guarda, carga y migra el progreso
│   │   ├── backup.ts         exportar, importar y fusionar respaldos
│   │   └── timing.ts         análisis del registro de tiempos
│   ├── content/
│   │   ├── techniques.json   catálogo completo de técnicas
│   │   └── lessons/          una lección por archivo
│   ├── ui/                   piezas visuales (teclado, tarjeta de problema, grilla)
│   ├── screens/              pantallas (Hoy, Arsenal, Aprender, Lección, Sesión, Ajustes, Tiempos)
│   └── styles/               tokens de diseño y estilos
└── tests/                    pruebas de la lógica
```

Regla: **`core/` no conoce React**. Así la lógica se prueba sola y se podría reutilizar en una app nativa.

### Datos guardados

Un solo objeto versionado en `localStorage` (`ganita:v2`). La clave `ganita:v1` de la Fase 0 se lee al migrar y nunca se borra: queda como copia.

```
{
  version: 2,
  items:    { "f:7x8": { interval, ease, due, reps, lapses, history: [{ok, ms, at}] }, ... },   // últimos 12 intentos
  lessons:  { "x11": { completedAt, bestBoss } },
  stats:    { days: ["2026-10-20", ...], sessions, answers },
  settings: { sessionLength, sound, theme: "sistema" | "oscuro" | "claro" },
  log:      [{ at, key, a, b, ms, ok, mode, retry?, skip? }, ...],                            // registro de tiempos, máx. 20.000
  meta:     { createdAt, lastBackupAt }
}
```

| Pieza | Archivo | Regla |
|---|---|---|
| Migración | `src/core/storage.ts` | Acepta cualquier versión anterior; descarta solo lo mal formado. La v1 recupera sus tiempos del historial como registro `previo` |
| Respaldo | `src/core/backup.ts` | Exportar = archivo `.json` con el progreso completo. Importar **fusiona**: une intentos, registro, lecciones y días sin duplicar; el estado de repaso de cada ítem sale del lado con el intento más reciente; los ajustes del teléfono se mantienen. Importar dos veces el mismo archivo no cambia nada |
| Deshacer | `ganita:antes-de-importar` | Copia tomada justo antes de importar. Solo se ofrece si no se practicó después (si no, se perderían esas respuestas) |
| Registro de tiempos | `src/core/timing.ts` | Cada respuesta con su modo. Para calibrar cuentan solo primeros intentos de hechos (sin reintentos, sin "No sé", sin `previo`). Se revisan los umbrales con 14 días y 300 respuestas. Exporta planilla `.csv` separada por punto y coma |

---

## 11. Diseño

- **Los números mandan.** Números grandes en Fraunces, con mucho espacio y nada más en pantalla mientras calculas.
- **Teclado propio**, grande y al alcance del pulgar, con sonido sutil. El iPhone no permite vibración desde una app web, así que la respuesta táctil se reemplaza con sonido y animación.
- **Las técnicas se ven en movimiento**: cifras que se separan, columnas que se suman.
- **Tema**: tinta azul profunda con acento azafrán, más un tema claro. Por defecto sigue al teléfono ("Sistema"); en Ajustes se fija oscuro o claro.
- **Cero culpa**: racha con días libres permitidos, sin notificaciones agresivas.

---

## 12. Decisiones abiertas

| Decisión | Opciones | Cuándo decidir |
|---|---|---|
| Nombre final | Ganita (nombre de trabajo) u otro | Antes de publicar |
| Algoritmo de repaso | SM-2 simple (actual) o FSRS | Después de la investigación |
| Sincronización | Solo en el teléfono, o cuenta + nube | Si se publica |
| Voz | Síntesis del navegador o grabaciones | Fase 4 |
