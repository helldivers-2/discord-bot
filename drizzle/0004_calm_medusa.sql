ALTER TABLE "announcement_channels" ADD COLUMN "type" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "announcement_channels" DROP COLUMN IF EXISTS "announcement_types";