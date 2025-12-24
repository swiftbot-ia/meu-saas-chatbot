-- =============================================================================
-- SwiftBot Affiliate System - Database Schema
-- Execute no Supabase PRINCIPAL
-- =============================================================================

-- =============================================================================
-- 1. AFFILIATE_APPLICATIONS - Formulário de aplicação para afiliados
-- =============================================================================
CREATE TABLE IF NOT EXISTS affiliate_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  why_affiliate TEXT NOT NULL,
  favorite_feature TEXT NOT NULL,
  has_experience BOOLEAN DEFAULT false,
  experience_details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_user_id ON affiliate_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_status ON affiliate_applications(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_created_at ON affiliate_applications(created_at DESC);

-- RLS
ALTER TABLE affiliate_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications" ON affiliate_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" ON affiliate_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage applications" ON affiliate_applications
  FOR ALL USING (true);

-- =============================================================================
-- 2. AFFILIATES - Afiliados aprovados com Stripe Connect
-- =============================================================================
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  application_id UUID REFERENCES affiliate_applications(id) ON DELETE SET NULL,
  affiliate_code TEXT UNIQUE NOT NULL,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  commission_rate DECIMAL(4,2) DEFAULT 0.30 NOT NULL,
  commission_months INTEGER DEFAULT 6 NOT NULL,
  total_earned DECIMAL(10,2) DEFAULT 0 NOT NULL,
  total_withdrawn DECIMAL(10,2) DEFAULT 0 NOT NULL,
  available_balance DECIMAL(10,2) DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'pending_onboarding' CHECK (status IN ('pending_onboarding', 'active', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_affiliate_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_stripe_account_id ON affiliates(stripe_account_id);

-- RLS
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate" ON affiliates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage affiliates" ON affiliates
  FOR ALL USING (true);

-- =============================================================================
-- 3. AFFILIATE_REFERRALS - Usuários indicados por afiliados
-- =============================================================================
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code_used TEXT NOT NULL,
  signup_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  first_payment_date TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  total_payments DECIMAL(10,2) DEFAULT 0,
  total_commissions DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'active', 'expired', 'churned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(referred_user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_user_id ON affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON affiliate_referrals(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_expires_at ON affiliate_referrals(expires_at);

-- RLS
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own referrals" ON affiliate_referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM affiliates a
      WHERE a.id = affiliate_referrals.affiliate_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage referrals" ON affiliate_referrals
  FOR ALL USING (true);

-- =============================================================================
-- 4. AFFILIATE_COMMISSIONS - Comissões por pagamento
-- =============================================================================
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  referral_id UUID REFERENCES affiliate_referrals(id) ON DELETE CASCADE NOT NULL,
  payment_log_id UUID,
  stripe_invoice_id TEXT,
  payment_amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(4,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'withdrawn')),
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  available_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_referral_id ON affiliate_commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_available_date ON affiliate_commissions(available_date);

-- RLS
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own commissions" ON affiliate_commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM affiliates a
      WHERE a.id = affiliate_commissions.affiliate_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage commissions" ON affiliate_commissions
  FOR ALL USING (true);

-- =============================================================================
-- 5. AFFILIATE_WITHDRAWALS - Solicitações de saque
-- =============================================================================
CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  stripe_transfer_id TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_affiliate_id ON affiliate_withdrawals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_status ON affiliate_withdrawals(status);

-- RLS
ALTER TABLE affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own withdrawals" ON affiliate_withdrawals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM affiliates a
      WHERE a.id = affiliate_withdrawals.affiliate_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can create own withdrawals" ON affiliate_withdrawals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM affiliates a
      WHERE a.id = affiliate_withdrawals.affiliate_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage withdrawals" ON affiliate_withdrawals
  FOR ALL USING (true);

-- =============================================================================
-- 6. TRIGGERS PARA UPDATED_AT
-- =============================================================================
CREATE OR REPLACE FUNCTION update_affiliate_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_affiliate_applications_updated ON affiliate_applications;
CREATE TRIGGER trigger_affiliate_applications_updated
  BEFORE UPDATE ON affiliate_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_timestamp();

DROP TRIGGER IF EXISTS trigger_affiliates_updated ON affiliates;
CREATE TRIGGER trigger_affiliates_updated
  BEFORE UPDATE ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_timestamp();

-- =============================================================================
-- 7. HELPER FUNCTIONS
-- =============================================================================

-- Gerar código de afiliado único
CREATE OR REPLACE FUNCTION generate_affiliate_code(user_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  suffix INTEGER := 0;
BEGIN
  -- Pegar primeiras 6 letras do nome (uppercase, sem espaços)
  base_code := UPPER(REGEXP_REPLACE(LEFT(user_name, 6), '[^A-Z]', '', 'gi'));
  
  -- Se muito curto, complementar
  IF LENGTH(base_code) < 4 THEN
    base_code := base_code || 'SWIFT';
  END IF;
  
  final_code := base_code;
  
  -- Verificar se já existe e adicionar sufixo se necessário
  WHILE EXISTS (SELECT 1 FROM affiliates WHERE affiliate_code = final_code) LOOP
    suffix := suffix + 1;
    final_code := base_code || suffix::TEXT;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Calcular comissões disponíveis para um afiliado
CREATE OR REPLACE FUNCTION calculate_affiliate_available_balance(aff_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  available DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(commission_amount), 0)
  INTO available
  FROM affiliate_commissions
  WHERE affiliate_id = aff_id
  AND status = 'available';
  
  RETURN available;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DONE!
-- =============================================================================
