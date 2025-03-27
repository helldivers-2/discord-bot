export type Position = {
  x: number;
  y: number;
};

export type Currency = 'Medals';
export type Faction =
  | 'Humans'
  | 'Total'
  | 'Automaton'
  | 'Terminids'
  | 'Illuminate';
export type PlanetEventType = 'Defend';
export type CampaignType = 'Defend' | 'Liberation' | 'Invasion';

export type PlanetBiome = {
  name: string;
  description: string;
};

export type PlanetEnvironment = {
  name: string;
  description: string;
};

export type TranslationLangs =
  | 'en-US'
  | 'en-GB'
  | 'pt-BR'
  | 'de-DE'
  | 'es-ES'
  | 'fr-FR'
  | 'it-IT'
  | 'ja-JP'
  | 'ko-KO'
  | 'ms-MY'
  | 'pl-PL'
  | 'pt-PT'
  | 'ru-RU'
  | 'zh-Hans'
  | 'zh-Hant';

export type AdditionalPlanetInfo = {
  [key: string]: {
    name: string;
    sector: string;
    biome: PlanetBiome;
    environmentals: PlanetEnvironment[];
    names: {
      [key in TranslationLangs]: string;
    };
  };
};

export type PlanetInfo = {
  index: number;
  settingsHash: number;
  position: Position;
  waypoints: number[];
  sector: number;
  maxHealth: number;
  disabled: boolean;
  initialOwner: number;
};

export type PlanetStatus = {
  index: number;
  owner: number;
  health: number;
  regenPerSecond: number;
  players: number;
};

export type HomeWorld = {
  race: number;
  planetIndices: number[];
};

export type HomeWorldDisplay = {
  raceIndex: number;
  race: string;
  planetIndices: number[];
  planetNames: string[];
};

export type PlanetAttack = {
  source: number;
  target: number;
};

export type PlanetAttackDisplay = {
  sourceIndex: number;
  source: string;
  targetIndex: number;
  target: string;
};

export type Campaign = {
  id: number;
  planetIndex: number;
  type: number;
  count: number;
};

export type JointOperation = {
  id: number;
  planetIndex: number;
  hqNodeIndex: number;
};

export type PlanetEvent = {
  id: number;
  planetIndex: number;
  eventType: number;
  race: number;
  health: number;
  maxHealth: number;
  startTime: number;
  expireTime: number;
  campaignId: number;
  jointOperationIds: number[];
};

export type MergedPlanetData = {
  index: number;
  name: string;
  settingsHash: number;
  position: Position;
  waypoints: number[];
  sector: number;
  maxHealth: number;
  disabled: boolean;
  initialOwner: Faction;
  owner: Faction;
  health: number;
  regenPerSecond: number;
  lossPercPerHour: number;
  players: number;
  playerPerc: number;
  liberation: number;
  sectorName?: string;
  biome?: PlanetBiome;
  environmentals?: PlanetEnvironment[];
};
/*
Defend missions are a race against the clock
Helldivers have to deal a certain amount of damage before the campaign ends
blue bar: health of the planet (we need to reduce it to 0 // fill the bar)
red bar: time limit (linearly fills as time passes)
*/
export type MergedPlanetEventData = {
  id: number;
  planetIndex: number;
  planetName: string;
  eventType: PlanetEventType;
  race: Faction;
  defence: number;
  health: number;
  maxHealth: number;
  startTime: number;
  expireTime: number;
  campaignId: number;
  jointOperationIds: number[];
  potentialBuildUp?: number;
  globalResourceId?: number;
};

export type MergedCampaignData = {
  id: number;
  planetIndex: number;
  planetName: string;
  campaignType: CampaignType;
  type: number;
  count: number;
  planetData: MergedPlanetData;
  planetEvent?: MergedPlanetEventData;
};

export type GlobalEvent = {
  eventId: number;
  id32: number;
  portraitId32: number;
  title: string;
  titleId32: number;
  message: string;
  messageId32: number;
  race: number;
  flag: number;
  assignmentId32: number;
  effectIds: any[];
  planetIndices: any[];
};

// /api/WarSeason/{war_id}/WarInfo
export type WarInfo = {
  warId: number;
  startDate: number;
  endDate: number;
  minimumClientVersion: string;
  planetInfos: PlanetInfo[];
  homeWorlds: HomeWorld[];
  capitalInfos: any[];
  planetPermanentEffects: any[];
};

// /api/WarSeason/{war_id}/Status
export type Status = {
  warId: number;
  time: number;
  timeUtc: number;
  impactMultiplier: number;
  storyBeatId32: number;
  planetStatus: PlanetStatus[];
  planetAttacks: PlanetAttack[];
  campaigns: Campaign[];
  communityTargets: any[];
  jointOperations: JointOperation[];
  planetEvents: PlanetEvent[];
  planetActiveEffects: any[];
  activeElectionPolicyEffects: any[];
  globalEvents: GlobalEvent[];
  superEarthWarResults: any[];
};

// export type Task = {
//   type: number;
//   values: keyof TaskTypeMappings[];
//   valueTypes: keyof ValueTypeMappings[];
// };

// export type TaskTypeMappings = {
//   // [key: number]: string;
//   3: 'Eradicate';
//   11: 'Liberation';
//   12: 'Defense';
//   13: 'Control';
// };

// export type ValueTypeMappings = {
//   // [key: number]: string;
//   1: 'race';
//   3: 'goal';
//   11: 'liberate';
//   12: 'planet_index';
// };

export type MappedTask = {
  type: number;
  name: string;
  race?: Faction; // 1
  goal: number; // 3
  progress: number; // in assignment progress field
  liberate?: boolean; // 11
  planetIndex?: number; // 12 (0 means "many")
  values: number[];
  valueTypes: number[];
};

// /api/v2/Assignment/War/{war_id}
export type Assignment = {
  id32: number;
  progress: number[];
  expiresIn: number;
  setting: {
    type: number;
    overrideTitle: string;
    overrideBrief: string;
    taskDescription: string;
    tasks: {
      type: number;
      values: number[];
      valueTypes: number[];
    }[];
    reward: {
      type: number;
      id32: number;
      amount: number;
    };
    flags: number;
  };
};

// /api/NewsFeed/{war_id}
export type NewsFeedItem = {
  id: number;
  published: number;
  publishedUtc: number;
  type: number;
  tagIds: number[];
  message: string;
};

export type StoreItem = {
  name: string;
  description: string;
  type: 'Light' | 'Medium' | 'Heavy';
  slot: 'Head' | 'Body' | 'Cloak';
  armor_rating: number;
  speed: number;
  stamina_regen: number;
  passive: {
    name: string;
    description: string;
  };
  store_cost: number;
};

export type StoreRotation = {
  expire_time: Date;
  items: StoreItem[];
};

export type SteamNewsItem = {
  title: string;
  url: string;
  date: Date;
  contents: string;
  // id: string;
  // author: string;
};

export type SteamNewsFeed = SteamNewsItem[];

export type RawSteamNewsItem = {
  id: string;
  author: string;
  title: string;
  url: string;
  date: Date;
  content: string;
};

export type RawSteamNewsFeed = RawSteamNewsItem[];

export type WarOverview = {
  warId: number;
  startDate: number;
  endDate: number;
  minimumClientVersion: string;

  Planets: MergedPlanetData[];
  Events: GlobalEvent[];
};

export type UnmappedPersonalOrder = {
  id32: number;
  progress: number[];
  expiresIn: number;
  setting: {
    type: number;
    overrideTitle: string;
    overrideBrief: string;
    taskDescription: string;
    tasks: {
      type: number;
      values: number[];
      valueTypes: number[];
    }[];
    reward: {
      type: number;
      id32: number;
      amount: number;
    };
    flags: number;
  };
};

export type PlanetStatsItem = {
  planetIndex: number;
  planetName: string;
  missionsWon: number;
  missionsLost: number;
  missionTime: number;
  bugKills: number;
  automatonKills: number;
  illuminateKills: number;
  bulletsFired: number;
  bulletsHit: number;
  timePlayed: number;
  deaths: number;
  revives: number;
  friendlies: number;
  missionSuccessRate: number;
  accurracy: number;
};

export type PlanetStats = {
  galaxy_stats: Omit<PlanetStatsItem, 'planetIndex' | 'planetName'>;
  planets_stats: PlanetStatsItem[];
};

export type ArmorItem = {
  id: string;
  name: string;
  description: string;
  type: 'Light' | 'Medium' | 'Heavy';
  slot: 'Head' | 'Body' | 'Cloak';
  armor_rating: number;
  speed: number;
  stamina_regen: number;
  passive: {
    name: string;
    description: string;
  };
};

export type WeaponItem = {
  id: string;
  name: string;
  description: string;
  type: 'Primary' | 'Secondary';
  damage: number;
  capacity: number;
  recoil: number;
  fire_rate: number;
  fire_mode: string[];
  traits: string[];
};

export type GrenadeItem = {
  id: string;
  name: string;
  description: string;
  damage: number;
  penetration: number;
  outer_radius: number;
  fuse_time: number;
};

export type BoosterItem = {
  id: string;
  name: string;
  description: string;
};

export type Items = {
  armor: {
    Head: ArmorItem[];
    Body: ArmorItem[];
    Cloak: ArmorItem[];
  };
  weapons: {
    primaries: WeaponItem[];
    secondaries: WeaponItem[];
    grenades: GrenadeItem[];
  };
  boosters: BoosterItem[];
};

export type WarbondItem = {
  name: string;
  mix_id: string;
  medal_cost: number;
} & Partial<GrenadeItem> &
  Partial<ArmorItem> &
  Partial<WeaponItem> &
  Partial<BoosterItem>;

export type WarbondNames =
  | 'helldivers_mobilize'
  | 'steeled_veterans'
  | 'cutting_edge'
  | 'democratic_detonation'
  | 'polar_patriots';

export type Warbond = {
  [key: string]: {
    medals_to_unlock: number;
    items: {
      [key: string]: WarbondItem;
    };
  };
};

export type HelldiversDiscordAnnouncement = {
  type: 'CM' | 'HD2' | 'AHG' | 'UNKNOWN';
  content: string;
  attachmentUrls?: string[];
  timestamp: Date;
  editedTimestamp?: Date;
};

export type SteamPostAPI = {
  title: string;
  url: string;
  date: string;
  contents: string;
};

export type SteamPost = {
  title: string;
  url: string;
  contents: string;
  date: Date;
};

export type ApiData = {
  WarInfo: WarInfo;
  Status: Status;
  Assignment: Assignment[];
  NewsFeed: NewsFeedItem[];
  PlanetStats: PlanetStats;
  Planets: MergedPlanetData[];
  additionalPlanetInfo?: AdditionalPlanetInfo;
  Campaigns: MergedCampaignData[];
  PlanetEvents: MergedPlanetEventData[];
  ActivePlanets: MergedPlanetData[];
  PlanetAttacks: {source: string; target: string}[];
  Events: GlobalEvent[];
  RawDSS?: RawDSSData;
  SuperStore?: StoreRotation;
  Items?: Items;
  UnmappedPersonalOrders?: UnmappedPersonalOrder[];
  Warbonds?: {
    helldivers_mobilize: Warbond;
    steeled_veterans: Warbond;
    cutting_edge: Warbond;
    democratic_detonation: Warbond;
    polar_patriots: Warbond;
  };
  Players: {
    [key in Faction]: number;
  };
  HelldiversDiscordAnnouncements: HelldiversDiscordAnnouncement[];
  SteamPosts: SteamPost[];
  UTCOffset: number;
};

export type StrippedApiData = {
  WarInfo: Omit<WarInfo, 'planetInfos'>;
  Status: Omit<Status, 'planetStatus'>;
  Assignment: Assignment[];
  NewsFeed: NewsFeedItem[];
  PlanetStats: PlanetStats;
  Campaigns: MergedCampaignData[];
  PlanetEvents: MergedPlanetEventData[];
  ActivePlanets: MergedPlanetData[];
  PlanetAttacks: {source: string; target: string}[];
  Events: GlobalEvent[];
  RawDSS?: RawDSSData;
  SuperStore?: StoreRotation;
  UnmappedPersonalOrders?: UnmappedPersonalOrder[];
  Players: {
    [key in Faction]: number;
  };
  HelldiversDiscordAnnouncements: HelldiversDiscordAnnouncement[];
  SteamPosts: SteamPost[];
  UTCOffset: number;
};

export type RawDSSData = {
  id32: number;
  planetIndex: number;
  lastElectrionId: string;
  currentElectionId: string;
  currentElectionEndWarTime: number;
  flags: number;
  tacticalActions: {
    id32: number;
    mediaId32: number;
    name: string;
    description: string;
    strategicDescription: string;
    status: number;
    statusExpireAtWarTimeSeconds: number;
    cost: {
      id: string;
      itemMixId: number;
      targetValue: number;
      currentValue: number;
      deltaPerSecond: number;
      maxDonationAmount: number;
      maxDonationPeriodSeconds: number;
    }[];
    effectIds: number[];
    activeEffectIds: number[];
  }[];
};

export type WarDifferences = {
  NewCampaigns: MergedCampaignData[];
  NewEvents: GlobalEvent[];
  NewNewsFeed: NewsFeedItem[];
  NewMajorOrder?: Assignment;
  WonPlanets: MergedCampaignData[];
  LostPlanets: MergedCampaignData[];
  Players: {
    [key in Faction]: number;
  };
};
