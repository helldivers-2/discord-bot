import {
  AttachmentBuilder,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {Command} from '../interfaces';
import {campaignEmbeds, campaignHistoryGraph} from '../handlers';
import {getPopularCampaign} from '../api-wrapper';
import {FOOTER_MESSAGE} from './_components';

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
        .setName('most')
        .setDescription('Display the campaign with the most active Helldivers')
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
    const subcommand = interaction.options.data[0].name;

    await subcmds[subcommand](interaction);
  },
};

const subcmds: {[key: string]: (job: CommandInteraction) => Promise<void>} = {
  // hashmap of subcommands
  list,
  most,
  info,
};

async function list(interaction: CommandInteraction) {
  const embeds: EmbedBuilder[] = await campaignEmbeds();

  await interaction.editReply({embeds: embeds});
}

async function info(interaction: CommandInteraction) {
  const userQuery = interaction.options.get('planet_name', true)
    .value as string;
  const embeds: EmbedBuilder[] = [
    ...(await campaignEmbeds(userQuery)),
    new EmbedBuilder()
      .setTitle(`${userQuery} Campaign History`)
      .setImage('attachment://chart.png')
      .setFooter({text: FOOTER_MESSAGE})
      .setTimestamp(),
  ];
  const attachment = new AttachmentBuilder(
    await campaignHistoryGraph(userQuery),
    {name: 'chart.png'}
  );

  await interaction.editReply({embeds: embeds, files: [attachment]});
}

async function most(interaction: CommandInteraction) {
  const campaign = getPopularCampaign();
  campaign.planetName;
  const embeds: EmbedBuilder[] = await campaignEmbeds(campaign.planetName);

  await interaction.editReply({embeds: embeds});
}

export default command;
