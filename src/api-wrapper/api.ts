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
  StoreRotation,
  AdditionalPlanetInfo,
} from './types';
import {getFactionName, getPlanetEventType, getPlanetName} from './mapping';
import {writeFileSync} from 'fs';
import {getAllPlanets} from './planets';
import axios from 'axios';
import {config} from '../config';
import {logger} from '../handlers';

// const API_URL = 'https://api.live.prod.thehelldiversgame.com/api';
const CHATS_URL = 'https://api.diveharder.com/v1/all';
const CHATS_URL_RAW = 'https://api.diveharder.com/raw/all';
const FALLBACK_URL = 'https://helldivers-2-dotnet.fly.dev/raw/api';
const {IDENTIFIER} = config;

const apiClient = axios.create({
  headers: {
    'Accept-Language': 'en-us',
    'User-Agent': IDENTIFIER,
  },
});

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
  additionalPlanetInfo: {},
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

export async function getData() {
  let chatsAPI;

  let warInfo: WarInfo;
  let status: Status;
  let UTCOffset: number;
  let assignment: Assignment[];
  let planetStats: PlanetStats;
  let newsFeed: NewsFeedItem[];
  let storeRotation: StoreRotation | undefined = undefined;
  let additionalPlanetInfo: AdditionalPlanetInfo | undefined = undefined;

  try {
    // Unofficial: api wrapper for the authed chats endpoint
    chatsAPI = await (await apiClient.get(CHATS_URL)).data;
  } catch (err) {
    logger.error('Failed to fetch chats data.', {
      type: 'API',
      ...(err as Error),
    });
  }

  if (chatsAPI) {
    warInfo = chatsAPI['war_info'] as WarInfo;
    status = chatsAPI['status'] as Status;
    status.timeUtc = Date.now();
    UTCOffset = Math.floor(status.timeUtc - status.time * 1000); // use this value to add to the time to get the UTC time in seconds
    assignment = chatsAPI['major_order'] as Assignment[];
    planetStats = chatsAPI['planet_stats'] as PlanetStats;
    newsFeed = chatsAPI['news_feed'].map(
      (item: Omit<NewsFeedItem, 'publishedUtc'>) => ({
        ...item,
        publishedUtc: UTCOffset + item.published * 1000,
      })
    ) as NewsFeedItem[];
    newsFeed.sort((a, b) => b.published - a.published);
    storeRotation = chatsAPI['store_rotation'] as StoreRotation;
    additionalPlanetInfo = chatsAPI['planets'] as AdditionalPlanetInfo;
  } else {
    logger.error('Fallback to dealloc APIs', {type: 'API'});
    // create a fallback API client
    apiClient.defaults.baseURL = FALLBACK_URL;
    const {id} = await (await apiClient.get('/WarSeason/current/WarID')).data;
    warInfo = await (await apiClient.get(`/WarSeason/${id}/WarInfo`)).data;
    status = await (await apiClient.get(`/WarSeason/${id}/Status`)).data;
    status.timeUtc = Date.now();
    UTCOffset = Math.floor(status.timeUtc - status.time * 1000); // use this value to add to the time to get the UTC time in seconds
    assignment = await (await apiClient.get(`/v2/Assignment/War/${id}`)).data;
    planetStats = await (await apiClient.get(`/Stats/War/${id}/Summary`)).data;
    newsFeed = (await (
      await apiClient.get(`/NewsFeed/${id}`)
    ).data.map((item: Omit<NewsFeedItem, 'publishedUtc'>) => ({
      ...item,
      publishedUtc: UTCOffset + item.published * 1000,
    }))) as NewsFeedItem[];
    newsFeed.sort((a, b) => b.published - a.published);
  }

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

      planets.push({
        name: getPlanetName(index),
        liberation: +liberation.toFixed(4),
        lossPercPerHour: +lossPercPerHour.toFixed(2),
        playerPerc: +playerPerc.toFixed(2),
        ...planet,
        ...planetStatus,
        initialOwner: initialOwner,
        owner: owner,
        sectorName: additionalPlanetInfo?.[index]?.sector,
        biome: additionalPlanetInfo?.[index]?.biome,
        environmentals: additionalPlanetInfo?.[index]?.environmentals,
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

  for (const campaign of campaigns) {
    const {planetData, planetEvent} = campaign;
    if (planetEvent) players[planetEvent.race] += planetData.players;
    else players[planetData.owner] += planetData.players;
  }

  data = {
    WarInfo: warInfo,
    Status: status,
    Assignment: assignment,
    NewsFeed: newsFeed,
    PlanetStats: planetStats,
    Planets: planets,
    // additionalPlanetInfo: additionalPlanetInfo,
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
    // SuperStore: storeRotation,
    Players: players,
    // this is the starting point in unix for whatever time thing they use
    UTCOffset: Math.floor(status.timeUtc - status.time * 1000), // use this value to add to the time to get the UTC time in seconds
  };
  if (additionalPlanetInfo) data.additionalPlanetInfo = additionalPlanetInfo;
  if (storeRotation) data.SuperStore = storeRotation;

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
