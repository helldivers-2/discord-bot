import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {getPlanetByName, getAllCampaigns} from '../api-wrapper';
import {Command} from '../interfaces';
import {FACTION_COLOUR, FOOTER_MESSAGE} from './_components';
import {planetNameTransform, warStatusEmbeds} from '../handlers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('planet')
    .setDescription("Get a planet's current status!")
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Display a list of planets with ongoing offences')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Get information for a specific planet')
        .addStringOption(option =>
          option
            .setName('planet')
            .setDescription('The name of the planet you want to check')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),
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
  const embeds = await warStatusEmbeds();
  embeds[embeds.length - 1].setFooter({text: FOOTER_MESSAGE}).setTimestamp();

  await interaction.editReply({embeds: embeds});
}

async function info(interaction: CommandInteraction) {
  const userQuery = interaction.options.get('planet', true).value as string;

  const planet = getPlanetByName(userQuery as string);
  const campaigns = await getAllCampaigns();

  const isActive: boolean = campaigns.some(c => c.planetName === userQuery);

  if (!planet) {
    await interaction.editReply({
      content: `Planet not found: ${userQuery}`,
    });
    return;
  }

  const {
    sector,
    maxHealth,
    owner,
    health,
    lossPercPerHour,
    playerPerc,
    players,
    liberation,
  } = planet;

  const squadImpact = maxHealth - health;
  let display: Record<string, string | number> = {};

  if (isActive)
    display = {
      Sector: sector,
      Players: `${players.toLocaleString()} (${playerPerc}%)`,
      Owner: owner,
      Liberation: `${liberation}%`,
      'Loss Per Hour': `${lossPercPerHour}%`,
      'Total Squad Impact': `${squadImpact.toLocaleString()} / ${maxHealth.toLocaleString()}`,
    };
  else
    display = {
      Sector: sector,
      Players: `${players.toLocaleString()} (${playerPerc}%)`,
      Owner: owner,
    };

  const planetThumbnailUrl = `https://helldiverscompanionimagescdn.b-cdn.net/planet-images/${planetNameTransform(
    planet.name
  )}.png`;
  const embed = new EmbedBuilder()
    .setTitle(planet.name)
    .setColor(FACTION_COLOUR[planet.owner])
    .setImage(planetThumbnailUrl);

  for (const [key, val] of Object.entries(display))
    embed.addFields({name: key, value: val.toString(), inline: true});

  await interaction.editReply({embeds: [embed]});
}

export default command;
