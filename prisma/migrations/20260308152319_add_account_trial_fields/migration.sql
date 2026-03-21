<<<<<<< HEAD
-- Add account trial fields to User model
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialStart" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialEnd" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hasUsedTrial" BOOLEAN NOT NULL DEFAULT false;
=======
-- Add account trial fields to User model
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialStart" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialEnd" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hasUsedTrial" BOOLEAN NOT NULL DEFAULT false;
>>>>>>> origin/main
