import {
  AdditionalPlanetInfo,
  ApiData,
  ArmorItem,
  Assignment,
  BoosterItem,
  GrenadeItem,
  Items,
  MergedCampaignData,
  MergedPlanetData,
  MergedPlanetEventData,
  NewsFeedItem,
  PlanetStats,
  Status,
  StoreRotation,
  UnmappedPersonalOrder,
  HelldiversDiscordAnnouncement,
  WarInfo,
  WeaponItem,
  SteamPost,
  SteamPostAPI,
  RawDSSData,
} from './types';
import {getFactionName, getPlanetEventType, getPlanetName} from './mapping';
import {writeFileSync} from 'fs';
import {getAllPlanets} from './planets';
import axios from 'axios';
import {config} from '../config';
import {logger} from '../handlers';
import {apiData, db} from '../db';
import dayjs from 'dayjs';

// const API_URL = 'https://api.live.prod.thehelldiversgame.com/api';
const CHATS_URL = 'https://api.diveharder.com/v1/all';
const CHATS_URL_RAW = 'https://api.diveharder.com/raw/all';
const CHATS_URL_RAW_DSS = 'https://api.diveharder.com/raw/dss';
const FALLBACK_URL = 'https://api.helldivers2.dev/raw/api';

const IDENTIFIER = config.IDENTIFIER;
const CONTACT = config.CONTACT;
const DEALLOC_TOKEN = config.DEALLOC_TOKEN;
const CM_DISPATCHES_CHANNEL = config.CM_DISPATCHES_CHANNEL;
const HD2_ANNOUNCEMENTS_CHANNEL = config.HD2_ANNOUNCEMENTS_CHANNEL;
const AHG_ANNOUNCEMENTS_CHANNEL = config.AHG_ANNOUNCEMENTS_CHANNEL;

const apiClient = axios.create({
  headers: {
    'Accept-Language': 'en-us',
    'User-Agent': IDENTIFIER,
    'X-Super-Client': IDENTIFIER,
    'X-Super-Contact': CONTACT,
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
    Illuminate: 0,
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
  HelldiversDiscordAnnouncements: [],
  SteamPosts: [],
};

export async function getData() {
  let chatsAPI;
  let rawDSS;

  let warInfo: WarInfo;
  let status: Status;
  let UTCOffset: number;
  let assignment: Assignment[] = [];
  let planetStats: PlanetStats;
  let newsFeed: NewsFeedItem[];
  let storeRotation: StoreRotation | undefined = undefined;
  let warbonds: ApiData['Warbonds'] | undefined = undefined;
  let steamPosts: SteamPost[] = [];

  const gameItems: Items = {
    armor: {
      Body: [],
      Cloak: [],
      Head: [],
    },
    boosters: [],
    weapons: {
      secondaries: [],
      grenades: [],
      primaries: [],
    },
  };
  let additionalPlanetInfo: AdditionalPlanetInfo | undefined = undefined;
  let unmappedPersonalOrders: UnmappedPersonalOrder[] = [];

  try {
    // Unofficial: api wrapper for the authed chats endpoint
    chatsAPI = await (await apiClient.get(CHATS_URL)).data;
  } catch (err) {
    logger.error('Failed to fetch chats data.', {
      type: 'API',
      ...(err as Error),
    });
  }

  try {
    // fetch DSS raw data
    rawDSS = await (await apiClient.get(CHATS_URL_RAW_DSS)).data[0];
  } catch (err) {
    logger.error('Failed to fetch DSS data.', {
      type: 'API',
      ...(err as Error),
    });
  }

  if (chatsAPI) {
    warInfo = chatsAPI['war_info'] as WarInfo;
    status = chatsAPI['status'] as Status;
    status.timeUtc = Date.now();
    UTCOffset = Math.floor(status.timeUtc - status.time * 1000); // use this value to add to the time to get the UTC time in seconds
    if ('major_order' in chatsAPI)
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
    unmappedPersonalOrders = chatsAPI[
      'personal_order'
    ] as UnmappedPersonalOrder[];
    warbonds = chatsAPI['warbonds'] as ApiData['Warbonds'];
    steamPosts = chatsAPI['updates'].map((p: SteamPostAPI) => ({
      ...p,
      date: dayjs(p.date).toDate(),
    }));

    const chatsItems = chatsAPI['items'];
    if (chatsItems['armor']) {
      for (const [id, armor] of Object.entries(chatsItems['armor'])) {
        const typedArmor = armor as Omit<ArmorItem, 'id'>;
        const {slot} = typedArmor;
        gameItems.armor[slot as 'Head' | 'Body' | 'Cloak'].push({
          id,
          ...typedArmor,
        });
      }
    }
    if (chatsItems['weapons']) {
      const {primaries, secondaries, grenades} = chatsItems['weapons'];
      for (const [id, w] of Object.entries(primaries)) {
        const weapon = w as Omit<WeaponItem, 'id'>;
        gameItems.weapons['primaries'].push({
          id,
          ...weapon,
        });
      }
      for (const [id, w] of Object.entries(secondaries)) {
        const weapon = w as Omit<WeaponItem, 'id'>;
        gameItems.weapons['secondaries'].push({
          id,
          ...weapon,
        });
      }
      for (const [id, grenade] of Object.entries(grenades)) {
        gameItems.weapons['grenades'].push({
          id,
          ...(grenade as Omit<GrenadeItem, 'id'>),
        });
      }
    }
    if (chatsItems['boosters']) {
      for (const [id, boosters] of Object.entries(chatsItems['boosters'])) {
        gameItems.boosters.push({
          id,
          ...(boosters as Omit<BoosterItem, 'id'>),
        });
      }
    }
  } else {
    logger.error('Fallback to dealloc API', {type: 'API'});
    // fallback to dealloc API with delay between calls to avoid rate limits (429s)
    apiClient.defaults.baseURL = FALLBACK_URL;
    apiClient.defaults.headers['Authorization'] = `Bearer ${DEALLOC_TOKEN}`;
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

  // Fetch Discord announcements from the DB
  const discAnnouncements = await db.query.helldiversDiscordAnns.findMany();
  const hd2DiscAnnouncements: HelldiversDiscordAnnouncement[] =
    discAnnouncements.map(d => {
      let annType: HelldiversDiscordAnnouncement['type'];
      if (d.channelId === CM_DISPATCHES_CHANNEL) annType = 'CM';
      else if (d.channelId === HD2_ANNOUNCEMENTS_CHANNEL) annType = 'HD2';
      else if (d.channelId === AHG_ANNOUNCEMENTS_CHANNEL) annType = 'AHG';
      else annType = 'UNKNOWN';

      return {
        type: annType,
        content: d.content,
        attachmentUrls: d.attachmentUrls ?? undefined,
        editedTimestamp: d.editedTimestamp ?? undefined,
        timestamp: d.timestamp,
      };
    });

  const planets: MergedPlanetData[] = [];
  const players = {
    Automaton: 0,
    Humans: 0,
    Terminids: 0,
    Illuminate: 0,
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
    RawDSS: rawDSS,
    Players: players,
    // this is the starting point in unix for whatever time thing they use
    UTCOffset: Math.floor(status.timeUtc - status.time * 1000), // use this value to add to the time to get the UTC time in seconds
    HelldiversDiscordAnnouncements: hd2DiscAnnouncements,
    SteamPosts: steamPosts,
  };
  if (additionalPlanetInfo) data.additionalPlanetInfo = additionalPlanetInfo;
  if (storeRotation) data.SuperStore = storeRotation;
  if (unmappedPersonalOrders)
    data.UnmappedPersonalOrders = unmappedPersonalOrders;
  if (warbonds) data.Warbonds = warbonds;
  if (gameItems.weapons) data.Items = gameItems; // just check one field to see if the data is there

  writeFileSync('data.json', JSON.stringify(data, null, 2));

  // update mapped names
  mappedNames.planets = data.Planets.map(x => x.name);
  mappedNames.campaignPlanets = data.Campaigns.map(x => x.planetName);
  if (data.Items) {
    // items includes armours, weapons and boosters, so we need to map them all
    mappedNames.armors = [
      ...data.Items.armor.Body.map(a => `${a.name} (${a.type} ${a.slot})`),
      ...data.Items.armor.Cloak.map(a => `${a.name} (${a.type} ${a.slot})`),
      ...data.Items.armor.Head.map(a => `${a.name} (${a.type} ${a.slot})`),
    ];
    // armor may have duplicates for variants (skins?), so we need to deduplicate
    mappedNames.armors = mappedNames.armors.filter((armor, index) => {
      return (
        index ===
        mappedNames.armors.findIndex(obj => {
          return JSON.stringify(obj) === JSON.stringify(armor);
        })
      );
    });
    mappedNames.weapons = [
      ...data.Items.weapons.primaries.map(w => w.name),
      ...data.Items.weapons.secondaries.map(w => w.name),
    ];
    mappedNames.grenades = data.Items.weapons.grenades.map(w => w.name);
    mappedNames.boosters = data.Items.boosters.map(b => b.name);
  }

  return data;
}

export const mappedNames: {
  factions: string[];
  planets: string[];
  campaignPlanets: string[];
  sectors: string[];
  // items autocomplete
  armors: string[];
  weapons: string[];
  grenades: string[];
  boosters: string[];
} = {
  factions: [],
  planets: [],
  campaignPlanets: [],
  sectors: [],
  armors: [],
  weapons: [],
  grenades: [],
  boosters: [],
};

export const planetNames = getAllPlanets().map(p => p.name);
