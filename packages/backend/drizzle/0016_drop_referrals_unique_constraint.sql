-- Remove unique constraint on referred_id so a user can appear at multiple referral levels
ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "referrals_referred_id_key";
