import {SlashCommandBuilder} from 'discord.js';
import {Command} from '../interfaces';
import {summaryRow, warStatusEmbeds} from '../handlers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('summary')
    .setDescription('Get a summarised view of the current galactic war.'),
  run: async interaction => {
    const embeds = await warStatusEmbeds();

    await interaction.editReply({
      embeds: embeds,
      components: [summaryRow],
    });
  },
};

export default command;
