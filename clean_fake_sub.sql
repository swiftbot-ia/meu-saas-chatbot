-- Limpar assinatura 'fake' criada manualmente (sub_restored_log)
-- para deixar apenas a assinatura REAL da Stripe (sub_1Slx30...)
DELETE FROM user_subscriptions 
WHERE stripe_subscription_id = 'sub_restored_log' 
AND user_id = 'b7dfba0a-1d56-4756-8b70-b12171ca83f4';
