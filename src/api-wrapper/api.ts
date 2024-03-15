import {
  WarInfo,
  Status,
  MergedPlanetData,
  GlobalEvent,
  Faction,
  MergedCampaignData,
  MergedPlanetEventData,
  ApiData,
  WarDifferences,
  Assignment,
  NewsFeedItem,
} from './types';
import {getFactionName, getPlanetEventType, getPlanetName} from './mapping';
import {existsSync, mkdirSync, writeFileSync} from 'fs';
import {dayjs, logger} from '../handlers';
import path from 'path';
import {getAllPlanets} from './planets';
import axios from 'axios';

const API_URL = 'https://api.live.prod.thehelldiversgame.com/api';

export const seasons = {
  current: 801,
  seasons: [801, 805],
};

// create an empty object to store the data
export let data: ApiData = {
  WarInfo: {
    warId: 0,
    startDate: 0,
    endDate: 0,
    minimumClientVersion: '',
    planetInfos: [],
    homeWorlds: [],
    capitalInfos: [],
    planetPermanentEffects: [],
  },
  Status: {
    warId: 0,
    time: 0,
    timeUtc: 0,
    impactMultiplier: 0,
    storyBeatId32: 0,
    planetStatus: [],
    planetAttacks: [],
    campaigns: [],
    communityTargets: [],
    jointOperations: [],
    planetEvents: [],
    planetActiveEffects: [],
    activeElectionPolicyEffects: [],
    globalEvents: [],
    superEarthWarResults: [],
  },
  Planets: [],
  Campaigns: [],
  PlanetEvents: [],
  ActivePlanets: [],
  PlanetAttacks: [],
  Events: [],
  Players: {
    Humans: 0,
    Total: 0,
    Automaton: 0,
    Terminids: 0,
  },
  UTCOffset: 0,
  Assignment: [],
  NewsFeed: [],
};

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

  const statusApi = await (
    await axios.get(`${API_URL}/WarSeason/${season}/Status`, {
      headers: {
        'Accept-Language': 'en-us',
      },
    })
  ).data;
  const status = statusApi as Status;
  status.timeUtc = Date.now();

  // https://api.live.prod.thehelldiversgame.com/api/v2/Assignment/War/801

  const assignmentApi = await (
    await axios.get(`${API_URL}/v2/Assignment/War/${season}`, {
      headers: {
        'Accept-Language': 'en-us',
      },
    })
  ).data;
  const assignment = assignmentApi as Assignment[];

  //https://api.live.prod.thehelldiversgame.com/api/NewsFeed/801
  const newsFeedApi = await (
    await axios.get(`${API_URL}/NewsFeed/${season}`, {
      headers: {
        'Accept-Language': 'en-us',
      },
    })
  ).data;
  const newsFeed = newsFeedApi as NewsFeedItem[];

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
      const liberation = +(
        (1 - planetStatus.health / planet.maxHealth) *
        100
      ).toFixed(4);
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
    defence: +((p.health / p.maxHealth) * 100).toFixed(4),
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

  data = {
    WarInfo: warInfo,
    Status: status,
    Assignment: assignment,
    NewsFeed: newsFeed,
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

export {API_URL};
