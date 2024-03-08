import {data, seasons} from './api';
import {Faction} from './types';

export function getAllPlayers(war_id?: number) {
  const warId = war_id || seasons.current;
  return data[warId].Players;
}

export function getCurrentPlayers(war_id?: number) {
  const warId = war_id || seasons.current;
  return data[warId].Players.Total;
}

export function getFactionPlayers(faction: Faction, war_id?: number) {
  const warId = war_id || seasons.current;
  return data[warId].Players[faction];
}
