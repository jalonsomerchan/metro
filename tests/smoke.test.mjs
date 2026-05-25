import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('HTML includes mobile viewport, fullscreen canvas and hamburger tools menu', () => {
  const html = read('index.html');

  assert.match(html, /viewport/);
  assert.match(html, /user-scalable=no/);
  assert.match(html, /id="gameCanvas"/);
  assert.match(html, /id="menuToggle"/);
  assert.match(html, /id="toolsMenu"/);
  assert.match(html, /data-tool="line"/);
  assert.match(html, /data-tool="erase"/);
  assert.match(html, /data-tool="pause"/);
});

test('input supports touch, mouse, pan, pinch zoom, wheel zoom and tap-to-connect', () => {
  const input = read('src/input.js');
  const css = read('src/styles.css');

  assert.match(input, /touchstart/);
  assert.match(input, /touchmove/);
  assert.match(input, /touchend/);
  assert.match(input, /mousedown/);
  assert.match(input, /wheel/);
  assert.match(input, /preventDefault\(\)/);
  assert.match(input, /passive: false/);
  assert.match(input, /finishStationTap/);
  assert.match(input, /pendingStationId/);
  assert.match(input, /createPinchGesture/);
  assert.match(input, /zoomCameraAt/);
  assert.match(input, /pan-map/);
  assert.match(input, /panCamera/);
  assert.match(css, /touch-action:\s*none/);
});

test('simulation keeps station queues, progressive stations and transfer logic', () => {
  const state = read('src/state.js');
  const simulation = read('src/simulation.js');

  assert.match(state, /queue:\s*\[\]/);
  assert.match(state, /maybeSpawnStation/);
  assert.match(state, /camera:\s*\{/);
  assert.match(state, /zoomCameraAt/);
  assert.match(simulation, /maybeSpawnStation/);
  assert.match(simulation, /destinationType === station\.type/);
  assert.match(simulation, /isTransferStation/);
  assert.match(simulation, /passengerCanUseOtherLine/);
});

test('geometry exposes larger touch hitboxes and selected line controls', () => {
  const config = read('src/config.js');
  const geometry = read('src/geometry.js');

  assert.match(config, /stationHitboxRadius:\s*60/);
  assert.match(config, /minZoom/);
  assert.match(config, /maxZoom/);
  assert.match(geometry, /findLineControlAt/);
  assert.match(geometry, /selectedLineId/);
  assert.match(geometry, /isEnd/);
});

test('renderer and styles use a paper-like Mini Metro inspired look', () => {
  const renderer = read('src/renderer.js');
  const css = read('src/styles.css');

  assert.match(renderer, /drawPaper/);
  assert.match(renderer, /pendingStationId/);
  assert.match(renderer, /lineWidth = state\.selectedLineId === line\.id \? 18 : 14/);
  assert.match(css, /--paper-color/);
  assert.match(css, /--station-stroke-color/);
});
