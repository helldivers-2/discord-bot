import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {Command} from '../interfaces';
import {getAllEvents, getLatestEvent} from '../api-wrapper';
import {FOOTER_MESSAGE} from './_components';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('events')
    .setDescription('Gets helldivers events!')
    .addSubcommand(subcommand =>
      subcommand
        .setName('all')
        .setDescription('Display all recent event dispatches')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('latest')
        .setDescription('Display the most recent event dispatch')
    ),
  run: async interaction => {
    const subcommand = interaction.options.data[0].name;

    await subcmds[subcommand](interaction);
  },
};

const subcmds: {[key: string]: (job: CommandInteraction) => Promise<void>} = {
  all,
  latest,
};

async function all(interaction: CommandInteraction) {
  const events = getAllEvents();

  const embeds: EmbedBuilder[] = [];
  for (const event of events) {
    const title = event.title;
    let message = event.message;
    message = message.replace(/<i=1>/g, '*').replace(/<\/i>/g, '*');
    const embed = new EmbedBuilder().setTitle(title).setTimestamp();
    if (message) embed.setDescription(message);
    embeds.push(embed);
  }

  embeds[embeds.length - 1].setFooter({text: FOOTER_MESSAGE}).setTimestamp();
  await interaction.editReply({embeds: embeds});
}

async function latest(interaction: CommandInteraction) {
  const event = getLatestEvent();
  const title = event.title;
  let message = event.message;

  message = message.replace(/<i=1>/g, '*').replace(/<\/i>/g, '*');
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setFooter({text: FOOTER_MESSAGE})
    .setTimestamp();
  if (message) embed.setDescription(message);

  await interaction.editReply({embeds: [embed]});
}

export default command;
