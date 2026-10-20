# Ganita

App para iPhone que entrena cálculo mental desde cero hasta nivel "calculadora humana".

- **Arsenal:** tablas del 2 al 19 y cuadrados hasta 30, con diagnóstico y repaso espaciado calificado por tiempo de respuesta.
- **Caminos:** cada técnica se enseña en 6 pasos (truco, por qué funciona, regla, práctica guiada, práctica libre, jefe). La primera: multiplicar por 11.
- **Hoy:** la sesión diaria se arma sola con lo vencido, lo nuevo y lo más lento.

## Instalar en el iPhone

1. Abre la app publicada en Safari: `https://fcoconchab.github.io/ganita/`
2. Toca Compartir → **Agregar a inicio**.
3. Ábrela desde el ícono: funciona a pantalla completa y sin internet.

El progreso se guarda en el teléfono.

## Documentos

- [Arquitectura](docs/ARQUITECTURA.md): cómo está pensada la app, de lo pedagógico a lo técnico.
- [Hoja de ruta](docs/ROADMAP.md): hitos, orden de construcción y definición de "listo".
- [Bitácora](docs/PROGRESO.md): qué se hizo en cada chat y qué quedó pendiente.
- [Atlas de técnicas](docs/atlas.html): las 122 técnicas en 15 ramas y 5 niveles.
- [Prompt de investigación](docs/INVESTIGACION_PROMPT.md): para buscar técnicas que falten.
- [Instrucciones del proyecto](docs/INSTRUCCIONES_PROYECTO.md): para pegar en el proyecto de Claude.

## Desarrollo

```bash
npm install
npm run dev     # local
npm test        # lógica
npm run build   # producción
```
