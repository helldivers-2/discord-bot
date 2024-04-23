import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {Command} from '../interfaces';
import {FOOTER_MESSAGE} from './_components';
import {warStatusEmbeds} from '../handlers';
import {config} from '../config';

const DISCORD_INVITE = config.DISCORD_INVITE;
const HD_COMPANION_LINK = config.HD_COMPANION_LINK;

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('summary')
    .setDescription('Get a summarised view of the current galactic war.'),
  run: async interaction => {
    const embeds = await warStatusEmbeds();
    embeds.push(
      new EmbedBuilder()
        .setDescription(
          `\n\nFor support, suggestions, or to report bugs pertaining to the bot, join the [HellCom Support Discord](${DISCORD_INVITE})!` +
            `\n\nFor more detailed information about the war, visit the [Helldivers Companion website](${HD_COMPANION_LINK})!`
        )
        .setFooter({text: FOOTER_MESSAGE})
        .setTimestamp()
    );

    await interaction.editReply({
      embeds: embeds,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents([
          new ButtonBuilder()
            .setLabel('HellCom Support Discord')
            .setEmoji('<:hellcom:1232123669560430693>')
            .setStyle(ButtonStyle.Link)
            .setURL(DISCORD_INVITE),
          new ButtonBuilder()
            .setLabel('Helldivers Companion')
            .setEmoji('<:helldiverscompanion:1232123938394607656>')
            .setStyle(ButtonStyle.Link)
            .setURL(HD_COMPANION_LINK),
        ]),
      ],
    });
  },
};

export default command;
