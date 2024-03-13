import {data} from './api';
import {MergedPlanetData} from './types';

export function getAllPlanets(): MergedPlanetData[] {
  return data.Planets;
}

export function getAllActivePlanets(): MergedPlanetData[] {
  return data.ActivePlanets;
}

export function getPlanetAttacks() {
  return data.PlanetAttacks;
}
export function getPlanetByIndex(planetIndex: number) {
  const planet = data.Planets.find(p => p.index === planetIndex);
  return planet;
}

export function getPlanetByName(planetName: string) {
  const planet = data.Planets.find(
    p => p.name.toLowerCase() === planetName.toLowerCase()
  );
  return planet;
}
