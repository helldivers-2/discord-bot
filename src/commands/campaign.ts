import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {
  Faction,
  MergedCampaignData,
  MergedPlanetData,
  MergedPlanetEventData,
  getAllCampaigns,
  getCampaignByPlanetName,
  getUtcTime,
} from '../api-wrapper';
import {Command} from '../interfaces';
import {FACTION_COLOUR, FOOTER_MESSAGE} from './_components';
import {campaignEmbeds} from '../handlers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('campaign')
    .setDescription('Active Helldiver war efforts')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Display all ongoing Helldiver war efforts')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Display the current war effort for a specific planet')
        .addStringOption(option =>
          option
            .setName('planet_name')
            .setDescription('Planet name')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),
  run: async interaction => {
    // TODO: perform any checks if needed (eg. perm checks)
    const subcommand = interaction.options.data[0].name;

    await subcmds[subcommand](interaction);
  },
};

const subcmds: {[key: string]: (job: CommandInteraction) => Promise<void>} = {
  // hashmap of subcommands
  // TODO
  list,
  info,
};

async function list(interaction: CommandInteraction) {
  const embeds: EmbedBuilder[] = await campaignEmbeds();

  await interaction.editReply({embeds: embeds});
}

async function info(interaction: CommandInteraction) {
  const userQuery = interaction.options.get('planet_name', true)
    .value as string;
  const embeds: EmbedBuilder[] = await campaignEmbeds(userQuery);

  await interaction.editReply({embeds: embeds});
}

export default command;
