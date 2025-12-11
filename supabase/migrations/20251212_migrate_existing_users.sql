-- =============================================================================
-- Migration: Migrate Existing Users to Accounts System
-- =============================================================================
-- Date: 2025-12-12
-- Description: Creates accounts for all existing users and adds them as owners
-- =============================================================================

-- =============================================================================
-- 1. Create accounts for all existing users with user_profiles
-- =============================================================================
-- Each existing user becomes an account owner with their own account

INSERT INTO public.accounts (owner_user_id, name)
SELECT 
  up.user_id,
  COALESCE(up.company_name, up.full_name, 'Minha Conta')
FROM public.user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM public.accounts a WHERE a.owner_user_id = up.user_id
)
ON CONFLICT (owner_user_id) DO NOTHING;

-- =============================================================================
-- 2. Add all account owners as members with 'owner' role
-- =============================================================================
-- The owner is also a member of their own account (simplifies queries)

INSERT INTO public.account_members (account_id, user_id, role, must_reset_password)
SELECT 
  a.id,
  a.owner_user_id,
  'owner',
  false  -- Owner doesn't need to reset password
FROM public.accounts a
WHERE NOT EXISTS (
  SELECT 1 FROM public.account_members am 
  WHERE am.account_id = a.id AND am.user_id = a.owner_user_id
)
ON CONFLICT (account_id, user_id) DO NOTHING;

-- =============================================================================
-- 3. Verification query (run manually to check migration)
-- =============================================================================
-- SELECT 
--   up.user_id,
--   up.full_name,
--   a.id as account_id,
--   am.role
-- FROM public.user_profiles up
-- LEFT JOIN public.accounts a ON a.owner_user_id = up.user_id
-- LEFT JOIN public.account_members am ON am.user_id = up.user_id
-- ORDER BY up.created_at DESC;

-- =============================================================================
-- DONE!
-- =============================================================================
