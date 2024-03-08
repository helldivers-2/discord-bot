import {CommandInteraction, EmbedBuilder, ColorResolvable} from 'discord.js';
import {getAllPlanets} from '../api-wrapper';
import {FOOTER_MESSAGE, EMBED_COLOUR} from '../commands/_components';

export function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function missingChannelPerms(interaction: CommandInteraction) {
  return {
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.avatarURL() || undefined,
        })
        .setTitle(`Permission Denied`)
        .setDescription(
          'This command creates a public, persistent message. To avoid inconviencing other users, it requires moderator permissions. '
        )
        .setFooter({text: FOOTER_MESSAGE})
        .setColor(EMBED_COLOUR as ColorResolvable)
        .setTimestamp(),
    ],
  };
}
