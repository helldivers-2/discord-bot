ALTER TABLE "persistent_messages" ADD COLUMN "type" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "persistent_messages" DROP COLUMN IF EXISTS "announcement_types";