import { GAME_CONFIG } from './config.js';
import { findLineAt, findLineControlAt, findStationAt, getTouchPoint } from './geometry.js';
import { ensureLineTrain } from './simulation.js';
import {
  createLine,
  getStationById,
  getStationPoint,
  panCamera,
  screenToWorld,
  zoomCameraAt,
} from './state.js';

export function bindTouchControls(canvas, state, onChange) {
  canvas.addEventListener('touchstart', (event) => handleTouchStart(event, canvas, state, onChange), { passive: false });
  canvas.addEventListener('touchmove', (event) => handleTouchMove(event, canvas, state, onChange), { passive: false });
  canvas.addEventListener('touchend', (event) => handleTouchEnd(event, canvas, state, onChange), { passive: false });
  canvas.addEventListener('touchcancel', (event) => handleTouchCancel(event, state, onChange), { passive: false });
  canvas.addEventListener('wheel', (event) => handleWheel(event, canvas, state, onChange), { passive: false });

  canvas.addEventListener('mousedown', (event) => handleMouseStart(event, canvas, state, onChange));
  window.addEventListener('mousemove', (event) => handleMouseMove(event, canvas, state, onChange));
  window.addEventListener('mouseup', (event) => handleMouseEnd(event, canvas, state, onChange));
}

function handleTouchStart(event, canvas, state, onChange) {
  event.preventDefault();

  if (event.touches.length === 2) {
    state.drag = null;
    state.gesture = createPinchGesture(canvas, event, state);
    onChange('Zoom');
    return;
  }

  if (event.touches.length !== 1) return;
  startSinglePointer(getTouchPoint(canvas, event), state, onChange);
}

function handleTouchMove(event, canvas, state, onChange) {
  event.preventDefault();

  if (state.gesture && event.touches.length === 2) {
    updatePinchGesture(canvas, event, state);
    onChange('Zoom');
    return;
  }

  if (event.touches.length !== 1) return;
  moveSinglePointer(getTouchPoint(canvas, event), state, onChange);
}

function handleTouchEnd(event, canvas, state, onChange) {
  event.preventDefault();

  if (state.gesture) {
    state.gesture = null;
    state.drag = null;
    onChange('Línea nueva');
    return;
  }

  if (!state.drag) return;
  const point = getTouchPoint(canvas, event);
  endSinglePointer(point, state, onChange);
}

function handleTouchCancel(event, state, onChange) {
  event.preventDefault();
  state.drag = null;
  state.gesture = null;
  state.selectedControl = null;
  onChange();
}

function handleWheel(event, canvas, state, onChange) {
  event.preventDefault();
  const point = mousePoint(canvas, event);
  const multiplier = Math.exp(-event.deltaY * 0.0015);
  zoomCameraAt(state, point, state.camera.zoom * multiplier);
  onChange('Zoom');
}

function handleMouseStart(event, canvas, state, onChange) {
  event.preventDefault();
  startSinglePointer(mousePoint(canvas, event), state, onChange);
}

function handleMouseMove(event, canvas, state, onChange) {
  if (!state.drag) return;
  event.preventDefault();
  moveSinglePointer(mousePoint(canvas, event), state, onChange);
}

function handleMouseEnd(event, canvas, state, onChange) {
  if (!state.drag) return;
  event.preventDefault();
  endSinglePointer(mousePoint(canvas, event), state, onChange);
}

function startSinglePointer(point, state, onChange) {
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
    onChange(state.pendingStationId ? 'Toca otra estación' : 'Arrastra o toca destino');
    return;
  }

  const control = findLineControlAt(state, point, state.selectedLineId);
  if (control) {
    state.pendingStationId = null;
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
    state.pendingStationId = null;
    state.selectedLineId = touchedLine.line.id;
    onChange('Línea seleccionada');
    return;
  }

  state.pendingStationId = null;
  state.drag = {
    mode: 'pan-map',
    startPoint: point,
    currentPoint: point,
    lastPoint: point,
    moved: false,
  };
  onChange('Moviendo mapa');
}

function moveSinglePointer(point, state, onChange) {
  if (!state.drag) return;

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

function endSinglePointer(point, state, onChange) {
  if (!state.drag) return;

  const targetStation = findStationAt(state, point);

  if (state.drag.mode === 'new-line') {
    finishNewLine(state, state.drag.startStation, targetStation, state.drag.moved, onChange);
  }

  if (state.drag.mode === 'extend-line') {
    finishLineExtension(state, state.drag.control, targetStation, onChange);
  }

  state.drag = null;
  state.selectedControl = null;
}

function finishNewLine(state, startStation, targetStation, moved, onChange) {
  if (!moved) {
    finishStationTap(state, startStation, onChange);
    return;
  }

  if (!targetStation) {
    onChange('Suelta sobre otra estación');
    return;
  }

  connectStations(state, startStation, targetStation, onChange);
}

function finishStationTap(state, station, onChange) {
  if (!state.pendingStationId) {
    state.pendingStationId = station.id;
    onChange('Toca estación destino');
    return;
  }

  const startStation = getStationById(state, state.pendingStationId);
  state.pendingStationId = null;

  if (!startStation) {
    onChange('Línea nueva');
    return;
  }

  connectStations(state, startStation, station, onChange);
}

function connectStations(state, startStation, targetStation, onChange) {
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
    state.pendingStationId = null;
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
    state.pendingStationId = null;
    state.lines = state.lines.filter((line) => line.id !== lineHit.line.id);
    state.trains = state.trains.filter((train) => train.lineId !== lineHit.line.id);
  }
}

function createPinchGesture(canvas, event, state) {
  const points = [...event.touches].map((touch) => touchPoint(canvas, touch));
  return {
    startDistance: distance(points[0], points[1]),
    startZoom: state.camera.zoom,
    center: midpoint(points[0], points[1]),
  };
}

function updatePinchGesture(canvas, event, state) {
  const points = [...event.touches].map((touch) => touchPoint(canvas, touch));
  const currentDistance = distance(points[0], points[1]);
  const center = midpoint(points[0], points[1]);
  zoomCameraAt(state, center, state.gesture.startZoom * (currentDistance / state.gesture.startDistance));
}

function touchPoint(canvas, touch) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
}

function mousePoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}
