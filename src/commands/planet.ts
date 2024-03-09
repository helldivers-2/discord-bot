import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {
  getAllActivePlanets,
  getPlanetAttacks,
  getPlanetByName,
  getAllPlayers,
} from '../api-wrapper';
import {Command} from '../interfaces';
import {EMBED_COLOUR, FACTION_COLOUR, FOOTER_MESSAGE} from './_components';
import {warStatusEmbeds} from '../handlers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('planet')
    .setDescription("Get a planet's current status!")
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Display a list of planets with ongoing offences')
    ),
  // .addSubcommand(subcommand =>
  //   subcommand
  //     .setName('info')
  //     .setDescription('Get information for a specific planet')
  //     .addStringOption(option =>
  //       option
  //         .setName('planet')
  //         .setDescription('The name of the planet you want to check')
  //         .setRequired(true)
  //         .setAutocomplete(true)
  //     )
  // ),
  run: async interaction => {
    const subcommand = interaction.options.data[0].name;

    await subcmds[subcommand](interaction);
  },
};

const subcmds: {[key: string]: (job: CommandInteraction) => Promise<void>} = {
  list,
  info,
};

async function list(interaction: CommandInteraction) {
  const activePlanets = getAllActivePlanets();
  const planetAttacks = getPlanetAttacks();
  const players = getAllPlayers();

  const responseEmbed = new EmbedBuilder()
    .setAuthor({
      name: `foo`,
    })
    .setFooter({text: FOOTER_MESSAGE})
    .setColor(EMBED_COLOUR)
    .setTimestamp();

  let value = '';
  let value2 = '';

  for (const val of activePlanets)
    value += `${val.name}: ${val.liberation}% (${val.players})\n`;

  for (const val of planetAttacks) value2 += `${val.source} -> ${val.target}\n`;

  responseEmbed.addFields(
    {
      name: `bar`,
      value: value,
    },
    {
      name: `baz`,
      value: value2,
    }
  );
  let playerDesc = '';
  for (const [key, val] of Object.entries(players)) {
    if (key === 'Total') continue;
    const perc = ((val / players.Total) * 100).toFixed(2);
    playerDesc += `${key}: ${val} (${perc}%)\n`;
  }
  playerDesc += `\nTotal: ${players.Total}`;
  const playersEmbed = new EmbedBuilder()
    .setTitle('Active Helldivers')
    .setDescription(playerDesc)
    .setFooter({text: FOOTER_MESSAGE})
    .setColor(EMBED_COLOUR);

  // await interaction.editReply({embeds: [responseEmbed, playersEmbed]});
  await interaction.editReply({embeds: warStatusEmbeds()});
}

async function info(interaction: CommandInteraction) {
  const userQuery = interaction.options.get('planet', true).value as string;

  const planet = getPlanetByName(userQuery as string);

  if (!planet) {
    await interaction.editReply({
      content: `Planet not found: ${userQuery}`,
    });
    return;
  }

  const responseEmbed = new EmbedBuilder()
    .setTitle(`${planet.name}`)
    .setFooter({text: FOOTER_MESSAGE})
    .setColor(FACTION_COLOUR[planet.owner])
    .setTimestamp();

  const {
    index,
    name,
    sector,
    maxHealth,
    initialOwner,
    owner,
    health,
    regenPerSecond,
    players,
    liberation,
  } = planet;
  const display = {
    sector,
    liberation: `${liberation}%`,
    players,
    health,
    maxHealth,
    regenPerSecond,
    owner,
    initialOwner,
  };

  let value = '';
  for (const [key, val] of Object.entries(display)) {
    value += `**${key[0].toUpperCase() + key.slice(1)}**: ${val}\n`;
  }

  responseEmbed.addFields({
    name: `${name} (${index})`,
    value: value,
  });
  await interaction.editReply({embeds: [responseEmbed]});
}

export default command;
