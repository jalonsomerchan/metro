import { GAME_CONFIG } from './config.js';
import { getLineById, getLineStations, getStationPoint, isTransferStation } from './state.js';

export function resizeCanvas(canvas, state) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.parentElement.getBoundingClientRect();

  state.viewport.width = Math.floor(rect.width);
  state.viewport.height = Math.floor(rect.height);
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
  drawGrid(context, state);
  drawLines(context, state);
  drawStations(context, state);
  drawTrains(context, state);
  drawDragPreview(context, state);
}

function drawGrid(context, state) {
  context.save();
  context.strokeStyle = getCssColor('--grid-color');
  context.lineWidth = 1;

  for (let x = 24; x < state.viewport.width; x += 48) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, state.viewport.height);
    context.stroke();
  }

  for (let y = 24; y < state.viewport.height; y += 48) {
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
    if (stations.length < 2) {
      continue;
    }

    context.save();
    context.strokeStyle = line.color;
    context.lineWidth = state.selectedLineId === line.id ? 13 : 9;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.globalAlpha = state.selectedLineId && state.selectedLineId !== line.id ? 0.45 : 1;
    context.beginPath();

    stations.forEach((station, index) => {
      const point = getStationPoint(state, station);
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });

    context.stroke();
    context.restore();
  }
}

function drawStations(context, state) {
  for (const station of state.stations) {
    const point = getStationPoint(state, station);
    const transfer = isTransferStation(state, station.id);

    context.save();
    context.fillStyle = getCssColor('--surface-color');
    context.strokeStyle = transfer ? '#22c55e' : getCssColor('--ink-color');
    context.lineWidth = transfer ? 4 : 3;
    drawShape(context, station.type, point.x, point.y, GAME_CONFIG.stationRadius + (transfer ? 2 : 0));
    context.fill();
    context.stroke();

    if (station.queue.length) {
      drawQueue(context, station, point);
    }

    context.restore();
  }
}

function drawQueue(context, station, point) {
  const passengers = station.queue.slice(0, 8);
  passengers.forEach((passenger, index) => {
    const x = point.x - 22 + (index % 4) * 14;
    const y = point.y + 23 + Math.floor(index / 4) * 13;
    context.fillStyle = '#111827';
    drawShape(context, passenger.destinationType, x, y, 4);
    context.fill();
  });
}

function drawTrains(context, state) {
  for (const train of state.trains) {
    const line = getLineById(state, train.lineId);
    if (!line) {
      continue;
    }

    const stations = getLineStations(state, line);
    const start = getStationPoint(state, stations[train.segmentIndex]);
    const end = getStationPoint(state, stations[train.segmentIndex + train.direction]);
    if (!start || !end) {
      continue;
    }

    const x = start.x + (end.x - start.x) * train.progress;
    const y = start.y + (end.y - start.y) * train.progress;

    context.save();
    context.fillStyle = '#ffffff';
    context.strokeStyle = line.color;
    context.lineWidth = 4;
    roundedRect(context, x - 13, y - 9, 26, 18, 8);
    context.fill();
    context.stroke();

    train.passengers.slice(0, 4).forEach((passenger, index) => {
      context.fillStyle = '#111827';
      drawShape(context, passenger.destinationType, x - 8 + index * 5, y, 2.5);
      context.fill();
    });

    context.restore();
  }
}

function drawDragPreview(context, state) {
  if (!state.drag?.startPoint || !state.drag.currentPoint) {
    return;
  }

  context.save();
  context.strokeStyle = state.drag.line?.color || '#38bdf8';
  context.lineWidth = 7;
  context.lineCap = 'round';
  context.setLineDash([10, 12]);
  context.beginPath();
  context.moveTo(state.drag.startPoint.x, state.drag.startPoint.y);
  context.lineTo(state.drag.currentPoint.x, state.drag.currentPoint.y);
  context.stroke();
  context.restore();
}

function drawShape(context, type, x, y, radius) {
  context.beginPath();
  if (type === 'triangle') {
    context.moveTo(x, y - radius);
    context.lineTo(x + radius, y + radius);
    context.lineTo(x - radius, y + radius);
    context.closePath();
    return;
  }

  if (type === 'square') {
    context.rect(x - radius, y - radius, radius * 2, radius * 2);
    return;
  }

  if (type === 'diamond') {
    context.moveTo(x, y - radius);
    context.lineTo(x + radius, y);
    context.lineTo(x, y + radius);
    context.lineTo(x - radius, y);
    context.closePath();
    return;
  }

  context.arc(x, y, radius, 0, Math.PI * 2);
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function getCssColor(token) {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}
