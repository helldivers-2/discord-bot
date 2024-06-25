import {SlashCommandBuilder} from 'discord.js';
import {Command} from '../interfaces';
import {subscribeEmbed} from '../handlers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('subscribe')
    .setDescription("Manage this server's notifications.")
    .setDefaultMemberPermissions(8),
  run: async interaction => {
    const {embeds, components} = await subscribeEmbed(interaction);

    await interaction.editReply({embeds, components});
  },
};

export default command;
