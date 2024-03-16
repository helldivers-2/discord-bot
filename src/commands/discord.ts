import {EmbedBuilder, SlashCommandBuilder} from 'discord.js';
import {Command} from '../interfaces';
import {EMBED_COLOUR, FOOTER_MESSAGE} from './_components';
import {config} from '../config';

const {DISCORD_APPLICATION_DIRECTORY, DISCORD_INVITE} = config;

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('discord')
    .setDescription('HellCom Discord invite'),
  run: async interaction => {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Leviathan Alliance - Helldivers 2 Community')
          .setDescription(
            'HellCom is part of **Leviathan Alliance**! ' +
              '\n\n' +
              'Leviathan Alliance is a community of like-minded Helldivers who are passionate about Helldivers 2! We welcome every level and skill into our server with open arms. We also built this server knowing that the main Helldivers discord can be hectic and overwhelming, so we hope you can find friendly Helldivers more easily here!' +
              '\n\n' +
              'You may also see patches for the bot, report bugs or give suggestions __for the bot__. ' +
              'If you would like to invite the bot to your own server, you may do so with ' +
              `__**[this link (click)](${DISCORD_APPLICATION_DIRECTORY})**__ (you must be a server admin).` +
              '\n\n' +
              'Thanks for your interest in the project! <3'
          )
          .setURL(DISCORD_INVITE)
          .setFooter({text: FOOTER_MESSAGE})
          .setColor(EMBED_COLOUR),
      ],
    });
  },
};

export default command;
