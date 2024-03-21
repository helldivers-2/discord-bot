import {EmbedBuilder, SlashCommandBuilder} from 'discord.js';
import {Command} from '../interfaces';
import {EMBED_COLOUR, FOOTER_MESSAGE} from './_components';
import {config} from '../config';
import {client} from '../handlers';

const {
  DISCORD_APPLICATION_DIRECTORY,
  DISCORD_INVITE,
  KOFI_LINK,
  TOP_GG_LINK,
  BOT_OWNER,
} = config;

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('discord')
    .setDescription('HellCom Discord invite'),
  run: async interaction => {
    const owner = client.users.cache.get(BOT_OWNER);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: 'Major (@theyodastream)',
            iconURL: owner?.avatarURL?.() || undefined,
          })
          .setTitle('Leviathan Alliance - Helldivers 2 Community')
          .setFields(
            {
              name: 'HellCom is part of Leviathan Alliance!',
              value:
                `**[Leviathan Alliance](${DISCORD_INVITE})** is a community of welcoming, like-minded Helldivers who are passionate about Helldivers 2! We also built this server knowing that the official Helldivers Discord can be hectic and overwhelming, so we hope you can find friendly Helldivers more easily here!` +
                '\n\n' +
                'HellCom has a dedicated section where you can see patchnotes for HellCom, report bugs, give suggestions or just chat about the bot. Patchnotes are posted in <#1218200640283611196> (if this says unknown, you need to join the server and get the HellCom role).',
            },
            {
              name: 'Adding HellCom to your own Servers',
              value:
                'HellCom is free for anyone to add to their own servers! ' +
                `You can add HellCom to your own server via the official **[Discord App Directory (click)](${DISCORD_APPLICATION_DIRECTORY})**.`,
            },
            {
              name: "Supporting HellCom's Development",
              value:
                'HellCom is a personal project, worked on in my spare time. ' +
                `If you'd like to help cover hosting costs, or just support me in general, you can with my **[ko-fi link (click)](${KOFI_LINK})**.` +
                '\n' +
                `Alternatively, you can support HellCom is via voting for and/or reviewing it on **[top.gg (click)](${TOP_GG_LINK})** so fellow Helldivers can find it more easily!`,
            }
          )
          .setURL(DISCORD_INVITE)
          .setFooter({text: FOOTER_MESSAGE})
          .setColor(EMBED_COLOUR),
      ],
    });
  },
};

export default command;
