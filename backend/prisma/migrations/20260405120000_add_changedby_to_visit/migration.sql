-- Add changedBy column to Visit table to track which logged-in user added the visit
ALTER TABLE "Visit" ADD COLUMN "changedBy" TEXT NOT NULL DEFAULT '';