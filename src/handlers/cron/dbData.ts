import {StrippedApiData, getData} from '../../api-wrapper';
import {apiData, db, eq, newApiData} from '../../db';

export async function dbData() {
  const data = await getData();
  const strippedData = data as StrippedApiData;

  const existingData = await db.query.apiData.findFirst({
    where: eq(apiData.time, strippedData.Status.time),
  });

  if (existingData) {
    console.log('Data already exists in database!');
    return;
  }

  await newApiData({
    time: strippedData.Status.time,
    warId: strippedData.WarInfo.warId,
    data: strippedData,
  });

  console.log('Committing new API data to database!');
}
