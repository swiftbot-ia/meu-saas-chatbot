// lib/SyncService.js
// ============================================================================
// Serviço de Sincronização de Contatos e Mensagens
// ============================================================================
// Sincroniza dados do WhatsApp via UAZAPI com o banco Supabase Chat
// Usa processamento em lotes para evitar sobrecarga
// ============================================================================

import { UAZAPIClient } from './uazapi-client'
import ConversationService from './ConversationService'
import { supabaseAdmin } from './supabase/server'
import { chatSupabaseAdmin } from './supabase/chat-server'
import { createSyncJob, updateSyncJob, getActiveJobByConnection } from './syncJobManager'

// Configurações de batch
const CONTACTS_BATCH_SIZE = 50
const CONVERSATIONS_BATCH_SIZE = 5
const MESSAGES_LIMIT = 100
const BATCH_DELAY_MS = 500

/**
 * Delay helper
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Log estruturado
 */
function log(jobId, emoji, message, data = null) {
    const prefix = `[Sync ${jobId?.substring(0, 8)}] ${emoji}`
    if (data) {
        console.log(prefix, message, JSON.stringify(data, null, 2))
    } else {
        console.log(prefix, message)
    }
}

class SyncService {
    /**
     * Executa sincronização completa em background
     * @param {string} connectionId - ID da conexão
     * @param {string} instanceToken - Token da instância UAZAPI
     * @returns {Promise<object>} Job criado
     */
    static async runFullSync(connectionId, instanceToken) {
        // Verificar se já existe job ativo para esta conexão
        const existingJob = getActiveJobByConnection(connectionId)
        if (existingJob) {
            log(existingJob.id, '⚠️', 'Sync já em andamento para esta conexão')
            return existingJob
        }

        // Criar job
        const job = createSyncJob({ connectionId, type: 'full' })
        log(job.id, '🚀', 'Iniciando sincronização completa', { connectionId })

        // Executar em background (não aguarda)
        this.executeFullSync(job.id, connectionId, instanceToken)
            .catch(error => {
                log(job.id, '❌', 'Erro fatal na sincronização', { error: error.message })
                updateSyncJob(job.id, { status: 'failed', error: error.message })
            })

        return job
    }

    /**
     * Executa sincronização completa (interno)
     */
    static async executeFullSync(jobId, connectionId, instanceToken) {
        try {
            updateSyncJob(jobId, { status: 'processing' })

            // 1. Buscar dados da conexão
            const { data: connection, error: connError } = await supabaseAdmin
                .from('whatsapp_connections')
                .select('id, user_id, instance_name, phone_number')
                .eq('id', connectionId)
                .single()

            if (connError || !connection) {
                throw new Error(`Conexão não encontrada: ${connectionId}`)
            }

            log(jobId, '📋', 'Conexão encontrada', {
                instanceName: connection.instance_name,
                userId: connection.user_id
            })

            // 2. Sincronizar contatos
            await this.syncContacts(jobId, connection, instanceToken)

            // 3. Sincronizar mensagens de cada conversa
            await this.syncMessages(jobId, connection, instanceToken)

            // 4. Marcar como concluído
            updateSyncJob(jobId, { status: 'completed' })
            log(jobId, '✅', 'Sincronização completa finalizada')

        } catch (error) {
            log(jobId, '❌', 'Erro na sincronização', { error: error.message })
            updateSyncJob(jobId, { status: 'failed', error: error.message })
            throw error
        }
    }

    /**
     * Sincroniza contatos da UAZAPI
     */
    static async syncContacts(jobId, connection, instanceToken) {
        try {
            updateSyncJob(jobId, {
                progress: { currentPhase: 'contacts' }
            })

            log(jobId, '👥', 'Buscando contatos da UAZAPI...')

            const uazClient = new UAZAPIClient()
            const contacts = await uazClient.getContacts(instanceToken)

            if (!Array.isArray(contacts)) {
                log(jobId, '⚠️', 'Resposta inválida de contatos', contacts)
                return
            }

            // Filtrar apenas contatos individuais (não grupos)
            const individualContacts = contacts.filter(c => {
                const jid = c.jid || c.id || ''
                return jid.endsWith('@s.whatsapp.net') && !jid.includes('@g.us')
            })

            log(jobId, '📊', `${individualContacts.length} contatos individuais encontrados`)

            updateSyncJob(jobId, {
                progress: { total: individualContacts.length, processed: 0 },
                stats: { contactsTotal: individualContacts.length }
            })

            // Processar em lotes
            let created = 0
            let updated = 0
            let conversationsCreated = 0

            for (let i = 0; i < individualContacts.length; i += CONTACTS_BATCH_SIZE) {
                const batch = individualContacts.slice(i, i + CONTACTS_BATCH_SIZE)

                for (const contact of batch) {
                    try {
                        const jid = contact.jid || contact.id || ''
                        const whatsappNumber = jid.replace('@s.whatsapp.net', '')
                        const name = contact.notify || contact.name || contact.pushname || whatsappNumber

                        // Criar/atualizar contato usando RPC existente
                        const result = await ConversationService.getOrCreateContact(
                            whatsappNumber,
                            { name, jid, profilePicUrl: contact.imgUrl || null },
                            chatSupabaseAdmin
                        )

                        // Criar conversa para este contato
                        const conversation = await ConversationService.getOrCreateConversation(
                            connection.instance_name,
                            connection.id,
                            result.id,
                            connection.user_id,
                            chatSupabaseAdmin
                        )

                        if (result.created_at === result.updated_at) {
                            created++
                        } else {
                            updated++
                        }

                        // Verificar se conversa foi criada
                        if (conversation) {
                            conversationsCreated++
                        }

                    } catch (error) {
                        log(jobId, '⚠️', `Erro ao processar contato`, { error: error.message })
                        updateSyncJob(jobId, {
                            stats: { errors: (updateSyncJob(jobId)?.stats?.errors || 0) + 1 },
                            error: error.message
                        })
                    }
                }

                // Atualizar progresso
                const processed = Math.min(i + batch.length, individualContacts.length)
                updateSyncJob(jobId, {
                    progress: { processed },
                    stats: { contactsCreated: created, contactsUpdated: updated, conversationsCreated }
                })

                log(jobId, '📈', `Progresso contatos: ${processed}/${individualContacts.length}`)

                // Pausa entre lotes
                if (i + CONTACTS_BATCH_SIZE < individualContacts.length) {
                    await delay(BATCH_DELAY_MS)
                }
            }

            log(jobId, '✅', 'Sincronização de contatos concluída', { created, updated, conversationsCreated })

        } catch (error) {
            log(jobId, '❌', 'Erro ao sincronizar contatos', { error: error.message })
            throw error
        }
    }

    /**
     * Sincroniza mensagens de todas as conversas
     */
    static async syncMessages(jobId, connection, instanceToken) {
        try {
            updateSyncJob(jobId, {
                progress: { currentPhase: 'messages', processed: 0 }
            })

            log(jobId, '💬', 'Buscando conversas para sincronizar mensagens...')

            // Buscar todas as conversas desta conexão
            const { data: conversations, error: convError } = await chatSupabaseAdmin
                .from('whatsapp_conversations')
                .select('id, contact:whatsapp_contacts(id, whatsapp_number, name)')
                .eq('connection_id', connection.id)

            if (convError) {
                throw new Error(`Erro ao buscar conversas: ${convError.message}`)
            }

            if (!conversations || conversations.length === 0) {
                log(jobId, '⚠️', 'Nenhuma conversa encontrada para sincronizar')
                return
            }

            log(jobId, '📊', `${conversations.length} conversas encontradas`)

            updateSyncJob(jobId, {
                progress: { total: conversations.length, processed: 0 }
            })

            const uazClient = new UAZAPIClient()
            let totalMessages = 0

            // Processar em lotes
            for (let i = 0; i < conversations.length; i += CONVERSATIONS_BATCH_SIZE) {
                const batch = conversations.slice(i, i + CONVERSATIONS_BATCH_SIZE)

                for (const conv of batch) {
                    if (!conv.contact?.whatsapp_number) continue

                    try {
                        const chatId = `${conv.contact.whatsapp_number}@s.whatsapp.net`

                        log(jobId, '📨', `Buscando mensagens: ${conv.contact.name || conv.contact.whatsapp_number}`)

                        const messages = await uazClient.getMessages(instanceToken, chatId, MESSAGES_LIMIT)

                        if (Array.isArray(messages) && messages.length > 0) {
                            const savedCount = await this.saveMessages(
                                jobId,
                                conv.id,
                                conv.contact.id,
                                connection,
                                messages
                            )
                            totalMessages += savedCount
                        }

                    } catch (error) {
                        log(jobId, '⚠️', `Erro ao buscar mensagens de ${conv.contact?.whatsapp_number}`, {
                            error: error.message
                        })
                    }
                }

                // Atualizar progresso
                const processed = Math.min(i + batch.length, conversations.length)
                updateSyncJob(jobId, {
                    progress: { processed },
                    stats: { messagesProcessed: totalMessages }
                })

                log(jobId, '📈', `Progresso conversas: ${processed}/${conversations.length}`)

                // Pausa entre lotes
                if (i + CONVERSATIONS_BATCH_SIZE < conversations.length) {
                    await delay(BATCH_DELAY_MS * 2) // Pausa maior para mensagens
                }
            }

            log(jobId, '✅', 'Sincronização de mensagens concluída', { totalMessages })

        } catch (error) {
            log(jobId, '❌', 'Erro ao sincronizar mensagens', { error: error.message })
            throw error
        }
    }

    /**
     * Salva mensagens no banco
     */
    static async saveMessages(jobId, conversationId, contactId, connection, messages) {
        let savedCount = 0

        for (const msg of messages) {
            try {
                const messageId = msg.messageid || msg.id?.id || msg.key?.id
                if (!messageId) continue

                // Verificar se mensagem já existe
                const { data: existing } = await chatSupabaseAdmin
                    .from('whatsapp_messages')
                    .select('id')
                    .eq('message_id', messageId)
                    .maybeSingle()

                if (existing) continue // Pular duplicados

                // Determinar tipo e conteúdo
                let messageType = 'text'
                let messageContent = ''
                let mediaUrl = null

                const msgType = msg.messageType || msg.type
                const content = msg.content || msg.message || {}

                if (msgType === 'Conversation' || msgType === 'conversation') {
                    messageType = 'text'
                    messageContent = content.text || msg.text || ''
                } else if (msgType === 'ExtendedTextMessage' || msgType === 'extendedTextMessage') {
                    messageType = 'text'
                    messageContent = content.text || msg.text || ''
                } else if (msgType === 'ImageMessage' || msgType === 'imageMessage') {
                    messageType = 'image'
                    messageContent = content.caption || ''
                    mediaUrl = content.URL || content.url
                } else if (msgType === 'VideoMessage' || msgType === 'videoMessage') {
                    messageType = 'video'
                    messageContent = content.caption || ''
                    mediaUrl = content.URL || content.url
                } else if (msgType === 'AudioMessage' || msgType === 'audioMessage') {
                    messageType = 'audio'
                    mediaUrl = content.URL || content.url
                } else if (msgType === 'DocumentMessage' || msgType === 'documentMessage') {
                    messageType = 'document'
                    messageContent = content.fileName || ''
                    mediaUrl = content.URL || content.url
                }

                // Timestamp
                let timestamp
                if (msg.messageTimestamp) {
                    timestamp = msg.messageTimestamp > 9999999999
                        ? new Date(msg.messageTimestamp)
                        : new Date(msg.messageTimestamp * 1000)
                } else {
                    timestamp = new Date()
                }

                // Direção
                const fromMe = msg.fromMe === true || msg.key?.fromMe === true
                const direction = fromMe ? 'outbound' : 'inbound'

                // Inserir mensagem
                const { error: insertError } = await chatSupabaseAdmin
                    .from('whatsapp_messages')
                    .insert({
                        instance_name: connection.instance_name,
                        connection_id: connection.id,
                        conversation_id: conversationId,
                        contact_id: contactId,
                        user_id: connection.user_id,
                        message_id: messageId,
                        from_number: fromMe ? connection.phone_number : msg.sender || '',
                        to_number: fromMe ? (msg.chatid?.replace('@s.whatsapp.net', '') || '') : connection.phone_number,
                        message_type: messageType,
                        message_content: messageContent,
                        media_url: mediaUrl,
                        direction,
                        status: fromMe ? 'sent' : 'received',
                        received_at: timestamp.toISOString(),
                        metadata: { synced: true, original: msg }
                    })

                if (!insertError) {
                    savedCount++
                }

            } catch (error) {
                // Ignorar erros de duplicação
                if (error.code !== '23505') {
                    log(jobId, '⚠️', 'Erro ao salvar mensagem', { error: error.message })
                }
            }
        }

        return savedCount
    }
}

export default SyncService
