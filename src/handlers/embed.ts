import {
  ColorResolvable,
  CommandInteraction,
  EmbedBuilder,
  ModalSubmitInteraction,
} from 'discord.js';
import {config} from '../config';
import {client} from '.';
import {
  Faction,
  MergedCampaignData,
  MergedPlanetEventData,
  getAllCampaigns,
  getAllPlayers,
  getCampaignByPlanetName,
} from '../api-wrapper';
import {FACTION_COLOUR} from '../commands/_components';

const {FOOTER_MESSAGE, EMBED_COLOUR} = config;

export function commandErrorEmbed(
  interaction: CommandInteraction | ModalSubmitInteraction
) {
  return {
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: client.user?.tag || '',
          iconURL: client.user?.avatarURL() || undefined,
        })
        .setTitle('Something Went Wrong )=')
        .setDescription(
          `There was an issue trying to execute \`/${
            interaction.isCommand()
              ? interaction.commandName
              : interaction.customId
          }\`! ` +
            'The issue has been logged and will be looked into. Feel free to try again shortly. ' +
            'If the problem persists, please let Major know'
        )
        .setFooter({text: FOOTER_MESSAGE})
        .setColor(EMBED_COLOUR as ColorResolvable)
        .setTimestamp(),
    ],
  };
}

export function missingChannelPerms(interaction: CommandInteraction) {
  return {
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.avatarURL() || undefined,
        })
        .setTitle('Permission Denied')
        .setDescription(
          'This command creates a public, persistent message. To avoid inconviencing other users, it requires moderator permissions. '
        )
        .setFooter({text: FOOTER_MESSAGE})
        .setColor(EMBED_COLOUR as ColorResolvable)
        .setTimestamp(),
    ],
  };
}

export function ownerCommandEmbed(interaction: CommandInteraction) {
  return {
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.avatarURL() || undefined,
        })
        .setTitle('Permission Denied')
        .setDescription('This command is only available to Owners!')
        .setFooter({text: FOOTER_MESSAGE})
        .setColor(EMBED_COLOUR as ColorResolvable)
        .setTimestamp(),
    ],
  };
}

export function adminCommandEmbed(interaction: CommandInteraction) {
  return {
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.avatarURL() || undefined,
        })
        .setTitle('Permission Denied')
        .setDescription('This command is only available to Admins!')
        .setFooter({text: FOOTER_MESSAGE})
        .setColor(EMBED_COLOUR as ColorResolvable)
        .setTimestamp(),
    ],
  };
}

export function warStatusEmbeds() {
  const campaigns = getAllCampaigns();
  const players = getAllPlayers();

  const status: Record<Faction, {name: string; value: string}[]> = {
    Terminids: [],
    Automaton: [],
    Humans: [],
    Total: [],
  };

  let playerDesc = '';
  for (const [key, val] of Object.entries(players)) {
    if (key === 'Total') continue;
    const perc = ((val / players.Total) * 100).toFixed(2);
    playerDesc += `${key}: ${val} (${perc}%)\n`;
  }
  playerDesc += `\nTotal: ${players.Total}`;

  for (const campaign of campaigns) {
    const {planetName, type, campaignType, planetData, planetEvent} = campaign;
    const title = `${planetName}: ${campaignType.toUpperCase()}`;

    if (campaignType === 'Liberation') {
      const {maxHealth, owner, health, players, liberation} = planetData;
      // status[owner] += `${planetName}: ${liberation}%\n`;
      const progressBar = drawLoadingBarPerc(liberation, 30);
      status[owner].push({name: title, value: progressBar});
    } else if (campaignType === 'Defend') {
      const {maxHealth, health, defence, race, startTime, expireTime} =
        planetEvent as MergedPlanetEventData;
      const {players} = planetData;
      // status[race] += `${planetName}: ${defence}%\n`;
      const progressBar = drawLoadingBarPerc(defence, 30);
      status[race].push({name: title, value: progressBar});
    }
  }
  const automatonEmbed = new EmbedBuilder()
    .setThumbnail(
      'https://cdn.discordapp.com/emojis/1215225136899170354.webp?size=128&quality=lossless'
    )
    .setColor(FACTION_COLOUR.Automaton)
    .setTitle('Automatons')
    .setDescription(
      `**${players.Automaton}** Helldivers are braving the automaton trenches!`
    )
    .addFields(status['Automaton']);

  const terminidEmbed = new EmbedBuilder()
    .setThumbnail(
      'https://cdn.discordapp.com/emojis/1215225138060984340.webp?size=128&quality=lossless'
    )
    .setColor(FACTION_COLOUR.Terminids)
    .setTitle('Terminids')
    .setDescription(
      `**${players.Terminids}** Helldivers are deployed to manage the terminid swarms!`
    )
    .addFields(status['Terminids']);

  const embeds = [automatonEmbed, terminidEmbed];

  return embeds;
}

export async function campaignEmbeds(planet_name?: string) {
  const campaigns: MergedCampaignData[] = planet_name
    ? [getCampaignByPlanetName(planet_name) as MergedCampaignData]
    : getAllCampaigns();

  const embeds = [];
  for (const campaign of campaigns) {
    const {planetName, type, campaignType, planetData, planetEvent} = campaign;
    const title = `${planetName}: ${campaignType.toUpperCase()}`;

    if (campaignType === 'Liberation') {
      const {
        maxHealth,
        initialOwner,
        owner,
        health,
        regenPerSecond,
        players,
        liberation,
        lossPercPerHour,
      } = planetData;

      const display = {
        Liberation: `${liberation}%`,
        Players: players,
        Progress: `${health} / ${maxHealth}`,
        'Loss Per Hour': `${lossPercPerHour}%`,
        // regenPerSecond,
        'Controlled By': owner,
        'Initial Owner': initialOwner,
      };
      let desc = '';
      for (const [key, val] of Object.entries(display)) {
        desc += `**${key[0].toUpperCase() + key.slice(1)}**: ${val}\n`;
      }

      embeds.push(
        new EmbedBuilder()
          .setTitle(title)
          .setDescription(desc)
          .setColor(FACTION_COLOUR[owner])
      );
    } else if (campaignType === 'Defend') {
      const {
        maxHealth,
        health,
        defence,
        eventType,
        race,
        startTime,
        expireTime,
      } = planetEvent as MergedPlanetEventData;
      const {players} = planetData;

      const display = {
        Defence: `${defence}%`,
        Players: players,
        Progress: `${health} / ${maxHealth}`,
        'Time Left': `${Math.floor((expireTime - Date.now()) / 1000)}s`,
        Faction: race,
      };
      let desc = '';
      for (const [key, val] of Object.entries(display)) {
        desc += `**${key[0].toUpperCase() + key.slice(1)}**: ${val}\n`;
      }
      embeds.push(
        new EmbedBuilder()
          .setTitle(title)
          .setDescription(desc)
          .setColor(FACTION_COLOUR[race])
      );
    }
  }
  embeds[embeds.length - 1].setFooter({text: FOOTER_MESSAGE}).setTimestamp();
  return embeds;
}

function drawLoadingBar(total: number, current: number, barLength: number) {
  const percentage = current / total;
  const progress = Math.round(barLength * percentage);
  const empty = barLength - progress;

  const progressBar = '[`' + '#'.repeat(progress) + ' '.repeat(empty) + '`]';
  const percentageText = (percentage * 100).toFixed(2) + '%';

  return progressBar + ' ' + percentageText;
}

function drawLoadingBarPerc(percentage: number, barLength: number) {
  const percMult = percentage / 100;
  const progress = Math.round(barLength * percMult);
  const empty = barLength - progress;

  const progressBar = '[`' + '#'.repeat(progress) + ' '.repeat(empty) + '`]';

  return `${progressBar} ${percentage.toFixed(2)}%`;
}
