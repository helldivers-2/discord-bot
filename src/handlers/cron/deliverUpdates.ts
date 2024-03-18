import {ChannelType, EmbedBuilder} from 'discord.js';
import {
  getPopularCampaign,
  Faction,
  MergedCampaignData,
  GlobalEvent,
  Assignment,
  NewsFeedItem,
} from '../../api-wrapper';
import {FACTION_COLOUR} from '../../commands/_components';
import {config, helldiversConfig} from '../../config';
import {planetNameTransform} from '../custom';
import {validateChannelArr} from '../discord';
import {majorOrderEmbed} from '../embed';
import {logger} from '../logging';

const {SUBSCRIBE_FOOTER} = config;
const {factionSprites, altSprites} = helldiversConfig;

export async function newCampaignUpdate(
  campaign: MergedCampaignData,
  channelIds: string[]
) {
  const channels = await validateChannelArr(channelIds);

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
      .setColor(FACTION_COLOUR[race])
      .setFooter({text: SUBSCRIBE_FOOTER}),
  ];
  // send new updates to subscribed channels
  const promises: Promise<any>[] = [];
  for (const channel of channels) {
    // TODO: fix issue where bot can see channel exists (is in the server), but cannot send messages. discord err 50001 Missing Access
    try {
      const message = await channel.send({embeds});
      if (channel.type === ChannelType.GuildAnnouncement) message.crosspost();
    } catch (err) {
      logger.error(err);
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
  const verb = campaignType === 'Liberation' ? 'liberated' : 'defended';
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
      .setColor(FACTION_COLOUR['Humans'])
      .setFooter({text: SUBSCRIBE_FOOTER}),
  ];
  // send new updates to subscribed channels
  const promises: Promise<any>[] = [];
  for (const channel of channels) {
    try {
      const message = await channel.send({embeds});
      if (channel.type === ChannelType.GuildAnnouncement) message.crosspost();
    } catch (err) {
      logger.error(err);
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
  const promises: Promise<any>[] = [];
  for (const channel of channels) {
    try {
      const message = await channel.send({embeds});
      if (channel.type === ChannelType.GuildAnnouncement) message.crosspost();
    } catch (err) {
      logger.error(err);
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
  if (event.title) eventEmbed.setTitle(event.title);
  if (event.message) eventEmbed.setDescription(event.message);

  // send new updates to subscribed channels
  const promises: Promise<any>[] = [];
  for (const channel of channels) {
    try {
      const message = await channel.send({embeds: [eventEmbed]});
      if (channel.type === ChannelType.GuildAnnouncement) message.crosspost();
    } catch (err) {
      logger.error(err);
    }
  }
  await Promise.all(promises);
  return;
}
// TODO: use new endpoint to get this
// export async function newMajorOrdeUpdater(order: ??, channels: (TextChannel | PublicThreadChannel)[]) {}
export async function newMajorOrderUpdate(
  assignment: Assignment,
  channelIds: string[]
) {
  const channels = await validateChannelArr(channelIds);

  const embeds = [majorOrderEmbed(assignment)];

  // send new updates to subscribed channels
  const promises: Promise<any>[] = [];
  for (const channel of channels) {
    try {
      const message = await channel.send({embeds});
      if (channel.type === ChannelType.GuildAnnouncement) message.crosspost();
    } catch (err) {
      logger.error(err);
    }
  }
  await Promise.all(promises);
  return;
}

export async function newNewsUpdate(news: NewsFeedItem, channelIds: string[]) {
  const channels = await validateChannelArr(channelIds);
  const {message} = news;
  const embeds = message.includes('\n')
    ? [
        new EmbedBuilder()
          .setAuthor({
            name: 'New Dispatch from SE Command!',
            iconURL: altSprites['Humans'],
          })
          .setTitle(message.split('\n')[0])
          .setDescription(message.split('\n').slice(1).join('\n'))
          .setFooter({text: SUBSCRIBE_FOOTER})
          .setTimestamp(),
      ]
    : [
        new EmbedBuilder()
          .setAuthor({
            name: 'New Dispatch from SE Command!',
            iconURL: altSprites['Humans'],
          })
          .setDescription(news.message)
          .setFooter({text: SUBSCRIBE_FOOTER})
          .setTimestamp(),
      ];

  for (const channel of channels) {
    try {
      const message = await channel.send({embeds});
      if (channel.type === ChannelType.GuildAnnouncement) message.crosspost();
    } catch (err) {
      logger.error(err);
    }
  }
}
