# Metro táctil

Prototipo mobile-first de un juego de gestión de metro inspirado en dinámicas de líneas, estaciones, pasajeros por forma y transbordos.

## Cómo jugar

- Arrastra sobre el fondo para moverte por el mapa infinito.
- Haz zoom con pinza de dos dedos o con la rueda/scroll del ratón.
- Las estaciones aparecen poco a poco alrededor de la zona visible.
- Abre el menú de hamburguesa para cambiar entre **Línea nueva**, **Borrador** y **Pausa**.
- En **Línea nueva**, crea líneas de dos formas: arrastra desde una estación hasta otra o toca una estación y después toca la estación destino.
- Si una estación ya pertenece a otra línea, también puede usarse para empezar una nueva línea o crear transbordos.
- Para ampliar una línea existente, arrastra desde su terminal en forma de **T** hasta una nueva estación.
- Arrastra desde un tramo intermedio de una línea hasta una estación para insertar esa estación en el trazado.
- Arrastra un nodo intermedio para modificar el trazado.
- Usa **Borrador** para tocar una línea y eliminarla. Las estaciones nunca se borran con esta herramienta.
- El contador de la izquierda muestra líneas y vías disponibles. Los límites crecen a medida que aparecen más estaciones.
- Usa **Pausa** para detener la simulación.

## Detalles técnicos

- HTML5 Canvas a pantalla completa, CSS y JavaScript puro, sin dependencias de runtime.
- Estética inspirada en Mini Metro: fondo claro tipo papel, líneas finas de colores sólidos, estaciones con relleno claro y contorno oscuro.
- Las líneas se dibujan por debajo de las estaciones para mantener la jerarquía visual del mapa.
- Los extremos de cada línea se dibujan como terminales reales en forma de **T** y la ampliación solo empieza desde esa T.
- Hay límite de líneas nuevas y vías disponibles, con contador visible y ampliación automática según el número de estaciones.
- Controles táctiles con `touchstart`, `touchmove` y `touchend`, y soporte adicional de ratón/rueda para escritorio.
- `preventDefault()` y `touch-action: none` evitan scroll, zoom y gestos del navegador durante la interacción.
- Cámara con coordenadas de mundo, zoom y pan para permitir movimiento por un mapa virtual sin límites fijos.
- El zoom mantiene el punto bajo los dedos o el cursor estable mientras cambia la escala.
- Hitboxes táctiles más grandes que el dibujo visual de estaciones, líneas, terminales en T y puntos de control.
- En modo **Línea nueva**, la creación permite arrastrar entre estaciones o tocar dos estaciones consecutivas.
- Una línea puede ampliarse desde terminales en T o ramificarse desde un tramo intermedio soltando sobre una estación.
- Las estaciones nuevas se generan de forma progresiva durante la simulación.
- Cada estación mantiene una `queue` de pasajeros.
- En cada parada, el tren baja pasajeros si su forma coincide con la estación.
- Si una estación es transbordo y otra línea puede llevar al pasajero a su tipo de destino, el pasajero baja a la cola de la estación para esperar.

## Estructura

```txt
index.html
src/
  config.js       Constantes visuales, recursos y de juego.
  geometry.js     Hitboxes, terminales en T, distancias y selección táctil.
  input.js        Eventos táctiles, ratón, zoom, creación de líneas, ramales y desplazamiento del mapa.
  main.js         Arranque, bucle de juego, recursos y menú de herramientas.
  renderer.js     Dibujo del mapa, terminales en T, estaciones, pasajeros y trenes.
  simulation.js   Movimiento de trenes, colas, estaciones progresivas y transbordos.
  state.js        Estado, recursos, cámara, zoom, entidades y helpers de datos.
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
