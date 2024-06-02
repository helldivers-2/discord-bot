import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {getPlanetByName} from '../api-wrapper';
import {Command} from '../interfaces';
import {planetEmbeds} from '../handlers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('planet')
    .setDescription("Get a planet's current status!")
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
  info,
};

async function info(interaction: CommandInteraction) {
  const userQuery = interaction.options.get('planet', true).value as string;

  const planet = getPlanetByName(userQuery as string);

  if (!planet) {
    await interaction.editReply({
      content: `Planet not found: ${userQuery}`,
    });
    return;
  }
  const embeds: EmbedBuilder[] = [...(await planetEmbeds(planet.name))];

  await interaction.editReply({embeds: embeds});
}

export default command;
