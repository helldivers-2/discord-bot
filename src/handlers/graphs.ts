import {ChartConfiguration} from 'chart.js';
import {ChartJSNodeCanvas} from 'chartjs-node-canvas';
import {apiData, db} from '../db';
import {desc} from 'drizzle-orm';
import {MergedCampaignData, getCampaignByPlanetName} from '../api-wrapper';
import {dayjs} from './dates';

const smallChartJSNodeCanvas = new ChartJSNodeCanvas({
  width: 1000,
  height: 400,
  backgroundColour: 'black',
});
smallChartJSNodeCanvas.registerFont('./fonts/Monda-Regular.ttf', {
  family: 'Monda',
});

const bigChartJSNodeCanvas = new ChartJSNodeCanvas({
  width: 2000,
  height: 2000,
  backgroundColour: 'black',
});
bigChartJSNodeCanvas.registerFont('./fonts/Monda-Regular.ttf', {
  family: 'Monda',
});

export async function campaignHistoryGraph(planet: string) {
  // get all API data for 24 hours ago
  const pastData = await db.query.apiData.findMany({
    orderBy: desc(apiData.time),
    limit: 24,
  });
  pastData.sort((a, b) => a.time - b.time);
  const pastCampaignData: {time: Date; data: MergedCampaignData}[] = [];

  for (const data of pastData) {
    const campaign = data.data.Campaigns.find(c => c.planetName === planet);
    if (!campaign) continue;
    pastCampaignData.push({
      time: data.createdAt,
      data: campaign,
    });
  }

  const currData = getCampaignByPlanetName(planet) as MergedCampaignData;
  pastCampaignData.push({
    time: new Date(),
    data: currData,
  });
  const liberationType = currData.campaignType;
  const data =
    liberationType === 'Liberation'
      ? (pastCampaignData.map(d => d?.data?.planetData?.liberation) as number[])
      : (pastCampaignData.map(d => d?.data?.planetEvent?.defence) as number[]);

  const configuration: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: pastCampaignData.map(d =>
        dayjs(d.time).utc().format('DD MMM hh:mmA')
      ),
      datasets: [
        {
          label: 'Players (k)',
          data: pastCampaignData.map(d => d.data?.planetData?.players / 1000),
          borderColor: 'rgb(255, 255, 0)', // Yellow
          borderWidth: 1,
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: `${liberationType} (%)`,
          data: data,
          borderColor:
            liberationType === 'Liberation'
              ? 'rgb(191, 42, 42)'
              : 'rgb(38, 90, 148)',
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
          text: `${planet} ${liberationType} History`,
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

  return renderMediumChart(configuration);
}

export const renderMediumChart = (configuration: ChartConfiguration) =>
  smallChartJSNodeCanvas.renderToBuffer(configuration);

export const renderBigChart = (configuration: ChartConfiguration) =>
  bigChartJSNodeCanvas.renderToBuffer(configuration);
