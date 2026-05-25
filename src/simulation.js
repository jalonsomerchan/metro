import { GAME_CONFIG, STATION_TYPES } from './config.js';
import {
  createPassenger,
  createTrain,
  getLineById,
  getLineStations,
  getStationById,
  isTransferStation,
  maybeSpawnStation,
} from './state.js';

export function ensureLineTrain(state, line) {
  if (line.stationIds.length < 2) {
    return;
  }

  const hasTrain = state.trains.some((train) => train.lineId === line.id);
  if (!hasTrain) {
    state.trains.push(createTrain(line.id));
  }
}

export function tickSimulation(state, now, deltaMs) {
  if (state.paused) {
    return;
  }

  maybeSpawnStation(state, now);
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

  if (train.dwellUntil > now) {
    return;
  }

  train.progress += GAME_CONFIG.trainSpeed * deltaMs;

  if (train.progress < 1) {
    return;
  }

  train.progress = 0;
  train.segmentIndex += train.direction;

  if (train.segmentIndex >= line.stationIds.length - 1) {
    train.segmentIndex = line.stationIds.length - 1;
    train.direction = -1;
  }

  if (train.segmentIndex <= 0) {
    train.segmentIndex = 0;
    train.direction = 1;
  }

  const stationId = line.stationIds[train.segmentIndex];
  const station = getStationById(state, stationId);
  if (station) {
    stopAtStation(state, train, station, line.id);
    train.dwellUntil = now + 430;
  }
}

function stopAtStation(state, train, station, lineId) {
  const remainingPassengers = [];

  for (const passenger of train.passengers) {
    if (passenger.destinationType === station.type) {
      continue;
    }

    if (isTransferStation(state, station.id) && passengerCanUseOtherLine(state, passenger, station.id, lineId)) {
      station.queue.push(passenger);
      continue;
    }

    remainingPassengers.push(passenger);
  }

  train.passengers = remainingPassengers;
  boardPassengers(state, train, station, lineId);
}

function boardPassengers(state, train, station, lineId) {
  const stillWaiting = [];

  for (const passenger of station.queue) {
    if (train.passengers.length >= GAME_CONFIG.trainCapacity) {
      stillWaiting.push(passenger);
      continue;
    }

    if (passenger.destinationType === station.type || lineCanReachType(state, lineId, passenger.destinationType)) {
      train.passengers.push(passenger);
    } else {
      stillWaiting.push(passenger);
    }
  }

  station.queue = stillWaiting;
}

function passengerCanUseOtherLine(state, passenger, stationId, currentLineId) {
  return state.lines.some((line) => (
    line.id !== currentLineId
    && line.stationIds.includes(stationId)
    && lineCanReachType(state, line.id, passenger.destinationType)
  ));
}

function lineCanReachType(state, lineId, type) {
  const line = getLineById(state, lineId);
  if (!line) {
    return false;
  }

  return getLineStations(state, line).some((lineStation) => lineStation.type === type);
}
