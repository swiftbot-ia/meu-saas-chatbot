-- ============================================================================
-- Script SQL SIMPLIFICADO para Ativar Super Account
-- Execute este script diretamente no Supabase SQL Editor
-- ============================================================================

-- ⚠️ IMPORTANTE: Substitua 'SEU_EMAIL_AQUI' pelo email do usuário antes de executar!

-- ----------------------------------------------------------------------------
-- ✅ SOLUÇÃO RÁPIDA: Marcar como super account + criar bypass
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'caio.guedes@swiftbot.com.br'; -- ➡️ ALTERE AQUI
BEGIN
  -- 1. Buscar user_id (case-insensitive e sem espaços)
  SELECT user_id INTO v_user_id
  FROM user_profiles
  WHERE TRIM(LOWER(email)) = TRIM(LOWER(v_email))
  LIMIT 1;
  
  -- Verificar se encontrou
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado com email: %', v_email;
  END IF;
  
  RAISE NOTICE '✅ User ID encontrado: %', v_user_id;
  
  -- 2. Marcar como super account
  UPDATE user_profiles 
  SET is_super_account = true, updated_at = NOW()
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '✅ Marcado como super_account';
  
  -- 3. Cancelar assinaturas normais ativas
  UPDATE user_subscriptions
  SET status = 'canceled', canceled_at = NOW(), updated_at = NOW()
  WHERE user_id = v_user_id
    AND status IN ('active', 'trial', 'trialing')
    AND stripe_subscription_id != 'super_account_bypass';
  
  -- 4. Criar ou atualizar bypass
  -- Verificar se já existe
  IF EXISTS (
    SELECT 1 FROM user_subscriptions 
    WHERE user_id = v_user_id 
      AND stripe_subscription_id = 'super_account_bypass'
  ) THEN
    -- Atualizar existente
    UPDATE user_subscriptions
    SET status = 'active',
        connections_purchased = 7,
        updated_at = NOW()
    WHERE user_id = v_user_id
      AND stripe_subscription_id = 'super_account_bypass';
    
    RAISE NOTICE '✅ Bypass atualizado';
  ELSE
    -- Criar novo
    INSERT INTO user_subscriptions (
      user_id, stripe_subscription_id, status, billing_period,
      connections_purchased, payment_gateway, created_at, updated_at
    ) VALUES (
      v_user_id, 'super_account_bypass', 'active', 'monthly',
      7, 'super_account', NOW(), NOW()
    );
    
    RAISE NOTICE '✅ Bypass criado';
  END IF;
  
  -- 5. Log
  INSERT INTO payment_logs (
    user_id, event_type, amount, payment_method, status,
    metadata, created_at
  ) VALUES (
    v_user_id, 'super_account_bypass_created', 0, 'super_account', 'success',
    '{"connections_limit": 7, "granted_via": "sql_quick_script"}'::jsonb,
    NOW()
  );
  
  RAISE NOTICE '✅ CONCLUÍDO! Super account ativada para: %', v_email;
END $$;

-- Verificar resultado
SELECT 
  up.email,
  up.full_name,
  up.is_super_account,
  us.stripe_subscription_id,
  us.status,
  us.connections_purchased,
  (SELECT COUNT(*) FROM whatsapp_connections wc WHERE wc.user_id = up.user_id) as conexoes_atuais
FROM user_profiles up
LEFT JOIN user_subscriptions us ON us.user_id = up.user_id 
  AND us.stripe_subscription_id = 'super_account_bypass'
WHERE TRIM(LOWER(up.email)) = TRIM(LOWER('caio.guedes@swiftbot.com.br'))  -- ➡️ ALTERE AQUI
ORDER BY us.created_at DESC;
