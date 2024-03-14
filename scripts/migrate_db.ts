import {
  announcementChannels,
  apiData as dbApiData,
  prevData as dbPrevData,
  db,
  eq,
  newAnnouncementChannel,
  newApiData,
  newPersistentMessage,
  newPrevData,
  // supaDb,
  persistentMessages,
} from '../src/db';

const main = async () => {
  const annChanns = await db.query.announcementChannels.findMany();
  const apiData = await db.query.apiData.findMany();
  const persMsg = await db.query.persistentMessages.findMany();
  const prevData = await db.query.prevData.findMany();
  console.log('Migrating data to supabase...');
  console.log(`Found ${annChanns.length} announcement channels to migrate`);
  console.log(`Found ${apiData.length} api data to migrate`);
  console.log(`Found ${persMsg.length} persistent messages to migrate`);
  console.log(`Found ${prevData.length} previous data to migrate`);
  let count = 0;
  for (const annChann of annChanns) {
    count++;
    console.log(`Migrating announcement channel ${count}/${annChanns.length}`);
    const data = db.query.announcementChannels.findFirst({
      where: eq(announcementChannels.channelId, annChann.channelId),
    });
    if (!data) await newAnnouncementChannel(annChann);
    else console.log('Announcement channel already exists in db, skipping...');
  }
  count = 0;
  console.log('Migrated announcement channels');
  for (const api of apiData) {
    count++;
    console.log(`Migrating api data ${count}/${apiData.length}`);
    const data = db.query.apiData.findFirst({
      where: eq(dbApiData.time, api.time),
    });
    if (!data) await newApiData(api);
    else console.log('API Data already exists in db, skipping...');
  }
  count = 0;
  console.log('Migrated api data');
  for (const msg of persMsg) {
    count++;
    console.log(`Migrating persistent message ${count}/${persMsg.length}`);
    const data = db.query.persistentMessages.findFirst({
      where: eq(persistentMessages.messageId, msg.messageId),
    });
    if (!data) await newPersistentMessage(msg);
    else console.log('Persistent message already exists in db, skipping...');
  }
  count = 0;
  console.log('Migrated persistent messages');
  for (const prev of prevData) {
    count++;
    console.log(`Migrating previous data ${count}/${prevData.length}`);
    const data = db.query.prevData.findFirst({
      where: eq(dbPrevData.time, prev.time),
    });
    if (!data) await newPrevData(prev);
    else console.log('Previous data already exists in db, skipping...');
  }
  count = 0;
  console.log('Migrated previous data');
  return;
};

main();
