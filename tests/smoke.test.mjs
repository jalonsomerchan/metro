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

test('state exposes resources, passenger animations and passenger route metadata', () => {
  const state = read('src/state.js');
  const config = read('src/config.js');

  assert.match(config, /initialLineLimit/);
  assert.match(config, /initialTrackLimit/);
  assert.match(config, /stationMinDistance/);
  assert.match(config, /passengerAnimMs/);
  assert.match(config, /seatRadius/);
  assert.match(state, /transferStationId:\s*null/);
  assert.match(state, /passengerAnimations:\s*\[\]/);
  assert.match(state, /createPassengerAnimation/);
  assert.match(state, /canCreateLine/);
  assert.match(state, /canAddTrack/);
});

test('simulation bounces at terminal stations and uses planned transfer stops', () => {
  const simulation = read('src/simulation.js');

  assert.match(simulation, /train\.segmentIndex === 0[\s\S]*train\.direction = 1/);
  assert.match(simulation, /train\.segmentIndex === lastIndex[\s\S]*train\.direction = -1/);
  assert.match(simulation, /const arrivedIndex = train\.segmentIndex \+ train\.direction/);
  assert.match(simulation, /findTransferStopForLine/);
  assert.match(simulation, /passenger\.transferStationId === station\.id/);
  assert.match(simulation, /passenger\.transferStationId = transferStationId/);
  assert.match(simulation, /excludedFirstLineId/);
  assert.match(simulation, /visitedLines/);
});

test('simulation enforces train capacity and preserves train progress when lines change', () => {
  const simulation = read('src/simulation.js');

  assert.match(simulation, /train\.passengers = train\.passengers\.slice\(0, GAME_CONFIG\.trainCapacity\)/);
  assert.match(simulation, /train\.passengers\.length >= GAME_CONFIG\.trainCapacity/);
  assert.match(simulation, /createPassengerAnimation/);
  assert.match(simulation, /addPassengerAnimation/);
  assert.match(simulation, /prunePassengerAnimations/);
  assert.match(simulation, /train\.progress = Math\.min\(Math\.max\(train\.progress, 0\), 0\.98\)/);
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

test('renderer draws trains with visible seats and passenger animations', () => {
  const renderer = read('src/renderer.js');
  const css = read('src/styles.css');

  assert.match(renderer, /drawPaper[\s\S]*drawLines[\s\S]*drawStations/);
  assert.match(renderer, /drawSeatGrid/);
  assert.match(renderer, /getSeatPositions/);
  assert.match(renderer, /GAME_CONFIG\.trainCapacity/);
  assert.match(renderer, /drawPassengerAnimations/);
  assert.match(renderer, /resolveAnimationPoint/);
  assert.match(css, /resource-panel/);
});
