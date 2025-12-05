-- ============================================================================
-- Script SQL para Gerenciar Super Accounts
-- Execute este script diretamente no Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CONCEDER STATUS DE SUPER ACCOUNT PARA UM USUÁRIO
-- ----------------------------------------------------------------------------
-- Substitua 'email@exemplo.com' pelo email do usuário que você quer tornar super account

-- Passo 1.1: Marcar usuário como super account
UPDATE user_profiles 
SET is_super_account = true,
    updated_at = NOW()
WHERE email = 'email@exemplo.com';
-- Ou se você tiver o user_id:
-- WHERE user_id = 'uuid-do-usuario-aqui';

-- Passo 1.2: Criar assinatura bypass para o usuário
-- Primeiro, busque o user_id do usuário
DO $$
DECLARE
  v_user_id UUID;
  v_existing_bypass_id UUID;
BEGIN
  -- Buscar user_id pelo email
  SELECT user_id INTO v_user_id
  FROM user_profiles
  WHERE email = 'email@exemplo.com'  -- ➡️ ALTERE AQUI
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  
  RAISE NOTICE 'User ID encontrado: %', v_user_id;
  
  -- Verificar se já existe bypass
  SELECT id INTO v_existing_bypass_id
  FROM user_subscriptions
  WHERE user_id = v_user_id
    AND stripe_subscription_id = 'super_account_bypass'
  LIMIT 1;
    
  IF v_existing_bypass_id IS NOT NULL THEN
    -- Atualizar bypass existente para ativo
    UPDATE user_subscriptions
    SET status = 'active',
        connections_purchased = 7,
        updated_at = NOW()
    WHERE id = v_existing_bypass_id;
    
    RAISE NOTICE 'Bypass existente atualizado: %', v_existing_bypass_id;
  ELSE
    -- Cancelar assinaturas ativas anteriores
    UPDATE user_subscriptions
    SET status = 'canceled',
        canceled_at = NOW(),
        updated_at = NOW()
    WHERE user_id = v_user_id
      AND status IN ('active', 'trial', 'trialing')
      AND stripe_subscription_id != 'super_account_bypass';
      
    -- Criar novo bypass
    INSERT INTO user_subscriptions (
      user_id,
      stripe_subscription_id,
      status,
      billing_period,
      connections_purchased,
      trial_start_date,
      trial_end_date,
      next_billing_date,
      stripe_customer_id,
      stripe_payment_method_id,
      payment_gateway,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      'super_account_bypass',
      'active',
      'monthly',
      7,  -- Limite máximo de conexões
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      'super_account',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Novo bypass criado para user_id: %', v_user_id;
  END IF;
  
  -- Registrar log
  INSERT INTO payment_logs (
    user_id,
    event_type,
    amount,
    payment_method,
    status,
    metadata,
    created_at
  ) VALUES (
    v_user_id,
    'super_account_bypass_created',
    0,
    'super_account',
    'success',
    jsonb_build_object(
      'is_super_account', true,
      'connections_limit', 7,
      'granted_via', 'sql_script'
    ),
    NOW()
  );
  
END $$;

-- ✅ Verificar se funcionou
SELECT 
  up.email,
  up.full_name,
  up.is_super_account,
  us.stripe_subscription_id,
  us.status,
  us.connections_purchased
FROM user_profiles up
LEFT JOIN user_subscriptions us ON us.user_id = up.user_id
WHERE TRIM(LOWER(up.email)) = TRIM(LOWER('caio.guedes@swiftbot.com.br'));  -- ➡️ ALTERE AQUI


-- ----------------------------------------------------------------------------
-- 2. REVOGAR STATUS DE SUPER ACCOUNT DE UM USUÁRIO
-- ----------------------------------------------------------------------------

-- Passo 2.1: Remover flag de super account
UPDATE user_profiles 
SET is_super_account = false,
    updated_at = NOW()
WHERE email = 'email@exemplo.com';  -- ➡️ ALTERE AQUI

-- Passo 2.2: Cancelar assinatura bypass
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar user_id pelo email
  SELECT user_id INTO v_user_id
  FROM user_profiles
  WHERE email = 'email@exemplo.com'  -- ➡️ ALTERE AQUI
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  
  -- Cancelar bypass
  UPDATE user_subscriptions
  SET status = 'canceled',
      canceled_at = NOW(),
      updated_at = NOW()
  WHERE user_id = v_user_id
    AND stripe_subscription_id = 'super_account_bypass';
    
  -- Registrar log
  INSERT INTO payment_logs (
    user_id,
    event_type,
    amount,
    payment_method,
    status,
    created_at
  ) VALUES (
    v_user_id,
    'super_account_bypass_removed',
    0,
    'super_account',
    'canceled',
    NOW()
  );
  
  RAISE NOTICE 'Super account revogada para user_id: %', v_user_id;
END $$;


-- ----------------------------------------------------------------------------
-- 3. LISTAR TODAS AS SUPER ACCOUNTS ATIVAS
-- ----------------------------------------------------------------------------

SELECT 
  up.email,
  up.full_name,
  up.company_name,
  up.is_super_account,
  up.created_at as perfil_criado_em,
  us.stripe_subscription_id,
  us.status as assinatura_status,
  us.connections_purchased,
  us.created_at as assinatura_criada_em,
  (SELECT COUNT(*) FROM whatsapp_connections wc WHERE wc.user_id = up.user_id) as conexoes_criadas
FROM user_profiles up
LEFT JOIN user_subscriptions us ON us.user_id = up.user_id 
  AND us.stripe_subscription_id = 'super_account_bypass'
WHERE up.is_super_account = true
ORDER BY up.created_at DESC;


-- ----------------------------------------------------------------------------
-- 4. VERIFICAR STATUS DE UM USUÁRIO ESPECÍFICO
-- ----------------------------------------------------------------------------

SELECT 
  up.user_id,
  up.email,
  up.full_name,
  up.is_super_account,
  us.stripe_subscription_id,
  us.status,
  us.connections_purchased,
  us.created_at as bypass_criado_em,
  (SELECT COUNT(*) FROM whatsapp_connections wc WHERE wc.user_id = up.user_id) as total_conexoes
FROM user_profiles up
LEFT JOIN user_subscriptions us ON us.user_id = up.user_id
WHERE up.email = 'email@exemplo.com'  -- ➡️ ALTERE AQUI
ORDER BY us.created_at DESC;


-- ----------------------------------------------------------------------------
-- 5. LIMPAR SUPER ACCOUNT ÓRFÃ (sem bypass)
-- ----------------------------------------------------------------------------
-- Use este script se encontrar super accounts sem assinatura bypass

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT up.user_id, up.email
    FROM user_profiles up
    WHERE up.is_super_account = true
      AND NOT EXISTS (
        SELECT 1 FROM user_subscriptions us 
        WHERE us.user_id = up.user_id 
          AND us.stripe_subscription_id = 'super_account_bypass'
          AND us.status = 'active'
      )
  LOOP
    RAISE NOTICE 'Criando bypass para: % (%)', rec.email, rec.user_id;
    
    -- Criar bypass
    INSERT INTO user_subscriptions (
      user_id,
      stripe_subscription_id,
      status,
      billing_period,
      connections_purchased,
      payment_gateway,
      created_at,
      updated_at
    ) VALUES (
      rec.user_id,
      'super_account_bypass',
      'active',
      'monthly',
      7,
      'super_account',
      NOW(),
      NOW()
    );
  END LOOP;
END $$;


-- ----------------------------------------------------------------------------
-- DICAS E TROUBLESHOOTING
-- ----------------------------------------------------------------------------

/*
PROBLEMA: Usuário marcado como super_account mas não consegue conectar

SOLUÇÃO:
1. Execute o bloco "4. VERIFICAR STATUS" acima para ver se tem bypass ativo
2. Se não tiver bypass, execute o bloco "1.2" para criar
3. Peça para o usuário fazer logout/login ou acessar /dashboard novamente

PROBLEMA: Super account atingiu limite de 7 conexões

SOLUÇÃO:
Deletar conexões antigas não usadas:

DELETE FROM whatsapp_connections 
WHERE user_id = 'uuid-do-usuario'
  AND status = 'disconnected'
  AND instance_token IS NULL;
*/
