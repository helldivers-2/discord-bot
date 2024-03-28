import {
  Faction,
  StrippedApiData,
  WarDifferences,
  data,
} from '../../api-wrapper';
import {isProd} from '../../config';
import {announcementChannels, db, eq, newPrevData, prevData} from '../../db';
import {logger} from '../logging';
import {and} from 'drizzle-orm';
import {writeFileSync} from 'fs';
import {
  lostPlanetUpdate,
  newCampaignUpdate,
  newEventUpdate,
  newNewsUpdate,
  wonPlanetUpdate,
} from '.';

export async function compareData(): Promise<WarDifferences | void> {
  const newData: StrippedApiData = {
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
  writeFileSync('strippedData.json', JSON.stringify(newData, null, 2));

  const oldDbData = await db.query.prevData.findFirst({
    where: eq(prevData.warId, newData.WarInfo.warId),
  });
  // if there isn't any old data, then this is the first time we're getting data for this war id
  if (!oldDbData) {
    await newPrevData({
      data: newData,
      time: newData.Status.time,
      warId: newData.WarInfo.warId,
      production: isProd,
      updatedAt: new Date(),
    });
    return;
  }

  // After fetching the old data, replace it with the new data
  await db
    .update(prevData)
    .set({
      data: newData,
      time: newData.Status.time,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(prevData.warId, newData.WarInfo.warId),
        eq(prevData.production, isProd)
      )
    );

  // Continue, compare the old and new data
  // NOTE: if testing, set this var to the old data
  const oldData: StrippedApiData = oldDbData.data;
  // const oldData: StrippedApiData = {};

  const differences: WarDifferences = {
    NewCampaigns: [],
    NewEvents: [],
    NewNewsFeed: [],
    NewMajorOrder: undefined,
    WonPlanets: [],
    LostPlanets: [],
    Players: {
      Humans: 0,
      Total: 0,
      Automaton: 0,
      Terminids: 0,
    },
  };

  const warAnnChannels = await db.query.announcementChannels.findMany({
    where: and(
      eq(announcementChannels.production, isProd),
      eq(announcementChannels.type, 'war_announcements')
    ),
  });
  const channelIds = warAnnChannels.map(c => c.channelId);

  // compare old api snapshot to the new one, check for changes
  // eg. new campaign, planet owner change, new event, new major order etc.
  // TODO: compare major order
  // check the list of old campaigns to see if it doesn't exist in the new data
  // if not, then we either lost or won a planet
  for (const campaign of oldData.Campaigns) {
    const {planetName} = campaign;
    const newCampaign = newData.Campaigns.find(
      c => c.planetName === planetName
    );

    if (!newCampaign) {
      logger.info(`Campaign on ${planetName} has ended`, {type: 'info'});
      const oldOwner = campaign.planetData.owner;
      const newOwner = data.Planets.find(p => p.name === planetName)?.owner;

      // if there is an old campaign, check if the owner has changed
      // if both the old and new owner are humans, then we won a defence
      if (oldOwner === 'Humans' && newOwner === 'Humans') {
        differences.WonPlanets.push({
          ...campaign,
        });
        logger.info(`Planet ${planetName} has been successfully defended`, {
          type: 'info',
        });
        wonPlanetUpdate(campaign, channelIds);
      }
      // if it changed, then we either liberated something, or failed to defend
      if (oldOwner !== newOwner) {
        if (newOwner === 'Humans') {
          // we won the campaign
          // eg. helldivers have successfully liberated <planet>!
          differences.WonPlanets.push({
            ...campaign,
          });
          logger.info(`Planet ${planetName} has been successfully LIBERATED`, {
            type: 'info',
          });
          wonPlanetUpdate(campaign, channelIds);
        } else if (oldOwner === 'Humans') {
          // we lost the campaign (probably a defend planet)
          // eg. helldivers were not able to defend <planet>!
          differences.LostPlanets.push({
            ...campaign,
          });
          logger.info(`Planet ${planetName} DEFENCE has failed`, {
            type: 'info',
          });
          lostPlanetUpdate(campaign, channelIds);
        }
      }
    }
  }
  // compare old and new campaigns
  for (const campaign of newData.Campaigns) {
    const {planetName} = campaign;
    const oldCampaign = oldData.Campaigns.find(
      c => c.planetName === planetName
    );
    if (!oldCampaign) {
      differences.NewCampaigns.push(campaign);
      // if there isn't an old campaign, then this is a new campaign
      logger.info(`New campaign on ${planetName}`, {type: 'info'});
      newCampaignUpdate(campaign, channelIds);
    }
  }
  // compare news feeds
  for (const item of newData.NewsFeed) {
    const oldItem = oldData.NewsFeed.find(i => i.id === item.id);
    if (!oldItem) {
      differences.NewNewsFeed.push(item);
      logger.info(`New news feed: ${item.message}`, {type: 'info'});
      newNewsUpdate(item, channelIds);
    }
  }
  // compare old and new events
  for (const event of newData.Events) {
    const oldEvent = oldData.Events.find(e => e.eventId === event.eventId);
    if (!oldEvent) {
      differences.NewEvents.push(event);
      logger.info(`New event: ${event.title}`, {type: 'info'});
      newEventUpdate(event, channelIds);
    }
  }
  // compare old and new player counts
  for (const f in newData.Players) {
    const faction = f as Faction;
    if (Object.prototype.hasOwnProperty.call(newData.Players, faction)) {
      const oldCount = oldData.Players[faction];
      const newCount = newData.Players[faction];
      if (oldCount !== newCount) {
        differences.Players[faction] = newCount - oldCount;
        // TODO: do this separately? way too spammy to check every 10s
      }
    }
  }
  writeFileSync('differences.json', JSON.stringify(differences, null, 2));
  return differences;
}
