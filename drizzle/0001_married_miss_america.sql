ALTER TABLE "announcement_channels" ALTER COLUMN "announcement_types" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "announcement_channels" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "announcement_channels" ALTER COLUMN "guild_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "announcement_channels" ALTER COLUMN "production" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "announcement_channels" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "persistent_messages" ALTER COLUMN "channel_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "persistent_messages" ALTER COLUMN "announcement_types" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "persistent_messages" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "persistent_messages" ALTER COLUMN "guild_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "persistent_messages" ALTER COLUMN "production" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "persistent_messages" ALTER COLUMN "created_at" SET NOT NULL;