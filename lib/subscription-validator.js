// lib/subscription-validator.js
import { supabase } from './supabase'

/**
 * Valida se o usuário tem assinatura ativa válida
 * 
 * @param {string} userId - ID do usuário
 * @returns {Promise<{valid: boolean, error?: string, subscription?: object}>}
 */
export async function validateActiveSubscription(userId) {
  try {
    // Buscar assinatura mais recente
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Verificar se assinatura existe
    if (subError || !subscription) {
      return {
        valid: false,
        error: 'Nenhuma assinatura encontrada. Assine um plano para continuar.'
      }
    }

    // Status bloqueados
    const blockedStatuses = [
      'canceled',
      'cancelled', 
      'expired', 
      'incomplete', 
      'incomplete_expired', 
      'unpaid',
      'paused'
    ]

    // Verificar se status está bloqueado
    if (blockedStatuses.includes(subscription.status)) {
      return {
        valid: false,
        error: `Assinatura ${subscription.status}. Por favor, renove seu plano.`,
        subscription_status: subscription.status
      }
    }

    // Verificar se trial expirou
    if (subscription.status === 'trial' && subscription.trial_end_date) {
      const trialEndDate = new Date(subscription.trial_end_date)
      const now = new Date()

      if (now > trialEndDate) {
        // Marcar como expirado no banco
        await supabase
          .from('user_subscriptions')
          .update({ 
            status: 'expired', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', subscription.id)

        return {
          valid: false,
          error: 'Seu período de teste expirou. Assine um plano para continuar.',
          subscription_status: 'expired'
        }
      }
    }

    // Verificar se plano ativo venceu (grace period de 7 dias)
    if (subscription.status === 'active' && subscription.next_billing_date) {
      const nextBillingDate = new Date(subscription.next_billing_date)
      const now = new Date()
      const gracePeriod = 7 * 24 * 60 * 60 * 1000 // 7 dias

      if (now > new Date(nextBillingDate.getTime() + gracePeriod)) {
        // Marcar como expirado
        await supabase
          .from('user_subscriptions')
          .update({ 
            status: 'expired', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', subscription.id)

        return {
          valid: false,
          error: 'Sua assinatura venceu. Atualize seu método de pagamento.',
          subscription_status: 'expired'
        }
      }
    }

    // ✅ Assinatura válida
    return {
      valid: true,
      subscription: subscription
    }

  } catch (error) {
    console.error('Erro ao validar assinatura:', error)
    return {
      valid: false,
      error: 'Erro ao verificar assinatura: ' + error.message
    }
  }
}

/**
 * Verifica se usuário pode adicionar mais conexões no plano atual
 * 
 * @param {string} userId - ID do usuário
 * @returns {Promise<{canAdd: boolean, error?: string, current: number, limit: number}>}
 */
export async function validateConnectionLimit(userId) {
  try {
    // Buscar assinatura
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('connection_limit')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const planLimit = subscription?.connection_limit || 1

    // Contar conexões ativas
    const { data: connections } = await supabase
      .from('whatsapp_connections')
      .select('id, status')
      .eq('user_id', userId)

    const connectedCount = connections?.filter(c => c.status === 'connected').length || 0

    if (connectedCount >= planLimit) {
      return {
        canAdd: false,
        error: `Você atingiu o limite de ${planLimit} conexão(ões) do seu plano.`,
        current: connectedCount,
        limit: planLimit
      }
    }

    return {
      canAdd: true,
      current: connectedCount,
      limit: planLimit
    }

  } catch (error) {
    console.error('Erro ao validar limite de conexões:', error)
    return {
      canAdd: false,
      error: 'Erro ao verificar limite de conexões'
    }
  }
}

/**
 * Status permitidos para usar o sistema
 */
export const ALLOWED_SUBSCRIPTION_STATUSES = [
  'active',
  'trial',
  'trialing'
]

/**
 * Status que bloqueiam o uso do sistema
 */
export const BLOCKED_SUBSCRIPTION_STATUSES = [
  'canceled',
  'cancelled',
  'expired',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused',
  'past_due'
]