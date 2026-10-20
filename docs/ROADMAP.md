# Ganita · Hoja de ruta

Cómo se construye, en qué orden y cuándo algo está "listo". Se actualiza al cerrar cada hito.

---

## Cómo trabajamos (cada funcionalidad pasa por esto)

```
1. FICHA      → 2. CONSTRUIR → 3. VERIFICAR       → 4. PUBLICAR → 5. USAR 3 DÍAS → 6. AJUSTAR
qué, por qué,    código +       tests, capturas      push a main    en tu iPhone,     y recién ahí
cómo se sabe     tests          iPhone, cuentas      (Pages)        anotas lo que      el siguiente
que está listo                  verificadas                         molesta
(Francisco aprueba)                                                 (Francisco)
```

Regla: **no se empieza un hito sin cerrar el anterior.** "Perfecto" no se diseña de una vez: sale de usarlo todos los días y corregir.

## Definición de "listo"

| Para | Listo cuando |
|---|---|
| Una lección | 6 pasos completos · generador con test · cada ejemplo verificado con código · animación del "por qué" · probada en iPhone, oscuro y claro |
| Un hecho o regla | Su estrategia de respaldo tiene test y termina en el resultado correcto |
| Un hito | Todo lo anterior + Francisco lo usó 3 días sin bloqueos |

---

## Hitos

| # | Hito | Contenido | Estado |
|---|---|---|---|
| 0 | **Fase 0 en tu iPhone** | Arsenal, diagnóstico, repaso espaciado, lección ×11 | Publicado · falta validar en iPhone |
| 0.5 | **Cimientos** | Respaldo del progreso (exportar/importar), ajustes (largo de sesión, sonido, tema), registro de tiempos, correcciones de tu prueba | Publicado · respaldo, ajustes, tiempos y pulido visual del juego; faltan tus correcciones del iPhone y 3 días de uso |
| 1a | **Victorias rápidas** | ×5 · ×25 · ×125 · ×9 · ×99 · cuadrados terminados en 5 | Publicado · 3 lecciones; falta probarlas en iPhone y 3 días de uso (en paralelo con el cierre del 0.5) |
| 1b | **Métodos generales** | Compensación · complemento · distributiva de izquierda a derecha | Pendiente |
| 2 | **Primeros shows** | Raíz cúbica de 6 dígitos · raíz quinta · cubos 1-10 al Arsenal · modo público | Pendiente |
| 1c | **Védico I** | Base cercana (Nikhilam) · diferencia de cuadrados · bloques de % | Pendiente |
| 3 | **Mundo real · Chile** | UF y dólar del día · IVA · propinas · rentabilidades | Pendiente |
| 4 | **Modos** | Oído (la app dicta) · presión · conversación | Pendiente |
| 5 | **Avanzado** | Cuadrados 3-4 dígitos · 3×3 · código fonético · calendario | Pendiente |

Los shows van antes del Védico I a propósito: con poco esfuerzo dan el primer "eres una máquina", y eso sostiene la práctica diaria de lo difícil.

La investigación (`docs/INVESTIGACION_PROMPT.md`) puede reordenar los hitos 1c en adelante.

---

## Riesgos conocidos

| Riesgo | Mitigación | Confianza |
|---|---|---|
| iOS borra datos de sitios web sin uso por 7 días | No aplica a apps agregadas a inicio; además hay respaldo en Ajustes y un aviso en Hoy si pasan 14 días sin respaldar | Media-alta |
| Umbrales de tiempo (1,5 s / 3 s) mal calibrados para ti | Registro de tiempos activo desde el hito 0.5; se revisan con 14 días y 300 respuestas (Ajustes → Tus tiempos) | Media |
| Demasiadas lecciones nuevas a la vez | Máximo 1 técnica nueva cada 2-3 días; el Arsenal es diario | Alta |
