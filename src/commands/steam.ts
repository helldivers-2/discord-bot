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
import axios from 'axios';
import {SteamNewsFeed} from '../api-wrapper';
import dayjs from 'dayjs';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('steam')
    .setDescription('View the latest Helldivers 2 / bot patch notes')
    .addSubcommand(subcommand =>
      subcommand
        .setName('news')
        .setDescription('View the latest Helldivers 2 non-patch news')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('patchnotes')
        .setDescription('View the latest Helldivers 2 patch notes')
    ),
  run: async interaction => {
    const subcommand = interaction.options.data[0].name;

    await subcmds[subcommand](interaction);
  },
};

const subcmds: {[key: string]: (job: CommandInteraction) => Promise<void>} = {
  patchnotes,
  news,
};

async function patchnotes(interaction: CommandInteraction) {
  const axiosOpts = {
    headers: {
      'User-Agent': 'HelldiversBot/1.0',
      'Accept-Language': 'en-US',
    },
  };
  const apiData = (await (
    await axios.get('https://api.diveharder.com/raw/updates', {
      ...axiosOpts,
      params: {
        maxEntries: 512,
      },
    })
  ).data) as SteamNewsFeed;
  const steamPatchNotes = apiData.filter(news =>
    news.title.toLowerCase().includes('patch')
  );

  const messages = steamPatchNotes
    .slice(0, 3)
    .reverse()
    .map(p => {
      const embed = new EmbedBuilder()
        .setTitle(p.title)
        .setURL(p.url)
        .setTimestamp(dayjs(p.date).unix() * 1000)
        .setFooter({text: FOOTER_MESSAGE});

      if (p.contents.length > 4000)
        embed.setDescription(
          p.contents.slice(0, 4000) +
            '`...`\n\n## Click the button below to read more!'
        );
      else embed.setDescription(p.contents);

      return {
        embeds: [embed],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder()
              .setLabel('Steam Post')
              .setStyle(ButtonStyle.Link)
              .setURL(p.url),
          ]),
        ],
      };
    });

  messages.forEach(async (m, i) => {
    if (i === 0) await interaction.editReply({...m});
    else await interaction.followUp({...m, ephemeral: true});
  });
}

async function news(interaction: CommandInteraction) {
  const axiosOpts = {
    headers: {
      'User-Agent': 'HelldiversBot/1.0',
      'Accept-Language': 'en-US',
    },
  };
  const apiData = (await (
    await axios.get('https://api.diveharder.com/raw/updates', {
      ...axiosOpts,
      params: {
        maxEntries: 512,
      },
    })
  ).data) as SteamNewsFeed;
  const steamNews = apiData.filter(
    news => !news.title.toLowerCase().includes('patch')
  );

  const messages = steamNews
    .slice(0, 3)
    .reverse()
    .map(p => {
      const embed = new EmbedBuilder()
        .setTitle(p.title)
        .setURL(p.url)
        .setTimestamp(dayjs(p.date).unix() * 1000)
        .setFooter({text: FOOTER_MESSAGE});

      if (p.contents.length > 4000)
        embed.setDescription(
          p.contents.slice(0, 4000) +
            '`...`\n\n## Click the button below to read more!'
        );
      else embed.setDescription(p.contents);

      return {
        embeds: [embed],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder()
              .setLabel('Steam Post')
              .setStyle(ButtonStyle.Link)
              .setURL(p.url),
          ]),
        ],
      };
    });

  messages.forEach(async (m, i) => {
    if (i === 0) await interaction.editReply({...m});
    else await interaction.followUp({...m, ephemeral: true});
  });
}

export default command;
