export type Position = {
  x: number;
  y: number;
};

export type Currency = 'Medals';
export type Faction = 'Humans' | 'Total' | 'Automaton' | 'Terminids';
export type PlanetEventType = 'Defend';
export type CampaignType = 'Defend' | 'Liberation';

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

export type WarOverview = {
  warId: number;
  startDate: number;
  endDate: number;
  minimumClientVersion: string;

  Planets: MergedPlanetData[];
  Events: GlobalEvent[];
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

export type ApiData = {
  WarInfo: WarInfo;
  Status: Status;
  Assignment: Assignment[];
  NewsFeed: NewsFeedItem[];
  PlanetStats: PlanetStats;
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
  Players: {
    [key in Faction]: number;
  };
  UTCOffset: number;
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
