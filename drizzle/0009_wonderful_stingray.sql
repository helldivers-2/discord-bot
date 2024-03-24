ALTER TABLE "prev_data" ADD COLUMN "production" boolean;
UPDATE "prev_data" SET "production" = true;
ALTER TABLE "prev_data" ALTER COLUMN "production" SET NOT NULL;
