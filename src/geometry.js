import { GAME_CONFIG } from './config.js';
import { getLineStations, getStationPoint } from './state.js';

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function findStationAt(state, point) {
  return state.stations.find((station) => (
    distance(getStationPoint(state, station), point) <= GAME_CONFIG.stationHitboxRadius
  ));
}

export function findLineControlAt(state, point) {
  for (const line of state.lines) {
    const stations = getLineStations(state, line);
    for (let index = 0; index < stations.length; index += 1) {
      const stationPoint = getStationPoint(state, stations[index]);
      const isEnd = index === 0 || index === stations.length - 1;
      const hitRadius = isEnd
        ? GAME_CONFIG.controlPointHitboxRadius + 8
        : GAME_CONFIG.controlPointHitboxRadius;

      if (distance(stationPoint, point) <= hitRadius) {
        return { line, station: stations[index], index, isEnd };
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
        closest = { line, index, distance: hit.distance };
      }
    }
  }

  return closest;
}

export function pointToSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const segmentLengthSq = dx * dx + dy * dy;
  if (!segmentLengthSq) {
    return { distance: distance(point, start), t: 0 };
  }

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / segmentLengthSq));
  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };

  return { distance: distance(point, projection), t };
}

export function getTouchPoint(canvas, event) {
  const touch = event.changedTouches[0] || event.touches[0];
  const rect = canvas.getBoundingClientRect();
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
}
