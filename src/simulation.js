import { GAME_CONFIG, STATION_TYPES } from './config.js';
import {
  createPassenger,
  createPassengerAnimation,
  createTrain,
  getLineById,
  getLineStations,
  getStationById,
  maybeSpawnStation,
} from './state.js';

export function ensureLineTrain(state, line) {
  if (line.stationIds.length < 2) {
    return;
  }

  const train = state.trains.find((item) => item.lineId === line.id);
  if (!train) {
    state.trains.push(createTrain(line.id));
    return;
  }

  const lastIndex = line.stationIds.length - 1;
  train.segmentIndex = Math.min(Math.max(train.segmentIndex, 0), lastIndex);
  train.progress = Math.min(Math.max(train.progress, 0), 0.98);
  if (train.segmentIndex === 0 && train.direction < 0) train.direction = 1;
  if (train.segmentIndex === lastIndex && train.direction > 0) train.direction = -1;
}

export function tickSimulation(state, now, deltaMs) {
  if (state.paused) {
    return;
  }

  maybeSpawnStation(state, now);
  prunePassengerAnimations(state, now);
  spawnPassengerIfNeeded(state, now);
  for (const train of state.trains) {
    moveTrain(state, train, now, deltaMs);
  }
}

function spawnPassengerIfNeeded(state, now) {
  if (now - state.lastSpawnAt < GAME_CONFIG.passengerSpawnMs) {
    return;
  }

  const stationsWithRoom = state.stations.filter((station) => station.queue.length < GAME_CONFIG.maxStationQueue);
  if (!stationsWithRoom.length) {
    return;
  }

  const station = stationsWithRoom[Math.floor(Math.random() * stationsWithRoom.length)];
  const possibleTypes = STATION_TYPES.filter((type) => type !== station.type);
  const destinationType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
  station.queue.push(createPassenger(station.id, destinationType));
  state.lastSpawnAt = now;
}

function moveTrain(state, train, now, deltaMs) {
  const line = getLineById(state, train.lineId);
  if (!line || line.stationIds.length < 2) {
    return;
  }

  const lastIndex = line.stationIds.length - 1;
  train.segmentIndex = Math.min(Math.max(train.segmentIndex, 0), lastIndex);
  if (train.segmentIndex === 0 && train.direction < 0) train.direction = 1;
  if (train.segmentIndex === lastIndex && train.direction > 0) train.direction = -1;

  if (train.dwellUntil > now) {
    return;
  }

  train.progress += GAME_CONFIG.trainSpeed * deltaMs;

  if (train.progress < 1) {
    return;
  }

  const arrivedIndex = train.segmentIndex + train.direction;
  train.segmentIndex = Math.min(Math.max(arrivedIndex, 0), lastIndex);
  train.progress = 0;

  if (train.segmentIndex === 0) {
    train.direction = 1;
  } else if (train.segmentIndex === lastIndex) {
    train.direction = -1;
  }

  const stationId = line.stationIds[train.segmentIndex];
  const station = getStationById(state, stationId);
  if (station) {
    stopAtStation(state, train, station, line.id, now);
    train.dwellUntil = now + 430;
  }
}

function stopAtStation(state, train, station, lineId, now) {
  const remainingPassengers = [];

  for (const passenger of train.passengers) {
    if (passenger.destinationType === station.type) {
      addPassengerAnimation(state, passenger, 'train', 'station', station.id, train.id, now, 'alight');
      continue;
    }

    const shouldTransfer = !lineCanReachType(state, lineId, passenger.destinationType)
      && canReachDestinationFromStation(state, station.id, passenger.destinationType, lineId);

    if (shouldTransfer) {
      station.queue.push(passenger);
      addPassengerAnimation(state, passenger, 'train', 'station', station.id, train.id, now, 'transfer');
      continue;
    }

    remainingPassengers.push(passenger);
  }

  train.passengers = remainingPassengers;
  boardPassengers(state, train, station, lineId, now);
}

function boardPassengers(state, train, station, lineId, now) {
  const stillWaiting = [];

  for (const passenger of station.queue) {
    if (train.passengers.length >= GAME_CONFIG.trainCapacity) {
      stillWaiting.push(passenger);
      continue;
    }

    if (passenger.destinationType === station.type || lineCanHelpPassenger(state, lineId, passenger.destinationType)) {
      train.passengers.push(passenger);
      addPassengerAnimation(state, passenger, 'station', 'train', station.id, train.id, now, 'board');
    } else {
      stillWaiting.push(passenger);
    }
  }

  station.queue = stillWaiting;
}

function addPassengerAnimation(state, passenger, fromKind, toKind, stationId, trainId, now, mode) {
  state.passengerAnimations.push(createPassengerAnimation(
    passenger,
    { kind: fromKind, stationId, trainId },
    { kind: toKind, stationId, trainId },
    now,
    mode,
  ));
}

function prunePassengerAnimations(state, now) {
  state.passengerAnimations = state.passengerAnimations.filter((animation) => (
    now - animation.startedAt < animation.duration
  ));
}

function lineCanHelpPassenger(state, lineId, destinationType) {
  const line = getLineById(state, lineId);
  if (!line) {
    return false;
  }

  return line.stationIds.some((stationId) => (
    canReachDestinationFromStation(state, stationId, destinationType)
  ));
}

function canReachDestinationFromStation(state, stationId, destinationType, excludedFirstLineId = null) {
  const queue = [stationId];
  const visitedStations = new Set(queue);
  const visitedLines = new Set();
  let isFirstStation = true;

  while (queue.length) {
    const currentStationId = queue.shift();
    const currentStation = getStationById(state, currentStationId);
    if (currentStation?.type === destinationType) {
      return true;
    }

    const connectedLines = state.lines.filter((line) => line.stationIds.includes(currentStationId));
    for (const line of connectedLines) {
      if (isFirstStation && line.id === excludedFirstLineId) {
        continue;
      }
      if (visitedLines.has(line.id)) {
        continue;
      }
      visitedLines.add(line.id);

      for (const nextStationId of line.stationIds) {
        if (!visitedStations.has(nextStationId)) {
          visitedStations.add(nextStationId);
          queue.push(nextStationId);
        }
      }
    }

    isFirstStation = false;
  }

  return false;
}

function lineCanReachType(state, lineId, type) {
  const line = getLineById(state, lineId);
  if (!line) {
    return false;
  }

  return getLineStations(state, line).some((lineStation) => lineStation.type === type);
}
