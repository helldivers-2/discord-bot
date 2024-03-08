import {data, seasons} from './api';
import {MergedPlanetData} from './types';

export function getAllPlanets(war_id?: number): MergedPlanetData[] {
  // planetInfos from WarInfo
  // planetStatus from Status
  const warId = war_id || seasons.current;
  return data[warId].Planets;
}

export function getAllActivePlanets(war_id?: number): MergedPlanetData[] {
  const warId = war_id || seasons.current;
  return data[warId].ActivePlanets;
}

export function getPlanetAttacks(war_id?: number) {
  const warId = war_id || seasons.current;
  return data[warId].PlanetAttacks;
}
export function getPlanetByIndex(planetIndex: number, war_id?: number) {
  const warId = war_id || seasons.current;
  const planet = data[warId].Planets.find(p => p.index === planetIndex);
  return planet;
}

export function getPlanetByName(planetName: string, war_id?: number) {
  const warId = war_id || seasons.current;
  const planet = data[warId].Planets.find(
    p => p.name.toLowerCase() === planetName.toLowerCase()
  );
  return planet;
}
