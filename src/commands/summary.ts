import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {Command} from '../interfaces';
import {
  hdCompanionButton,
  supportDiscordButton,
  supportRow,
  warStatusEmbeds,
} from '../handlers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('summary')
    .setDescription('Get a summarised view of the current galactic war.'),
  run: async interaction => {
    const embeds = await warStatusEmbeds();

    await interaction.editReply({
      embeds: embeds,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents([
          supportDiscordButton,
          hdCompanionButton,
        ]),
        supportRow,
      ],
    });
  },
};

export default command;
