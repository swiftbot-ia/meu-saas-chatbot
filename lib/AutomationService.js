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
        const { error } = await supabaseAdmin.rpc('increment_automation_execution', {
            automation_id: automationId
        })

        // Se RPC não existir, fazer UPDATE manual
        if (error) {
            await supabaseAdmin
                .from('automations')
                .update({
                    execution_count: supabaseAdmin.raw('execution_count + 1'),
                    updated_at: new Date().toISOString()
                })
                .eq('id', automationId)
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
     * Executa ações adicionais (webhook externo, tags) quando automação dispara
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
                await this.addTagsToContact(contact.id, automation.action_add_tags)
            }
        } catch (error) {
            console.error('❌ [Automation] Erro ao executar ações:', error)
            // Não propagar erro - ações são fire-and-forget
        }
    }

    /**
     * Envia dados do lead para um webhook externo
     */
    static async sendToExternalWebhook(webhookUrl, automation, connection, contact, message) {
        try {
            console.log(`🔗 [Automation] Enviando para webhook externo: ${webhookUrl.substring(0, 50)}...`)

            const payload = {
                event: 'automation_triggered',
                timestamp: new Date().toISOString(),
                automation: {
                    id: automation.id,
                    name: automation.name
                },
                contact: {
                    id: contact.id,
                    name: contact.name || null,
                    phone: contact.whatsapp_number,
                    profile_pic_url: contact.profile_pic_url || null
                },
                message: {
                    id: message.id,
                    type: message.message_type,
                    content: message.message_content,
                    received_at: message.received_at
                },
                connection: {
                    id: connection.id,
                    instance_name: connection.instance_name,
                    phone_number: connection.phone_number
                },
                tags: automation.action_add_tags || []
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
                console.log(`✅ [Automation] Dados enviados para webhook externo`)
            }
        } catch (error) {
            console.error('❌ [Automation] Erro ao enviar para webhook externo:', error.message)
        }
    }

    /**
     * Adiciona tags ao contato (armazena no metadata do contato)
     */
    static async addTagsToContact(contactId, tags) {
        try {
            // Buscar tags atuais do contato
            const { data: contact, error: fetchError } = await supabaseAdmin
                .from('whatsapp_contacts')
                .select('metadata')
                .eq('id', contactId)
                .single()

            if (fetchError) {
                console.error('❌ [Automation] Erro ao buscar contato para tags:', fetchError)
                return
            }

            // Merge com tags existentes
            const currentTags = contact?.metadata?.tags || []
            const newTags = [...new Set([...currentTags, ...tags])] // Remove duplicatas

            // Atualizar metadata com novas tags
            const { error: updateError } = await supabaseAdmin
                .from('whatsapp_contacts')
                .update({
                    metadata: {
                        ...(contact?.metadata || {}),
                        tags: newTags
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('id', contactId)

            if (updateError) {
                console.error('❌ [Automation] Erro ao atualizar tags do contato:', updateError)
            } else {
                console.log(`🏷️ [Automation] Tags adicionadas ao contato: ${tags.join(', ')}`)
            }
        } catch (error) {
            console.error('❌ [Automation] Erro ao adicionar tags:', error)
        }
    }
}

export default AutomationService
