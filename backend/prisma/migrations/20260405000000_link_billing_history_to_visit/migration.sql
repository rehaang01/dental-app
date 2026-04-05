-- Add optional visitId to BillingHistory so visit-created entries can be
-- found and deleted when the visit itself is deleted.
ALTER TABLE "BillingHistory" ADD COLUMN "visitId" TEXT;