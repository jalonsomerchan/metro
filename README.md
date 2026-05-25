# Metro táctil

Prototipo mobile-first de un juego de gestión de metro inspirado en dinámicas de líneas, estaciones, pasajeros por forma y transbordos.

## Cómo jugar

- Toca **Línea nueva** y arrastra desde una estación hasta otra para crear una línea.
- Toca una línea para seleccionarla.
- Arrastra un extremo de una línea seleccionada para ampliarla a una estación nueva o existente.
- Arrastra un nodo intermedio para modificar el trazado.
- Usa **Borrador** para tocar una estación o línea y eliminarla.
- Usa **Pausa** para detener la simulación.

## Detalles técnicos

- HTML5 Canvas, CSS y JavaScript puro, sin dependencias de runtime.
- Controles táctiles con `touchstart`, `touchmove` y `touchend`.
- `preventDefault()` y `touch-action: none` evitan scroll, zoom y gestos del navegador durante la interacción.
- Hitboxes táctiles más grandes que el dibujo visual de estaciones y puntos de control.
- Punto de fuga para edición: extremos amplían líneas; nodos intermedios mueven estaciones y alteran el trazado.
- Cada estación mantiene una `queue` de pasajeros.
- En cada parada, el tren baja pasajeros si su forma coincide con la estación.
- Si una estación es transbordo y otra línea puede llevar al pasajero a su tipo de destino, el pasajero baja a la cola de la estación para esperar.

## Estructura

```txt
index.html
src/
  config.js       Constantes visuales y de juego.
  geometry.js     Hitboxes, distancias y selección táctil.
  input.js        Eventos táctiles y edición de líneas.
  main.js         Arranque, bucle de juego y UI.
  renderer.js     Dibujo del mapa, estaciones, pasajeros y trenes.
  simulation.js   Movimiento de trenes, colas y transbordos.
  state.js        Estado, entidades y helpers de datos.
tests/
  smoke.test.mjs  Comprobaciones básicas del prototipo.
```

## Comandos

```sh
npm test
```

Para probarlo localmente basta servir la carpeta con cualquier servidor estático.
