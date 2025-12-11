-- =============================================================================
-- Migration: Create Multi-User Team System Tables
-- =============================================================================
-- Date: 2025-12-12
-- Description: Creates accounts and account_members tables for multi-user
--              team management functionality
-- =============================================================================

-- =============================================================================
-- 1. Create accounts table
-- =============================================================================
-- This table represents the "parent account" (conta mãe) that owns all resources
-- The owner_user_id is the original user who created the account

CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  name text,
  max_members integer DEFAULT 5,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_owner_user_id_unique UNIQUE (owner_user_id),
  CONSTRAINT accounts_owner_user_id_fkey FOREIGN KEY (owner_user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_owner_user_id ON public.accounts(owner_user_id);

-- Add comment
COMMENT ON TABLE public.accounts IS 
  'Parent accounts that own all resources. Each user who signs up becomes an account owner.';

-- =============================================================================
-- 2. Create account_members table
-- =============================================================================
-- This table links users to accounts with their roles
-- Roles: owner (can manage everything), member (can access shared resources)

CREATE TABLE IF NOT EXISTS public.account_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role varchar NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  invited_by uuid,
  invited_at timestamp with time zone DEFAULT now(),
  must_reset_password boolean DEFAULT false,
  
  CONSTRAINT account_members_pkey PRIMARY KEY (id),
  CONSTRAINT account_members_account_user_unique UNIQUE (account_id, user_id),
  CONSTRAINT account_members_account_id_fkey FOREIGN KEY (account_id) 
    REFERENCES public.accounts(id) ON DELETE CASCADE,
  CONSTRAINT account_members_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT account_members_invited_by_fkey FOREIGN KEY (invited_by) 
    REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_account_members_account_id ON public.account_members(account_id);
CREATE INDEX IF NOT EXISTS idx_account_members_user_id ON public.account_members(user_id);

-- Add comment
COMMENT ON TABLE public.account_members IS 
  'Links users to accounts. Owner role has full access, member role has access to shared resources.';

-- =============================================================================
-- 3. Create trigger to update updated_at on accounts
-- =============================================================================
CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_accounts_updated_at ON public.accounts;
CREATE TRIGGER trigger_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_accounts_updated_at();

-- =============================================================================
-- 4. Helper function to check if user has access to account data
-- =============================================================================
-- This function checks if the current authenticated user belongs to the same
-- account as the target user_id. Used in RLS policies.

CREATE OR REPLACE FUNCTION public.user_has_account_access(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- If target is the same user, always allow
  IF auth.uid() = target_user_id THEN
    RETURN true;
  END IF;
  
  -- Check if both users are members of the same account
  RETURN EXISTS (
    SELECT 1 
    FROM public.account_members am1
    JOIN public.account_members am2 ON am1.account_id = am2.account_id
    WHERE am1.user_id = auth.uid()
      AND am2.user_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. Helper function to get account_id for a user
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_user_account_id(target_user_id uuid)
RETURNS uuid AS $$
DECLARE
  v_account_id uuid;
BEGIN
  SELECT account_id INTO v_account_id
  FROM public.account_members
  WHERE user_id = target_user_id
  LIMIT 1;
  
  RETURN v_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. Enable RLS on new tables
-- =============================================================================
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 7. RLS Policies for accounts table
-- =============================================================================

-- Users can view their own account
CREATE POLICY "Users can view own account" ON public.accounts
  FOR SELECT
  USING (
    owner_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.account_members
      WHERE account_id = accounts.id AND user_id = auth.uid()
    )
  );

-- Only owner can update account
CREATE POLICY "Owner can update account" ON public.accounts
  FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role full access to accounts" ON public.accounts
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- 8. RLS Policies for account_members table
-- =============================================================================

-- Users can view members of their own account
CREATE POLICY "Users can view account members" ON public.account_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.account_members am
      WHERE am.account_id = account_members.account_id 
        AND am.user_id = auth.uid()
    )
  );

-- Only owners can insert new members
CREATE POLICY "Owner can add members" ON public.account_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE id = account_id AND owner_user_id = auth.uid()
    )
  );

-- Only owners can delete members (except themselves)
CREATE POLICY "Owner can remove members" ON public.account_members
  FOR DELETE
  USING (
    user_id != auth.uid() AND -- Can't delete yourself
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE id = account_id AND owner_user_id = auth.uid()
    )
  );

-- Users can update their own membership (for password reset flag)
CREATE POLICY "Users can update own membership" ON public.account_members
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can do everything
CREATE POLICY "Service role full access to account_members" ON public.account_members
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- 9. Auto-create account for new users
-- =============================================================================
-- This trigger automatically creates an account and membership when a new
-- user is created (during signup). This ensures every user has an account.

CREATE OR REPLACE FUNCTION public.auto_create_account_for_user()
RETURNS TRIGGER AS $$
DECLARE
  v_account_id uuid;
BEGIN
  -- Create a new account for this user
  INSERT INTO public.accounts (owner_user_id, name, max_members)
  VALUES (NEW.id, 'Minha Conta', 5)
  RETURNING id INTO v_account_id;
  
  -- Add the user as owner of this account
  INSERT INTO public.account_members (account_id, user_id, role, must_reset_password)
  VALUES (v_account_id, NEW.id, 'owner', false);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_create_account ON auth.users;
CREATE TRIGGER trigger_auto_create_account
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_account_for_user();

-- =============================================================================
-- DONE!
-- =============================================================================
