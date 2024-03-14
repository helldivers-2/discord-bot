import {
  ChannelType,
  DiscordAPIError,
  EmbedBuilder,
  PublicThreadChannel,
  TextChannel,
} from 'discord.js';
import {
  Faction,
  StrippedApiData,
  WarDifferences,
  data,
  getPopularCampaign,
} from '../../api-wrapper';
import {helldiversConfig, isProd} from '../../config';
import {announcementChannels, db, eq, newPrevData, prevData} from '../../db';
import {logger} from '../logging';
import {client} from '../client';
import {planetNameTransform} from '../custom';
import {FACTION_COLOUR} from '../../commands/_components';
import {and} from 'drizzle-orm';
import {writeFileSync} from 'fs';

const {factionSprites, altSprites} = helldiversConfig;

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
    Campaigns: data.Campaigns,
    PlanetEvents: data.PlanetEvents,
    ActivePlanets: data.ActivePlanets,
    PlanetAttacks: data.PlanetAttacks,
    Events: data.Events,
    Players: data.Players,
    UTCOffset: data.UTCOffset,
  };
  const oldDbData = await db.query.prevData.findFirst({
    where: eq(prevData.warId, newData.WarInfo.warId),
  });
  // if there isn't any old data, then this is the first time we're getting data for this war id
  if (!oldDbData) {
    await newPrevData({
      data: newData,
      time: newData.Status.time,
      warId: newData.WarInfo.warId,
      updatedAt: new Date(),
    });
    return;
  }

  await db
    .update(prevData)
    .set({
      data: newData,
      time: newData.Status.time,
      updatedAt: new Date(),
    })
    .where(eq(prevData.warId, newData.WarInfo.warId));

  const oldData = oldDbData.data;

  const differences: WarDifferences = {
    NewCampaigns: [],
    NewEvents: [],
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

  // compare old api snapshot to the new one, check for changes
  // eg. new campaign, planet owner change, new event, new major order etc.
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
    } else {
      const oldOwner = oldCampaign.planetData.owner;
      const newOwner = campaign.planetData.owner;
      // if there is an old campaign, check if the owner has changed
      // if both the old and new owner are humans, then we won a defence
      if (oldOwner === 'Humans' && newOwner === 'Humans') {
        differences.WonPlanets.push({
          ...campaign,
        });
      }
      // if it changed, then we either liberated something, or failed to defend
      if (oldOwner !== newOwner) {
        if (newOwner === 'Humans') {
          // we won the campaign
          // eg. helldivers have successfully liberated <planet>!
          differences.WonPlanets.push({
            ...campaign,
          });
        } else if (oldOwner === 'Humans') {
          // we lost the campaign (probably a defend planet)
          // eg. helldivers were not able to defend <planet>!
          differences.LostPlanets.push({
            ...campaign,
          });
        }
        logger.info(
          `Planet ${planetName} has changed owner from ${oldCampaign.planetData.owner} to ${campaign.planetData.owner}`,
          {type: 'info'}
        );
      }
    }
  }
  // compare old and new events
  for (const event of newData.Events) {
    const oldEvent = oldData.Events.find(e => e.eventId === event.eventId);
    if (!oldEvent) {
      if (event.flag === 0) differences.NewMajorOrder = event;
      differences.NewEvents.push(event);
      logger.info(`New event: ${event.title}`, {type: 'info'});
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

export async function deliverUpdates(differences: WarDifferences) {
  const {
    LostPlanets,
    NewCampaigns,
    NewEvents,
    NewMajorOrder,
    Players,
    WonPlanets,
  } = differences;
  if (
    LostPlanets.length === 0 &&
    NewCampaigns.length === 0 &&
    NewEvents.length === 0 &&
    !NewMajorOrder &&
    WonPlanets.length === 0
  )
    return;

  const start = Date.now();
  const promises: Promise<any>[] = [];
  const updates =
    LostPlanets.length +
    NewCampaigns.length +
    NewEvents.length +
    (NewMajorOrder ? 1 : 0) +
    WonPlanets.length;

  const warAnnChannels = await db.query.announcementChannels.findMany({
    where: and(
      eq(announcementChannels.production, isProd),
      eq(announcementChannels.type, 'war_announcements')
    ),
  });
  const channels: (TextChannel | PublicThreadChannel)[] = [];
  for (const c of warAnnChannels) {
    const {channelId} = c;
    const channel = await client.channels.fetch(channelId);
    if (!channel) continue;
    if (
      channel.type === ChannelType.GuildText ||
      channel.type === ChannelType.PublicThread
    )
      channels.push(channel as TextChannel | PublicThreadChannel);
  }

  const mostPlayers = getPopularCampaign();
  const nextPlanetName = mostPlayers.planetName;
  const nextPlanetPlayers = mostPlayers.planetData.players;
  const nextPlanetRace =
    mostPlayers.campaignType === 'Liberation'
      ? mostPlayers.planetData.owner
      : (mostPlayers.planetEvent?.race as string);
  const nextPlanetRaceDisplay =
    nextPlanetRace === 'Automaton' ? 'Automatons' : nextPlanetRace;

  for (const campaign of NewCampaigns) {
    const {planetName, campaignType} = campaign;
    const typeDisplay = campaignType === 'Liberation' ? 'Liberate' : 'Defend';
    const race =
      campaignType === 'Liberation'
        ? campaign.planetData.owner
        : (campaign.planetEvent?.race as string);
    const displayRace = race === 'Automaton' ? 'Automatons' : race;
    const planetThumbnailUrl = `https://helldiverscompanionimagescdn.b-cdn.net/planet-images/${planetNameTransform(
      planetName
    )}.png`;
    const embeds = [
      new EmbedBuilder()
        .setAuthor({name: 'Helldivers Needed!'})
        .setThumbnail(factionSprites[race as Faction])
        .setTitle(`${typeDisplay} ${campaign.planetName}`)
        .setDescription(
          `A new campaign has started on **${planetName}**! ` +
            `Helldivers are requested to assist in ${campaignType.toLowerCase()} efforts against the ${displayRace}!`
        )
        .addFields(
          {
            name: 'Faction',
            value: displayRace,
            inline: true,
          },
          {
            name: 'Directive',
            value: typeDisplay,
            inline: true,
          }
        )
        .setImage(planetThumbnailUrl)
        .setColor(FACTION_COLOUR[race]),
    ];
    // send new campaign updates
    for (const channel of channels) promises.push(channel.send({embeds}));
  }
  for (const event of NewEvents) {
    const eventEmbed = new EmbedBuilder()
      .setThumbnail(factionSprites['Humans'])
      .setColor(FACTION_COLOUR.Humans)
      .setAuthor({
        name: 'New Dispatch from SE Command',
        iconURL: altSprites['Humans'],
      });
    if (event.title) eventEmbed.setTitle(event.title);
    if (event.message) eventEmbed.setDescription(event.message);
    for (const channel of channels)
      promises.push(channel.send({embeds: [eventEmbed]}));
  }
  for (const campaign of WonPlanets) {
    // send won planet updates
    const {planetName, campaignType, planetData} = campaign;
    const {players} = planetData;
    const planetThumbnailUrl = `https://helldiverscompanionimagescdn.b-cdn.net/planet-images/${planetNameTransform(
      planetName
    )}.png`;
    const verb = campaignType === 'Liberation' ? 'liberated' : 'defended';
    const race =
      campaignType === 'Liberation'
        ? campaign.planetData.owner
        : (campaign.planetEvent?.race as string);
    const displayRace = race === 'Automaton' ? 'Automatons' : race;
    const embeds = [
      new EmbedBuilder()
        .setTitle(`${planetName}: V I C T O R Y !`)
        .setThumbnail(factionSprites['Humans'])
        .setDescription(
          `Helldivers have successfully ${verb} **${planetName}** from the ${displayRace}! Super Earth thanks you for your service.` +
            `\n\nRemaining **${players.toLocaleString()}** troops are to direct their efforts elsewhere.`
        )
        .addFields(
          {
            name: '[SUGGESTION]',
            value: nextPlanetName,
            inline: true,
          },
          {
            name: 'Helldiver Forces',
            value: nextPlanetPlayers.toLocaleString(),
            inline: true,
          },
          {
            name: 'Faction',
            value: nextPlanetRaceDisplay,
            inline: true,
          }
        )
        .setImage(planetThumbnailUrl)
        .setColor(FACTION_COLOUR['Humans']),
    ];
    for (const channel of channels) promises.push(channel.send({embeds}));
  }
  for (const campaign of LostPlanets) {
    // send won planet updates
    const {planetName, campaignType, planetData} = campaign;
    const {players} = planetData;
    const planetThumbnailUrl = `https://helldiverscompanionimagescdn.b-cdn.net/planet-images/${planetNameTransform(
      planetName
    )}.png`;
    const race =
      campaignType === 'Liberation'
        ? campaign.planetData.owner
        : (campaign.planetEvent?.race as string);
    const displayRace = race.endsWith('s') ? race.slice(0, -1) : race;
    const embeds = [
      new EmbedBuilder()
        .setTitle(`${planetName}: Defeat.`)
        .setThumbnail(factionSprites[race as Faction])
        .setDescription(
          `${displayRace} combatants have prevailed on **${planetName}**. ` +
            `Helldiver forces have been forced to retreat, failing ${campaignType.toLowerCase()} efforts. Better luck out there next time, soldiers.` +
            `\n\n**${players.toLocaleString()}** Helldivers are to evacuate immediately, re-engaging on another front.`
        )
        .addFields(
          {
            name: '[SUGGESTION]',
            value: nextPlanetName,
            inline: true,
          },
          {
            name: 'Helldiver Forces',
            value: nextPlanetPlayers.toLocaleString(),
            inline: true,
          },
          {
            name: 'Faction',
            value: nextPlanetRaceDisplay,
            inline: true,
          }
        )
        .setImage(planetThumbnailUrl)
        .setColor(FACTION_COLOUR[race]),
    ];
    for (const channel of channels) promises.push(channel.send({embeds}));
  }
  for (const order in NewMajorOrder) {
    // send major order updates
  }

  await Promise.all(promises);
  const time = `${Date.now() - start}ms`;
  logger.info(
    `Delivered ${updates} updates to ${channels.length} channels messages in ${time}`,
    {
      type: 'info',
    }
  );
}
