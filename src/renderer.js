import { GAME_CONFIG } from './config.js';
import { getTerminalControl } from './geometry.js';
import { getLineById, getLineStations, getStationPoint, isTransferStation } from './state.js';

export function resizeCanvas(canvas, state) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  state.viewport.width = Math.floor(window.innerWidth);
  state.viewport.height = Math.floor(window.innerHeight);
  state.viewport.dpr = dpr;

  canvas.width = Math.floor(state.viewport.width * dpr);
  canvas.height = Math.floor(state.viewport.height * dpr);
  canvas.style.width = `${state.viewport.width}px`;
  canvas.style.height = `${state.viewport.height}px`;

  const context = canvas.getContext('2d');
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function render(canvas, state) {
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, state.viewport.width, state.viewport.height);
  drawPaper(context, state);
  drawLines(context, state);
  drawStations(context, state);
  drawTrains(context, state);
  drawDragPreview(context, state);
}

function drawPaper(context, state) {
  context.save();
  context.fillStyle = getCssColor('--paper-color');
  context.fillRect(0, 0, state.viewport.width, state.viewport.height);

  context.globalAlpha = 0.18;
  context.strokeStyle = '#d8d1c4';
  context.lineWidth = 1;
  const size = 96 * state.camera.zoom;
  const offsetX = positiveModulo((-state.camera.x * state.camera.zoom) + state.viewport.width / 2, size);
  const offsetY = positiveModulo((-state.camera.y * state.camera.zoom) + state.viewport.height / 2, size);

  for (let x = offsetX; x < state.viewport.width; x += size) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, state.viewport.height);
    context.stroke();
  }

  for (let y = offsetY; y < state.viewport.height; y += size) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(state.viewport.width, y);
    context.stroke();
  }

  context.restore();
}

function drawLines(context, state) {
  for (const line of state.lines) {
    const stations = getLineStations(state, line);
    if (stations.length < 2) continue;

    const points = stations.map((station) => getStationPoint(state, station));
    const displayPoints = withTerminalOverhangs(points);

    context.save();
    context.strokeStyle = line.color;
    context.lineWidth = state.selectedLineId === line.id
      ? GAME_CONFIG.selectedLineWidth
      : GAME_CONFIG.lineWidth;
    context.lineCap = 'butt';
    context.lineJoin = 'round';
    context.globalAlpha = state.selectedLineId && state.selectedLineId !== line.id ? 0.48 : 1;
    context.beginPath();

    displayPoints.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });

    context.stroke();
    drawTerminalCaps(context, state, line, stations);
    context.restore();
  }
}

function drawTerminalCaps(context, state, line, stations) {
  for (const index of [0, stations.length - 1]) {
    const terminal = getTerminalControl(state, line, stations, index);
    const half = GAME_CONFIG.terminalCapLength / 2;

    context.beginPath();
    context.moveTo(
      terminal.point.x - terminal.normal.x * half,
      terminal.point.y - terminal.normal.y * half,
    );
    context.lineTo(
      terminal.point.x + terminal.normal.x * half,
      terminal.point.y + terminal.normal.y * half,
    );
    context.stroke();
  }
}

function withTerminalOverhangs(points) {
  if (points.length < 2) return points;

  const displayPoints = points.map((point) => ({ ...point }));
  displayPoints[0] = extendPoint(points[0], points[1], GAME_CONFIG.terminalExtensionLength);
  displayPoints[displayPoints.length - 1] = extendPoint(
    points[points.length - 1],
    points[points.length - 2],
    GAME_CONFIG.terminalExtensionLength,
  );

  return displayPoints;
}

function extendPoint(point, neighbor, amount) {
  const dx = point.x - neighbor.x;
  const dy = point.y - neighbor.y;
  const length = Math.hypot(dx, dy) || 1;

  return {
    x: point.x + (dx / length) * amount,
    y: point.y + (dy / length) * amount,
  };
}

function drawStations(context, state) {
  for (const station of state.stations) {
    const point = getStationPoint(state, station);
    if (!isVisible(point, 90, state)) continue;

    const transfer = isTransferStation(state, station.id);
    const pending = state.pendingStationId === station.id;
    context.save();
    context.fillStyle = getCssColor('--station-fill-color');
    context.strokeStyle = getCssColor('--station-stroke-color');
    context.lineWidth = pending ? 8 : transfer ? 6 : 5;
    drawShape(context, station.type, point.x, point.y, GAME_CONFIG.stationRadius + (transfer ? 4 : 0));
    context.fill();
    context.stroke();

    if (pending) {
      context.strokeStyle = '#ef2b24';
      context.lineWidth = 3;
      context.setLineDash([5, 5]);
      drawShape(context, station.type, point.x, point.y, GAME_CONFIG.stationRadius + 13);
      context.stroke();
    }

    if (station.queue.length) drawQueue(context, station, point);
    context.restore();
  }
}

function drawQueue(context, station, point) {
  station.queue.slice(0, 8).forEach((passenger, index) => {
    const x = point.x + 20 + (index % 4) * 13;
    const y = point.y + 4 + Math.floor(index / 4) * 13;
    context.fillStyle = getCssColor('--station-stroke-color');
    drawShape(context, passenger.destinationType, x, y, 4.5);
    context.fill();
  });
}

function drawTrains(context, state) {
  for (const train of state.trains) {
    const line = getLineById(state, train.lineId);
    if (!line) continue;

    const stations = getLineStations(state, line);
    const startStation = stations[train.segmentIndex];
    const endStation = stations[train.segmentIndex + train.direction];
    if (!startStation || !endStation) continue;

    const start = getStationPoint(state, startStation);
    const end = getStationPoint(state, endStation);
    const x = start.x + (end.x - start.x) * train.progress;
    const y = start.y + (end.y - start.y) * train.progress;

    context.save();
    context.translate(x, y);
    context.rotate(Math.atan2(end.y - start.y, end.x - start.x));
    context.fillStyle = '#f5f0e6';
    context.strokeStyle = line.color;
    context.lineWidth = 4;
    roundedRect(context, -16, -9, 32, 18, 2);
    context.fill();
    context.stroke();
    context.restore();
  }
}

function drawDragPreview(context, state) {
  if (!state.drag?.startPoint || !state.drag.currentPoint || state.drag.mode === 'pan-map') return;

  context.save();
  context.strokeStyle = state.drag.line?.color || '#ef2b24';
  context.lineWidth = GAME_CONFIG.lineWidth;
  context.lineCap = 'butt';
  context.setLineDash([14, 10]);
  context.beginPath();
  context.moveTo(state.drag.startPoint.x, state.drag.startPoint.y);
  context.lineTo(state.drag.currentPoint.x, state.drag.currentPoint.y);
  context.stroke();
  context.restore();
}

function drawShape(context, type, x, y, radius) {
  context.beginPath();
  if (type === 'triangle') {
    context.moveTo(x, y - radius * 1.1);
    context.lineTo(x + radius * 1.08, y + radius * 0.95);
    context.lineTo(x - radius * 1.08, y + radius * 0.95);
    context.closePath();
    return;
  }
  if (type === 'square') {
    context.rect(x - radius, y - radius, radius * 2, radius * 2);
    return;
  }
  if (type === 'diamond') {
    context.moveTo(x, y - radius * 1.15);
    context.lineTo(x + radius * 1.15, y);
    context.lineTo(x, y + radius * 1.15);
    context.lineTo(x - radius * 1.15, y);
    context.closePath();
    return;
  }
  context.arc(x, y, radius, 0, Math.PI * 2);
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function isVisible(point, margin, state) {
  return point.x > -margin
    && point.y > -margin
    && point.x < state.viewport.width + margin
    && point.y < state.viewport.height + margin;
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function getCssColor(token) {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}
