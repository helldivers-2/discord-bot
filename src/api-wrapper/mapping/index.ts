import {Faction, PlanetEventType} from '../types';
import factions from './factions.json';
import planetEvents from './planetEvents.json';
import planets from './planets.json';
import sectors from './sectors.json';

interface JsonFile {
  [key: string]: string;
}

export function getFactionName(id: number): Faction {
  return (factions as JsonFile)[id] as Faction;
}

export function getPlanetEventType(id: number): PlanetEventType {
  return (planetEvents as JsonFile)[id] as PlanetEventType;
}

export function getPlanetName(id: number): string {
  return (planets as JsonFile)[id];
}

export function getSectorName(id: number): string {
  return (sectors as JsonFile)[id];
}
