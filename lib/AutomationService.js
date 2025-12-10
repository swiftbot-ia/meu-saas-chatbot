/**
 * AutomationService - Processa automações de resposta automática
 * 
 * Este serviço verifica mensagens recebidas contra automações configuradas
 * e dispara respostas automáticas quando há match.
 */

import { createClient } from '@supabase/supabase-js'

// Supabase Admin Client (bypass RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

class AutomationService {

    /**
     * Processa mensagem recebida e dispara automações se houver match
     * @param {Object} message - Mensagem recebida do webhook
     * @param {Object} connection - Dados da conexão WhatsApp
     * @param {Object} contact - Dados do contato
     * @returns {Object} Resultado do processamento
     */
    static async processMessage(message, connection, contact) {
        try {
            // Só processa mensagens recebidas (inbound)
            if (message.direction === 'outbound') {
                console.log('ℹ️ [Automation] Ignorando mensagem outbound')
                return { processed: false, reason: 'outbound_message' }
            }

            // Extrai o conteúdo da mensagem para matching
            const messageContent = this.extractMessageContent(message)
            if (!messageContent) {
                console.log('ℹ️ [Automation] Mensagem sem conteúdo para matching')
                return { processed: false, reason: 'no_content' }
            }

            console.log(`🔍 [Automation] Verificando automações para: "${messageContent.substring(0, 50)}..."`)

            // Buscar automações ativas da conexão
            const { data: automations, error } = await supabaseAdmin
                .from('automations')
                .select(`
          *,
          automation_keywords (id, keyword, match_type, is_case_sensitive),
          automation_responses (id, response_type, content, media_url, delay_seconds, order_index)
        `)
                .eq('connection_id', connection.id)
                .eq('is_active', true)
                .eq('type', 'keyword')

            if (error) {
                console.error('❌ [Automation] Erro ao buscar automações:', error)
                return { processed: false, reason: 'db_error', error: error.message }
            }

            if (!automations || automations.length === 0) {
                console.log('ℹ️ [Automation] Nenhuma automação ativa para esta conexão')
                return { processed: false, reason: 'no_automations' }
            }

            console.log(`📋 [Automation] ${automations.length} automação(ões) ativa(s) encontrada(s)`)

            // Verificar cada automação
            for (const automation of automations) {
                const matched = this.checkKeywordMatch(messageContent, automation)

                if (matched) {
                    console.log(`✅ [Automation] MATCH! Automação: "${automation.name}"`)

                    // Dispara as respostas da automação
                    await this.executeResponses(automation, connection, contact, message)

                    // Executar ações adicionais (webhook externo, tags)
                    await this.executeActions(automation, connection, contact, message)

                    // Incrementar contador de execuções
                    await this.incrementExecutionCount(automation.id)

                    return {
                        processed: true,
                        automationId: automation.id,
                        automationName: automation.name,
                        matched: true
                    }
                }
            }

            console.log('ℹ️ [Automation] Nenhuma automação correspondeu à mensagem')
            return { processed: false, reason: 'no_match' }

        } catch (error) {
            console.error('❌ [Automation] Erro ao processar:', error)
            return { processed: false, reason: 'error', error: error.message }
        }
    }

    /**
     * Extrai conteúdo de texto da mensagem para matching
     */
    static extractMessageContent(message) {
        // Prioridade: conteúdo de texto > transcrição de áudio
        let content = message.message_content || ''

        // Se for áudio com transcrição, usar transcrição
        if (message.message_type === 'audio' && message.metadata?.transcription) {
            content = message.metadata.transcription
        }

        return content.trim()
    }

    /**
     * Verifica se a mensagem corresponde a alguma keyword da automação
     */
    static checkKeywordMatch(messageContent, automation) {
        const keywords = automation.automation_keywords || []

        for (const kw of keywords) {
            const keyword = kw.keyword
            const matchType = kw.match_type || 'contains'
            const caseSensitive = kw.is_case_sensitive || false

            // Preparar strings para comparação
            const msgToCheck = caseSensitive ? messageContent : messageContent.toLowerCase()
            const kwToCheck = caseSensitive ? keyword : keyword.toLowerCase()

            let matches = false

            switch (matchType) {
                case 'is':
                    // Mensagem é exatamente a keyword
                    matches = msgToCheck === kwToCheck
                    break

                case 'contains':
                    // Mensagem contém a keyword
                    matches = msgToCheck.includes(kwToCheck)
                    break

                case 'starts_with':
                    // Mensagem começa com a keyword
                    matches = msgToCheck.startsWith(kwToCheck)
                    break

                case 'word':
                    // Mensagem contém a keyword como palavra inteira
                    const wordRegex = new RegExp(`\\b${this.escapeRegExp(kwToCheck)}\\b`, caseSensitive ? '' : 'i')
                    matches = wordRegex.test(messageContent)
                    break

                default:
                    matches = msgToCheck.includes(kwToCheck)
            }

            if (matches) {
                console.log(`🎯 [Automation] Keyword match: "${keyword}" (${matchType})`)
                return true
            }
        }

        return false
    }

    /**
     * Executa as respostas configuradas na automação
     */
    static async executeResponses(automation, connection, contact, originalMessage) {
        const responses = automation.automation_responses || []

        // Ordenar respostas por order_index
        responses.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))

        for (const response of responses) {
            try {
                // Aplicar delay se configurado
                if (response.delay_seconds > 0) {
                    console.log(`⏳ [Automation] Aguardando ${response.delay_seconds}s antes de enviar...`)
                    await this.sleep(response.delay_seconds * 1000)
                }

                // Enviar resposta
                await this.sendResponse(response, connection, contact)

                console.log(`📤 [Automation] Resposta enviada: ${response.response_type}`)

            } catch (error) {
                console.error(`❌ [Automation] Erro ao enviar resposta:`, error)
            }
        }
    }

    /**
     * Envia uma resposta para o contato via UAZapi
     */
    static async sendResponse(response, connection, contact) {
        const instanceName = connection.instance_name
        const instanceToken = connection.instance_token
        const toNumber = contact.whatsapp_number

        if (!instanceToken) {
            console.error('❌ [Automation] Sem token da instância para enviar resposta')
            return
        }

        const baseUrl = process.env.UAZAPI_BASE_URL || 'https://api.uazapi.chat'

        // Por enquanto, só suporta respostas de texto
        if (response.response_type === 'text') {
            const endpoint = `${baseUrl}/${instanceName}/messages/sendText`

            const payload = {
                phone: toNumber,
                message: response.content
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${instanceToken}`
                },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const errorText = await res.text()
                throw new Error(`UAZapi error: ${res.status} - ${errorText}`)
            }

            console.log(`✅ [Automation] Mensagem enviada para ${toNumber}`)
        }
        // TODO: Adicionar suporte para imagem, áudio, documento, etc.
    }

    /**
     * Incrementa o contador de execuções da automação
     */
    static async incrementExecutionCount(automationId) {
        try {
            // Buscar valor atual e incrementar
            const { data: automation } = await supabaseAdmin
                .from('automations')
                .select('execution_count')
                .eq('id', automationId)
                .single()

            const newCount = (automation?.execution_count || 0) + 1

            await supabaseAdmin
                .from('automations')
                .update({
                    execution_count: newCount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', automationId)

            console.log(`📊 [Automation] Execuções: ${newCount}`)
        } catch (error) {
            console.error('❌ [Automation] Erro ao incrementar contador:', error)
        }
    }

    /**
     * Helpers
     */
    static escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Executa ações adicionais (webhook externo, tags, origem) quando automação dispara
     */
    static async executeActions(automation, connection, contact, message) {
        try {
            // 1. Enviar para webhook externo se configurado
            if (automation.action_webhook_enabled && automation.action_webhook_url) {
                await this.sendToExternalWebhook(
                    automation.action_webhook_url,
                    automation,
                    connection,
                    contact,
                    message
                )
            }

            // 2. Adicionar tags ao contato se configurado
            if (automation.action_add_tags && automation.action_add_tags.length > 0) {
                await this.addTagsToContact(contact.id, automation.action_add_tags, connection.user_id)
            }

            // 3. Definir origem se configurado
            if (automation.action_set_origin_id) {
                await this.setContactOrigin(contact.id, automation.action_set_origin_id)
            }
        } catch (error) {
            console.error('❌ [Automation] Erro ao executar ações:', error)
            // Não propagar erro - ações são fire-and-forget
        }
    }

    /**
     * Envia dados completos do lead para um webhook externo
     * Inclui: contato completo, etapa do funil, tags, origem, campos personalizados
     */
    static async sendToExternalWebhook(webhookUrl, automation, connection, contact, message, conversation = null) {
        try {
            console.log(`🔗 [Automation] Enviando para webhook externo: ${webhookUrl.substring(0, 50)}...`)

            // Buscar dados completos da conversa se não fornecido
            let conversationData = conversation
            if (!conversationData) {
                const chatSupabaseAdmin = (await import('@/lib/supabase/chat-server')).chatSupabaseAdmin
                const { data } = await chatSupabaseAdmin
                    .from('whatsapp_conversations')
                    .select(`
                        id,
                        funnel_stage,
                        funnel_position,
                        is_archived,
                        unread_count,
                        last_message_at,
                        created_at
                    `)
                    .eq('contact_id', contact.id)
                    .eq('instance_name', connection.instance_name)
                    .maybeSingle()
                conversationData = data
            }

            // Buscar tags do contato
            let contactTags = []
            try {
                const chatSupabaseAdmin = (await import('@/lib/supabase/chat-server')).chatSupabaseAdmin
                const { data: tagAssignments } = await chatSupabaseAdmin
                    .from('contact_tag_assignments')
                    .select('tag:contact_tags(id, name, color)')
                    .eq('contact_id', contact.id)
                if (tagAssignments) {
                    contactTags = tagAssignments.map(a => a.tag).filter(Boolean)
                }
            } catch (e) {
                console.log('ℹ️ [Automation] Não foi possível buscar tags do contato')
            }

            // Buscar origem do contato
            let originData = null
            if (contact.origin_id) {
                try {
                    const chatSupabaseAdmin = (await import('@/lib/supabase/chat-server')).chatSupabaseAdmin
                    const { data } = await chatSupabaseAdmin
                        .from('contact_origins')
                        .select('id, name')
                        .eq('id', contact.origin_id)
                        .single()
                    originData = data
                } catch (e) {
                    // Origem não encontrada
                }
            }

            // Montar payload completo
            const payload = {
                event: 'automation_triggered',
                timestamp: new Date().toISOString(),

                // Dados da automação
                automation: {
                    id: automation.id,
                    name: automation.name
                },

                // Dados COMPLETOS do contato
                contact: {
                    id: contact.id,
                    name: contact.name || null,
                    phone: contact.whatsapp_number,
                    profile_pic_url: contact.profile_pic_url || null,
                    jid: contact.jid || null,
                    created_at: contact.created_at,
                    updated_at: contact.updated_at,
                    metadata: contact.metadata || {}
                },

                // Etapa do funil e status
                funnel: conversationData ? {
                    stage: conversationData.funnel_stage || 'new',
                    position: conversationData.funnel_position || 0,
                    is_archived: conversationData.is_archived || false,
                    unread_count: conversationData.unread_count || 0,
                    conversation_created_at: conversationData.created_at,
                    last_message_at: conversationData.last_message_at
                } : null,

                // Tags do contato
                tags: contactTags,

                // Origem do contato
                origin: originData,

                // Tags que serão adicionadas por esta automação
                tags_to_add: automation.action_add_tags || [],

                // Mensagem que disparou a automação
                message: {
                    id: message.id,
                    type: message.message_type,
                    content: message.message_content,
                    received_at: message.received_at || message.created_at
                },

                // Conexão WhatsApp
                connection: {
                    id: connection.id,
                    instance_name: connection.instance_name,
                    phone_number: connection.phone_number,
                    profile_name: connection.profile_name || null
                },

                // Campos personalizados definidos na automação
                custom_fields: automation.action_custom_fields || {}
            }

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'SwiftBot-Automation/1.0'
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                console.warn(`⚠️ [Automation] Webhook externo retornou ${response.status}`)
            } else {
                console.log(`✅ [Automation] Dados completos enviados para webhook externo`)
            }
        } catch (error) {
            console.error('❌ [Automation] Erro ao enviar para webhook externo:', error.message)
        }
    }

    /**
     * Adiciona tags ao contato usando as tabelas corretas:
     * - contact_tags: definições de tags (por usuário)
     * - contact_tag_assignments: links entre tag e contato
     */
    static async addTagsToContact(contactId, tags, userId) {
        // Usar Chat DB Admin para tabelas de contato
        const chatSupabaseAdmin = (await import('@/lib/supabase/chat-server')).chatSupabaseAdmin

        try {
            for (const tagName of tags) {
                // 1. Upsert tag na tabela contact_tags (cria se não existir)
                const { data: existingTag } = await chatSupabaseAdmin
                    .from('contact_tags')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('name', tagName)
                    .maybeSingle()

                let tagId = existingTag?.id

                if (!tagId) {
                    // Criar nova tag
                    const { data: newTag, error: createError } = await chatSupabaseAdmin
                        .from('contact_tags')
                        .insert({
                            user_id: userId,
                            name: tagName,
                            color: this.getRandomTagColor()
                        })
                        .select('id')
                        .single()

                    if (createError) {
                        console.error(`❌ [Automation] Erro ao criar tag "${tagName}":`, createError)
                        continue
                    }
                    tagId = newTag.id
                    console.log(`🏷️ [Automation] Nova tag criada: "${tagName}"`)
                }

                // 2. Verificar se já tem assignment
                const { data: existingAssignment } = await chatSupabaseAdmin
                    .from('contact_tag_assignments')
                    .select('id')
                    .eq('contact_id', contactId)
                    .eq('tag_id', tagId)
                    .maybeSingle()

                if (!existingAssignment) {
                    // 3. Criar assignment
                    const { error: assignError } = await chatSupabaseAdmin
                        .from('contact_tag_assignments')
                        .insert({
                            contact_id: contactId,
                            tag_id: tagId
                        })

                    if (assignError) {
                        console.error(`❌ [Automation] Erro ao atribuir tag "${tagName}":`, assignError)
                    } else {
                        console.log(`🏷️ [Automation] Tag "${tagName}" atribuída ao contato`)
                    }
                } else {
                    console.log(`ℹ️ [Automation] Contato já tem tag "${tagName}"`)
                }
            }
        } catch (error) {
            console.error('❌ [Automation] Erro ao adicionar tags:', error)
        }
    }

    /**
     * Define a origem do contato
     */
    static async setContactOrigin(contactId, originId) {
        const chatSupabaseAdmin = (await import('@/lib/supabase/chat-server')).chatSupabaseAdmin

        try {
            const { error } = await chatSupabaseAdmin
                .from('whatsapp_contacts')
                .update({
                    origin_id: originId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', contactId)

            if (error) {
                console.error('❌ [Automation] Erro ao definir origem:', error)
            } else {
                console.log(`📍 [Automation] Origem definida para contato`)
            }
        } catch (error) {
            console.error('❌ [Automation] Erro ao definir origem:', error)
        }
    }

    /**
     * Retorna uma cor aleatória para nova tag
     */
    static getRandomTagColor() {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
        return colors[Math.floor(Math.random() * colors.length)]
    }
}

export default AutomationService
