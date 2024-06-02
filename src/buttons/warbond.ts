import {ButtonInteraction} from 'discord.js';
import {warbondPageResponse} from '../handlers';

const button = async (interaction: ButtonInteraction): Promise<void> => {
  const {customId} = interaction;
  // "warbond-helldivers_mobilize-1-next"
  const [_, warbond, page, action] = customId.split('-');

  const {embeds, components} = warbondPageResponse({
    interaction: 'command',
    warbond: warbond,
    warbondPage: page,
    action: action,
  });

  await interaction.editReply({embeds: embeds, components: components});
  return;
};

export default button;
