-- Make affiliate_code nullable to allow approval without a code
ALTER TABLE affiliates ALTER COLUMN affiliate_code DROP NOT NULL;
