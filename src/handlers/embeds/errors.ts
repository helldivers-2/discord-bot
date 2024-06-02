import {
  ColorResolvable,
  CommandInteraction,
  EmbedBuilder,
  MessageComponentInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import {client} from '../client';
import {EMBED_COLOUR, FOOTER_MESSAGE} from './exports';
import {supportDiscordRow} from './components';

export function commandErrorEmbed(
  interaction: CommandInteraction | ModalSubmitInteraction
) {
  return {
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: client.user?.tag || '',
          iconURL: client.user?.avatarURL() || undefined,
        })
        .setTitle('HellCom Encountered an Error!')
        .setDescription(
          `There was an issue trying to execute \`/${
            interaction.isCommand()
              ? interaction.commandName
              : interaction.customId
          }\`! ` +
            'The issue has been logged and will be looked into. Feel free to try again shortly. ' +
            'If the problem persists, please report it in the HellCom support Discord linked below!'
        )
        .setFooter({text: FOOTER_MESSAGE})
        .setColor(EMBED_COLOUR as ColorResolvable)
        .setTimestamp(),
    ],
    components: [supportDiscordRow],
  };
}

export function componentErrorEmbed(interaction: MessageComponentInteraction) {
  return {
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: client.user?.tag || '',
          iconURL: client.user?.avatarURL() || undefined,
        })
        .setTitle('HellCom Encountered an Error!')
        .setDescription(
          `There was an issue trying to execute component type \`${interaction.customId}\`! ` +
            'The issue has been logged and will be looked into. Feel free to try again shortly. ' +
            'If the problem persists, please report it in the HellCom support Discord linked below!'
        )
        .setFooter({text: FOOTER_MESSAGE})
        .setColor(EMBED_COLOUR as ColorResolvable)
        .setTimestamp(),
    ],
    components: [supportDiscordRow],
  };
}
