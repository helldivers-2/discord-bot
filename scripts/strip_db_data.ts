import {db} from '../src/db';
import fs from 'fs';

const main = async () => {
  const allData = await db.query.apiData.findMany();
  fs.writeFileSync('api_data.json', JSON.stringify(allData, null, 2));

  return;
};
main();
