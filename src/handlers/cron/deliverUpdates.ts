import {ChannelType, EmbedBuilder} from 'discord.js';
import {
  getPopularCampaign,
  Faction,
  MergedCampaignData,
  GlobalEvent,
  Assignment,
  NewsFeedItem,
  data,
} from '../../api-wrapper';
import {FACTION_COLOUR} from '../../commands/_components';
import {config, helldiversConfig, isProd} from '../../config';
import {planetNameTransform} from '../custom';
import {validateChannelArr} from '../discord';
import {majorOrderEmbed} from '../embed';
import {logger} from '../logging';
import {announcementChannels, db} from '../../db';
import {and, eq} from 'drizzle-orm';

const {SUBSCRIBE_FOOTER} = config;
const {factionSprites, altSprites} = helldiversConfig;

export async function newCampaignUpdate(
  campaign: MergedCampaignData,
  channelIds: string[]
) {
  const channels = await validateChannelArr(channelIds);

  const {planetName, campaignType} = campaign;
  const typeDisplay =
    campaignType === 'Liberation'
      ? 'Liberate'
      : campaignType === 'Invasion'
        ? 'Repel'
        : 'Defend';
  const verb =
    campaignType === 'Liberation'
      ? 'liberation'
      : campaignType === 'Invasion'
        ? 'protective'
        : 'defensive';
  const race =
    campaignType === 'Liberation'
      ? campaign.planetData.owner
      : (campaign.planetEvent?.race as string);
  const displayRace = race === 'Automaton' ? 'Automatons' : race;
  const planetThumbnailUrl = `https://helldiverscompanionimagescdn.b-cdn.net/planet-images/${planetNameTransform(
    planetName
  )}.png`;
  let description =
    `A new campaign has started on **${planetName}**! ` +
    `Helldivers are requested to assist in ${verb} efforts against the ${displayRace}!`;
  if (campaignType === 'Defend' && campaign.planetEvent) {
    const {expireTime} = campaign.planetEvent;
    const expiresInS = expireTime - data.Status.time;
    const expireTimeUtc = Math.floor(Date.now() + expiresInS * 1000);
    const expiresInUtcS = Math.floor(expireTimeUtc / 1000);

    description += `\n\n**Defence Ends**: <t:${expiresInUtcS}:R>`;
  } else if (campaignType === 'Invasion' && campaign.planetEvent) {
    const {expireTime} = campaign.planetEvent;
    const expiresInS = expireTime - data.Status.time;
    const expireTimeUtc = Math.floor(Date.now() + expiresInS * 1000);
    const expiresInUtcS = Math.floor(expireTimeUtc / 1000);

    description += `\n\n**Invasion Ends**: <t:${expiresInUtcS}:R>`;
  }
  const embeds = [
    new EmbedBuilder()
      .setAuthor({name: 'Helldivers Needed!'})
      .setThumbnail(factionSprites[race as Faction])
      .setTitle(`${typeDisplay} ${campaign.planetName}`)
      .setDescription(description)
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
      .setColor(FACTION_COLOUR[race])
      .setFooter({text: SUBSCRIBE_FOOTER}),
  ];
  // send new updates to subscribed channels
  const promises: Promise<never>[] = [];
  for (const channel of channels) {
    // TODO: fix issue where bot can see channel exists (is in the server), but cannot send messages. discord err 50001 Missing Access
    try {
      const message = await channel.send({embeds});
      if (channel.type === ChannelType.GuildAnnouncement) message.crosspost();
    } catch (err) {
      logger.info(err);
      await db
        .delete(announcementChannels)
        .where(
          and(
            eq(announcementChannels.production, isProd),
            eq(announcementChannels.channelId, channel.id)
          )
        )
        .catch(err => logger.error(err));
    }
  }
  await Promise.all(promises);
  return;
}

export async function wonPlanetUpdate(
  campaign: MergedCampaignData,
  channelIds: string[]
) {
  const channels = await validateChannelArr(channelIds);

  const {planetName, campaignType, planetData} = campaign;
  const {players} = planetData;

  const planetThumbnailUrl = `https://helldiverscompanionimagescdn.b-cdn.net/planet-images/${planetNameTransform(
    planetName
  )}.png`;
  const verb =
    campaignType === 'Liberation'
      ? 'liberated'
      : campaignType === 'Invasion'
        ? 'protected'
        : 'defended';
  const race =
    campaignType === 'Liberation'
      ? campaign.planetData.owner
      : (campaign.planetEvent?.race as string);
  const displayRace = race === 'Automaton' ? 'Automatons' : race;

  const mostPlayers = getPopularCampaign();
  const nextPlanetName = mostPlayers.planetName;
  const nextPlanetPlayers = mostPlayers.planetData.players;
  const nextPlanetRace =
    mostPlayers.campaignType === 'Liberation'
      ? mostPlayers.planetData.owner
      : (mostPlayers.planetEvent?.race as string);
  const nextPlanetRaceDisplay =
    nextPlanetRace === 'Automaton' ? 'Automatons' : nextPlanetRace;

  const embeds = [
    new EmbedBuilder()
      .setTitle(`${planetName}: V I C T O R Y !`)
      .setThumbnail(factionSprites['Humans'])
      .setDescription(
        `Helldivers have successfully ${verb} **${planetName}** from the ${displayRace}! Super Earth thanks you for your service.` +
          `\n\nRemaining **${players.toLocaleString()}** troops are to direct their efforts elsewhere.`
      )
      // .addFields(
      //   {
      //     name: '[SUGGESTION]',
      //     value: nextPlanetName,
      //     inline: true,
      //   },
      //   {
      //     name: 'Helldiver Forces',
      //     value: nextPlanetPlayers.toLocaleString(),
      //     inline: true,
      //   },
      //   {
      //     name: 'Faction',
      //     value: nextPlanetRaceDisplay,
      //     inline: true,
      //   }
      // )
      .setImage(planetThumbnailUrl)
      .setColor(FACTION_COLOUR['Humans'])
      .setFooter({text: SUBSCRIBE_FOOTER}),
  ];
  // send new updates to subscribed channels
  const promises: Promise<never>[] = [];
  for (const channel of channels) {
    try {
      const message = await channel.send({embeds});
      if (channel.type === ChannelType.GuildAnnouncement) message.crosspost();
    } catch (err) {
      logger.info(err);
      await db
        .delete(announcementChannels)
        .where(
          and(
            eq(announcementChannels.production, isProd),
            eq(announcementChannels.channelId, channel.id)
          )
        )
        .catch(err => logger.error(err));
    }
  }

  await Promise.all(promises);
  return;
}

export async function lostPlanetUpdate(
  campaign: MergedCampaignData,
  channelIds: string[]
) {
  const channels = await validateChannelArr(channelIds);

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

  const mostPlayers = getPopularCampaign();
  const nextPlanetName = mostPlayers.planetName;
  const nextPlanetPlayers = mostPlayers.planetData.players;
  const nextPlanetRace =
    mostPlayers.campaignType === 'Liberation'
      ? mostPlayers.planetData.owner
      : (mostPlayers.planetEvent?.race as string);
  const nextPlanetRaceDisplay =
    nextPlanetRace === 'Automaton' ? 'Automatons' : nextPlanetRace;

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
      .setColor(FACTION_COLOUR[race])
      .setFooter({text: SUBSCRIBE_FOOTER}),
  ];
  // send new updates to subscribed channels
  const promises: Promise<never>[] = [];
  for (const channel of channels) {
    try {
      const message = await channel.send({embeds});
      if (channel.type === ChannelType.GuildAnnouncement) message.crosspost();
    } catch (err) {
      logger.info(err);
      await db
        .delete(announcementChannels)
        .where(
          and(
            eq(announcementChannels.production, isProd),
            eq(announcementChannels.channelId, channel.id)
          )
        )
        .catch(err => logger.error(err));
    }
  }
  await Promise.all(promises);
  return;
}

export async function lostDefenceUpdate(
  campaign: MergedCampaignData,
  channelIds: string[]
) {
  const channels = await validateChannelArr(channelIds);

  const {planetName, campaignType, planetData} = campaign;
  const {players} = planetData;

  const planetThumbnailUrl = `https://helldiverscompanionimagescdn.b-cdn.net/planet-images/${planetNameTransform(
    planetName
  )}.png`;
  const race = campaign.planetEvent!.race;
  const displayRace = race.endsWith('s') ? race.slice(0, -1) : race;

  const embeds = [
    new EmbedBuilder()
      .setTitle(`${planetName}: Defeat.`)
      .setThumbnail(factionSprites[race as Faction])
      .setDescription(
        `${displayRace} combatants have prevailed on **${planetName}**. ` +
          `Occupying Super Earth forces have been forced to retreat with Helldivers failing ${campaignType.toLowerCase()} efforts.` +
          `\n\n**${players.toLocaleString()}** Helldivers are to focus on liberating the fallen planet.`
      )
      .addFields(
        {
          name: '[SUGGESTION]',
          value: planetName,
          inline: true,
        },
        {
          name: 'Helldiver Forces',
          value: players.toLocaleString(),
          inline: true,
        },
        {
          name: 'Faction',
          value: displayRace,
          inline: true,
        }
      )
      .setImage(planetThumbnailUrl)
      .setColor(FACTION_COLOUR[race])
      .setFooter({text: SUBSCRIBE_FOOTER}),
  ];
  // send new updates to subscribed channels
  const promises: Promise<never>[] = [];
  for (const channel of channels) {
    try {
      const message = await channel.send({embeds});
      if (channel.type === ChannelType.GuildAnnouncement) message.crosspost();
    } catch (err) {
      logger.info(err);
      await db
        .delete(announcementChannels)
        .where(
          and(
            eq(announcementChannels.production, isProd),
            eq(announcementChannels.channelId, channel.id)
          )
        )
        .catch(err => logger.error(err));
    }
  }
  await Promise.all(promises);
  return;
}

export async function newEventUpdate(event: GlobalEvent, channelIds: string[]) {
  const channels = await validateChannelArr(channelIds);

  const eventEmbed = new EmbedBuilder()
    .setThumbnail(factionSprites['Humans'])
    .setColor(FACTION_COLOUR.Humans)
    .setAuthor({
      name: 'New Dispatch from SE Command',
      iconURL: altSprites['Humans'],
    })
    .setFooter({text: SUBSCRIBE_FOOTER});
  if (event.title)
    eventEmbed.setTitle(
      event.title.replace(/<i=\d>/g, '**').replace(/<\/i>/g, '**')
    );
  if (event.message)
    eventEmbed.setDescription(
      event.message.replace(/<i=\d>/g, '**').replace(/<\/i>/g, '**')
    );

  // send new updates to subscribed channels
  const promises: Promise<any>[] = [];
  for (const channel of channels) {
    try {
      const message = await channel.send({embeds: [eventEmbed]});
      if (channel.type === ChannelType.GuildAnnouncement) message.crosspost();
    } catch (err) {
      logger.info(err);
      await db
        .delete(announcementChannels)
        .where(
          and(
            eq(announcementChannels.production, isProd),
            eq(announcementChannels.channelId, channel.id)
          )
        )
        .catch(err => logger.error(err));
    }
  }
  await Promise.all(promises);
  return;
}
export async function newMajorOrderUpdate(
  assignment: Assignment,
  channelIds: string[]
) {
  const channels = await validateChannelArr(channelIds);

  const embeds = [majorOrderEmbed(assignment)];

  // send new updates to subscribed channels
  const promises: Promise<never>[] = [];
  for (const channel of channels) {
    try {
      const message = await channel.send({embeds});
      if (channel.type === ChannelType.GuildAnnouncement) message.crosspost();
    } catch (err) {
      logger.info(err);
      await db
        .delete(announcementChannels)
        .where(eq(announcementChannels.channelId, channel.id))
        .catch(err => logger.error(err));
    }
  }
  await Promise.all(promises);
  return;
}

export async function newNewsUpdate(news: NewsFeedItem, channelIds: string[]) {
  const channels = await validateChannelArr(channelIds);
  const {message} = news;
  const splitMessage = message.split('\n');
  // check whether the dispatch reasonably has a title (short string before newline)
  const title = splitMessage[0].length < 256 ? splitMessage[0] : undefined;
  const embeds: EmbedBuilder[] = [];

  // if it does have a title, parse it and include it as an embed title
  if (title)
    embeds.push(
      new EmbedBuilder()
        .setAuthor({
          name: 'New Dispatch from SE Command!',
          iconURL: altSprites['Humans'],
        })
        .setTitle(
          message
            .split('\n')[0]
            .replace(/<i=\d>/g, '**')
            .replace(/<\/i>/g, '**')
        )
        .setDescription(
          message
            .split('\n')
            .slice(1)
            .join('\n')
            .replace(/<i=\d>/g, '**')
            .replace(/<\/i>/g, '**')
        )
        .setFooter({text: SUBSCRIBE_FOOTER})
        .setTimestamp()
    );
  // otherwise, no title, just description
  else
    embeds.push(
      new EmbedBuilder()
        .setAuthor({
          name: 'New Dispatch from SE Command!',
          iconURL: altSprites['Humans'],
        })
        .setDescription(
          news.message.replace(/<i=\d>/g, '**').replace(/<\/i>/g, '**')
        )
        .setFooter({text: SUBSCRIBE_FOOTER})
        .setTimestamp()
    );

  for (const channel of channels) {
    try {
      const message = await channel.send({embeds});
      if (channel.type === ChannelType.GuildAnnouncement)
        await message.crosspost();
    } catch (err) {
      logger.info(err);
      await db
        .delete(announcementChannels)
        .where(eq(announcementChannels.channelId, channel.id))
        .catch(err => logger.error(err));
    }
  }
}
