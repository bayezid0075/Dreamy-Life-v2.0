-- Add new columns to user_info table for profile update feature
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS gender varchar(20);
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS father_name varchar(255);
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS mother_name varchar(255);
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS preferred_language varchar(5) DEFAULT 'en';
