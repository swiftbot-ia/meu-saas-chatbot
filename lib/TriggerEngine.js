import { createClient } from '@supabase/supabase-js'
import AutomationService from './AutomationService'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

class TriggerEngine {

    /**
     * Process system events and execute matching triggers
     * @param {string} eventType - 'contact_created', 'tag_added', etc.
     * @param {Object} payload - Data related to the event (contact, tag, etc.)
     * @param {string} connectionId - ID of the connection
     */
    static async processEvent(eventType, payload, connectionId) {
        console.log(`⚡ [TriggerEngine] Processing event: ${eventType} (Connection: ${connectionId})`)

        try {
            // 1. Fetch active triggers for this event type
            const { data: triggers, error } = await supabaseAdmin
                .from('automations')
                .select(`
                    *,
                    automation_responses (id, response_type, content, media_url, delay_seconds, order_index)
                `)
                .eq('connection_id', connectionId)
                .eq('is_active', true)
                .eq('type', 'trigger')
                .eq('trigger_type', eventType)

            if (error) {
                console.error(`❌ [TriggerEngine] Error fetching triggers:`, error)
                return
            }

            if (!triggers || triggers.length === 0) {
                return
            }

            console.log(`📋 [TriggerEngine] Found ${triggers.length} active triggers for ${eventType}`)

            // 2. Evaluate triggers
            for (const trigger of triggers) {
                const isMatch = this.evaluateCondition(trigger, payload)

                if (isMatch) {
                    console.log(`✅ [TriggerEngine] Trigger MATCH: "${trigger.name}"`)
                    await this.executeTrigger(trigger, payload, connectionId)
                }
            }

        } catch (error) {
            console.error(`❌ [TriggerEngine] Error processing event:`, error)
        }
    }

    /**
     * Evaluate if the event payload matches the trigger configuration
     */
    static evaluateCondition(trigger, payload) {
        const config = trigger.trigger_config || {}

        switch (trigger.trigger_type) {
            case 'contact_created':
                // Usually fires for any contact creation
                // Can add filters like origin_id later
                return true

            case 'tag_added':
                // Check if the added tag matches the configured tag
                // payload should have { tagId: '...' }
                return config.tag_id === payload.tagId

            case 'custom_field_changed':
                // Check if the changed field matches
                // payload: { fieldKey: '...', newValue: '...' }
                if (config.field_key !== payload.fieldKey) return false

                return this.evaluateOperator(config.operator, config.value, payload.newValue)

            case 'funnel_stage_changed':
                // payload: { toStage: '...', fromStage: '...', contactId: '...' }
                if (config.target_stage && config.target_stage !== payload.toStage) return false
                return true

            case 'deal_won':
                // payload: { toStage: '...', fromStage: '...', contactId: '...' }
                return payload.toStage === 'ganho' || payload.toStage === 'won'

            case 'deal_lost':
                // payload: { toStage: '...', fromStage: '...', contactId: '...' }
                return payload.toStage === 'perdido' || payload.toStage === 'lost'

            default:
                return false
        }
    }

    static evaluateOperator(operator, targetValue, actualValue) {
        const actual = String(actualValue || '').toLowerCase()
        const target = String(targetValue || '').toLowerCase()

        switch (operator) {
            case 'equals': return actual === target
            case 'contains': return actual.includes(target)
            case 'starts_with': return actual.startsWith(target)
            case 'not_empty': return actual.length > 0
            default: return actual === target
        }
    }

    static async executeTrigger(trigger, payload, connectionId) {
        // Prepare data for AutomationService
        // We need 'contact' and 'connection' objects
        // Payload might contain them or we fetch them

        let contact = payload.contact
        let connection = payload.connection

        // If missing, fetch (simplified)
        if (!contact && payload.contactId) {
            const { data } = await supabaseAdmin.from('whatsapp_contacts').select('*').eq('id', payload.contactId).single()
            contact = data
        }

        if (!connection) {
            const { data } = await supabaseAdmin.from('whatsapp_connections').select('*').eq('id', connectionId).single()
            connection = data
        }

        if (!contact || !connection) {
            console.error(`❌ [TriggerEngine] Missing data for execution: contact? ${!!contact} (ID: ${payload.contactId}), connection? ${!!connection} (ID: ${connectionId})`)
            return
        }

        // Mock message object for compatibility with AutomationService
        const mockMessage = {
            id: `trigger_${Date.now()}`,
            message_type: 'event',
            message_content: `Trigger: ${trigger.name}`,
            created_at: new Date().toISOString()
        }

        // Execute Responses (Text)
        await AutomationService.executeResponses(trigger, connection, contact, mockMessage)

        // Execute Actions (Tags, Webhooks, etc.)
        await AutomationService.executeActions(trigger, connection, contact, mockMessage)

        // Increment count
        await AutomationService.incrementExecutionCount(trigger.id)
    }
}

export default TriggerEngine
