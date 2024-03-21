import {logger} from '..';
import {StrippedApiData, getData} from '../../api-wrapper';
import {apiData, db, eq, newApiData} from '../../db';

export async function dbData() {
  const data = await getData();
  const strippedData: StrippedApiData = {
    WarInfo: {
      warId: data.WarInfo.warId,
      startDate: data.WarInfo.startDate,
      endDate: data.WarInfo.endDate,
      minimumClientVersion: data.WarInfo.minimumClientVersion,
      homeWorlds: data.WarInfo.homeWorlds,
      capitalInfos: data.WarInfo.capitalInfos,
      planetPermanentEffects: data.WarInfo.planetPermanentEffects,
    },
    Status: {
      warId: data.Status.warId,
      time: data.Status.time,
      timeUtc: data.Status.timeUtc,
      impactMultiplier: data.Status.impactMultiplier,
      storyBeatId32: data.Status.storyBeatId32,
      planetAttacks: data.Status.planetAttacks,
      campaigns: data.Status.campaigns,
      communityTargets: data.Status.communityTargets,
      jointOperations: data.Status.jointOperations,
      planetEvents: data.Status.planetEvents,
      planetActiveEffects: data.Status.planetActiveEffects,
      activeElectionPolicyEffects: data.Status.activeElectionPolicyEffects,
      globalEvents: data.Status.globalEvents,
      superEarthWarResults: data.Status.superEarthWarResults,
    },
    Assignment: data.Assignment,
    NewsFeed: data.NewsFeed,
    PlanetStats: data.PlanetStats,
    Campaigns: data.Campaigns,
    PlanetEvents: data.PlanetEvents,
    ActivePlanets: data.ActivePlanets,
    PlanetAttacks: data.PlanetAttacks,
    Events: data.Events,
    Players: data.Players,
    UTCOffset: data.UTCOffset,
  };

  const existingData = await db.query.apiData.findFirst({
    where: eq(apiData.time, strippedData.Status.time),
  });

  if (existingData) {
    logger.info('Data already exists in database!', {type: 'info'});
    return;
  }

  await newApiData({
    time: strippedData.Status.time,
    warId: strippedData.WarInfo.warId,
    data: strippedData,
  });

  logger.info('Committing new API data to database!', {type: 'info'});
}
