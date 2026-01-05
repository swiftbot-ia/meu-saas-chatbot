// lib/SequenceService.js
/**
 * ============================================================================
 * Sequence Service - Service for managing sequence enrollments and execution
 * ============================================================================
 * 
 * IMPORTANT: Tables are split between two databases:
 * - MAIN DB: automation_sequences, automation_sequence_steps, whatsapp_connections
 * - CHAT DB: whatsapp_contacts, whatsapp_conversations, automation_sequence_subscriptions
 */

import { createClient } from '@supabase/supabase-js'
import uazapi from './uazapi-client.js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const chatSupabaseUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL
const chatSupabaseServiceKey = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY

// Main DB client (for automation_sequences, automation_sequence_steps)
const getMainDbClient = () => {
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
    })
}

// Chat DB client (for whatsapp_contacts, whatsapp_conversations, automation_sequence_subscriptions)
const getChatDbClient = () => {
    return createClient(chatSupabaseUrl, chatSupabaseServiceKey, {
        auth: { persistSession: false }
    })
}

const SequenceService = {
    /**
     * Check if a contact should be enrolled in any sequences based on trigger
     * @param {string} contactId - Contact UUID
     * @param {string} connectionId - Connection UUID
     * @param {string} triggerType - 'new_contact', 'has_tag', 'has_origin', 'keyword'
     * @param {*} triggerValue - Tag ID, Origin ID, or keyword text
     */
    async checkAndEnroll(contactId, connectionId, triggerType, triggerValue = null) {
        const mainDb = getMainDbClient()
        console.log(`🔍 [SequenceService] Checking sequences for trigger: ${triggerType}`, { contactId, triggerValue })

        try {
            // Find all active sequences matching the trigger (MAIN DB)
            let query = mainDb
                .from('automation_sequences')
                .select('*')
                .eq('connection_id', connectionId)
                .eq('is_active', true)
                .eq('trigger_type', triggerType)

            const { data: sequences, error } = await query

            if (error) {
                console.error('❌ [SequenceService] Error finding sequences:', error)
                return
            }

            if (!sequences || sequences.length === 0) {
                console.log(`ℹ️ [SequenceService] No sequences found for trigger: ${triggerType}`)
                return
            }

            // Filter sequences based on trigger value
            for (const sequence of sequences) {
                let shouldEnroll = false

                switch (triggerType) {
                    case 'new_contact':
                        shouldEnroll = true
                        break

                    case 'has_tag':
                        shouldEnroll = sequence.trigger_tag_id === triggerValue
                        break

                    case 'has_origin':
                        shouldEnroll = sequence.trigger_origin_id === triggerValue
                        break

                    case 'keyword':
                        if (sequence.trigger_keywords && sequence.trigger_keywords.length > 0) {
                            const messageText = (triggerValue || '').toLowerCase()
                            shouldEnroll = sequence.trigger_keywords.some(kw =>
                                messageText.includes(kw.toLowerCase())
                            )
                        }
                        break
                }

                if (shouldEnroll) {
                    console.log(`✅ [SequenceService] Enrolling contact in sequence: ${sequence.name}`)
                    await this.enrollContact(sequence.id, contactId, connectionId)
                }
            }
        } catch (error) {
            console.error('❌ [SequenceService] checkAndEnroll error:', error)
        }
    },

    /**
     * Enroll a contact in a sequence
     * @param {string} sequenceId - Sequence UUID
     * @param {string} contactId - Contact UUID
     * @param {string} connectionId - Connection UUID
     */
    async enrollContact(sequenceId, contactId, connectionId) {
        const mainDb = getMainDbClient()
        const chatDb = getChatDbClient()

        try {
            // Check if already enrolled (CHAT DB)
            const { data: existing } = await chatDb
                .from('automation_sequence_subscriptions')
                .select('id, status')
                .eq('sequence_id', sequenceId)
                .eq('contact_id', contactId)
                .single()

            if (existing && existing.status === 'active') {
                console.log(`ℹ️ [SequenceService] Contact already enrolled in sequence`)
                return { success: false, reason: 'already_enrolled' }
            }

            // Get first step to calculate next_step_at (MAIN DB)
            const { data: steps } = await mainDb
                .from('automation_sequence_steps')
                .select('*')
                .eq('sequence_id', sequenceId)
                .eq('is_active', true)
                .order('order_index', { ascending: true })
                .limit(1)

            const firstStep = steps?.[0]
            const nextStepAt = firstStep
                ? this.calculateNextStepTime(firstStep)
                : null

            // Get conversation_id for this contact/connection (CHAT DB)
            const { data: conversation } = await chatDb
                .from('whatsapp_conversations')
                .select('id')
                .eq('contact_id', contactId)
                .eq('connection_id', connectionId)
                .single()

            // Create or update subscription (CHAT DB)
            if (existing) {
                // Reactivate existing subscription
                await chatDb
                    .from('automation_sequence_subscriptions')
                    .update({
                        status: 'active',
                        current_step: 0,
                        started_at: new Date().toISOString(),
                        next_step_at: nextStepAt,
                        completed_at: null,
                        connection_id: connectionId,
                        conversation_id: conversation?.id
                    })
                    .eq('id', existing.id)
            } else {
                // Create new subscription (CHAT DB)
                await chatDb
                    .from('automation_sequence_subscriptions')
                    .insert({
                        sequence_id: sequenceId,
                        contact_id: contactId,
                        connection_id: connectionId,
                        conversation_id: conversation?.id,
                        current_step: 0,
                        status: 'active',
                        started_at: new Date().toISOString(),
                        next_step_at: nextStepAt
                    })
            }

            // Increment subscribers count (fire and forget, MAIN DB)
            try {
                // Simple increment using SQL
                const { data: seq } = await mainDb
                    .from('automation_sequences')
                    .select('subscribers_count')
                    .eq('id', sequenceId)
                    .single()

                await mainDb
                    .from('automation_sequences')
                    .update({ subscribers_count: (seq?.subscribers_count || 0) + 1 })
                    .eq('id', sequenceId)
            } catch (incrementError) {
                console.warn('⚠️ [SequenceService] Failed to increment subscribers count:', incrementError)
            }

            console.log(`✅ [SequenceService] Contact enrolled successfully. Next step at: ${nextStepAt}`)
            return { success: true, nextStepAt }

        } catch (error) {
            console.error('❌ [SequenceService] enrollContact error:', error)
            return { success: false, error: error.message }
        }
    },

    /**
     * Calculate when the next step should be executed
     * @param {object} step - Step object with delay_value, delay_unit, time_window_start, time_window_end, allowed_days
     * @returns {string} ISO timestamp
     */
    calculateNextStepTime(step) {
        let nextTime = new Date()

        // Apply delay
        const delayValue = step.delay_value || 1
        const delayUnit = step.delay_unit || 'hours'

        switch (delayUnit) {
            case 'immediately':
                // No delay
                break
            case 'minutes':
                nextTime.setMinutes(nextTime.getMinutes() + delayValue)
                break
            case 'hours':
                nextTime.setHours(nextTime.getHours() + delayValue)
                break
            case 'days':
                nextTime.setDate(nextTime.getDate() + delayValue)
                break
        }

        // Adjust for time window and allowed days
        nextTime = this.adjustForTimeWindow(nextTime, step)

        return nextTime.toISOString()
    },

    /**
     * Adjust a timestamp to fit within allowed time window and days
     * @param {Date} scheduledTime - Originally scheduled time
     * @param {object} step - Step with time_window_start, time_window_end, allowed_days
     * @returns {Date} Adjusted time
     */
    adjustForTimeWindow(scheduledTime, step) {
        const { time_window_start, time_window_end, allowed_days } = step
        let adjustedTime = new Date(scheduledTime)

        // Map day numbers to day abbreviations
        const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
        const allowedDaysArray = allowed_days || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

        // Max iterations to prevent infinite loop
        let iterations = 0
        const maxIterations = 14

        while (iterations < maxIterations) {
            const currentDay = dayMap[adjustedTime.getDay()]

            // Check if day is allowed
            if (!allowedDaysArray.includes(currentDay)) {
                // Move to next day at time window start (or 9am default)
                adjustedTime.setDate(adjustedTime.getDate() + 1)
                if (time_window_start) {
                    const [hours, minutes] = time_window_start.split(':').map(Number)
                    adjustedTime.setHours(hours, minutes, 0, 0)
                } else {
                    adjustedTime.setHours(9, 0, 0, 0)
                }
                iterations++
                continue
            }

            // Check time window
            if (time_window_start && time_window_end) {
                const [startH, startM] = time_window_start.split(':').map(Number)
                const [endH, endM] = time_window_end.split(':').map(Number)

                const currentH = adjustedTime.getHours()
                const currentM = adjustedTime.getMinutes()
                const currentMinutes = currentH * 60 + currentM
                const startMinutes = startH * 60 + startM
                const endMinutes = endH * 60 + endM

                if (currentMinutes < startMinutes) {
                    // Too early, set to start of window
                    adjustedTime.setHours(startH, startM, 0, 0)
                } else if (currentMinutes > endMinutes) {
                    // Too late, move to next day at window start
                    adjustedTime.setDate(adjustedTime.getDate() + 1)
                    adjustedTime.setHours(startH, startM, 0, 0)
                    iterations++
                    continue
                }
            }

            // If we get here, the time is valid
            break
        }

        return adjustedTime
    },

    /**
     * Unenroll a contact from a sequence
     * @param {string} sequenceId - Sequence UUID
     * @param {string} contactId - Contact UUID
     */
    async unenrollContact(sequenceId, contactId) {
        const chatDb = getChatDbClient()

        try {
            await chatDb
                .from('automation_sequence_subscriptions')
                .update({ status: 'unsubscribed' })
                .eq('sequence_id', sequenceId)
                .eq('contact_id', contactId)

            console.log(`✅ [SequenceService] Contact unenrolled from sequence`)
            return { success: true }
        } catch (error) {
            console.error('❌ [SequenceService] unenrollContact error:', error)
            return { success: false, error: error.message }
        }
    },

    /**
     * Process all pending subscriptions (called by worker)
     * IMPORTANT: Tables are in different databases, so we can't use JOINs
     */
    async processPendingSubscriptions() {
        const mainDb = getMainDbClient()
        const chatDb = getChatDbClient()
        const now = new Date().toISOString()

        console.log(`🔄 [SequenceService] Processing pending subscriptions at ${now}`)

        try {
            // Get all subscriptions due for next step (CHAT DB)
            const { data: subscriptions, error } = await chatDb
                .from('automation_sequence_subscriptions')
                .select('*')
                .eq('status', 'active')
                .lte('next_step_at', now)
                .limit(50) // Process in batches

            if (error) {
                console.error('❌ [SequenceService] Error fetching subscriptions:', error)
                return { processed: 0, errors: 1 }
            }

            if (!subscriptions || subscriptions.length === 0) {
                console.log(`ℹ️ [SequenceService] No pending subscriptions`)
                return { processed: 0, errors: 0 }
            }

            console.log(`📋 [SequenceService] Found ${subscriptions.length} pending subscriptions`)

            let processed = 0
            let errors = 0

            for (const subscription of subscriptions) {
                try {
                    // Fetch sequence and steps from MAIN DB
                    const { data: sequence, error: seqError } = await mainDb
                        .from('automation_sequences')
                        .select(`
                            id, name, connection_id, is_active,
                            automation_sequence_steps (*)
                        `)
                        .eq('id', subscription.sequence_id)
                        .single()

                    if (seqError || !sequence) {
                        console.error(`❌ [SequenceService] Sequence not found: ${subscription.sequence_id}`)
                        errors++
                        continue
                    }

                    if (!sequence.is_active) {
                        console.log(`⏸️ [SequenceService] Sequence ${sequence.name} is paused`)
                        continue
                    }

                    await this.processSubscription(subscription, sequence, mainDb, chatDb)
                    processed++
                } catch (err) {
                    console.error(`❌ [SequenceService] Error processing subscription ${subscription.id}:`, err)
                    errors++
                }
            }

            console.log(`✅ [SequenceService] Processed ${processed} subscriptions, ${errors} errors`)
            return { processed, errors }

        } catch (error) {
            console.error('❌ [SequenceService] processPendingSubscriptions error:', error)
            return { processed: 0, errors: 1 }
        }
    },

    /**
     * Process a single subscription - send message and advance step
     * @param {object} subscription - Subscription data
     * @param {object} sequence - Sequence with steps
     * @param {object} mainDb - Main database client
     * @param {object} chatDb - Chat database client
     */
    async processSubscription(subscription, sequence, mainDb, chatDb) {
        const steps = sequence.automation_sequence_steps || []

        // Sort steps by order_index
        steps.sort((a, b) => a.order_index - b.order_index)

        const currentStepIndex = subscription.current_step || 0
        const currentStep = steps[currentStepIndex]

        if (!currentStep) {
            // No more steps, mark as completed (CHAT DB)
            await chatDb
                .from('automation_sequence_subscriptions')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    next_step_at: null
                })
                .eq('id', subscription.id)

            console.log(`✅ [SequenceService] Subscription ${subscription.id} completed (no more steps)`)
            return
        }

        // Check if step is active
        if (!currentStep.is_active) {
            // Skip to next step
            return this.advanceToNextStep(subscription, steps, currentStepIndex, chatDb)
        }

        // Check if agent is paused (CHAT DB)
        if (subscription.conversation_id) {
            const { data: conversation } = await chatDb
                .from('whatsapp_conversations')
                .select('agent_paused')
                .eq('id', subscription.conversation_id)
                .single()

            if (conversation?.agent_paused) {
                console.log(`⏸️ [SequenceService] Agent paused for subscription ${subscription.id}, skipping`)
                // Reschedule for later (1 hour)
                const rescheduleTime = new Date()
                rescheduleTime.setHours(rescheduleTime.getHours() + 1)

                await chatDb
                    .from('automation_sequence_subscriptions')
                    .update({ next_step_at: rescheduleTime.toISOString() })
                    .eq('id', subscription.id)

                return
            }
        }

        // Get contact details (CHAT DB)
        const { data: contact } = await chatDb
            .from('whatsapp_contacts')
            .select('whatsapp_number, name')
            .eq('id', subscription.contact_id)
            .single()

        if (!contact) {
            console.error(`❌ [SequenceService] Missing contact or connection for subscription ${subscription.id}`)
            return
        }

        // Get connection details for sending (MAIN DB)
        const { data: connection } = await mainDb
            .from('whatsapp_connections')
            .select('instance_token')
            .eq('id', sequence.connection_id)
            .single()

        if (!connection?.instance_token) {
            console.error(`❌ [SequenceService] Connection not found or no token: ${sequence.connection_id}`)
            return
        }

        // Get message content (from template or step) - MAIN DB
        let messageContent = null

        if (currentStep.template_id) {
            const { data: template } = await mainDb
                .from('message_templates')
                .select('content, type, media_url')
                .eq('id', currentStep.template_id)
                .single()

            if (template) {
                messageContent = {
                    type: template.type || 'text',
                    content: template.content,
                    mediaUrl: template.media_url
                }
            }
        }

        if (!messageContent && currentStep.automation_id) {
            // Get from linked automation (MAIN DB)
            const { data: automation } = await mainDb
                .from('automations')
                .select('response_type, response_content, response_media_url')
                .eq('id', currentStep.automation_id)
                .single()

            if (automation) {
                messageContent = {
                    type: automation.response_type || 'text',
                    content: automation.response_content,
                    mediaUrl: automation.response_media_url
                }
            }
        }

        if (!messageContent) {
            console.error(`❌ [SequenceService] No message content for step ${currentStep.id}`)
            return this.advanceToNextStep(subscription, steps, currentStepIndex, chatDb)
        }

        // Send message via UAZapi
        try {
            console.log(`📤 [SequenceService] Sending message to ${contact.whatsapp_number}`)

            if (messageContent.type === 'text') {
                await uazapi.sendMessage(
                    connection.instance_token,
                    contact.whatsapp_number,
                    messageContent.content
                )
            } else if (messageContent.type === 'image' && messageContent.mediaUrl) {
                await uazapi.sendImage(
                    connection.instance_token,
                    contact.whatsapp_number,
                    messageContent.mediaUrl,
                    messageContent.content
                )
            } else if (messageContent.type === 'audio' && messageContent.mediaUrl) {
                await uazapi.sendAudio(
                    connection.instance_token,
                    contact.whatsapp_number,
                    messageContent.mediaUrl
                )
            } else if (messageContent.type === 'video' && messageContent.mediaUrl) {
                await uazapi.sendVideo(
                    connection.instance_token,
                    contact.whatsapp_number,
                    messageContent.mediaUrl,
                    messageContent.content
                )
            } else if (messageContent.type === 'document' && messageContent.mediaUrl) {
                await uazapi.sendDocument(
                    connection.instance_token,
                    contact.whatsapp_number,
                    messageContent.mediaUrl,
                    messageContent.content
                )
            }

            console.log(`✅ [SequenceService] Message sent successfully`)

            // Update step sent count (MAIN DB)
            await mainDb
                .from('automation_sequence_steps')
                .update({ sent_count: (currentStep.sent_count || 0) + 1 })
                .eq('id', currentStep.id)

        } catch (sendError) {
            console.error(`❌ [SequenceService] Error sending message:`, sendError)
            // Don't advance step on send error, will retry next cycle
            return
        }

        // Advance to next step
        await this.advanceToNextStep(subscription, steps, currentStepIndex, chatDb)
    },

    /**
     * Advance subscription to next step
     * @param {object} chatDb - Chat database client for subscription updates
     */
    async advanceToNextStep(subscription, steps, currentStepIndex, chatDb) {
        // If chatDb not passed, get it
        if (!chatDb) {
            chatDb = getChatDbClient()
        }

        const nextStepIndex = currentStepIndex + 1
        const nextStep = steps[nextStepIndex]

        if (!nextStep) {
            // No more steps, mark as completed (CHAT DB)
            await chatDb
                .from('automation_sequence_subscriptions')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    next_step_at: null,
                    current_step: nextStepIndex
                })
                .eq('id', subscription.id)

            console.log(`✅ [SequenceService] Subscription ${subscription.id} completed`)
            return
        }

        // Calculate next step time
        const nextStepAt = this.calculateNextStepTime(nextStep)

        await chatDb
            .from('automation_sequence_subscriptions')
            .update({
                current_step: nextStepIndex,
                next_step_at: nextStepAt
            })
            .eq('id', subscription.id)

        console.log(`➡️ [SequenceService] Advanced to step ${nextStepIndex}, next at ${nextStepAt}`)
    },

    /**
     * Handle lead reply - restart follow-up sequences if configured
     * Called when a lead sends a message (inbound)
     * @param {string} contactId - Contact UUID
     * @param {string} connectionId - Connection UUID
     */
    async handleLeadReply(contactId, connectionId) {
        const mainDb = getMainDbClient()
        const chatDb = getChatDbClient()

        try {
            console.log(`🔄 [SequenceService] Handling lead reply for contact: ${contactId}`)

            // Get all active subscriptions for this contact (CHAT DB)
            const { data: subscriptions, error: subError } = await chatDb
                .from('automation_sequence_subscriptions')
                .select('id, sequence_id, current_step')
                .eq('contact_id', contactId)
                .eq('status', 'active')

            if (subError || !subscriptions || subscriptions.length === 0) {
                console.log(`ℹ️ [SequenceService] No active subscriptions for contact`)
                return { restarted: 0 }
            }

            let restartedCount = 0

            for (const subscription of subscriptions) {
                // Get sequence config from MAIN DB
                const { data: sequence, error: seqError } = await mainDb
                    .from('automation_sequences')
                    .select('id, name, is_follow_up, restart_on_reply, automation_sequence_steps(*)')
                    .eq('id', subscription.sequence_id)
                    .single()

                if (seqError || !sequence) {
                    console.log(`⚠️ [SequenceService] Sequence not found: ${subscription.sequence_id}`)
                    continue
                }

                // Update lead_last_message_at for all active subscriptions
                await chatDb
                    .from('automation_sequence_subscriptions')
                    .update({
                        lead_last_message_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', subscription.id)

                // Check if this is a follow-up sequence with restart enabled
                if (sequence.is_follow_up && sequence.restart_on_reply) {
                    console.log(`🔁 [SequenceService] Restarting follow-up sequence: ${sequence.name}`)

                    // Get first step to calculate next_step_at
                    const steps = (sequence.automation_sequence_steps || [])
                        .sort((a, b) => a.order_index - b.order_index)
                    const firstStep = steps[0]

                    const nextStepAt = firstStep
                        ? this.calculateNextStepTime(firstStep)
                        : null

                    // Restart subscription (reset to step 0)
                    await chatDb
                        .from('automation_sequence_subscriptions')
                        .update({
                            current_step: 0,
                            started_at: new Date().toISOString(),
                            next_step_at: nextStepAt,
                            completed_at: null,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', subscription.id)

                    console.log(`✅ [SequenceService] Sequence ${sequence.name} restarted. Next step at: ${nextStepAt}`)
                    restartedCount++
                }
            }

            return { restarted: restartedCount }

        } catch (error) {
            console.error('❌ [SequenceService] handleLeadReply error:', error)
            return { restarted: 0, error: error.message }
        }
    },

    /**
     * Update lead_last_message_at for a contact's active subscriptions
     * @param {string} contactId - Contact UUID
     */
    async updateLeadLastMessage(contactId) {
        const chatDb = getChatDbClient()

        try {
            const { error } = await chatDb
                .from('automation_sequence_subscriptions')
                .update({
                    lead_last_message_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('contact_id', contactId)
                .eq('status', 'active')

            if (error) {
                console.error('❌ [SequenceService] updateLeadLastMessage error:', error)
            }
        } catch (error) {
            console.error('❌ [SequenceService] updateLeadLastMessage error:', error)
        }
    }
}

export default SequenceService

