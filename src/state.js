import { LINE_COLORS, STATION_TYPES } from './config.js';

let idCounter = 0;

const nextId = (prefix) => `${prefix}-${idCounter += 1}`;

export const createInitialState = () => ({
  tool: 'line',
  paused: false,
  selectedLineId: null,
  selectedControl: null,
  drag: null,
  viewport: { width: 0, height: 0, dpr: 1 },
  stations: [
    createStation(0.22, 0.24, 'circle'),
    createStation(0.72, 0.25, 'triangle'),
    createStation(0.49, 0.42, 'square'),
    createStation(0.25, 0.65, 'diamond'),
    createStation(0.77, 0.68, 'circle'),
    createStation(0.51, 0.78, 'triangle'),
  ],
  lines: [],
  trains: [],
  passengers: [],
  lastSpawnAt: 0,
});

export function createStation(xRatio, yRatio, type) {
  return {
    id: nextId('station'),
    xRatio,
    yRatio,
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
  const station = createStation(
    clamp(x / Math.max(state.viewport.width, 1), 0.08, 0.92),
    clamp(y / Math.max(state.viewport.height, 1), 0.12, 0.82),
    type,
  );
  state.stations.push(station);
  return station;
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
  return {
    x: station.xRatio * state.viewport.width,
    y: station.yRatio * state.viewport.height,
  };
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
