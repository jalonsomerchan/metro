import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('HTML includes mobile viewport, canvas and touch toolbar', () => {
  const html = read('index.html');

  assert.match(html, /viewport/);
  assert.match(html, /user-scalable=no/);
  assert.match(html, /id="gameCanvas"/);
  assert.match(html, /data-tool="line"/);
  assert.match(html, /data-tool="erase"/);
  assert.match(html, /data-tool="pause"/);
});

test('touch input prevents browser gestures and uses required events', () => {
  const input = read('src/input.js');
  const css = read('src/styles.css');

  assert.match(input, /touchstart/);
  assert.match(input, /touchmove/);
  assert.match(input, /touchend/);
  assert.match(input, /preventDefault\(\)/);
  assert.match(input, /passive: false/);
  assert.match(css, /touch-action:\s*none/);
});

test('simulation keeps station queues and transfer logic', () => {
  const state = read('src/state.js');
  const simulation = read('src/simulation.js');

  assert.match(state, /queue:\s*\[\]/);
  assert.match(simulation, /destinationType === station\.type/);
  assert.match(simulation, /isTransferStation/);
  assert.match(simulation, /passengerCanUseOtherLine/);
});

test('geometry exposes larger touch hitboxes and line controls', () => {
  const config = read('src/config.js');
  const geometry = read('src/geometry.js');

  assert.match(config, /stationHitboxRadius:\s*34/);
  assert.match(geometry, /findLineControlAt/);
  assert.match(geometry, /isEnd/);
});
