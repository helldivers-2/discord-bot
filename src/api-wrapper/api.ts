import {
  WarInfo,
  Status,
  MergedPlanetData,
  PlanetStatus,
  GlobalEvent,
  Faction,
  MergedCampaignData,
  MergedPlanetEventData,
} from './types';
import {
  getFactionName,
  getPlanetEventType,
  getPlanetName,
  getSectorName,
} from './mapping';
import {existsSync, mkdirSync, writeFileSync} from 'fs';
import {compressFile, dayjs, logger, writeGzipJson} from '../handlers';
import path from 'path';
import {getAllPlanets} from './planets';
import axios from 'axios';

const API_URL = 'https://api.live.prod.thehelldiversgame.com/api';

export const seasons = {
  current: 801,
  seasons: [801, 805],
};

// create an empty object to store the data
export const data: {
  [key: number]: {
    WarInfo: WarInfo;
    Status: Status;
    Planets: MergedPlanetData[];
    Campaigns: MergedCampaignData[];
    PlanetEvents: MergedPlanetEventData[];
    ActivePlanets: MergedPlanetData[];
    PlanetAttacks: {source: string; target: string}[];
    Events: GlobalEvent[];
    Players: {
      [key in Faction]: number;
    };
    UTCOffset: number;
  };
} = {};

for (const season of seasons.seasons) {
  data[season] = {
    WarInfo: {} as WarInfo,
    Status: {} as Status,
    Planets: [] as MergedPlanetData[],
    Campaigns: [] as MergedCampaignData[],
    PlanetEvents: [] as MergedPlanetEventData[],
    ActivePlanets: [],
    PlanetAttacks: [],
    Events: [] as GlobalEvent[],
    Players: {
      Automaton: 0,
      Humans: 0,
      Terminids: 0,
      Total: 0,
    },
    UTCOffset: 0,
  };
}

export async function getData() {
  const season = seasons.current;
  const fileTimestamp = dayjs().format('DD_MM_YYYYTHH_mm_ssZZ[UTC]');
  // logger.info(`Fetching data for season ${season} at ${fileTimestamp}`, {
  //   type: 'info',
  // });

  if (!existsSync(path.join('api_responses', String(season))))
    mkdirSync(path.join('api_responses', String(season)), {recursive: true});

  const warInfoApi = await (
    await axios.get(`${API_URL}/WarSeason/${season}/WarInfo`, {
      headers: {
        'Accept-Language': 'en-us',
      },
    })
  ).data;
  const warInfo = warInfoApi as WarInfo;
  // const warInfoPath = path.join(
  //   'api_responses',
  //   String(season),
  //   `${fileTimestamp}_WarInfo.json`
  // );
  // await writeGzipJson(warInfoPath + '.gz', warInfoApi);
  const statusApi = await (
    await axios.get(`${API_URL}/WarSeason/${season}/Status`, {
      headers: {
        'Accept-Language': 'en-us',
      },
    })
  ).data;
  const status = statusApi as Status;
  status.timeUtc = Date.now();

  // const statusPath = path.join(
  //   'api_responses',
  //   String(season),
  //   `${fileTimestamp}_Status.json`
  // );
  // await writeGzipJson(statusPath + '.gz', statusApi);

  const planets: MergedPlanetData[] = [];
  const players = {
    Automaton: 0,
    Humans: 0,
    Terminids: 0,
    Total: status.planetStatus.reduce((acc, p) => acc + p.players, 0),
  };
  // ACTIVE MISSIONS ARE IN status/campaigns
  // DEFENCE MISSIONS ARE IN status/planetEvents with an eventType of 1
  // USE campaignId to link to the campaign
  for (const planet of warInfo.planetInfos) {
    const {index} = planet;
    const planetStatus = status.planetStatus.find(p => p.index === index);
    if (planetStatus) {
      const {regenPerSecond} = planetStatus;
      const liberation = (1 - planetStatus.health / planet.maxHealth) * 100;
      const lossPercPerHour =
        ((regenPerSecond * 3600) / planet.maxHealth) * 100;
      const playerPerc = (planetStatus.players / players['Total']) * 100;
      const owner = getFactionName(planetStatus.owner);
      const initialOwner = getFactionName(planet.initialOwner);
      players[owner] += planetStatus.players;
      // players['Total'] += planetStatus.players;
      planets.push({
        name: getPlanetName(index),
        liberation: +liberation.toFixed(4),
        lossPercPerHour: +lossPercPerHour.toFixed(2),
        playerPerc: +playerPerc.toFixed(2),
        ...planet,
        ...planetStatus,
        initialOwner: initialOwner,
        owner: owner,
      });
    }
  }

  const planetEvents: MergedPlanetEventData[] = status.planetEvents.map(p => ({
    ...p,
    defence: +(p.health / p.maxHealth).toFixed(4),
    planetName: getPlanetName(p.planetIndex),
    eventType: getPlanetEventType(p.eventType),
    race: getFactionName(p.race),
  }));
  const campaigns: MergedCampaignData[] = status.campaigns.map(c => ({
    ...c,
    planetName: getPlanetName(c.planetIndex),
    planetEvent: planetEvents.find(p => p.campaignId === c.id),
    planetData: planets.find(
      p => p.index === c.planetIndex
    ) as MergedPlanetData,
    campaignType:
      planetEvents.find(p => p.campaignId === c.id)?.eventType || 'Liberation',
  }));

  data[season] = {
    WarInfo: warInfo,
    Status: status,
    Planets: planets,
    Campaigns: campaigns,
    PlanetEvents: planetEvents,
    ActivePlanets: planets.filter(
      p => p.playerPerc > 0 && p.owner !== 'Humans'
    ),
    PlanetAttacks: status.planetAttacks.map(p => ({
      source: getPlanetName(p.source),
      target: getPlanetName(p.target),
    })),
    Events: status.globalEvents,
    Players: players,
    // this is the starting point in unix for whatever time thing they use
    UTCOffset: Math.floor(status.timeUtc - status.time * 1000), // use this value to add to the time to get the UTC time in seconds
  };

  writeFileSync('data.json', JSON.stringify(data, null, 2));
  return data;
}

export const mappedNames: {
  factions: string[];
  planets: string[];
  campaignPlanets: string[];
  sectors: string[];
} = {
  factions: [],
  planets: [],
  campaignPlanets: [],
  sectors: [],
};
export const planetNames = getAllPlanets().map(p => p.name);

// setInterval(getData, 60000);

// "https://api.live.prod.thehelldiversgame.com/api/WarSeason/#{war_id}/WarInfo"
// "https://api.live.prod.thehelldiversgame.com/api/WarSeason/#{war_id}/Status"
// eg:
// "https://api.live.prod.thehelldiversgame.com/api/WarSeason/801/WarInfo"
// "https://api.live.prod.thehelldiversgame.com/api/WarSeason/801/Status"

/*
good stuff to have:
- <warId>/WarInfo
- <warId>/Status
- <warId>/Planets
- <warId>/Planets/<planetIndex>

other api has:
/api
all available war seasons

/api/{war_id}/events
all global events

/api/{war_id}/events/latest
latest global event

/api/{war_id}/info
war season info

/api/{war_id}/planets
overview of all planets

/api/{war_id}/planets/{planet_index}
info about a specific planet

/api/{war_id}/planets/{planet_index}/status
status of a specific planet

/api/{war_id}/status
current overall helldiver offensive status
*/

export {API_URL};
