// app/api/conversation-analysis/agent-config/[connectionId]/generate/route.js
// ============================================================================
// POST /api/conversation-analysis/agent-config/:connectionId/generate
// Generate agent config using AI based on analysis data
// ============================================================================

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../../lib/supabase/server'
import OpenAI from 'openai'
import { getAgentConfigPrompt } from '../../../../../../lib/conversation-analysis/prompts/agent-config-prompt.js'

export async function POST(request, { params }) {
    try {
        const { connectionId } = await params
        const body = await request.json()
        const { style, objective } = body

        if (!connectionId) {
            return NextResponse.json(
                { error: 'connectionId is required' },
                { status: 400 }
            )
        }

        // Get the latest completed report
        const { data: report, error } = await supabaseAdmin
            .from('conversation_analysis_reports')
            .select('id, connection_id, connection_name, report_data, knowledge_base')
            .eq('connection_id', connectionId)
            .eq('status', 'completed')
            .order('analysis_date', { ascending: false })
            .limit(1)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    {
                        error: 'Nenhuma análise encontrada para esta conexão.',
                        has_report: false,
                        message: 'Sincronize suas conversas primeiro para gerar a configuração com IA.'
                    },
                    { status: 404 }
                )
            }
            throw new Error(error.message)
        }

        // Prepare analysis data for the prompt
        const analysisData = {
            report_data: report.report_data,
            knowledge_base: report.knowledge_base,
            connection_name: report.connection_name
        }

        // Generate prompt
        const prompt = getAgentConfigPrompt(analysisData, { style, objective })

        // Call OpenAI to generate personalized config
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        })

        console.log(`🤖 [AgentConfigGenerate] Generating config for connection: ${connectionId}`)

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Você é um especialista em criação de agentes de IA para WhatsApp.
Gere configurações personalizadas e específicas baseadas nos dados de análise fornecidos.
Retorne APENAS JSON válido, sem texto adicional.`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 4000,
            temperature: 0.4
        })

        const content = response.choices[0]?.message?.content
        if (!content) {
            throw new Error('Empty response from AI')
        }

        // Parse JSON from response
        let generatedConfig
        try {
            let jsonStr = content.trim()
            if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '')
            } else if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '')
            }
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
            generatedConfig = JSON.parse(jsonMatch[0])
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError)
            throw new Error('Failed to parse AI response')
        }

        console.log(`✅ [AgentConfigGenerate] Config generated successfully`)

        // Map to form_values format expected by frontend
        const formValues = {
            companyName: generatedConfig.companyName || '',
            businessSector: generatedConfig.businessSector || 'servicos',
            personality: generatedConfig.personality || style || 'amigavel',
            botObjective: generatedConfig.botObjective || objective || 'vendas_qualificacao',
            welcomeMessage: generatedConfig.welcomeMessage || '',
            defaultResponse: generatedConfig.defaultResponse || 'Desculpe, não entendi. Pode reformular?',
            productDescription: generatedConfig.productDescription || '',
            priceRange: generatedConfig.priceRange || '',
            agentName: generatedConfig.agentName || 'Assistente',
            objectionsQA: generatedConfig.objectionsQA || [{ question: '', answer: '' }],
            objectiveQuestions: generatedConfig.objectiveQuestions || [],
            salesCTA: generatedConfig.salesCTA || '',
            followupMessages: generatedConfig.followupMessages || {},
            knowledgeSnippets: generatedConfig.knowledgeSnippets || [],
            caracteristicas_identificadas: generatedConfig.caracteristicas_identificadas || {}
        }

        return NextResponse.json({
            success: true,
            connection_id: report.connection_id,
            connection_name: report.connection_name,
            generated_config: generatedConfig,
            form_values: formValues
        })

    } catch (error) {
        console.error('Error generating agent config:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
