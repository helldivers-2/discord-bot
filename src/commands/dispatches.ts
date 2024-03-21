import {EmbedBuilder, SlashCommandBuilder} from 'discord.js';
import {Command} from '../interfaces';
import {FOOTER_MESSAGE} from './_components';
import {getAllDispatches} from '../api-wrapper';
import {helldiversConfig} from '../config';

const {altSprites} = helldiversConfig;

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('dispatches')
    .setDescription('Get recent dispatch messages from SE Command'),
  run: async interaction => {
    const sinceDays = 7;
    const limit = 15;
    const since = Date.now() - sinceDays * 24 * 60 * 60 * 1000;
    const dispatches = getAllDispatches().filter(
      dispatch => dispatch.publishedUtc > since
    );

    const title =
      dispatches.length === 0
        ? 'No dispatches found'
        : dispatches.length > limit
        ? `Dispatch Log [SINCE: ${sinceDays} DAYS / LIMIT: ${limit}]`
        : `Dispatch Log [SINCE: ${sinceDays} DAYS]`;

    const embed = new EmbedBuilder()
      .setAuthor({name: 'SE Command', iconURL: altSprites['Humans']})
      .setTitle(title)
      .setFooter({text: FOOTER_MESSAGE})
      .setTimestamp();

    for (const dispatch of dispatches
      .splice(0, limit)
      .sort((a, b) => a.publishedUtc - b.publishedUtc)) {
      const {message} = dispatch;
      const timestamp = `\n**Recieved**: <t:${Math.floor(
        dispatch.publishedUtc / 1000
      )}:f>`;
      if (message && message.includes('\n')) {
        const title = message.split('\n')[0];
        const description = message.split('\n').slice(1).join('\n');

        if (title.length > 256)
          embed.addFields({name: '\u200b', value: message + timestamp});
        else embed.addFields({name: title, value: description + timestamp});
      } else embed.addFields({name: '\u200b', value: message + timestamp});
    }

    // we use editReply because slashcommands are deferred by default
    // discord requires a response within 3 seconds, so we defer a response and then edit it later
    await interaction.editReply({embeds: [embed]});
  },
};

export default command;
