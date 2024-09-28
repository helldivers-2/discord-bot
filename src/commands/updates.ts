import {SlashCommandBuilder} from 'discord.js';
import {Command} from '../interfaces';
import {HelldiversDiscordAnnouncement} from '../api-wrapper';
import {updateTimestampResponse} from '../handlers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('updates')
    .setDescription('Check for recent updates from a variety of sources')
    .addSubcommand(subcommand =>
      subcommand
        .setName('high_command_dispatches')
        .setDescription('Check for recent High Command dispatches')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('helldivers_announcements')
        .setDescription('Check for recent HD2 announcements')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('arrowhead_games_news')
        .setDescription('Check for recent Arrowhead Games news')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('patch_notes')
        .setDescription('Check for recent HD2 patch notes')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('steam_posts')
        .setDescription('Check for recent Steam posts')
    ),
  // .addStringOption(option =>
  //   option
  //     .setName('type')
  //     .setDescription('The type of updates to check')
  //     .setRequired(true)
  //     .setChoices(
  //       {
  //         name: 'High Command Dispatches',
  //         value: 'CM',
  //       },
  //       {
  //         name: 'HD2 Announcements',
  //         value: 'HD2',
  //       },
  //       {
  //         name: 'Arrowhead Games News',
  //         value: 'AHG',
  //       },
  //       {
  //         name: 'HD2 Patch Notes',
  //         value: 'PATCH',
  //       },
  //       {
  //         name: 'Steam Posts',
  //         value: 'STEAM',
  //       }
  //     )
  // ),
  run: async interaction => {
    const subcommand = interaction.options.data[0].name;
    const options: {
      high_command_dispatches: 'CM';
      helldivers_announcements: 'HD2';
      arrowhead_games_news: 'AHG';
      patch_notes: 'PATCH';
      steam_posts: 'STEAM';
    } = {
      high_command_dispatches: 'CM',
      helldivers_announcements: 'HD2',
      arrowhead_games_news: 'AHG',
      patch_notes: 'PATCH',
      steam_posts: 'STEAM',
    };

    const {embeds, components} = updateTimestampResponse({
      interaction: 'command',
      type: options[subcommand as keyof typeof options],
      timestamp: Date.now(),
      action: 'none',
    });
    await interaction.editReply({
      embeds: embeds,
      components: components ?? [],
    });
  },
};

export default command;
