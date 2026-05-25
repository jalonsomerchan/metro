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

test('input supports touch, mouse, pan, zoom, tap-to-connect and mid-line branching', () => {
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
  assert.match(input, /branch-line/);
  assert.match(input, /finishLineBranch/);
  assert.match(input, /splice\(drag\.segmentIndex \+ 1, 0, targetStation\.id\)/);
  assert.match(input, /createPinchGesture/);
  assert.match(input, /zoomCameraAt/);
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

test('geometry exposes segment data and selected line controls', () => {
  const config = read('src/config.js');
  const geometry = read('src/geometry.js');

  assert.match(config, /stationHitboxRadius:\s*60/);
  assert.match(config, /terminalExtensionLength/);
  assert.match(config, /lineWidth:\s*10/);
  assert.match(geometry, /findLineControlAt/);
  assert.match(geometry, /selectedLineId/);
  assert.match(geometry, /point: hit\.point/);
  assert.match(geometry, /isEnd/);
});

test('renderer draws lines below stations with terminal overhangs', () => {
  const renderer = read('src/renderer.js');
  const css = read('src/styles.css');

  assert.match(renderer, /drawPaper[\s\S]*drawLines[\s\S]*drawStations/);
  assert.match(renderer, /withTerminalOverhangs/);
  assert.match(renderer, /terminalExtensionLength/);
  assert.match(renderer, /GAME_CONFIG\.lineWidth/);
  assert.match(css, /--paper-color/);
  assert.match(css, /--station-stroke-color/);
});
