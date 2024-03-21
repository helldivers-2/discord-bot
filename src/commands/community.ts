import {EmbedBuilder, SlashCommandBuilder} from 'discord.js';
import {Command} from '../interfaces';
import {EMBED_COLOUR, FOOTER_MESSAGE} from './_components';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('community')
    .setDescription('Check out other awesome community resources!'),
  run: async interaction => {
    const embed = new EmbedBuilder()
      .setTitle('Great Community Projects')
      .setDescription(
        'HellCom is just one of many community-driven projects. ' +
          'Check out these other awesome projects!'
      )
      .setFields(
        {
          name: 'Helldivers Companion (Website)',
          value:
            'An awesome website showing ongoing war status with beautiful graphs for historical data!' +
            '\n' +
            'https://helldiverscompanion.com/',
        },
        {
          name: 'Helldivers 2 Unofficial API (API) - dealloc',
          value:
            'Reverse engineered API of the official Helldivers 2 video game, aiming to be a central go-to point for folks looking to build upon HD2 information.' +
            '\n' +
            'https://github.com/dealloc/helldivers2-api',
        },
        {
          name: 'Helldivers Galaxy (Website)',
          value:
            'Interactive Galactic Map for Helldivers' +
            '\n' +
            'https://helldiversgalaxy.io/',
        },
        {
          name: 'Helldivers Training Manual (Website)',
          value:
            'Incredibly beautiful website for Helldivers 2 information. Features strategem information (and minigames!) with a fully-fledged bestiary and more.' +
            '\n' +
            'https://helldiverstrainingmanual.com/',
        },
        {
          name: 'Helldivers 2 API Discussion (Discord)',
          value:
            'Community developer server for discussing the official HD2 API' +
            '\n' +
            'https://discord.gg/9euUqtF4kZ',
        },
        {
          name: 'Helldivers 2 Unofficial API (API) - chats',
          value:
            'Python FastAPI proxy service for the Helldivers 2 API.' +
            '\n' +
            'https://api.diveharder.com/docs',
        }
      )
      .setFooter({text: FOOTER_MESSAGE})
      .setColor(EMBED_COLOUR);

    await interaction.editReply({embeds: [embed]});
  },
};

export default command;
