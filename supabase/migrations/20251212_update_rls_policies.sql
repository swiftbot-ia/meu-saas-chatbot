-- =============================================================================
-- Migration: Update RLS Policies for Multi-User Access
-- =============================================================================
-- Date: 2025-12-12
-- Description: Updates RLS policies on existing tables to allow team members
--              to access the same data as the account owner
-- =============================================================================

-- =============================================================================
-- IMPORTANT: These policies use OR to maintain backward compatibility
-- The original user_id check still works, but now team members can also access
-- =============================================================================

-- =============================================================================
-- 1. whatsapp_connections - Team members can access owner's connections
-- =============================================================================

-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view own connections" ON public.whatsapp_connections;
DROP POLICY IF EXISTS "Team members can view account connections" ON public.whatsapp_connections;

-- Create new policy that allows team access
CREATE POLICY "Team members can view account connections" 
ON public.whatsapp_connections
FOR SELECT
USING (
  user_id = auth.uid() OR
  public.user_has_account_access(user_id)
);

-- Keep insert/update/delete policies as before (only owner can modify)
DROP POLICY IF EXISTS "Users can insert own connections" ON public.whatsapp_connections;
CREATE POLICY "Users can insert own connections" ON public.whatsapp_connections
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own connections" ON public.whatsapp_connections;
CREATE POLICY "Users can update own connections" ON public.whatsapp_connections
FOR UPDATE USING (user_id = auth.uid() OR public.user_has_account_access(user_id));

DROP POLICY IF EXISTS "Users can delete own connections" ON public.whatsapp_connections;
CREATE POLICY "Users can delete own connections" ON public.whatsapp_connections
FOR DELETE USING (user_id = auth.uid());

-- =============================================================================
-- 2. ai_agents - Team members can view and use agent config
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own agents" ON public.ai_agents;
DROP POLICY IF EXISTS "Team members can view account agents" ON public.ai_agents;

CREATE POLICY "Team members can view account agents" 
ON public.ai_agents
FOR SELECT
USING (
  user_id = auth.uid() OR
  public.user_has_account_access(user_id)
);

DROP POLICY IF EXISTS "Users can insert own agents" ON public.ai_agents;
CREATE POLICY "Users can insert own agents" ON public.ai_agents
FOR INSERT WITH CHECK (user_id = auth.uid() OR public.user_has_account_access(user_id));

DROP POLICY IF EXISTS "Users can update own agents" ON public.ai_agents;
CREATE POLICY "Users can update own agents" ON public.ai_agents
FOR UPDATE USING (user_id = auth.uid() OR public.user_has_account_access(user_id));

DROP POLICY IF EXISTS "Users can delete own agents" ON public.ai_agents;
CREATE POLICY "Users can delete own agents" ON public.ai_agents
FOR DELETE USING (user_id = auth.uid());

-- =============================================================================
-- 3. automations - Team members can manage automations
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own automations" ON public.automations;
DROP POLICY IF EXISTS "Team members can view account automations" ON public.automations;

CREATE POLICY "Team members can view account automations" 
ON public.automations
FOR SELECT
USING (
  user_id = auth.uid() OR
  public.user_has_account_access(user_id)
);

DROP POLICY IF EXISTS "Users can insert own automations" ON public.automations;
CREATE POLICY "Users can insert own automations" ON public.automations
FOR INSERT WITH CHECK (user_id = auth.uid() OR public.user_has_account_access(user_id));

DROP POLICY IF EXISTS "Users can update own automations" ON public.automations;
CREATE POLICY "Users can update own automations" ON public.automations
FOR UPDATE USING (user_id = auth.uid() OR public.user_has_account_access(user_id));

DROP POLICY IF EXISTS "Users can delete own automations" ON public.automations;
CREATE POLICY "Users can delete own automations" ON public.automations
FOR DELETE USING (user_id = auth.uid() OR public.user_has_account_access(user_id));

-- =============================================================================
-- 4. automation_folders - Team access
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own automation folders" ON public.automation_folders;
DROP POLICY IF EXISTS "Team members can view account automation folders" ON public.automation_folders;

CREATE POLICY "Team members can view account automation folders" 
ON public.automation_folders
FOR SELECT
USING (
  user_id = auth.uid() OR
  public.user_has_account_access(user_id)
);

DROP POLICY IF EXISTS "Users can manage own automation folders" ON public.automation_folders;
CREATE POLICY "Users can manage own automation folders" ON public.automation_folders
FOR ALL USING (user_id = auth.uid() OR public.user_has_account_access(user_id));

-- =============================================================================
-- 5. automation_sequences - Team access
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own sequences" ON public.automation_sequences;
DROP POLICY IF EXISTS "Team members can view account sequences" ON public.automation_sequences;

CREATE POLICY "Team members can view account sequences" 
ON public.automation_sequences
FOR SELECT
USING (
  user_id = auth.uid() OR
  public.user_has_account_access(user_id)
);

DROP POLICY IF EXISTS "Users can manage own sequences" ON public.automation_sequences;
CREATE POLICY "Users can manage own sequences" ON public.automation_sequences
FOR ALL USING (user_id = auth.uid() OR public.user_has_account_access(user_id));

-- =============================================================================
-- 6. message_templates - Team access
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own templates" ON public.message_templates;
DROP POLICY IF EXISTS "Team members can view account templates" ON public.message_templates;

CREATE POLICY "Team members can view account templates" 
ON public.message_templates
FOR SELECT
USING (
  user_id = auth.uid() OR
  public.user_has_account_access(user_id)
);

DROP POLICY IF EXISTS "Users can manage own templates" ON public.message_templates;
CREATE POLICY "Users can manage own templates" ON public.message_templates
FOR ALL USING (user_id = auth.uid() OR public.user_has_account_access(user_id));

-- =============================================================================
-- 7. user_subscriptions - ONLY OWNER can access (no team access)
-- =============================================================================
-- Subscriptions remain user_id based - only the account owner can manage

DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
FOR SELECT
USING (user_id = auth.uid());

-- =============================================================================
-- 8. user_profiles - Each user has their own profile (no sharing)
-- =============================================================================
-- Profiles remain individual - team members have separate profiles

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 9. user_credits - Team can share credits (linked to account)
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Team members can view account credits" ON public.user_credits;

CREATE POLICY "Team members can view account credits" 
ON public.user_credits
FOR SELECT
USING (
  user_id = auth.uid() OR
  public.user_has_account_access(user_id)
);

-- Only owner can update credits (UPSERT operations)
DROP POLICY IF EXISTS "Users can manage own credits" ON public.user_credits;
CREATE POLICY "Users can manage own credits" ON public.user_credits
FOR ALL USING (user_id = auth.uid());

-- =============================================================================
-- 10. swiftbot_conversations - Individual per user (AI chat history)
-- =============================================================================
-- SwiftBot IA conversations remain individual - each user has their own

DROP POLICY IF EXISTS "Users can view own swiftbot conversations" ON public.swiftbot_conversations;
CREATE POLICY "Users can view own swiftbot conversations" ON public.swiftbot_conversations
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own swiftbot conversations" ON public.swiftbot_conversations;
CREATE POLICY "Users can manage own swiftbot conversations" ON public.swiftbot_conversations
FOR ALL USING (user_id = auth.uid());

-- =============================================================================
-- 11. support_tickets - Individual per user (each member can create tickets)
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets" ON public.support_tickets
FOR SELECT
USING (user_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Users can create own tickets" ON public.support_tickets;
CREATE POLICY "Users can create own tickets" ON public.support_tickets
FOR INSERT
WITH CHECK (user_id = auth.uid()::uuid);

-- =============================================================================
-- DONE!
-- =============================================================================
