import {EmbedBuilder, SlashCommandBuilder} from 'discord.js';
import {Command} from '../interfaces';
import {EMBED_COLOUR, FOOTER_MESSAGE} from './_components';
import {config, helldiversConfig} from '../config';
import {client} from '../handlers';

const {KOFI_LINK, DISCORD_INVITE, TOP_GG_LINK, BOT_OWNER} = config;
const {icons} = helldiversConfig;

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Support the HellCom project!'),
  run: async interaction => {
    const owner = client.users.cache.get(BOT_OWNER);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: 'Major (@theyodastream)',
            iconURL: owner?.avatarURL?.() || undefined,
          })
          .setTitle("Support HellCom's Development <3")
          .setThumbnail(icons.kofi)
          .setDescription(
            'Hey! Thanks for checking this out =)' +
              '\n\n' +
              ' HellCom is a personal project, worked on in my spare time. ' +
              `If you'd like to help cover hosting costs, or just support me in general, you can with my **[ko-fi link](${KOFI_LINK})**.` +
              '\n' +
              `Another way to support HellCom is via [voting for and/or reviewing it on top.gg](${TOP_GG_LINK}) so fellow Helldivers can find it more easily!` +
              '\n\n' +
              `HellCom is a community-driven project, so I'm always open to suggestions and bug reports. Feel free to join the **[Discord](${DISCORD_INVITE})** and chat with me there!`
          )
          .setURL(KOFI_LINK)
          .setFooter({text: FOOTER_MESSAGE})
          .setColor(EMBED_COLOUR),
      ],
    });
  },
};

export default command;
