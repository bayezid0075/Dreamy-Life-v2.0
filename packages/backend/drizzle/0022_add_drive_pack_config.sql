ALTER TABLE "recharge_config" ADD COLUMN "drive_pack_buyer_commission_rate" decimal(5, 2) NOT NULL DEFAULT '5.00';
ALTER TABLE "recharge_config" ADD COLUMN "drive_pack_cashback_rate" decimal(5, 2) NOT NULL DEFAULT '0.00';
ALTER TABLE "recharge_config" ADD COLUMN "drive_pack_commission_rates" jsonb NOT NULL DEFAULT '[3, 2, 1, 0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1]';
ALTER TABLE "recharge_config" ADD COLUMN "drive_pack_is_active" boolean NOT NULL DEFAULT false;
