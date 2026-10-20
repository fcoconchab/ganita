# CLAUDE.md

Guía para Claude al trabajar en este repositorio.

## Qué es

Ganita: PWA para iPhone que entrena cálculo mental (Arsenal de hechos, lecciones de técnicas, repaso espaciado). La arquitectura completa está en `docs/ARQUITECTURA.md` y manda sobre cualquier otra suposición.

## Comandos

```bash
npm install        # dependencias
npm run dev        # servidor local
npm test           # tests de la lógica (vitest)
npm run build      # build de producción en dist/ (también corre tsc)
```

Cada push a `main` publica en GitHub Pages con `.github/workflows/deploy.yml`.

## Reglas

- `src/core/` es lógica pura: no importa React ni toca el DOM. Todo lo que está ahí tiene tests en `tests/`.
- El contenido son datos: técnicas en `src/content/techniques.json`, lecciones en `src/content/lessons/`. Una lección nueva no debería requerir una pantalla nueva.
- Toda regla o ejemplo matemático se verifica con un test o ejecutando código. Las estrategias de respaldo de los hechos se prueban todas en `tests/facts.test.ts`.
- Los textos de la app van en español de Chile: decimales con coma, miles con punto, sin guiones largos (—).
- Colores y tipografía solo desde los tokens de `src/styles/tokens.css`.
- El progreso del usuario se guarda en `localStorage` (`ganita:v1`). Si cambia el formato, sube la versión y escribe una migración en `src/core/storage.ts`; nunca borres el progreso.
- Al entregar cambios a Francisco: archivos completos, nunca diffs.
- Antes de cerrar una tarea: `npm test` y `npm run build` sin errores.
