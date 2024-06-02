CREATE TABLE IF NOT EXISTS "arrowhead_discord_anns" (
	"message_id" varchar PRIMARY KEY NOT NULL,
	"channel_id" varchar NOT NULL,
	"channel_name" varchar NOT NULL,
	"content" varchar NOT NULL,
	"timestamp" timestamp NOT NULL,
	"edited_timestamp" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
