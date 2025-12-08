// lib/swiftbot-ia/context-builder.js
// ============================================================================
// Context Builder - Builds AI context from analysis data and recent messages
// ============================================================================

import { supabaseAdmin } from '../supabase/server'
import { chatSupabaseAdmin } from '../supabase/chat-server'

/**
 * Build context for SwiftBot IA from analysis report and recent messages
 * @param {string} connectionId - WhatsApp connection ID
 * @param {string} userId - User ID
 * @returns {Promise<string>} Context string for AI prompt
 */
export async function buildContext(connectionId, userId) {
    let context = ''

    // 1. Get analysis report (from main Supabase)
    const analysisContext = await getAnalysisContext(connectionId)
    if (analysisContext) {
        context += analysisContext
    }

    // 2. Get recent messages (from chat Supabase)
    const messagesContext = await getRecentMessagesContext(connectionId, 300)
    if (messagesContext) {
        context += messagesContext
    }

    // 3. Get agent config if exists
    const agentContext = await getAgentConfigContext(connectionId, userId)
    if (agentContext) {
        context += agentContext
    }

    return context
}

/**
 * Get context from conversation analysis report
 */
async function getAnalysisContext(connectionId) {
    try {
        const { data: report, error } = await supabaseAdmin
            .from('conversation_analysis_reports')
            .select('report_data, knowledge_base, connection_name')
            .eq('connection_id', connectionId)
            .eq('status', 'completed')
            .order('analysis_date', { ascending: false })
            .limit(1)
            .single()

        if (error || !report) {
            return null
        }

        let context = `\n## ANÁLISE DO NEGÓCIO: ${report.connection_name}\n`

        const kb = report.knowledge_base || {}
        const data = report.report_data || {}

        // Resumo executivo
        if (data.resumo_executivo) {
            context += `\n### Resumo Executivo:\n`
            context += `- Total de mensagens analisadas: ${data.resumo_executivo.total_mensagens || 'N/A'}\n`
            context += `- Clientes únicos: ${data.resumo_executivo.clientes_unicos || 'N/A'}\n`
            context += `- Taxa de engajamento: ${data.resumo_executivo.taxa_engajamento || 'N/A'}\n`
            context += `- Horário de pico: ${data.resumo_executivo.horario_pico || 'N/A'}\n`
            context += `- Principal objeção: ${data.resumo_executivo.principal_objecao || 'N/A'}\n`
        }

        // Empresa
        if (kb.company) {
            context += `\n### Informações da Empresa:\n`
            if (kb.company.name) context += `- Nome: ${kb.company.name}\n`
            if (kb.company.business_type) context += `- Tipo: ${kb.company.business_type}\n`
            if (kb.company.location) context += `- Localização: ${kb.company.location}\n`
            if (kb.company.payment_methods?.length) {
                context += `- Formas de pagamento: ${kb.company.payment_methods.join(', ')}\n`
            }
        }

        // Pricing
        if (kb.pricing?.items?.length || kb.pricing?.packages?.length) {
            context += `\n### Preços e Serviços:\n`
            kb.pricing?.items?.slice(0, 10).forEach(p => {
                context += `- ${p.item}: ${p.price}\n`
            })
            kb.pricing?.packages?.slice(0, 5).forEach(p => {
                context += `- Pacote ${p.item}: ${p.price}\n`
            })
        }

        // Objeções
        if (kb.objections?.mapeamento?.length) {
            context += `\n### Principais Objeções e Rebatimentos:\n`
            kb.objections.mapeamento.slice(0, 8).forEach(obj => {
                context += `- "${obj.objecao}" → ${obj.rebatimento_que_funcionou}\n`
            })
        }

        // FAQs
        if (kb.faqs?.length) {
            context += `\n### Perguntas Frequentes:\n`
            kb.faqs.slice(0, 10).forEach(faq => {
                context += `- P: ${faq.question}\n  R: ${faq.answer}\n`
            })
        }

        // Insights
        if (data.insights_estrategicos) {
            context += `\n### Insights Estratégicos:\n`
            if (data.insights_estrategicos.pontos_fortes?.length) {
                context += `**Pontos Fortes:** ${data.insights_estrategicos.pontos_fortes.join(', ')}\n`
            }
            if (data.insights_estrategicos.pontos_melhoria?.length) {
                context += `**Pontos de Melhoria:** ${data.insights_estrategicos.pontos_melhoria.join(', ')}\n`
            }
            if (data.insights_estrategicos.oportunidades_nao_exploradas?.length) {
                context += `**Oportunidades:** ${data.insights_estrategicos.oportunidades_nao_exploradas.join(', ')}\n`
            }
        }

        return context

    } catch (error) {
        console.error('[ContextBuilder] Error getting analysis:', error)
        return null
    }
}

/**
 * Get context from recent WhatsApp messages
 */
async function getRecentMessagesContext(connectionId, limit = 300) {
    try {
        const { data: messages, error } = await chatSupabaseAdmin
            .from('whatsapp_messages')
            .select('content, is_from_me, received_at')
            .eq('connection_id', connectionId)
            .eq('type', 'text')
            .order('received_at', { ascending: false })
            .limit(limit)

        if (error || !messages?.length) {
            return null
        }

        let context = `\n## ÚLTIMAS ${messages.length} MENSAGENS DO WHATSAPP:\n`
        context += `(Use para entender contexto recente das conversas)\n\n`

        // Group by conversation patterns
        const recentMessages = messages.slice(0, 100).reverse()
        recentMessages.forEach(msg => {
            const sender = msg.is_from_me ? 'EMPRESA' : 'CLIENTE'
            const content = msg.content?.substring(0, 200) || ''
            if (content.trim()) {
                context += `[${sender}]: ${content}\n`
            }
        })

        return context

    } catch (error) {
        console.error('[ContextBuilder] Error getting messages:', error)
        return null
    }
}

/**
 * Get agent configuration context
 */
async function getAgentConfigContext(connectionId, userId) {
    try {
        const { data: agent, error } = await supabaseAdmin
            .from('ai_agents')
            .select('company_name, product_description, personality, bot_objective, objections_qa')
            .eq('connection_id', connectionId)
            .eq('user_id', userId)
            .single()

        if (error || !agent) {
            return null
        }

        let context = `\n## CONFIGURAÇÃO DO AGENTE:\n`
        if (agent.company_name) context += `- Empresa: ${agent.company_name}\n`
        if (agent.product_description) context += `- Produtos/Serviços: ${agent.product_description}\n`
        if (agent.personality) context += `- Personalidade: ${agent.personality}\n`
        if (agent.bot_objective) context += `- Objetivo: ${agent.bot_objective}\n`

        return context

    } catch (error) {
        console.error('[ContextBuilder] Error getting agent config:', error)
        return null
    }
}

export default {
    buildContext
}
