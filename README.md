# Metro táctil

Prototipo mobile-first de un juego de gestión de metro inspirado en dinámicas de líneas, estaciones, pasajeros por forma y transbordos.

## Cómo jugar

- Arrastra sobre el fondo para moverte por el mapa infinito.
- Las estaciones aparecen poco a poco alrededor de la zona visible.
- Abre el menú de hamburguesa para cambiar entre **Línea nueva**, **Borrador** y **Pausa**.
- En **Línea nueva**, arrastra desde una estación hasta otra estación existente para crear una línea.
- Si una estación ya pertenece a otra línea, también puede usarse para empezar una nueva línea o crear transbordos.
- Toca una línea para seleccionarla.
- Arrastra un extremo de una línea seleccionada hasta otra estación para ampliarla.
- Arrastra un nodo intermedio para modificar el trazado.
- Usa **Borrador** para tocar una estación o línea y eliminarla.
- Usa **Pausa** para detener la simulación.

## Detalles técnicos

- HTML5 Canvas a pantalla completa, CSS y JavaScript puro, sin dependencias de runtime.
- Estética inspirada en Mini Metro: fondo claro tipo papel, líneas gruesas de colores sólidos, estaciones con relleno claro y contorno oscuro.
- Controles táctiles con `touchstart`, `touchmove` y `touchend`.
- `preventDefault()` y `touch-action: none` evitan scroll, zoom y gestos del navegador durante la interacción.
- Cámara con coordenadas de mundo para permitir movimiento por un mapa virtual sin límites fijos.
- Hitboxes táctiles más grandes que el dibujo visual de estaciones y puntos de control.
- En modo **Línea nueva**, la detección prioriza estaciones sobre controles de líneas para que sea fácil crear conexiones.
- Punto de fuga para edición: extremos amplían líneas; nodos intermedios mueven estaciones y alteran el trazado.
- Las estaciones nuevas se generan de forma progresiva durante la simulación.
- Cada estación mantiene una `queue` de pasajeros.
- En cada parada, el tren baja pasajeros si su forma coincide con la estación.
- Si una estación es transbordo y otra línea puede llevar al pasajero a su tipo de destino, el pasajero baja a la cola de la estación para esperar.

## Estructura

```txt
index.html
src/
  config.js       Constantes visuales y de juego.
  geometry.js     Hitboxes, distancias y selección táctil.
  input.js        Eventos táctiles, edición de líneas y desplazamiento del mapa.
  main.js         Arranque, bucle de juego y menú de herramientas.
  renderer.js     Dibujo del mapa, estaciones, pasajeros y trenes.
  simulation.js   Movimiento de trenes, colas, estaciones progresivas y transbordos.
  state.js        Estado, cámara, entidades y helpers de datos.
scripts/
  build.mjs       Genera dist/ para GitHub Pages.
tests/
  smoke.test.mjs  Comprobaciones básicas del prototipo.
.github/workflows/
  ci.yml          Ejecuta tests y build en PRs y pushes a main.
  pages.yml       Publica dist/ en GitHub Pages desde main.
```

## Comandos

```sh
npm test
npm run build
```

`npm run build` genera una carpeta `dist/` con el sitio estático listo para publicar.

## GitHub Pages

El workflow `Deploy GitHub Pages` publica automáticamente el contenido de `dist/` cuando se hace push a `main`. También se puede lanzar manualmente desde la pestaña **Actions** con `workflow_dispatch`.

En la configuración del repositorio, GitHub Pages debe usar **GitHub Actions** como fuente de despliegue.
