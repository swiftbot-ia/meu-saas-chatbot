// lib/conversation-analysis/analyzer.js
// ============================================================================
// Main Analyzer - Orchestrates the complete analysis flow
// ============================================================================

import { chatSupabaseAdmin } from '../supabase/chat-server'
import { supabaseAdmin } from '../supabase/server'
import { MessageExtractor } from './message-extractor.js'
import { AIProcessor } from './ai-processor.js'
import { KnowledgeBuilder } from './knowledge-builder.js'
import { AgentConfigBuilder } from './agent-config-builder.js'
import { ANALYSIS_STATUS, DEFAULT_ANALYSIS_OPTIONS } from './types.js'

// In-memory job store (for simplicity - could use Redis in production)
const analysisJobs = new Map()

/**
 * Create a new analysis job
 */
export function createAnalysisJob(connectionId, userId) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const job = {
        id: jobId,
        connectionId,
        userId,
        status: ANALYSIS_STATUS.QUEUED,
        progress: 0,
        currentStep: 'Iniciando...',
        createdAt: new Date().toISOString(),
        reportId: null,
        error: null
    }
    analysisJobs.set(jobId, job)
    return job
}

/**
 * Get analysis job status
 */
export function getAnalysisJob(jobId) {
    return analysisJobs.get(jobId) || null
}

/**
 * Update analysis job
 */
function updateJob(jobId, updates) {
    const job = analysisJobs.get(jobId)
    if (job) {
        Object.assign(job, updates)
        analysisJobs.set(jobId, job)
    }
}

/**
 * Main Conversation Analyzer
 */
export class ConversationAnalyzer {
    constructor() {
        this.chatClient = chatSupabaseAdmin
        this.mainClient = supabaseAdmin
    }

    /**
     * Start analysis in background
     * @param {string} connectionId 
     * @param {string} userId 
     * @param {object} options 
     * @returns {object} Job info
     */
    async startAnalysis(connectionId, userId, options = {}) {
        const job = createAnalysisJob(connectionId, userId)

        console.log(`🚀 [Analyzer] Starting analysis job ${job.id} for connection ${connectionId}`)

        // Run analysis in background (don't await)
        this.runAnalysis(job.id, connectionId, userId, options)
            .then(() => {
                console.log(`✅ [Analyzer] Job ${job.id} completed successfully`)
            })
            .catch(error => {
                console.error(`❌ [Analyzer] Job ${job.id} failed:`, error)
                updateJob(job.id, {
                    status: ANALYSIS_STATUS.FAILED,
                    error: error.message
                })
            })

        return job
    }

    /**
     * Run the complete analysis flow
     */
    async runAnalysis(jobId, connectionId, userId, options = {}) {
        const startTime = Date.now()
        const mergedOptions = { ...DEFAULT_ANALYSIS_OPTIONS, ...options }

        try {
            // Step 1: Extract messages
            updateJob(jobId, {
                status: ANALYSIS_STATUS.PROCESSING,
                progress: 10,
                currentStep: 'Extraindo mensagens...'
            })

            const extractor = new MessageExtractor(this.chatClient)
            const { messages, contacts, connectionName } = await extractor.extract(
                connectionId,
                options.period
            )

            console.log(`📊 [Analyzer] Extracted ${messages.length} messages, ${contacts.length} contacts`)

            // Check minimum messages
            if (messages.length < mergedOptions.minMessages) {
                throw new Error(
                    `Número insuficiente de mensagens: ${messages.length}. ` +
                    `Mínimo necessário: ${mergedOptions.minMessages}. ` +
                    `Sincronize mais conversas antes de analisar.`
                )
            }

            // Step 2: Format for AI
            updateJob(jobId, {
                progress: 20,
                currentStep: 'Preparando dados para análise...'
            })

            const formattedConversations = extractor.formatForAnalysis(messages, contacts)
            const basicMetrics = extractor.calculateBasicMetrics(messages, contacts)

            // Step 3: AI Analysis
            updateJob(jobId, {
                progress: 30,
                currentStep: 'Analisando com IA (pode levar alguns minutos)...'
            })

            const aiProcessor = new AIProcessor()
            const { analysis, processingTime, usage } = await aiProcessor.analyze(
                formattedConversations,
                { connectionName }
            )

            console.log(`🤖 [Analyzer] AI analysis completed in ${processingTime}ms`)

            // Step 4: Build knowledge base
            updateJob(jobId, {
                progress: 70,
                currentStep: 'Construindo base de conhecimento...'
            })

            const knowledgeBuilder = new KnowledgeBuilder()
            const knowledgeBase = knowledgeBuilder.build(analysis, connectionName)

            // Step 5: Build agent config suggestion
            updateJob(jobId, {
                progress: 80,
                currentStep: 'Gerando configuração de agente...'
            })

            const agentConfigBuilder = new AgentConfigBuilder()
            const suggestedAgentConfig = agentConfigBuilder.build(analysis, knowledgeBase, connectionName)

            // Step 6: Save to database
            updateJob(jobId, {
                progress: 90,
                currentStep: 'Salvando relatório...'
            })

            const totalTime = Date.now() - startTime

            const { data: report, error: insertError } = await this.mainClient
                .from('conversation_analysis_reports')
                .insert({
                    connection_id: connectionId,
                    connection_name: connectionName,
                    period_start: basicMetrics.period_start,
                    period_end: basicMetrics.period_end,
                    total_messages: basicMetrics.total_messages,
                    total_contacts: basicMetrics.total_contacts,
                    messages_incoming: basicMetrics.messages_incoming,
                    messages_outgoing: basicMetrics.messages_outgoing,
                    status: 'completed',
                    processing_time_ms: totalTime,
                    report_data: analysis,
                    metrics: {
                        ...basicMetrics,
                        ai_processing_time: processingTime,
                        tokens_used: usage
                    },
                    knowledge_base: knowledgeBase,
                    suggested_agent_config: suggestedAgentConfig,
                    created_by: userId
                })
                .select()
                .single()

            if (insertError) {
                throw new Error(`Error saving report: ${insertError.message}`)
            }

            console.log(`💾 [Analyzer] Report saved with ID: ${report.id}`)

            // Save knowledge base entries
            await this.saveKnowledgeEntries(report.id, connectionId, knowledgeBase)

            // Step 7: Mark complete
            updateJob(jobId, {
                status: ANALYSIS_STATUS.COMPLETED,
                progress: 100,
                currentStep: 'Análise concluída!',
                reportId: report.id
            })

            return report

        } catch (error) {
            console.error(`❌ [Analyzer] Error in analysis:`, error)

            // Save failed report for debugging
            try {
                await this.mainClient
                    .from('conversation_analysis_reports')
                    .insert({
                        connection_id: connectionId,
                        status: 'failed',
                        error_message: error.message,
                        processing_time_ms: Date.now() - startTime,
                        created_by: userId
                    })
            } catch (saveError) {
                console.error(`❌ [Analyzer] Could not save error report:`, saveError)
            }

            throw error
        }
    }

    /**
     * Save individual knowledge base entries
     */
    async saveKnowledgeEntries(reportId, connectionId, knowledgeBase) {
        const entries = []

        // FAQs
        knowledgeBase.faqs?.forEach(faq => {
            entries.push({
                report_id: reportId,
                connection_id: connectionId,
                category: 'faq',
                subcategory: faq.category,
                question: faq.question,
                answer: faq.answer,
                frequency: faq.frequency
            })
        })

        // Pricing
        knowledgeBase.pricing?.forEach(price => {
            entries.push({
                report_id: reportId,
                connection_id: connectionId,
                category: 'price',
                question: `Quanto custa ${price.item}?`,
                answer: price.price,
                context: price.details || null
            })
        })

        // Objection handling
        Object.entries(knowledgeBase.objection_handling || {}).forEach(([objType, data]) => {
            entries.push({
                report_id: reportId,
                connection_id: connectionId,
                category: 'objection',
                subcategory: objType,
                question: objType,
                answer: data.response,
                context: data.examples?.join(' | ') || null,
                frequency: data.frequency
            })
        })

        if (entries.length > 0) {
            const { error } = await this.mainClient
                .from('knowledge_base_entries')
                .insert(entries)

            if (error) {
                console.error(`⚠️ [Analyzer] Error saving KB entries:`, error)
            } else {
                console.log(`📚 [Analyzer] Saved ${entries.length} knowledge base entries`)
            }
        }
    }

    /**
     * Get the latest report for a connection
     */
    async getLatestReport(connectionId) {
        const { data, error } = await this.mainClient
            .from('conversation_analysis_reports')
            .select('*')
            .eq('connection_id', connectionId)
            .eq('status', 'completed')
            .order('analysis_date', { ascending: false })
            .limit(1)
            .single()

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Error fetching report: ${error.message}`)
        }

        return data || null
    }

    /**
     * Get all reports for a connection
     */
    async getReports(connectionId, limit = 10) {
        const { data, error } = await this.mainClient
            .from('conversation_analysis_reports')
            .select('id, connection_id, connection_name, analysis_date, status, total_messages, total_contacts, processing_time_ms')
            .eq('connection_id', connectionId)
            .order('analysis_date', { ascending: false })
            .limit(limit)

        if (error) {
            throw new Error(`Error fetching reports: ${error.message}`)
        }

        return data || []
    }
}

export default ConversationAnalyzer
