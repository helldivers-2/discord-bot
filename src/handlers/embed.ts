import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ColorResolvable,
  CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import {config, helldiversConfig} from '../config';
import {client, emojis, formatPlayers, planetBiomeTransform} from '.';
import {
  ApiData,
  Assignment,
  data,
  Faction,
  getAllCampaigns,
  getAllPlayers,
  getCampaignByPlanetName,
  getFactionName,
  getItemName,
  getLatestAssignment,
  getPlanetByIndex,
  getPlanetByName,
  getPlanetName,
  MappedTask,
  MergedPlanetData,
  MergedPlanetEventData,
  Warbond,
} from '../api-wrapper';
import {FACTION_COLOUR} from '../commands/_components';
import {apiData, db} from '../db';
import {asc, gt} from 'drizzle-orm';

const {
  SUBSCRIBE_FOOTER,
  FOOTER_MESSAGE,
  EMBED_COLOUR,
  DISCORD_INVITE,
  HD_COMPANION_LINK,
  KOFI_LINK,
} = config;
const {factionSprites, altSprites} = helldiversConfig;

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

const taskTypeMappings = {
  3: 'Eradicate',
  11: 'Liberation',
  12: 'Defense',
  13: 'Control',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const valueTypeMappings = {
  1: 'race',
  3: 'goal',
  11: 'liberate',
  12: 'planet_index',
};

export function majorOrderEmbed(assignment: Assignment) {
  const {expiresIn, progress, setting} = assignment;
  const {overrideTitle, overrideBrief, taskDescription, tasks, reward} =
    setting;

  const expiresInUtcS = Math.floor((Date.now() + expiresIn * 1000) / 1000);
  const expiresInDays = Math.floor(expiresIn / 86400);
  const expiresInHours = Math.floor((expiresIn % 86400) / 3600);

  const campaigns = getAllCampaigns();

  const embedTitle = overrideTitle || 'Major Order';
  const embedDescription = overrideBrief || 'No briefing provided.';
  const embedTaskDescription =
    taskDescription || 'No task description provided.';
  const embedFields: {name: string; value: string; inline?: boolean}[] = [];

  embedFields.push(
    {
      name: 'Objective',
      value: embedTaskDescription,
      inline: false,
    },
    {
      name: 'Expires In',
      value: `<t:${expiresInUtcS}:R> (${expiresInDays}d ${expiresInHours}h)`,
      inline: true,
    }
  );
  // TODO: task progress here
  if (reward)
    embedFields.push({
      name: 'Reward',
      value:
        `${reward.amount}x ` +
        (reward.type === 1
          ? '<:warbond_medal:1231439956640010261>'
          : reward.type.toString()),
      inline: true,
    });

  const mappedTasks: MappedTask[] = [];
  for (const [taskIndex, task] of tasks.entries()) {
    const {type, values, valueTypes} = task;
    // skip loop execution if task type not mapped
    if (!(type in taskTypeMappings)) continue;

    const mappedTask: MappedTask = {
      type: type,
      name: taskTypeMappings[type as keyof typeof taskTypeMappings],
      goal: -1,
      progress: -1,
      values: values,
      valueTypes: valueTypes,
    };
    for (const [valueIndex, valueType] of valueTypes.entries()) {
      // 1: 'race',
      // 3: 'goal',
      // 11: 'liberate',
      // 12: 'planet_index',
      if (valueType === 1) mappedTask.race = getFactionName(values[valueIndex]);
      if (valueType === 3) mappedTask.goal = values[valueIndex];
      if (valueType === 3) mappedTask.progress = progress[taskIndex];
      if (valueType === 11) mappedTask.liberate = values[valueIndex] === 1;
      if (valueType === 12) mappedTask.planetIndex = values[valueIndex];
    }
    mappedTasks.push(mappedTask);
  }

  for (const task of mappedTasks) {
    const {type, name, race, goal, progress, planetIndex} = task;
    const percent = ((progress / goal) * 100).toFixed(2);
    if (type === 3) {
      embedFields.push({
        name: `${name} ${race}`,
        value: `${progress.toLocaleString()} / ${goal.toLocaleString()} (${percent}%)`,
        inline: true,
      });
    } else if (type === 11 || type === 13) {
      const campaign = campaigns.find(c => c.planetIndex === planetIndex);
      const campaignProgress =
        campaign?.campaignType === 'Defend'
          ? campaign?.planetEvent?.defence ?? 0
          : campaign?.planetData.liberation ?? 0;
      let text = '';
      if (campaign)
        text = `**${campaign.campaignType}**: ${campaignProgress.toFixed(2)}%`;
      else text = '**COMPLETE**';
      embedFields.push({
        name: planetIndex ? getPlanetName(planetIndex) : 'Unknown Planet',
        value: text,
        inline: true,
      });
    } else if (type === 12) {
      embedFields.push({
        name: `Defend ${goal} Planets`,
        value: `${progress} / ${goal} (${percent}%)`,
        inline: true,
      });
    }
  }

  return new EmbedBuilder()
    .setThumbnail(factionSprites['Humans'])
    .setColor(FACTION_COLOUR.Humans)
    .setAuthor({
      name: 'Super Earth Command Dispatch',
      iconURL: altSprites['Humans'],
    })
    .setTitle(embedTitle)
    .setDescription(embedDescription)
    .setFields(embedFields)
    .setFooter({text: SUBSCRIBE_FOOTER});
}

export async function warStatusEmbeds() {
  const campaigns = getAllCampaigns();
  const players = getAllPlayers();
  const majorOrder = getLatestAssignment();

  const status: Record<Faction, {name: string; value: string}[]> = {
    Terminids: [],
    Automaton: [],
    Humans: [],
    Illuminate: [],
    Total: [],
  };
  const statusShortened: Record<Faction, string> = {
    Terminids: '',
    Automaton: '',
    Humans: '',
    Illuminate: '',
    Total: '',
  };

  const diverEmoji = client.emojis.cache.find(
    emoji => emoji.name === 'helldiver_icon_s092'
  );

  const timeCheck = 3 * 60 * 60 * 1000; // 6 hours in milliseconds
  const timestamp = new Date(Date.now() - timeCheck);
  // fetch the first API data entry that is older than 6 hours
  const pastApiData = await db.query.apiData.findMany({
    where: gt(apiData.createdAt, timestamp),
    orderBy: asc(apiData.createdAt),
  });
  for (const campaign of campaigns) {
    const oldData = pastApiData.find(d =>
      d.data.Campaigns.some(c => c.id === campaign.id)
    );

    let averageChangeStr = '';
    if (oldData) {
      const oldCampaign = oldData.data.Campaigns.find(
        c => c.id === campaign.id
      );
      const timeSinceInH =
        (Date.now() - new Date(oldData.createdAt).getTime()) / 1000 / 60 / 60;

      const oldPerc =
        oldCampaign!.campaignType === 'Liberation'
          ? oldCampaign!.planetData.liberation
          : oldCampaign!.planetEvent!.defence;
      const newPerc =
        campaign.campaignType === 'Liberation'
          ? campaign.planetData.liberation
          : campaign.planetEvent!.defence;
      const avgChange = (newPerc - oldPerc) / timeSinceInH;
      averageChangeStr +=
        ' (' +
        (avgChange >= 0 ? '+' : '') +
        parseFloat(avgChange.toFixed(2)) +
        '%/h)';
    }
    // const oldCampaign = pastApiData!.data.Campaigns.find(c => c.id === campaign.id);
    const {planetName, campaignType, planetData, planetEvent} = campaign;
    const {players, playerPerc} = planetData;
    const playersStr = `${diverEmoji} ${formatPlayers(
      players
    )} | ${playerPerc}%`;
    const title = `${planetName}: ${campaignType.toUpperCase()} - ${playersStr}`;

    if (campaignType === 'Liberation') {
      const {owner, liberation} = planetData;
      // TODO: temp fix, need to add illuminate support
      const progressBar =
        liberation > 0 ? drawLoadingBarPerc(liberation, 30) : '';
      if (liberation > 5)
        status[owner as Faction].push({
          name: title,
          value: `${progressBar}` + averageChangeStr,
        });
      else
        statusShortened[owner as Faction] +=
          `\`${campaignType}\` ${planetName}: ${liberation}%\n`;
    } else if (campaignType === 'Defend') {
      const {defence, race, expireTime} = planetEvent as MergedPlanetEventData;
      const expiresInS = expireTime - data.Status.time;
      const expireTimeUtc = Math.floor(Date.now() + expiresInS * 1000);
      const expiresInUtcS = Math.floor(expireTimeUtc / 1000);
      const progressBar = drawLoadingBarPerc(defence, 30);
      if (defence > 5)
        status[race as Faction].push({
          name: title,
          value:
            `${progressBar}` +
            averageChangeStr +
            `\n**Defence Ends**: <t:${expiresInUtcS}:R>`,
        });
      else
        statusShortened[race as Faction] +=
          `\`${campaignType}\` ${planetName}: ${defence}%\n`;
    } else if (campaignType === 'Invasion') {
      const {defence, race, expireTime} = planetEvent as MergedPlanetEventData;
      const expiresInS = expireTime - data.Status.time;
      const expireTimeUtc = Math.floor(Date.now() + expiresInS * 1000);
      const expiresInUtcS = Math.floor(expireTimeUtc / 1000);
      const progressBar = drawLoadingBarPerc(defence, 30);
      if (defence > 5)
        status[race as Faction].push({
          name: title,
          value:
            `${progressBar}` +
            averageChangeStr +
            `\n**Defence Ends**: <t:${expiresInUtcS}:R>`,
        });
      else
        statusShortened[race as Faction] +=
          `\`${campaignType}\` ${planetName}: ${defence}%\n`;
    }
  }
  const automatonEmbed = new EmbedBuilder()
    .setThumbnail(factionSprites['Automaton'])
    .setColor(FACTION_COLOUR.Automaton)
    .setTitle('Automatons')
    .setDescription(
      `**${players.Automaton.toLocaleString()}** Helldivers are braving the automaton trenches!`
    )
    .addFields([
      ...status['Automaton'],
      {name: 'Low-Progress Campaigns', value: statusShortened['Automaton']},
    ]);

  const terminidEmbed = new EmbedBuilder()
    .setThumbnail(factionSprites['Terminids'])
    .setColor(FACTION_COLOUR.Terminids)
    .setTitle('Terminids')
    .setDescription(
      `**${players.Terminids.toLocaleString()}** Helldivers are deployed to manage the terminid swarms!`
    )
    .addFields([
      ...status['Terminids'],
      {name: 'Low-Progress Campaigns', value: statusShortened['Terminids']},
    ]);

  const illuminateEmbed = new EmbedBuilder()
    .setThumbnail(factionSprites['Illuminate'])
    .setColor(FACTION_COLOUR.Illuminate)
    .setTitle('Illuminate')
    .setDescription(
      `**${players.Illuminate.toLocaleString()}** Helldivers are deployed to quell the illuminate invasions!`
    )
    .addFields([
      ...status['Illuminate'],
      {name: 'Low-Progress Campaigns', value: statusShortened['Illuminate']},
    ]);

  const embeds = [automatonEmbed, terminidEmbed, illuminateEmbed];
  const dssEmbed = await democracySpaceStationEmbed();
  if (dssEmbed) embeds.push(dssEmbed);

  if (majorOrder) embeds.push(majorOrderEmbed(majorOrder));
  else
    embeds.push(
      new EmbedBuilder()
        .setTitle('Awaiting Major Order')
        .setColor(FACTION_COLOUR.Humans)
        .setDescription(
          'Stand by for further orders from Super Earth High Command'
        )
        .setThumbnail(factionSprites['Humans'])
    );
  embeds.push(
    new EmbedBuilder()
      .setDescription(
        `For more detailed information about the war, visit the [Helldivers Companion website](${HD_COMPANION_LINK})!` +
          '\n' +
          `For support, suggestions, or to report bugs pertaining to the bot, join the [HellCom Support Discord](${DISCORD_INVITE})!` +
          '\n' +
          `If HellCom has proved useful and you would like to support its development, you can donate via [Ko-fi](${KOFI_LINK})!`
      )
      .setFooter({text: FOOTER_MESSAGE})
      .setTimestamp()
  );
  return embeds;
}

const dssActionStatus: Record<number, string> = {
  1: 'IN PROGRESS ❓',
  2: 'ACTIVE :bangbang:',
  3: 'COOLDOWN ❌',
};

export async function democracySpaceStationEmbed(): Promise<EmbedBuilder | void> {
  const {RawDSS: dssData, UTCOffset} = data;
  // TODO: temp fix, need to add illuminate support
  if (!dssData || !dssData.tacticalActions) return;
  const {planetIndex, currentElectionEndWarTime, flags, tacticalActions} =
    dssData;
  const planet = getPlanetByIndex(planetIndex);

  const embed = new EmbedBuilder();

  if (planet)
    embed.setTitle(`Democracy Space Station (orbiting ${planet.name})`);
  else embed.setTitle('Democracy Space Station');

  const dssMovesInS = Math.floor(
    Math.floor(
      Date.now() + (currentElectionEndWarTime - data.Status.time) * 1000
    ) / 1000
  );
  embed.setDescription(`DSS moves in <t:${dssMovesInS}:R>`);

  for (const action of tacticalActions) {
    const {
      name,
      description,
      strategicDescription,
      status,
      statusExpireAtWarTimeSeconds,
      cost,
    } = action;

    let displayName = '';
    switch (name) {
      case 'EAGLE STORM':
        displayName = `<:eagle_airstrike:1220789240049434734> ${name} - ${dssActionStatus[status]}`;
        break;
      case 'ORBITAL BLOCKADE':
        displayName = `<:supply_pack:1220789644455579658> ${name} - ${dssActionStatus[status]}`;
        break;
      case 'HEAVY ORDNANCE DISTRIBUTION':
        displayName = `<:orbital_380mm_he_barrage:1220789627841937419> ${name} - ${dssActionStatus[status]}`;
        break;
      default:
        displayName = `${name} (${dssActionStatus[status]})`;
        break;
    }
    let desc = '';
    if (status === 1 || status === 2)
      desc =
        strategicDescription.replace(/\<i\=\d\>/g, '').replace(/<\/i>/g, '') +
        '\n';
    const expiresInS = statusExpireAtWarTimeSeconds - data.Status.time;
    const expireTimeUtc = Math.floor(Date.now() + expiresInS * 1000);
    const expiresInUtcS = Math.floor(expireTimeUtc / 1000);

    switch (status) {
      case 1:
        for (const c of cost) {
          const item = getItemName(c.itemMixId);
          const progress = ((c.currentValue / c.targetValue) * 100).toFixed(2);
          const contribPeriodInHours = c.maxDonationPeriodSeconds / 60 / 60;
          desc += `\n*${item}*: ${c.currentValue} / ${c.targetValue} (${progress}%)`;
          desc += `\n*Contribution Allowance*: ${c.maxDonationAmount} per ${contribPeriodInHours}H`;
        }
        desc += `\n*Contribution Period Ends*: <t:${expiresInUtcS}:f> (<t:${expiresInUtcS}:R>)`;
        break;
      case 2:
        desc += `\n*Active Until*: <t:${expiresInUtcS}:f>`;
        break;
      case 3:
        desc += `\n*Cooldown Expires*: <t:${expiresInUtcS}:f> (<t:${expiresInUtcS}:R>)`;
        break;
    }
    embed.addFields({
      name: displayName,
      value: desc,
    });
  }

  return embed;
}

export async function planetEmbeds(planet_name?: string) {
  const planets: MergedPlanetData[] = planet_name
    ? [getPlanetByName(planet_name) as MergedPlanetData]
    : getAllCampaigns().map(c => c.planetData);

  const embeds = [];
  for (const planet of planets) {
    const {
      name: planetName,
      // index,
      // sector,
      sectorName,
      biome,
      environmentals,
    } = planet;
    const campaign = getCampaignByPlanetName(planetName);
    const embed = new EmbedBuilder();
    embeds.push(embed);

    let title = `${planetName}`;
    let description = '';
    if (sectorName) title += ` (${sectorName} Sector)`;
    if (biome) {
      description = biome.description;
      // TODO: correct links and re-enable
      // embed.setImage(
      //   `https://helldiverscompanion.com/biomes/${planetBiomeTransform(
      //     biome.name
      //   )}.webp`
      // );
    }
    for (const e of environmentals ?? []) {
      description += '\n\n' + `**${e.name}**` + '\n' + e.description;
    }
    if (description) embed.setDescription(description);

    let display: Record<string, string | number> = {};
    if (campaign) {
      const {campaignType, planetData, planetEvent} = campaign;
      title += `: ${campaignType.toUpperCase()}`;
      if (campaignType === 'Liberation') {
        const {
          maxHealth,
          initialOwner,
          owner,
          health,
          players,
          playerPerc,
          liberation,
          lossPercPerHour,
        } = planetData;

        embed.setColor(FACTION_COLOUR[owner]);
        const squadImpact = maxHealth - health;

        display = {
          ...display,
          Players: `${players.toLocaleString()} (${playerPerc}%)`,
          'Controlled By': owner,
          'Initial Owner': initialOwner,
          Liberation: `${liberation}%`,
          'Loss Per Hour': `${lossPercPerHour}%`,
          'Total Squad Impact': `${squadImpact.toLocaleString()} / ${maxHealth.toLocaleString()}`,
        };
      } else if (campaignType === 'Defend') {
        const {maxHealth, health, defence, race, expireTime} =
          planetEvent as MergedPlanetEventData;
        const {players, playerPerc, owner} = planetData;
        const statusTime = data.Status.time;

        embed.setColor(FACTION_COLOUR[race]);

        const expiresInS = expireTime - statusTime;
        const expireTimeUtc = Math.floor(Date.now() + expiresInS * 1000);

        const expiresInUtcS = Math.floor(expireTimeUtc / 1000);
        const expiresInDays = Math.floor(expiresInS / 86400);
        const expiresInHours = Math.floor((expiresInS % 86400) / 3600);

        const squadImpact = maxHealth - health;
        display = {
          ...display,
          Players: `${players.toLocaleString()} (${playerPerc}%)`,
          'Controlled By': owner,
          Attackers: race,
          Defence: `${defence}%`,
          'Campaign Ends': `<t:${expiresInUtcS}:R> (${expiresInDays}d ${expiresInHours}h)`,
          'Total Squad Impact': `${squadImpact.toLocaleString()} / ${maxHealth.toLocaleString()}`,
        };
      }
    }
    const planetStats = data.PlanetStats.planets_stats.find(
      p => p.planetIndex === planet.index
    );
    if (planetStats) {
      const {
        missionsWon,
        missionsLost,
        missionTime,
        deaths,
        bugKills,
        automatonKills,
        illuminateKills,
      } = planetStats;
      const successRate = (missionsWon / (missionsWon + missionsLost)) * 100;
      const failRate = (missionsLost / (missionsWon + missionsLost)) * 100;

      display['Missions Won'] =
        `${missionsWon.toLocaleString()} (${successRate.toFixed(2)}%)`;
      display['Missions Lost'] =
        `${missionsLost.toLocaleString()} (${failRate.toFixed(2)}%)`;
      display['Mission Time'] = `${(missionTime / 3600).toFixed(2)} hours`;
      display['Helldivers Killed'] = deaths.toLocaleString();
      if (bugKills) display['Bug Kills'] = bugKills.toLocaleString();
      if (automatonKills)
        display['Automaton Kills'] = automatonKills.toLocaleString();
      if (illuminateKills)
        display['Illuminate Kills'] = illuminateKills.toLocaleString();
    }
    embed.setTitle(title);
    for (const [key, val] of Object.entries(display))
      embed.addFields({name: key, value: val.toString(), inline: true});
  }
  if (embeds.length > 1)
    embeds[embeds.length - 1].setFooter({text: FOOTER_MESSAGE}).setTimestamp();
  return embeds;
}

function drawLoadingBarPerc(percentage: number, barLength: number) {
  const percMult = percentage / 100;
  const progress = Math.round(barLength * percMult);
  const empty = barLength - progress;

  const progressBar = '[`' + '█'.repeat(progress) + ' '.repeat(empty) + '`]';

  return `${progressBar} ${percentage.toFixed(2)}%`;
}

interface WarbondPageEmbedParams {
  interaction: string;
  warbond: string;
  warbondPage: string;
  action: string;
}

export function warbondPageResponse({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interaction,
  warbond,
  warbondPage,
  action,
}: WarbondPageEmbedParams): {
  embeds: EmbedBuilder[];
  components?: ActionRowBuilder<ButtonBuilder>[];
} {
  // `warbond_${warbond}_${warbondPage}_back`
  if (action === 'back') warbondPage = (parseInt(warbondPage) - 1).toString();
  else if (action === 'next')
    warbondPage = (parseInt(warbondPage) + 1).toString();
  // if it's not back/next, do nothing to the page num

  if (!data.Warbonds) {
    return {
      embeds: [
        new EmbedBuilder()
          .setTitle('Warbonds Data Unavailable')
          .setDescription('Try again later.'),
      ],
    };
  }

  const warbondData: Warbond =
    data.Warbonds[warbond as keyof ApiData['Warbonds']];
  const warbondPageData = warbondData[warbondPage];
  const hasBack = (Number(warbondPage) - 1).toString() in warbondData;
  const hasNext = (Number(warbondPage) + 1).toString() in warbondData;
  const warbondName = (warbond as string)
    .replace('_', ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const totalPages = Object.keys(warbondData).length;
  const embed = new EmbedBuilder()
    .setTitle(`${warbondName} - Page ${warbondPage} / ${totalPages}`)
    .setFooter({text: FOOTER_MESSAGE});

  for (const [id, item] of Object.entries(warbondPageData.items)) {
    const {name, medal_cost, description, type} = item;

    let itemDesc = '';
    const boosterItem = data.Items?.boosters.find(i => i.name === name);
    const errorItem = 'error' in item;
    if ('armor_rating' in item) itemDesc += `\`${type} Armor\``;
    else if ('fire_rate' in item)
      itemDesc += type ? `\`${type} Primary\`` : '`Secondary Weapon`';
    else if ('outer_radius' in item) itemDesc += '`Grenade Item`';
    else if (boosterItem) {
      itemDesc += '`Booster Item`';
      itemDesc += `\n*${boosterItem.description}*`;
    } else if (name && name.includes('Super Credits')) itemDesc += '\u200b';
    else itemDesc += '`Vanity Item`';
    if (description) itemDesc += `\n*${description}*`;

    embed.addFields({
      name: errorItem
        ? '<ITEM_ERROR>'
        : `${medal_cost} ${emojis.medals} | ${name}`,
      value: errorItem ? `ID: \`${id}\`` : itemDesc,
      inline: true,
    });
  }

  const backButton = new ButtonBuilder()
    .setCustomId(`warbond-${warbond}-${warbondPage}-back`)
    .setLabel('Previous Page')
    .setStyle(ButtonStyle.Success)
    .setDisabled(!hasBack);
  const nextButton = new ButtonBuilder()
    .setCustomId(`warbond-${warbond}-${warbondPage}-next`)
    .setLabel('Next Page')
    .setStyle(ButtonStyle.Success)
    .setDisabled(!hasNext);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    backButton,
    nextButton
  );
  return {
    embeds: [embed],
    components: [row],
  };
}
