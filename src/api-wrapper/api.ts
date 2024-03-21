import {
  WarInfo,
  Status,
  MergedPlanetData,
  MergedCampaignData,
  MergedPlanetEventData,
  ApiData,
  Assignment,
  NewsFeedItem,
  PlanetStats,
  PlanetStatsItem,
} from './types';
import {getFactionName, getPlanetEventType, getPlanetName} from './mapping';
import {writeFileSync} from 'fs';
import {getAllPlanets} from './planets';
import axios, {AxiosRequestConfig} from 'axios';
import {config} from '../config';

const API_URL = 'https://api.live.prod.thehelldiversgame.com/api';
const {IDENTIFIER} = config;

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
  PlanetStats: {
    galaxy_stats: {
      missionsWon: 0,
      missionsLost: 0,
      missionTime: 0,
      bugKills: 0,
      automatonKills: 0,
      illuminateKills: 0,
      bulletsFired: 0,
      bulletsHit: 0,
      timePlayed: 0,
      deaths: 0,
      revives: 0,
      friendlies: 0,
      missionSuccessRate: 0,
      accurracy: 0,
    },
    planets_stats: [],
  },
};

const axiosOpts: AxiosRequestConfig = {
  headers: {
    'Accept-Language': 'en-us',
  },
};

let getDataCounter = 0;
export async function getData() {
  const season = seasons.current;
  // https://api.live.prod.thehelldiversgame.com/api/WarSeason/801/Status
  // https://api.live.prod.thehelldiversgame.com/api/WarSeason/801/WarInfo
  // https://api.live.prod.thehelldiversgame.com/api/NewsFeed/801
  // https://api.live.prod.thehelldiversgame.com/api/v2/Assignment/War/801
  const warInfoApi = await (
    await axios.get(`${API_URL}/WarSeason/${season}/WarInfo`, axiosOpts)
  ).data;
  const warInfo = warInfoApi as WarInfo;

  const statusApi = await (
    await axios.get(`${API_URL}/WarSeason/${season}/Status`, axiosOpts)
  ).data;
  const status = statusApi as Status;
  status.timeUtc = Date.now();

  const assignmentApi = await (
    await axios.get(`${API_URL}/v2/Assignment/War/${season}`, axiosOpts)
  ).data;
  const assignment = assignmentApi as Assignment[];

  // Unofficial: api wrapper for the authed planetStats endpoint
  // https://api.diveharder.com/raw/planetStats
  let planetStats: PlanetStats = data.PlanetStats;
  if (getDataCounter % 2 === 0) {
    const planetStatsApi = await (
      await axios.get('https://api.diveharder.com/raw/planetStats', {
        ...axiosOpts,
        params: {
          source: IDENTIFIER,
        },
      })
    ).data;

    planetStats = {
      galaxy_stats: planetStatsApi.galaxy_stats,
      planets_stats: planetStatsApi.planets_stats.map(
        (p: Omit<PlanetStatsItem, 'planetName'>) => ({
          ...p,
          planetName: getPlanetName(p.planetIndex),
        })
      ),
    };
  }

  //https://api.live.prod.thehelldiversgame.com/api/NewsFeed/801
  // fetch the earliest possible news, then using the latest timestamp, fetch more news until it returns empty
  const newsFeed: NewsFeedItem[] = [];
  let newsFeedApi = await (
    await axios.get(`${API_URL}/NewsFeed/${season}`, axiosOpts)
  ).data;

  newsFeed.push(
    ...(newsFeedApi.map((item: Omit<NewsFeedItem, 'publishedUtc'>) => ({
      ...item,
      publishedUtc: data.UTCOffset + item.published * 1000,
    })) as NewsFeedItem[])
  );
  let newsFeedFrom = newsFeed.sort((a, b) => b.published - a.published)[0]
    .published;
  let newItemsAdded = true;
  while (newsFeedApi.length > 0 && newItemsAdded) {
    newItemsAdded = false;
    newsFeedApi = await (
      await axios.get(`${API_URL}/NewsFeed/${season}`, {
        ...axiosOpts,
        params: {
          fromTimestamp: newsFeedFrom,
        },
      })
    ).data;
    newsFeedApi.forEach((item: NewsFeedItem) => {
      if (!newsFeed.find(existingItem => existingItem.id === item.id)) {
        newsFeed.push({
          ...item,
          publishedUtc: data.UTCOffset + item.published * 1000,
        });
        newItemsAdded = true;
      }
    });
    newsFeedFrom = newsFeed.sort((a, b) => b.published - a.published)[0]
      .published;
  }
  newsFeed.sort((a, b) => b.published - a.published);

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
    defence: +((1 - p.health / p.maxHealth) * 100).toFixed(4),
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
    PlanetStats: planetStats,
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

  getDataCounter++;
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
