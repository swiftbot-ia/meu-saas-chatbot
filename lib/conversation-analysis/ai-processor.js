// lib/conversation-analysis/ai-processor.js
// ============================================================================
// AI Processor - Integrates with OpenAI for conversation analysis
// ============================================================================

import OpenAI from 'openai'
import { getAnalysisPrompt } from './prompts/analysis-prompt.js'
import { OPENAI_MODEL } from './types.js'

/**
 * AI Processor for conversation analysis
 */
export class AIProcessor {
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        })
    }

    /**
     * Analyze conversations using AI
     * @param {string} formattedConversations - Text formatted by MessageExtractor
     * @param {object} options - { connectionName: string }
     * @returns {Promise<object>} Parsed analysis result
     */
    async analyze(formattedConversations, options = {}) {
        const { connectionName = 'Empresa' } = options

        console.log(`🤖 [AIProcessor] Starting analysis for: ${connectionName}`)
        console.log(`📊 [AIProcessor] Input size: ${formattedConversations.length} characters`)

        const prompt = getAnalysisPrompt(formattedConversations, connectionName)

        try {
            const startTime = Date.now()

            const response = await this.client.chat.completions.create({
                model: OPENAI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: `Você é um especialista em análise de conversas comerciais de WhatsApp.
Analise as conversas fornecidas e retorne APENAS um JSON válido seguindo a estrutura especificada.
Não inclua markdown, código, ou qualquer texto antes ou depois do JSON.
Seja específico, use dados reais das conversas e quantifique sempre que possível.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 8000,
                temperature: 0.3 // Lower temperature for more consistent output
            })

            const processingTime = Date.now() - startTime
            console.log(`✅ [AIProcessor] Analysis completed in ${processingTime}ms`)

            // Extract content
            const content = response.choices[0]?.message?.content
            if (!content) {
                throw new Error('Empty response from AI')
            }

            // Parse JSON from response
            const result = this.parseJsonResponse(content)

            console.log(`📋 [AIProcessor] Parsed analysis with ${Object.keys(result).length} sections`)

            return {
                analysis: result,
                processingTime,
                model: response.model,
                usage: response.usage
            }

        } catch (error) {
            console.error('❌ [AIProcessor] Error during analysis:', error)
            throw error
        }
    }

    /**
     * Parse JSON from AI response
     * Handles various edge cases
     * @param {string} content - Raw AI response
     * @returns {object} Parsed JSON
     */
    parseJsonResponse(content) {
        let jsonStr = content.trim()

        // Remove markdown code blocks if present
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }

        // Try to find JSON object in the response
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            console.error('❌ [AIProcessor] No JSON found in response:', jsonStr.substring(0, 500))
            throw new Error('No valid JSON found in AI response')
        }

        try {
            return JSON.parse(jsonMatch[0])
        } catch (parseError) {
            console.error('❌ [AIProcessor] JSON parse error:', parseError.message)
            console.error('❌ [AIProcessor] Content sample:', jsonMatch[0].substring(0, 500))
            throw new Error(`Failed to parse AI response: ${parseError.message}`)
        }
    }
}

export default AIProcessor
