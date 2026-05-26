import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('HTML includes mobile viewport, fullscreen canvas, resource counters and tools menu', () => {
  const html = read('index.html');

  assert.match(html, /viewport/);
  assert.match(html, /user-scalable=no/);
  assert.match(html, /id="gameCanvas"/);
  assert.match(html, /id="lineCounter"/);
  assert.match(html, /id="trackCounter"/);
  assert.match(html, /id="menuToggle"/);
  assert.match(html, /id="toolsMenu"/);
  assert.match(html, /data-tool="line"/);
  assert.match(html, /data-tool="erase"/);
  assert.match(html, /data-tool="pause"/);
});

test('input supports T terminal extension, resources, safe delete and branching', () => {
  const input = read('src/input.js');
  const css = read('src/styles.css');

  assert.match(input, /findTerminalAt/);
  assert.match(input, /Amplía desde la T/);
  assert.match(input, /canCreateLine/);
  assert.match(input, /canAddTrack/);
  assert.match(input, /Sin vías/);
  assert.match(input, /branch-line/);
  assert.match(input, /finishLineBranch/);
  assert.match(input, /splice\(drag\.segmentIndex \+ 1, 0, targetStation\.id\)/);
  assert.doesNotMatch(input, /state\.stations = state\.stations\.filter/);
  assert.match(css, /touch-action:\s*none/);
});

test('state exposes limited line and track resources', () => {
  const state = read('src/state.js');
  const config = read('src/config.js');

  assert.match(config, /initialLineLimit/);
  assert.match(config, /initialTrackLimit/);
  assert.match(config, /stationsPerResourceBonus/);
  assert.match(state, /getResourceStatus/);
  assert.match(state, /getLineLimit/);
  assert.match(state, /getTrackLimit/);
  assert.match(state, /canCreateLine/);
  assert.match(state, /canAddTrack/);
});

test('geometry detects real terminal hit areas', () => {
  const config = read('src/config.js');
  const geometry = read('src/geometry.js');

  assert.match(config, /terminalCapLength/);
  assert.match(config, /terminalHitboxRadius/);
  assert.match(geometry, /findTerminalAt/);
  assert.match(geometry, /getTerminalControl/);
  assert.match(geometry, /normal/);
});

test('renderer draws lines below stations with T terminals', () => {
  const renderer = read('src/renderer.js');
  const css = read('src/styles.css');

  assert.match(renderer, /drawPaper[\s\S]*drawLines[\s\S]*drawStations/);
  assert.match(renderer, /drawTerminalCaps/);
  assert.match(renderer, /terminalCapLength/);
  assert.match(renderer, /GAME_CONFIG\.lineWidth/);
  assert.match(css, /resource-panel/);
  assert.match(css, /--paper-color/);
});
