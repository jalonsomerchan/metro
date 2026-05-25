import { GAME_CONFIG, LINE_COLORS, STATION_TYPES } from './config.js';

let idCounter = 0;

const nextId = (prefix) => `${prefix}-${idCounter += 1}`;

export const createInitialState = () => ({
  tool: 'line',
  paused: false,
  menuOpen: false,
  pendingStationId: null,
  selectedLineId: null,
  selectedControl: null,
  drag: null,
  gesture: null,
  camera: { x: 0, y: 0, zoom: 1 },
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
  const distance = (190 + Math.random() * 260) / state.camera.zoom;
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
    x: (point.x - state.camera.x) * state.camera.zoom + state.viewport.width / 2,
    y: (point.y - state.camera.y) * state.camera.zoom + state.viewport.height / 2,
  };
}

export function screenToWorld(state, point) {
  return {
    x: (point.x - state.viewport.width / 2) / state.camera.zoom + state.camera.x,
    y: (point.y - state.viewport.height / 2) / state.camera.zoom + state.camera.y,
  };
}

export function panCamera(state, dx, dy) {
  state.camera.x -= dx / state.camera.zoom;
  state.camera.y -= dy / state.camera.zoom;
}

export function zoomCameraAt(state, screenPoint, nextZoom) {
  const before = screenToWorld(state, screenPoint);
  state.camera.zoom = clamp(nextZoom, GAME_CONFIG.minZoom, GAME_CONFIG.maxZoom);
  const after = screenToWorld(state, screenPoint);
  state.camera.x += before.x - after.x;
  state.camera.y += before.y - after.y;
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

export function getLineLimit(state) {
  return GAME_CONFIG.initialLineLimit + Math.floor(state.stations.length / GAME_CONFIG.lineBonusEveryStations);
}

export function getTrackLimit(state) {
  return GAME_CONFIG.initialTrackLimit
    + Math.floor(state.stations.length / GAME_CONFIG.stationsPerResourceBonus) * 2;
}

export function getTrackUsed(state) {
  return state.lines.reduce((total, line) => total + Math.max(line.stationIds.length - 1, 0), 0);
}

export function getResourceStatus(state) {
  const lineLimit = getLineLimit(state);
  const trackLimit = getTrackLimit(state);
  const lineUsed = state.lines.length;
  const trackUsed = getTrackUsed(state);

  return {
    lineUsed,
    lineLimit,
    lineRemaining: Math.max(lineLimit - lineUsed, 0),
    trackUsed,
    trackLimit,
    trackRemaining: Math.max(trackLimit - trackUsed, 0),
  };
}

export function canCreateLine(state) {
  const resources = getResourceStatus(state);
  return resources.lineRemaining > 0 && resources.trackRemaining > 0;
}

export function canAddTrack(state, amount = 1) {
  return getResourceStatus(state).trackRemaining >= amount;
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
