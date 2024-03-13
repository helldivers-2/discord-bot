import {data} from './api';
import {Faction} from './types';

export function getAllPlayers() {
  return data.Players;
}

export function getCurrentPlayers() {
  return data.Players.Total;
}

export function getFactionPlayers(faction: Faction) {
  return data.Players[faction];
}
