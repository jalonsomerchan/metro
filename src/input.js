import { GAME_CONFIG } from './config.js';
import { findLineAt, findLineControlAt, findStationAt, getTouchPoint } from './geometry.js';
import { ensureLineTrain } from './simulation.js';
import { createLine, getStationPoint, panCamera, screenToWorld } from './state.js';

export function bindTouchControls(canvas, state, onChange) {
  canvas.addEventListener('touchstart', (event) => handleTouchStart(event, canvas, state, onChange), { passive: false });
  canvas.addEventListener('touchmove', (event) => handleTouchMove(event, canvas, state, onChange), { passive: false });
  canvas.addEventListener('touchend', (event) => handleTouchEnd(event, canvas, state, onChange), { passive: false });
  canvas.addEventListener('touchcancel', (event) => handleTouchCancel(event, state, onChange), { passive: false });
}

function handleTouchStart(event, canvas, state, onChange) {
  event.preventDefault();
  const point = getTouchPoint(canvas, event);

  if (state.tool === 'erase') {
    eraseAtPoint(state, point);
    onChange();
    return;
  }

  if (state.tool === 'pause') return;

  const station = findStationAt(state, point);
  if (state.tool === 'line' && station) {
    state.drag = {
      mode: 'new-line',
      startStation: station,
      startPoint: getStationPoint(state, station),
      currentPoint: point,
      lastPoint: point,
      moved: false,
    };
    onChange('Arrastra a otra estación');
    return;
  }

  const control = findLineControlAt(state, point, state.selectedLineId);
  if (control) {
    state.selectedLineId = control.line.id;
    state.selectedControl = control;
    state.drag = {
      mode: control.isEnd ? 'extend-line' : 'edit-control',
      line: control.line,
      control,
      startPoint: getStationPoint(state, control.station),
      currentPoint: point,
      lastPoint: point,
      moved: false,
    };
    onChange('Editando trazado');
    return;
  }

  const touchedLine = findLineAt(state, point);
  if (touchedLine) {
    state.selectedLineId = touchedLine.line.id;
    onChange('Línea seleccionada');
    return;
  }

  state.drag = {
    mode: 'pan-map',
    startPoint: point,
    currentPoint: point,
    lastPoint: point,
    moved: false,
  };
  onChange('Moviendo mapa');
}

function handleTouchMove(event, canvas, state, onChange) {
  event.preventDefault();
  if (!state.drag) return;

  const point = getTouchPoint(canvas, event);
  const dx = point.x - state.drag.lastPoint.x;
  const dy = point.y - state.drag.lastPoint.y;
  state.drag.currentPoint = point;
  state.drag.moved = state.drag.moved || Math.hypot(point.x - state.drag.startPoint.x, point.y - state.drag.startPoint.y) > GAME_CONFIG.panDeadZone;

  if (state.drag.mode === 'pan-map') {
    panCamera(state, dx, dy);
  }

  if (state.drag.mode === 'edit-control') {
    const station = state.drag.control.station;
    const worldPoint = screenToWorld(state, point);
    station.x = worldPoint.x;
    station.y = worldPoint.y;
  }

  state.drag.lastPoint = point;
  onChange();
}

function handleTouchEnd(event, canvas, state, onChange) {
  event.preventDefault();
  if (!state.drag) return;

  const point = getTouchPoint(canvas, event);
  const targetStation = findStationAt(state, point);

  if (state.drag.mode === 'new-line') {
    finishNewLine(state, state.drag.startStation, targetStation, onChange);
  }

  if (state.drag.mode === 'extend-line') {
    finishLineExtension(state, state.drag.control, targetStation, onChange);
  }

  state.drag = null;
  state.selectedControl = null;
  onChange('Línea nueva');
}

function handleTouchCancel(event, state, onChange) {
  event.preventDefault();
  state.drag = null;
  state.selectedControl = null;
  onChange();
}

function finishNewLine(state, startStation, targetStation, onChange) {
  if (!targetStation) {
    onChange('Suelta sobre otra estación');
    return;
  }
  if (startStation.id === targetStation.id) {
    onChange('Elige otra estación');
    return;
  }

  const existingLine = state.lines.find((line) => (
    line.stationIds.includes(startStation.id) && line.stationIds.includes(targetStation.id)
  ));
  if (existingLine) {
    state.selectedLineId = existingLine.id;
    onChange('Línea seleccionada');
    return;
  }

  const line = createLine([startStation.id, targetStation.id]);
  state.lines.push(line);
  state.selectedLineId = line.id;
  ensureLineTrain(state, line);
  onChange('Línea creada');
}

function finishLineExtension(state, control, targetStation, onChange) {
  if (!targetStation) {
    onChange('Suelta sobre una estación');
    return;
  }
  const line = control.line;

  if (line.stationIds.includes(targetStation.id)) return;

  if (control.index === 0) {
    line.stationIds.unshift(targetStation.id);
  } else {
    line.stationIds.push(targetStation.id);
  }

  ensureLineTrain(state, line);
  onChange('Línea ampliada');
}

function eraseAtPoint(state, point) {
  const station = findStationAt(state, point);
  if (station) {
    state.lines.forEach((line) => {
      line.stationIds = line.stationIds.filter((stationId) => stationId !== station.id);
    });
    state.stations = state.stations.filter((item) => item.id !== station.id);
    state.lines = state.lines.filter((line) => line.stationIds.length >= 2);
    state.trains = state.trains.filter((train) => state.lines.some((line) => line.id === train.lineId));
    return;
  }

  const lineHit = findLineAt(state, point);
  if (lineHit) {
    state.lines = state.lines.filter((line) => line.id !== lineHit.line.id);
    state.trains = state.trains.filter((train) => train.lineId !== lineHit.line.id);
  }
}
