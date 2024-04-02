import 'dotenv/config';

import {client, lostDefenceUpdate} from '../src/handlers';
import {config, isProd} from '../src/config';
import {MergedCampaignData} from '../src/api-wrapper';
import {announcementChannels, db, eq} from '../src/db';
import {and} from 'drizzle-orm';

const {BOT_TOKEN} = config;

async function main() {
  await client.login(BOT_TOKEN);
  // client.on('ready', async () => await onReady(client));
  console.log(`Logged in as ${client.user?.tag}`);

  const defence: MergedCampaignData = {
    id: 50055,
    planetIndex: 78,
    type: 0,
    count: 4,
    planetName: 'Crimsica',
    planetEvent: {
      id: 4346,
      planetIndex: 78,
      eventType: 'Defend',
      race: 'Terminids',
      health: 67744,
      maxHealth: 400000,
      startTime: 4444860,
      expireTime: 4531260,
      campaignId: 50055,
      jointOperationIds: [4346],
      defence: 83.064,
      planetName: 'Crimsica',
    },
    planetData: {
      name: 'Crimsica',
      liberation: 0,
      lossPercPerHour: 500,
      playerPerc: 18.15,
      index: 78,
      settingsHash: 1886266372,
      position: {
        x: 0.6113544,
        y: 0.22880854,
      },
      waypoints: [169, 170],
      sector: 21,
      maxHealth: 1000000,
      disabled: false,
      initialOwner: 'Terminids',
      owner: 'Humans',
      health: 1000000,
      regenPerSecond: 1388.8889,
      players: 38495,
    },
    campaignType: 'Defend',
  };

  const warAnnChannels = await db.query.announcementChannels.findMany({
    where: and(
      eq(announcementChannels.production, isProd),
      eq(announcementChannels.type, 'war_announcements')
    ),
  });
  const channelIds = warAnnChannels.map(c => c.channelId);
  console.log(`Found ${channelIds.length} announcement channels`);
  console.log(channelIds);

  await lostDefenceUpdate(defence, channelIds);

  console.log('Logging out...');
  await client.destroy();
}

main();
