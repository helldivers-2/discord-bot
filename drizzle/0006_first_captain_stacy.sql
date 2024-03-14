CREATE TABLE IF NOT EXISTS "prev_data" (
	"time" integer PRIMARY KEY NOT NULL,
	"war_id" integer NOT NULL,
	"data" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
