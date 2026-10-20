# Ganita · Bitácora de progreso

Registro de lo que se hizo, en qué chat y qué quedó pendiente. **Cada chat lo lee al empezar y agrega una entrada al terminar** (la más nueva arriba). El estado de los hitos vive en `docs/ROADMAP.md`.

## Estado actual

| Hito | Estado | Chat a cargo |
|---|---|---|
| 0 · Fase 0 en tu iPhone | Publicado, falta validar en iPhone | Francisco |
| 0.5 · Cimientos | Publicado; faltan correcciones de la prueba en iPhone y 3 días de uso | Chat "0.5 Cimientos" |
| 1a · Victorias rápidas | Pendiente (después de 0.5) | Chat "1a Victorias rápidas" |
| Investigación | Pendiente | Chat "Investigación" |

## Entradas

### 2026-10-20 · Chat "0.5 Cimientos" (parte 2: el juego más bonito y el reintento)
- **Hecho:**
  - Reintentos: un acierto justo después de un error ahora agenda para mañana (antes, 2 días como si se supiera de memoria) y no entra al historial ni a la mediana. En habilidades, el reintento no borra el error.
  - Cuentas de ábaco: la barra de progreso es una fila de cuentas que se colorean (verde, azafrán rápida, coral error); la misma fila en el resumen y en Hoy ("Hoy: 15 de 17 bien, 13 rápidas").
  - Respuesta: la pregunta entra con movimiento, el acierto crece y muestra su tiempo, la rápida se pinta azafrán con un anillo; el error tiembla, achica el problema y muestra el camino línea por línea. Racha visible desde 3 seguidas y celebración cada 5.
  - Sonido nuevo tipo marimba: escala pentatónica que sube con la racha, brillo en las rápidas, clic seco en las teclas. Vibración (Android; iPhone con iOS 18+), con interruptor en Ajustes.
  - Teclado con teclas que se hunden. Resumen con el % que cuenta, "Subieron de rango" (celdas que cambian de color), la más rápida y "Para repasar" solo con errores y lentas.
  - Hoy: saludo según la hora, mini mapa del nivel actual (toca para ir al Arsenal), etiquetas en minúscula inicial en vez de mayúsculas espaciadas.
  - Tema claro: números legibles sobre celdas Aprendiz y Fluido (nuevo token `--r-ink-soft`).
- **Verificado:** 64 tests, build sin errores. Sesiones completas jugadas en 390 × 844 (pantalla del iPhone 14 instalada) en oscuro y claro, con capturas de cada estado y un GIF de la sesión. Cero errores de consola.
- **Decisiones:** reintento = fijar, no medir (`relearn`); racha y celebración cada 5 sin castigar al fallar (la racha solo vuelve a 0); vibración activada por defecto.
- **Pendiente:** validar en iPhone real la vibración (confianza media: depende del truco del interruptor de Safari en iOS 18), el sonido con la marimba y la hoja de compartir del respaldo; correcciones de la prueba en iPhone; 3 días de uso para cerrar el hito.

### 2026-10-20 · Chat "0.5 Cimientos" (parte 1: respaldo, ajustes, tiempos)
- **Hecho:**
  - Formato de datos v2 (`ganita:v2`) con migración desde v1; la clave v1 queda intacta como copia. Si v2 se daña, se carga v1.
  - Respaldo: Ajustes → Exportar (hoja de compartir del iPhone: Archivos, iCloud, AirDrop) e Importar con vista previa (fecha, respuestas, hechos, lecciones y cuánto agrega). Importar fusiona sin borrar; "Deshacer" disponible mientras no practiques después. Aviso suave en Hoy con 100+ respuestas y 14 días sin respaldo.
  - Ajustes (engranaje en Hoy): largo de sesión 10/15/25/40, sonido con prueba, tema Sistema/Oscuro/Claro (sin parpadeo al abrir, ajusta el color de la barra).
  - Registro de tiempos: cada respuesta con modo, reintento y "No sé" (hasta 20.000). Pantalla "Tus tiempos": mediana, % bajo 1,5 s y 3 s, histograma por tramos con colores de rango, comparación por cifras de la respuesta (cuánto pesa teclear), avance hacia 14 días y 300 respuestas, planilla CSV.
  - Correcciones menores: "1 repaso te espera" (antes "1 repasos"); en listas con scroll los hijos ya no se encogen (la fila de pestañas de nivel quedaba en 0 px).
- **Verificado:** 61 tests (37 nuevos: migración, fusión idempotente y sin pérdida, cuantiles contra numpy, CSV), build sin errores. Prueba de punta a punta en tamaño iPhone 14 (oscuro y claro): migración de un progreso v1 real, sesión jugada con teclado, exportar → importar en un teléfono vacío (ítems, lecciones, registro y estadísticas idénticos), importar dos veces sin cambios, deshacer, archivo ajeno rechazado, lección completa registrando guiada/práctica/jefe. Cero errores de consola.
- **Decisiones:** importar = fusionar (nunca reemplazar); tema por defecto = Sistema (lo que ya tenías); los ajustes no viajan en la importación; para calibrar cuentan solo primeros intentos de hechos; CSV con punto y coma y ms enteros para Excel en Chile.
- **Pendiente:** correcciones de la prueba en iPhone (Francisco las pasa con capturas); probar en iPhone real la hoja de compartir al exportar y el selector de archivos al importar (confianza media: en el computador se probó la descarga); 3 días de uso para cerrar el hito. Observación para la investigación: un acierto justo después de un error (reintento) hoy sube el intervalo a 2 días; quizás debería quedar en 1.

### 2026-10-20 · Chat inicial (definición y Fase 0)
- **Hecho:** atlas de 122 técnicas en 15 ramas; arquitectura; hoja de ruta; prompt de investigación; instrucciones del proyecto; repo `fcoconchab/ganita` con publicación automática en GitHub Pages; Fase 0 (Arsenal de 164 hechos en 4 niveles, diagnóstico, repaso espaciado calificado por tiempo, sesión diaria, mapa del Arsenal, lección ×11).
- **Verificado:** 24 tests, build sin errores, flujo completo probado en tamaño iPhone (oscuro y claro), deploy exitoso.
- **Decisiones:** Arsenal hasta 19 × 19 más cuadrados 20-30 (no la tabla del 12); rango provisorio con menos de 3 intentos, desbloqueo exige 3; los shows (hito 2) van antes del Védico I.
- **Pendiente:** validar en iPhone real (instalación, sonido, uso sin conexión).
