// lib/conversation-analysis/message-extractor.js
// ============================================================================
// Message Extractor - Extracts messages from Supabase Chat for analysis
// ============================================================================

import { chatSupabaseAdmin } from '../supabase/chat-server'

/**
 * Extracts messages and contacts for a given connection
 */
export class MessageExtractor {
    constructor(client = null) {
        this.client = client || chatSupabaseAdmin
    }

    /**
     * Extract all messages for a connection
     * @param {string} connectionId - Connection UUID
     * @param {object} period - Optional { start: Date, end: Date }
     * @returns {Promise<{messages: Array, contacts: Array, connectionName: string}>}
     */
    async extract(connectionId, period = {}) {
        console.log(`📥 [MessageExtractor] Extracting messages for connection: ${connectionId}`)

        // 1. Get connection info from main Supabase
        const { supabaseAdmin } = await import('../supabase/server')
        const { data: connection, error: connError } = await supabaseAdmin
            .from('whatsapp_connections')
            .select('id, instance_name, phone_number')
            .eq('id', connectionId)
            .single()

        if (connError || !connection) {
            throw new Error(`Connection not found: ${connectionId}`)
        }

        // 2. Build messages query
        let messagesQuery = this.client
            .from('whatsapp_messages')
            .select(`
        id,
        message_id,
        message_content,
        message_type,
        direction,
        from_number,
        to_number,
        received_at,
        transcription,
        contact_id,
        conversation_id
      `)
            .eq('connection_id', connectionId)
            .order('received_at', { ascending: true })

        // Apply period filter if provided
        if (period.start) {
            messagesQuery = messagesQuery.gte('received_at', period.start)
        }
        if (period.end) {
            messagesQuery = messagesQuery.lte('received_at', period.end)
        }

        const { data: messages, error: msgError } = await messagesQuery

        if (msgError) {
            throw new Error(`Error fetching messages: ${msgError.message}`)
        }

        console.log(`📊 [MessageExtractor] Found ${messages?.length || 0} messages`)

        // 3. Get unique contacts
        const contactIds = [...new Set(messages.filter(m => m.contact_id).map(m => m.contact_id))]

        let contacts = []
        if (contactIds.length > 0) {
            const { data: contactsData, error: contactsError } = await this.client
                .from('whatsapp_contacts')
                .select('id, whatsapp_number, name, profile_pic_url')
                .in('id', contactIds)

            if (!contactsError) {
                contacts = contactsData || []
            }
        }

        console.log(`👥 [MessageExtractor] Found ${contacts.length} unique contacts`)

        return {
            messages: messages || [],
            contacts,
            connectionName: connection.instance_name
        }
    }

    /**
     * Format messages for AI analysis
     * Groups messages by contact and formats for prompt
     * @param {Array} messages - Messages array
     * @param {Array} contacts - Contacts array
     * @returns {string} Formatted text for AI prompt
     */
    formatForAnalysis(messages, contacts) {
        // Create contact lookup
        const contactMap = new Map(contacts.map(c => [c.id, c]))

        // Group by contact_id
        const byContact = {}
        messages.forEach(msg => {
            const key = msg.contact_id || msg.from_number || 'unknown'
            if (!byContact[key]) {
                byContact[key] = []
            }
            byContact[key].push(msg)
        })

        // Format output
        let output = ''
        let conversationCount = 0

        Object.entries(byContact).forEach(([contactId, msgs]) => {
            conversationCount++
            const contact = contactMap.get(contactId)
            const contactName = contact?.name || contact?.whatsapp_number || contactId

            output += `\n--- CONVERSA #${conversationCount} COM: ${contactName} ---\n`

            msgs.forEach(msg => {
                const direction = msg.direction === 'inbound' ? 'LEAD' : 'EMPRESA'
                let content = msg.message_content || ''

                // Use transcription for audio messages
                if (msg.message_type === 'audio' && msg.transcription) {
                    content = `[ÁUDIO] ${msg.transcription}`
                } else if (msg.message_type === 'image') {
                    content = content ? `[IMAGEM] ${content}` : '[IMAGEM]'
                } else if (msg.message_type === 'video') {
                    content = content ? `[VÍDEO] ${content}` : '[VÍDEO]'
                } else if (msg.message_type === 'document') {
                    content = content ? `[DOCUMENTO] ${content}` : '[DOCUMENTO]'
                }

                if (content.trim()) {
                    output += `[${direction}] ${content}\n`
                }
            })
        })

        // Limit size to avoid token limits (approximately 100k characters = ~25k tokens)
        const MAX_CHARS = 80000
        if (output.length > MAX_CHARS) {
            console.log(`⚠️ [MessageExtractor] Truncating output from ${output.length} to ${MAX_CHARS} chars`)
            output = output.substring(0, MAX_CHARS) + '\n\n... [TRUNCADO - MUITAS MENSAGENS]'
        }

        return output
    }

    /**
     * Calculate basic metrics from messages
     * @param {Array} messages 
     * @param {Array} contacts 
     * @returns {object} Basic metrics
     */
    calculateBasicMetrics(messages, contacts) {
        const incoming = messages.filter(m => m.direction === 'inbound')
        const outgoing = messages.filter(m => m.direction === 'outbound')

        // Find date range
        const dates = messages.map(m => new Date(m.received_at)).filter(d => !isNaN(d))
        const periodStart = dates.length > 0 ? new Date(Math.min(...dates)) : null
        const periodEnd = dates.length > 0 ? new Date(Math.max(...dates)) : null

        return {
            total_messages: messages.length,
            messages_incoming: incoming.length,
            messages_outgoing: outgoing.length,
            total_contacts: contacts.length,
            period_start: periodStart?.toISOString(),
            period_end: periodEnd?.toISOString(),
            avg_messages_per_contact: contacts.length > 0
                ? Math.round(messages.length / contacts.length)
                : 0
        }
    }
}

export default MessageExtractor
