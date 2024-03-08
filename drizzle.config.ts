import 'dotenv/config';
// eslint-disable-next-line node/no-unpublished-import
import {defineConfig} from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL as string,
    ssl: true,
  },
  verbose: true,
  strict: true,
});
