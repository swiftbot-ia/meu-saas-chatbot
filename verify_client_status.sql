-- Verificação Completa do Cliente
-- Substitua o ID abaixo se necessário (usando o ID do log anterior)
SELECT 
    us.user_id,
    p.email,
    p.full_name,
    us.status,
    us.stripe_subscription_id,
    us.created_at,
    us.updated_at
FROM user_subscriptions us
JOIN user_profiles p ON us.user_id = p.user_id
WHERE us.user_id = '381c853f-a6dd-49cc-8640-593674d8b9bb';

-- O botão IRÁ aparecer se o status for um destes:
-- 'past_due' (Pagamento Pendente/Falhou)
-- 'expired'  (Expirado)
-- 'pending'  (Novo status que adicionei para suportar 'Incomplete')
-- 'none'     (Sem assinatura)
