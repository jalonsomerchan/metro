import { GAME_CONFIG } from './config.js';
import { getLineStations, getStationPoint } from './state.js';

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function findStationAt(state, point) {
  let closest = null;

  for (const station of state.stations) {
    const stationPoint = getStationPoint(state, station);
    const stationDistance = distance(stationPoint, point);
    if (stationDistance <= GAME_CONFIG.stationHitboxRadius && (!closest || stationDistance < closest.distance)) {
      closest = { station, distance: stationDistance };
    }
  }

  return closest?.station || null;
}

export function findTerminalAt(state, point, selectedLineId = null) {
  let closest = null;

  for (const line of state.lines) {
    if (selectedLineId && line.id !== selectedLineId) continue;

    const stations = getLineStations(state, line);
    if (stations.length < 2) continue;

    const firstTerminal = getTerminalControl(state, line, stations, 0);
    const lastTerminal = getTerminalControl(state, line, stations, stations.length - 1);

    for (const terminal of [firstTerminal, lastTerminal]) {
      const terminalDistance = distance(terminal.point, point);
      if (terminalDistance <= GAME_CONFIG.terminalHitboxRadius && (!closest || terminalDistance < closest.distance)) {
        closest = { ...terminal, distance: terminalDistance };
      }
    }
  }

  return closest;
}

export function findLineControlAt(state, point, selectedLineId = null) {
  for (const line of state.lines) {
    if (selectedLineId && line.id !== selectedLineId) continue;

    const stations = getLineStations(state, line);
    for (let index = 1; index < stations.length - 1; index += 1) {
      const stationPoint = getStationPoint(state, stations[index]);
      if (distance(stationPoint, point) <= GAME_CONFIG.controlPointHitboxRadius) {
        return { line, station: stations[index], index, isEnd: false };
      }
    }
  }
  return null;
}

export function findLineAt(state, point) {
  let closest = null;

  for (const line of state.lines) {
    const stations = getLineStations(state, line);
    for (let index = 0; index < stations.length - 1; index += 1) {
      const start = getStationPoint(state, stations[index]);
      const end = getStationPoint(state, stations[index + 1]);
      const hit = pointToSegmentDistance(point, start, end);

      if (hit.distance <= GAME_CONFIG.lineHitboxRadius && (!closest || hit.distance < closest.distance)) {
        closest = {
          line,
          index,
          distance: hit.distance,
          t: hit.t,
          point: hit.point,
        };
      }
    }
  }

  return closest;
}

export function getTerminalControl(state, line, stations, index) {
  const station = stations[index];
  const neighbor = index === 0 ? stations[1] : stations[index - 1];
  const stationPoint = getStationPoint(state, station);
  const neighborPoint = getStationPoint(state, neighbor);
  const dx = stationPoint.x - neighborPoint.x;
  const dy = stationPoint.y - neighborPoint.y;
  const length = Math.hypot(dx, dy) || 1;

  return {
    line,
    station,
    index,
    isEnd: true,
    point: {
      x: stationPoint.x + (dx / length) * GAME_CONFIG.terminalExtensionLength,
      y: stationPoint.y + (dy / length) * GAME_CONFIG.terminalExtensionLength,
    },
    normal: {
      x: -dy / length,
      y: dx / length,
    },
  };
}

export function pointToSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const segmentLengthSq = dx * dx + dy * dy;
  if (!segmentLengthSq) {
    return { distance: distance(point, start), t: 0, point: start };
  }

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / segmentLengthSq));
  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };

  return { distance: distance(point, projection), t, point: projection };
}

export function getTouchPoint(canvas, event) {
  const touch = event.changedTouches[0] || event.touches[0];
  const rect = canvas.getBoundingClientRect();
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
}
