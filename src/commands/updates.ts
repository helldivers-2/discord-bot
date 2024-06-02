import {SlashCommandBuilder} from 'discord.js';
import {Command} from '../interfaces';
import {HelldiversDiscordAnnouncement} from '../api-wrapper';
import {updateTimestampResponse} from '../handlers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('updates')
    .setDescription('Check for recent updates from a variety of sources')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('The type of updates to check')
        .setRequired(true)
        .setChoices(
          {
            name: 'High Command Dispatches',
            value: 'CM',
          },
          {
            name: 'HD2 Announcements',
            value: 'HD2',
          },
          {
            name: 'Arrowhead Games News',
            value: 'AHG',
          },
          {
            name: 'HD2 Patch Notes',
            value: 'PATCH',
          },
          {
            name: 'Steam Posts',
            value: 'STEAM',
          }
        )
    ),
  run: async interaction => {
    const option = interaction.options.get('type')?.value as string;

    const {embeds, components} = updateTimestampResponse({
      interaction: 'command',
      type: option as HelldiversDiscordAnnouncement['type'] | 'STEAM' | 'PATCH',
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
