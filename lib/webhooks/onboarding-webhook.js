/**
 * lib/webhooks/onboarding-webhook.js
 * ============================================================================
 * Serviço centralizado de webhooks para eventos de onboarding/marketing
 * 
 * Eventos suportados:
 * - new_lead: Novo cadastro
 * - conta_criada: Conta criada (após confirmação de email)
 * - trial_iniciado: Trial iniciado
 * - whatsapp_conectado: WhatsApp conectado com sucesso
 * - agente_criado: Agente de IA criado/ativado
 * - mensagem_enviada: Primeira mensagem enviada pelo agente
 * - assinatura_criada: Assinatura paga criada
 * ============================================================================
 */

const WEBHOOK_URL = process.env.N8N_WEBHOOK_LEAD_URL

/**
 * Envia evento para webhook de onboarding
 * @param {string} event - Nome do evento
 * @param {object} data - Dados do evento
 */
export async function sendOnboardingWebhook(event, data) {
    if (!WEBHOOK_URL) {
        console.warn(`⚠️ [Webhook] N8N_WEBHOOK_LEAD_URL não configurada - evento ${event} ignorado`)
        return { success: false, skipped: true }
    }

    const payload = {
        event,
        timestamp: new Date().toISOString(),
        ...data
    }

    try {
        console.log(`📡 [Webhook] Enviando evento: ${event}`)

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            console.error(`❌ [Webhook] Erro ${response.status} ao enviar ${event}`)
            return { success: false, error: `HTTP ${response.status}` }
        }

        console.log(`✅ [Webhook] Evento ${event} enviado com sucesso`)
        return { success: true }

    } catch (error) {
        console.error(`❌ [Webhook] Erro ao enviar ${event}:`, error.message)
        return { success: false, error: error.message }
    }
}

/**
 * Enviar evento: Conta criada
 */
export async function sendContaCriadaWebhook(userData) {
    return sendOnboardingWebhook('conta_criada', {
        user: {
            user_id: userData.user_id,
            email: userData.email,
            full_name: userData.full_name,
            company_name: userData.company_name,
            business_sector: userData.business_sector,
            phone: userData.phone
        }
    })
}

/**
 * Enviar evento: Trial iniciado
 */
export async function sendTrialIniciadoWebhook(userData, subscription) {
    return sendOnboardingWebhook('trial_iniciado', {
        user: {
            user_id: userData.user_id,
            email: userData.email,
            full_name: userData.full_name
        },
        trial: {
            start_date: subscription.trial_start_date || new Date().toISOString(),
            end_date: subscription.trial_end_date,
            connections: subscription.connections_purchased
        }
    })
}

/**
 * Enviar evento: WhatsApp conectado
 */
export async function sendWhatsappConectadoWebhook(userId, connection) {
    return sendOnboardingWebhook('whatsapp_conectado', {
        user_id: userId,
        connection: {
            connection_id: connection.id,
            instance_name: connection.instance_name,
            phone_number: connection.phone_number,
            profile_name: connection.profile_name
        }
    })
}

/**
 * Enviar evento: Agente de IA criado/ativado
 */
export async function sendAgenteCriadoWebhook(userId, agent, connection) {
    return sendOnboardingWebhook('agente_criado', {
        user_id: userId,
        agent: {
            agent_id: agent.id,
            agent_name: agent.agent_name || agent.company_name,
            company_name: agent.company_name,
            bot_objective: agent.bot_objective,
            is_active: agent.is_active
        },
        connection: connection ? {
            connection_id: connection.id,
            instance_name: connection.instance_name,
            phone_number: connection.phone_number
        } : null
    })
}

/**
 * Enviar evento: Primeira mensagem enviada pelo agente
 */
export async function sendMensagemEnviadaWebhook(userId, connectionId, messageData) {
    return sendOnboardingWebhook('mensagem_enviada', {
        user_id: userId,
        connection_id: connectionId,
        message: {
            to_number: messageData.to_number,
            message_type: messageData.message_type || 'text',
            is_first_message: messageData.is_first || false
        }
    })
}

/**
 * Enviar evento: Assinatura criada (primeiro pagamento)
 */
export async function sendAssinaturaCriadaWebhook(userId, subscription, paymentData) {
    return sendOnboardingWebhook('assinatura_criada', {
        user_id: userId,
        subscription: {
            subscription_id: subscription.id,
            status: subscription.status,
            billing_period: subscription.billing_period,
            connections: subscription.connections_purchased,
            stripe_subscription_id: subscription.stripe_subscription_id
        },
        payment: paymentData ? {
            amount: paymentData.amount,
            payment_method: paymentData.payment_method
        } : null
    })
}

/**
 * Enviar evento: Assinatura cancelada
 */
export async function sendAssinaturaCanceladaWebhook(userId, subscription, reason = null) {
    return sendOnboardingWebhook('assinatura_cancelada', {
        user_id: userId,
        subscription: {
            subscription_id: subscription.id,
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            stripe_subscription_id: subscription.stripe_subscription_id
        },
        reason: reason || 'user_canceled'
    })
}

export default {
    sendOnboardingWebhook,
    sendContaCriadaWebhook,
    sendTrialIniciadoWebhook,
    sendWhatsappConectadoWebhook,
    sendAgenteCriadoWebhook,
    sendMensagemEnviadaWebhook,
    sendAssinaturaCriadaWebhook,
    sendAssinaturaCanceladaWebhook
}
