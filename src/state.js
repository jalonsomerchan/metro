import { GAME_CONFIG, LINE_COLORS, STATION_TYPES } from './config.js';

let idCounter = 0;

const nextId = (prefix) => `${prefix}-${idCounter += 1}`;

export const createInitialState = () => ({
  tool: 'line',
  paused: false,
  menuOpen: false,
  selectedLineId: null,
  selectedControl: null,
  drag: null,
  camera: { x: 0, y: 0 },
  viewport: { width: 0, height: 0, dpr: 1 },
  stations: [
    createStation(-150, -120, 'circle'),
    createStation(160, -95, 'triangle'),
    createStation(15, 90, 'square'),
  ],
  lines: [],
  trains: [],
  passengers: [],
  lastSpawnAt: 0,
  lastStationSpawnAt: 0,
});

export function createStation(x, y, type) {
  return {
    id: nextId('station'),
    x,
    y,
    type,
    queue: [],
  };
}

export function createPassenger(originId, destinationType) {
  return {
    id: nextId('passenger'),
    originId,
    destinationType,
  };
}

export function createLine(stationIds) {
  const color = LINE_COLORS[idCounter % LINE_COLORS.length];
  return {
    id: nextId('line'),
    color,
    stationIds: [...stationIds],
  };
}

export function createTrain(lineId) {
  return {
    id: nextId('train'),
    lineId,
    segmentIndex: 0,
    progress: 0,
    direction: 1,
    passengers: [],
    dwellUntil: 0,
  };
}

export function addStation(state, x, y, type = randomStationType()) {
  const station = createStation(x, y, type);
  state.stations.push(station);
  return station;
}

export function spawnStationNearCamera(state) {
  const center = screenToWorld(state, {
    x: state.viewport.width / 2,
    y: state.viewport.height / 2,
  });
  const angle = Math.random() * Math.PI * 2;
  const distance = 190 + Math.random() * 260;
  const station = addStation(
    state,
    center.x + Math.cos(angle) * distance,
    center.y + Math.sin(angle) * distance,
    randomStationType(),
  );
  return station;
}

export function maybeSpawnStation(state, now) {
  if (state.paused || now - state.lastStationSpawnAt < GAME_CONFIG.stationSpawnMs) {
    return null;
  }

  state.lastStationSpawnAt = now;
  return spawnStationNearCamera(state);
}

export function randomStationType() {
  return STATION_TYPES[Math.floor(Math.random() * STATION_TYPES.length)];
}

export function getStationById(state, stationId) {
  return state.stations.find((station) => station.id === stationId);
}

export function getLineById(state, lineId) {
  return state.lines.find((line) => line.id === lineId);
}

export function getStationPoint(state, station) {
  return worldToScreen(state, station);
}

export function worldToScreen(state, point) {
  return {
    x: point.x - state.camera.x + state.viewport.width / 2,
    y: point.y - state.camera.y + state.viewport.height / 2,
  };
}

export function screenToWorld(state, point) {
  return {
    x: point.x + state.camera.x - state.viewport.width / 2,
    y: point.y + state.camera.y - state.viewport.height / 2,
  };
}

export function panCamera(state, dx, dy) {
  state.camera.x -= dx;
  state.camera.y -= dy;
}

export function getLineStations(state, line) {
  return line.stationIds
    .map((stationId) => getStationById(state, stationId))
    .filter(Boolean);
}

export function stationLineIds(state, stationId) {
  return state.lines
    .filter((line) => line.stationIds.includes(stationId))
    .map((line) => line.id);
}

export function isTransferStation(state, stationId) {
  return stationLineIds(state, stationId).length > 1;
}

export function setTool(state, tool) {
  state.tool = tool;
  state.paused = tool === 'pause' ? !state.paused : state.paused;
  if (tool !== 'pause') {
    state.paused = false;
  }
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
