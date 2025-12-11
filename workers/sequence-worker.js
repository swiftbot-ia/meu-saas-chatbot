#!/usr/bin/env node
// workers/sequence-worker.js
/**
 * ============================================================================
 * Sequence Worker - Standalone worker for processing sequences
 * ============================================================================
 * 
 * Run with PM2:
 *   pm2 start workers/sequence-worker.js --name "sequence-worker"
 * 
 * Or directly:
 *   node workers/sequence-worker.js
 * 
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL (Main DB)
 *   - SUPABASE_SERVICE_ROLE_KEY (Main DB)
 *   - NEXT_PUBLIC_CHAT_SUPABASE_URL (Chat DB)
 *   - CHAT_SUPABASE_SERVICE_ROLE_KEY (Chat DB)
 *   - UAZAPI_BASE_URL
 *   - UAZAPI_ADMIN_TOKEN
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const INTERVAL_MS = 60000 // 60 seconds
const BATCH_SIZE = 50

// Main DB - sequences, steps, connections, templates
const mainDbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const mainDbKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Chat DB - contacts, conversations, subscriptions
const chatDbUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL
const chatDbKey = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY

const uazapiBaseUrl = process.env.UAZAPI_BASE_URL || 'https://swiftbot.uazapi.com'

if (!mainDbUrl || !mainDbKey) {
    console.error('❌ Missing Main DB environment variables')
    process.exit(1)
}

if (!chatDbUrl || !chatDbKey) {
    console.error('❌ Missing Chat DB environment variables')
    process.exit(1)
}

// Main DB client - for sequences, steps, connections, templates
const mainDb = createClient(mainDbUrl, mainDbKey, {
    auth: { persistSession: false }
})

// Chat DB client - for contacts, conversations, subscriptions
const chatDb = createClient(chatDbUrl, chatDbKey, {
    auth: { persistSession: false }
})

console.log('🚀 Sequence Worker starting...')
console.log(`📊 Interval: ${INTERVAL_MS / 1000}s, Batch size: ${BATCH_SIZE}`)
console.log(`📦 Main DB: ${mainDbUrl}`)
console.log(`📦 Chat DB: ${chatDbUrl}`)


/**
 * Calculate next step time based on delay configuration
 */
function calculateNextStepTime(step) {
    let nextTime = new Date()
    const delayValue = step.delay_value || 1
    const delayUnit = step.delay_unit || 'hours'

    switch (delayUnit) {
        case 'immediately':
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
    const { time_window_start, time_window_end, allowed_days } = step
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const allowedDaysArray = allowed_days || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

    let iterations = 0
    while (iterations < 14) {
        const currentDay = dayMap[nextTime.getDay()]

        if (!allowedDaysArray.includes(currentDay)) {
            nextTime.setDate(nextTime.getDate() + 1)
            if (time_window_start) {
                const [hours, minutes] = time_window_start.split(':').map(Number)
                nextTime.setHours(hours, minutes, 0, 0)
            } else {
                nextTime.setHours(9, 0, 0, 0)
            }
            iterations++
            continue
        }

        if (time_window_start && time_window_end) {
            const [startH, startM] = time_window_start.split(':').map(Number)
            const [endH, endM] = time_window_end.split(':').map(Number)
            const currentMinutes = nextTime.getHours() * 60 + nextTime.getMinutes()
            const startMinutes = startH * 60 + startM
            const endMinutes = endH * 60 + endM

            if (currentMinutes < startMinutes) {
                nextTime.setHours(startH, startM, 0, 0)
            } else if (currentMinutes > endMinutes) {
                nextTime.setDate(nextTime.getDate() + 1)
                nextTime.setHours(startH, startM, 0, 0)
                iterations++
                continue
            }
        }

        break
    }

    return nextTime.toISOString()
}

/**
 * Send message via UAZapi
 */
async function sendMessage(instanceToken, to, messageContent) {
    const endpoint = messageContent.type === 'text' ? '/send/text' : '/send/media'

    let body
    if (messageContent.type === 'text') {
        body = { number: to, text: messageContent.content }
    } else {
        body = {
            number: to,
            type: messageContent.type,
            file: messageContent.mediaUrl,
            caption: messageContent.content
        }
    }

    const response = await fetch(`${uazapiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'token': instanceToken
        },
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`UAZapi error: ${response.status} - ${error}`)
    }

    return response.json()
}

/**
 * Process a single subscription
 */
async function processSubscription(subscription) {
    const sequence = subscription.automation_sequences
    const steps = (sequence.automation_sequence_steps || []).sort((a, b) => a.order_index - b.order_index)
    const currentStepIndex = subscription.current_step || 0
    const currentStep = steps[currentStepIndex]

    if (!currentStep) {
        // No more steps, mark as completed (Chat DB)
        await chatDb
            .from('automation_sequence_subscriptions')
            .update({ status: 'completed', completed_at: new Date().toISOString(), next_step_at: null })
            .eq('id', subscription.id)
        console.log(`✅ Subscription ${subscription.id} completed`)
        return
    }

    if (!currentStep.is_active) {
        // Skip inactive step
        return advanceToNextStep(subscription.id, steps, currentStepIndex)
    }

    // Check if agent is paused (Chat DB)
    if (subscription.conversation_id) {
        const { data: conversation } = await chatDb
            .from('whatsapp_conversations')
            .select('agent_paused')
            .eq('id', subscription.conversation_id)
            .single()

        if (conversation?.agent_paused) {
            console.log(`⏸️ Agent paused for subscription ${subscription.id}, rescheduling`)
            const rescheduleTime = new Date()
            rescheduleTime.setHours(rescheduleTime.getHours() + 1)
            await chatDb
                .from('automation_sequence_subscriptions')
                .update({ next_step_at: rescheduleTime.toISOString() })
                .eq('id', subscription.id)
            return
        }
    }

    // Get contact details (Chat DB)
    const { data: contact } = await chatDb
        .from('whatsapp_contacts')
        .select('whatsapp_number, name')
        .eq('id', subscription.contact_id)
        .single()

    // Get connection details (Main DB)
    const { data: connection } = await mainDb
        .from('whatsapp_connections')
        .select('instance_token')
        .eq('id', sequence.connection_id)
        .single()

    if (!contact || !connection?.instance_token) {
        console.error(`❌ Missing contact or connection for subscription ${subscription.id}`)
        return
    }

    // Get message content (Main DB)
    let messageContent = null

    if (currentStep.template_id) {
        const { data: template } = await mainDb
            .from('message_templates')
            .select('content, type, media_url')
            .eq('id', currentStep.template_id)
            .single()

        if (template) {
            messageContent = { type: template.type || 'text', content: template.content, mediaUrl: template.media_url }
        }
    }

    if (!messageContent && currentStep.automation_id) {
        const { data: automation } = await mainDb
            .from('automations')
            .select('response_type, response_content, response_media_url')
            .eq('id', currentStep.automation_id)
            .single()

        if (automation) {
            messageContent = { type: automation.response_type || 'text', content: automation.response_content, mediaUrl: automation.response_media_url }
        }
    }

    if (!messageContent) {
        console.error(`❌ No message content for step ${currentStep.id}`)
        return advanceToNextStep(subscription.id, steps, currentStepIndex)
    }

    // Send message
    try {
        console.log(`📤 Sending to ${contact.whatsapp_number}: ${messageContent.content?.substring(0, 50)}...`)
        await sendMessage(connection.instance_token, contact.whatsapp_number, messageContent)
        console.log(`✅ Message sent to ${contact.whatsapp_number}`)

        // Update sent count (Main DB)
        await mainDb
            .from('automation_sequence_steps')
            .update({ sent_count: (currentStep.sent_count || 0) + 1 })
            .eq('id', currentStep.id)

    } catch (err) {
        console.error(`❌ Error sending message:`, err.message)
        return // Will retry next cycle
    }

    // Advance to next step
    await advanceToNextStep(subscription.id, steps, currentStepIndex)
}

/**
 * Advance subscription to next step (Chat DB)
 */
async function advanceToNextStep(subscriptionId, steps, currentStepIndex) {
    const nextStepIndex = currentStepIndex + 1
    const nextStep = steps[nextStepIndex]

    if (!nextStep) {
        await chatDb
            .from('automation_sequence_subscriptions')
            .update({ status: 'completed', completed_at: new Date().toISOString(), next_step_at: null, current_step: nextStepIndex })
            .eq('id', subscriptionId)
        console.log(`✅ Subscription ${subscriptionId} completed`)
        return
    }

    const nextStepAt = calculateNextStepTime(nextStep)
    await chatDb
        .from('automation_sequence_subscriptions')
        .update({ current_step: nextStepIndex, next_step_at: nextStepAt })
        .eq('id', subscriptionId)
    console.log(`➡️ Advanced subscription ${subscriptionId} to step ${nextStepIndex}, next at ${nextStepAt}`)
}

/**
 * Main processing loop
 * IMPORTANT: Subscriptions are in Chat DB, but sequences/steps are in Main DB
 * We cannot use JOINs across databases, so we fetch separately
 */
async function processPendingSubscriptions() {
    const now = new Date().toISOString()
    console.log(`\n🔄 [${new Date().toLocaleTimeString()}] Checking for pending subscriptions...`)

    try {
        // Step 1: Get pending subscriptions from Chat DB
        const { data: subscriptions, error } = await chatDb
            .from('automation_sequence_subscriptions')
            .select('*')
            .eq('status', 'active')
            .lte('next_step_at', now)
            .limit(BATCH_SIZE)

        if (error) {
            console.error('❌ Error fetching subscriptions:', error)
            return
        }

        if (!subscriptions || subscriptions.length === 0) {
            console.log('ℹ️ No pending subscriptions')
            return
        }

        console.log(`📋 Found ${subscriptions.length} pending subscriptions`)

        // Step 2: For each subscription, fetch sequence and steps from Main DB
        for (const subscription of subscriptions) {
            try {
                // Fetch sequence with steps from Main DB
                const { data: sequence, error: seqError } = await mainDb
                    .from('automation_sequences')
                    .select(`
                        id, name, connection_id, is_active,
                        automation_sequence_steps (*)
                    `)
                    .eq('id', subscription.sequence_id)
                    .single()

                if (seqError || !sequence) {
                    console.error(`❌ Sequence not found: ${subscription.sequence_id}`)
                    continue
                }

                if (!sequence.is_active) {
                    console.log(`⏸️ Sequence ${sequence.name} is paused, skipping`)
                    continue
                }

                // Attach sequence to subscription for processSubscription
                subscription.automation_sequences = sequence

                await processSubscription(subscription)
            } catch (err) {
                console.error(`❌ Error processing subscription ${subscription.id}:`, err)
            }
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err)
    }
}


// Start the worker loop
setInterval(processPendingSubscriptions, INTERVAL_MS)

// Run immediately on start
processPendingSubscriptions()

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 Sequence Worker shutting down...')
    process.exit(0)
})

process.on('SIGINT', () => {
    console.log('👋 Sequence Worker shutting down...')
    process.exit(0)
})
