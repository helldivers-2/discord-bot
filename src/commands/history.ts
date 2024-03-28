import {
  AttachmentBuilder,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {Command} from '../interfaces';
import {FOOTER_MESSAGE} from './_components';
import {apiData, db} from '../db';
import {desc} from 'drizzle-orm';
import {ChartConfiguration} from 'chart.js';
import dayjs from 'dayjs';
import {renderMediumChart} from '../handlers';
import {getAllPlayers} from '../api-wrapper';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('See historical data')
    .addSubcommand(subcommand =>
      subcommand
        .setName('players')
        .setDescription('See a chart of the player count by faction over time')
    ),
  run: async interaction => {
    const subcommand = interaction.options.data[0].name;

    await subcmds[subcommand](interaction);
  },
};

const subcmds: {[key: string]: (job: CommandInteraction) => Promise<void>} = {
  players,
};

async function players(interaction: CommandInteraction) {
  // get all API data for 24 hours ago
  const pastData = await db.query.apiData.findMany({
    orderBy: desc(apiData.time),
    limit: 24 * 14,
  });
  pastData.sort((a, b) => a.time - b.time);

  const pastPlayersByDate = pastData.map(d => {
    return {
      time: d.createdAt,
      players: d.data.Players,
    };
  });

  pastPlayersByDate.push({
    time: new Date(),
    players: getAllPlayers(),
  });
  const configuration: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: pastPlayersByDate.map(d =>
        dayjs(d.time).utc().format('DD MMM hh:mmA')
      ),
      datasets: [
        {
          label: 'Total Players',
          data: pastPlayersByDate.map(d => d.players.Total / 1000),
          fill: false,
          borderColor: 'rgb(255, 255, 0)', // Yellow
          borderWidth: 1,
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: 'Terminids',
          data: pastPlayersByDate.map(d => d.players.Terminids / 1000),
          fill: false,
          borderColor: 'rgb(255, 165, 0)', // Orange
          borderWidth: 1,
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: 'Automatons',
          data: pastPlayersByDate.map(d => d.players.Automaton / 1000),
          fill: false,
          borderColor: 'rgb(255, 0, 0)', // Red
          borderWidth: 1,
          tension: 0.1,
          pointRadius: 0,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)', // Light white
          },
          ticks: {
            color: 'rgb(255, 255, 255)', // White
            callback: value => +value + 'k',
          },
        },
        x: {
          title: {
            text: 'Time (UTC)',
            display: true,
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)', // Light white
          },
          ticks: {
            color: 'rgb(255, 255, 255)', // White
          },
        },
      },
      plugins: {
        title: {
          text: 'Helldivers 2 Player Counts',
          color: 'rgb(255, 255, 255)', // White
          display: true,
        },
        legend: {
          labels: {
            color: 'rgb(255, 255, 255)', // White
          },
        },
      },
    },
  };

  // eg. sending image in an embed
  const image = await renderMediumChart(configuration);
  const attachment = new AttachmentBuilder(image, {name: 'playercount.png'});
  const embed = new EmbedBuilder()
    // .setTitle('Player Count (in UTC)')
    // .setImage('attachment://playercount.png')
    .setFooter({text: FOOTER_MESSAGE});

  // we use editReply because slashcommands are deferred by default
  // discord requires a response within 3 seconds, so we defer a response and then edit it later
  await interaction.editReply({embeds: [embed], files: [attachment]});
}

export default command;
