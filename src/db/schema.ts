import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

// https://orm.drizzle.team/docs/column-types/pg
export const permsEnum = pgEnum('user_perms', ['admin', 'officer']);

export const announcementChannels = pgTable('announcement_channels', {
  channelId: varchar('channel_id').primaryKey(),
  type: varchar('type').notNull(),
  userId: varchar('user_id').notNull(),
  guildId: varchar('guild_id').notNull(),
  production: boolean('production').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const persistentMessages = pgTable('persistent_messages', {
  messageId: varchar('message_id').primaryKey(),
  channelId: varchar('channel_id').notNull(),
  type: varchar('type').notNull(),
  userId: varchar('user_id').notNull(),
  guildId: varchar('guild_id').notNull(),
  production: boolean('production').notNull(),
  deleted: boolean('deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
