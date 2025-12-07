// lib/conversation-analysis/types.js
// ============================================================================
// Type definitions and constants for Conversation Analysis System
// ============================================================================

/**
 * Analysis status enum
 */
export const ANALYSIS_STATUS = {
    QUEUED: 'queued',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
}

/**
 * Knowledge base categories
 */
export const KB_CATEGORIES = {
    FAQ: 'faq',
    OBJECTION: 'objection',
    SCRIPT: 'script',
    PRICE: 'price',
    PRODUCT: 'product',
    TONE: 'tone'
}

/**
 * Default analysis options
 */
export const DEFAULT_ANALYSIS_OPTIONS = {
    minMessages: 50,
    language: 'pt-BR',
    includeAudioTranscription: true
}

/**
 * AI Provider configuration
 */
export const AI_PROVIDERS = {
    OPENAI: 'openai',
    DEEPSEEK: 'deepseek'
}

// Current provider (can be switched)
export const CURRENT_AI_PROVIDER = AI_PROVIDERS.OPENAI

/**
 * OpenAI model to use for analysis
 */
export const OPENAI_MODEL = 'gpt-4o-mini' // Cost-effective, good enough for analysis
