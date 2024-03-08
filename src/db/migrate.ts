import {drizzle} from 'drizzle-orm/postgres-js';
import {migrate} from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import {config} from '../config';

const {DATABASE_URL} = config;

const migrationClient = postgres(DATABASE_URL, {max: 1, ssl: 'require'});

(async () => {
  // This will run migrations on the database, skipping the ones already applied
  await migrate(drizzle(migrationClient), {migrationsFolder: 'drizzle'});
  // Don't forget to close the connection, otherwise the script will hang
  await migrationClient.end();
})();
