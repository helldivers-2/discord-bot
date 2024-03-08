DO $$ BEGIN
 CREATE TYPE "user_perms" AS ENUM('admin', 'officer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "announcement_channels" (
	"channel_id" varchar PRIMARY KEY NOT NULL,
	"announcement_types" json,
	"user_id" varchar,
	"guild_id" varchar,
	"production" boolean,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "persistent_messages" (
	"message_id" varchar PRIMARY KEY NOT NULL,
	"channel_id" varchar,
	"announcement_types" json,
	"user_id" varchar,
	"guild_id" varchar,
	"production" boolean,
	"created_at" timestamp DEFAULT now()
);
