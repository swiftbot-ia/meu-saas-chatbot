// lib/swiftbot-ia/credits-service.js
// ============================================================================
// Credits Management Service for SwiftBot IA
// ============================================================================

import { supabaseAdmin } from '../supabase/server'

// Pricing constants
const PRICING = {
    // OpenAI GPT-4o-mini pricing (per 1M tokens)
    INPUT_COST_PER_1M: 0.15,   // USD
    OUTPUT_COST_PER_1M: 0.60,  // USD

    // Conversion
    USD_TO_BRL: 5.0,

    // Markup
    MARKUP_MULTIPLIER: 30.0,

    // Credits value (5000 credits = R$50)
    CREDITS_PER_BRL: 100, // 5000 / 50 = 100 credits per R$1
}

/**
 * Calculate credits to charge based on token usage
 * @param {number} inputTokens - Input tokens used
 * @param {number} outputTokens - Output tokens used
 * @returns {number} Credits to charge
 */
export function calculateCredits(inputTokens, outputTokens) {
    // Calculate cost in USD
    const inputCostUSD = (inputTokens / 1_000_000) * PRICING.INPUT_COST_PER_1M
    const outputCostUSD = (outputTokens / 1_000_000) * PRICING.OUTPUT_COST_PER_1M
    const totalCostUSD = inputCostUSD + outputCostUSD

    // Convert to BRL
    const totalCostBRL = totalCostUSD * PRICING.USD_TO_BRL

    // Apply markup
    const finalCostBRL = totalCostBRL * PRICING.MARKUP_MULTIPLIER

    // Convert to credits (100 credits per R$1)
    const credits = finalCostBRL * PRICING.CREDITS_PER_BRL

    // Return rounded to 4 decimal places
    return Math.round(credits * 10000) / 10000
}

/**
 * Get user's credit balance
 * @param {string} userId - User ID
 * @returns {Promise<{balance: number, exists: boolean}>}
 */
export async function getBalance(userId) {
    const { data, error } = await supabaseAdmin
        .from('user_credits')
        .select('balance')
        .eq('user_id', userId)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return { balance: 0, exists: false }
        }
        throw new Error(error.message)
    }

    return { balance: parseFloat(data.balance), exists: true }
}

/**
 * Initialize credits for a user (if not exists)
 * @param {string} userId - User ID
 * @returns {Promise<{balance: number, created: boolean}>}
 */
export async function initializeCredits(userId) {
    // Check if already exists
    const existing = await getBalance(userId)
    if (existing.exists) {
        return { balance: existing.balance, created: false }
    }

    // Create with initial balance
    const initialBalance = 5000.00

    const { error: creditsError } = await supabaseAdmin
        .from('user_credits')
        .insert({ user_id: userId, balance: initialBalance })

    if (creditsError) {
        throw new Error(creditsError.message)
    }

    // Log transaction
    await supabaseAdmin
        .from('credit_transactions')
        .insert({
            user_id: userId,
            type: 'initial',
            amount: initialBalance,
            description: 'Créditos iniciais de boas-vindas'
        })

    return { balance: initialBalance, created: true }
}

/**
 * Deduct credits from user balance
 * @param {string} userId - User ID
 * @param {number} amount - Credits to deduct
 * @param {string} messageId - Associated message ID (optional)
 * @param {string} description - Description (optional)
 * @returns {Promise<{newBalance: number, success: boolean}>}
 */
export async function deductCredits(userId, amount, messageId = null, description = null) {
    // Get current balance
    const { balance, exists } = await getBalance(userId)

    if (!exists) {
        throw new Error('User credits not initialized')
    }

    if (balance < amount) {
        throw new Error('Insufficient credits')
    }

    const newBalance = balance - amount

    // Update balance
    const { error: updateError } = await supabaseAdmin
        .from('user_credits')
        .update({ balance: newBalance })
        .eq('user_id', userId)

    if (updateError) {
        throw new Error(updateError.message)
    }

    // Log transaction
    await supabaseAdmin
        .from('credit_transactions')
        .insert({
            user_id: userId,
            type: 'usage',
            amount: -amount,
            message_id: messageId,
            description: description || 'Uso do SwiftBot IA'
        })

    return { newBalance, success: true }
}

/**
 * Check if user has sufficient credits
 * @param {string} userId - User ID
 * @param {number} minimumRequired - Minimum credits required (default 1)
 * @returns {Promise<boolean>}
 */
export async function hasCredits(userId, minimumRequired = 1) {
    const { balance, exists } = await getBalance(userId)
    return exists && balance >= minimumRequired
}

export default {
    calculateCredits,
    getBalance,
    initializeCredits,
    deductCredits,
    hasCredits,
    PRICING
}
