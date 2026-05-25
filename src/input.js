import { findLineAt, findLineControlAt, findStationAt, getTouchPoint } from './geometry.js';
import { ensureLineTrain } from './simulation.js';
import { addStation, createLine, getStationPoint, randomStationType } from './state.js';

export function bindTouchControls(canvas, state, onChange) {
  canvas.addEventListener('touchstart', (event) => handleTouchStart(event, canvas, state, onChange), { passive: false });
  canvas.addEventListener('touchmove', (event) => handleTouchMove(event, canvas, state, onChange), { passive: false });
  canvas.addEventListener('touchend', (event) => handleTouchEnd(event, canvas, state, onChange), { passive: false });
  canvas.addEventListener('touchcancel', (event) => handleTouchCancel(event, state, onChange), { passive: false });

  canvas.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') {
      handlePointerFallback(event, state, onChange);
    }
  });
}

function handleTouchStart(event, canvas, state, onChange) {
  event.preventDefault();
  const point = getTouchPoint(canvas, event);

  if (state.tool === 'erase') {
    eraseAtPoint(state, point);
    onChange();
    return;
  }

  if (state.tool === 'pause') {
    return;
  }

  const control = findLineControlAt(state, point);
  if (control) {
    state.selectedLineId = control.line.id;
    state.selectedControl = control;
    state.drag = {
      mode: control.isEnd ? 'extend-line' : 'edit-control',
      line: control.line,
      control,
      startPoint: getStationPoint(state, control.station),
      currentPoint: point,
    };
    onChange('Editando trazado');
    return;
  }

  const station = findStationAt(state, point);
  if (station) {
    state.drag = {
      mode: 'new-line',
      startStation: station,
      startPoint: getStationPoint(state, station),
      currentPoint: point,
    };
    onChange('Arrastra a otra estación');
    return;
  }

  const touchedLine = findLineAt(state, point);
  if (touchedLine) {
    state.selectedLineId = touchedLine.line.id;
    onChange('Línea seleccionada');
  }
}

function handleTouchMove(event, canvas, state, onChange) {
  event.preventDefault();
  if (!state.drag) {
    return;
  }

  const point = getTouchPoint(canvas, event);
  state.drag.currentPoint = point;

  if (state.drag.mode === 'edit-control') {
    const station = state.drag.control.station;
    station.xRatio = point.x / Math.max(state.viewport.width, 1);
    station.yRatio = point.y / Math.max(state.viewport.height, 1);
  }

  onChange();
}

function handleTouchEnd(event, canvas, state, onChange) {
  event.preventDefault();
  if (!state.drag) {
    return;
  }

  const point = getTouchPoint(canvas, event);
  const targetStation = findStationAt(state, point);

  if (state.drag.mode === 'new-line') {
    finishNewLine(state, state.drag.startStation, targetStation, point);
  }

  if (state.drag.mode === 'extend-line') {
    finishLineExtension(state, state.drag.control, targetStation, point);
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

function finishNewLine(state, startStation, targetStation, point) {
  const endStation = targetStation || addStation(state, point.x, point.y, randomStationType());
  if (startStation.id === endStation.id) {
    return;
  }

  const line = createLine([startStation.id, endStation.id]);
  state.lines.push(line);
  state.selectedLineId = line.id;
  ensureLineTrain(state, line);
}

function finishLineExtension(state, control, targetStation, point) {
  const line = control.line;
  const newStation = targetStation || addStation(state, point.x, point.y, randomStationType());

  if (line.stationIds.includes(newStation.id)) {
    return;
  }

  if (control.index === 0) {
    line.stationIds.unshift(newStation.id);
  } else {
    line.stationIds.push(newStation.id);
  }

  ensureLineTrain(state, line);
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

function handlePointerFallback(event, state, onChange) {
  const rect = event.currentTarget.getBoundingClientRect();
  const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  const station = findStationAt(state, point);
  if (!station) {
    return;
  }

  state.drag = {
    mode: 'new-line',
    startStation: station,
    startPoint: getStationPoint(state, station),
    currentPoint: point,
  };
  onChange('Usa táctil para el flujo completo');
}
