import {ButtonInteraction} from 'discord.js';
import {HelldiversDiscordAnnouncement} from '../api-wrapper';
import {updateTimestampResponse} from '../handlers';

const button = async (interaction: ButtonInteraction): Promise<void> => {
  const {customId} = interaction;
  // "warbond-helldivers_mobilize-1-next"
  const [_, type, timestamp, action] = customId.split('-');

  const {embeds, components} = updateTimestampResponse({
    interaction: 'command',
    type: type as HelldiversDiscordAnnouncement['type'] | 'STEAM' | 'PATCH',
    timestamp: parseInt(timestamp),
    action: action,
  });

  await interaction.editReply({embeds: embeds, components: components});
  return;
};

export default button;
