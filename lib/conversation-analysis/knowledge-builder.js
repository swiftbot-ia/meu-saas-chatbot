// lib/conversation-analysis/knowledge-builder.js
// ============================================================================
// Knowledge Builder - Constructs knowledge base from analysis results
// ============================================================================

/**
 * Builds a knowledge base from AI analysis results
 */
export class KnowledgeBuilder {
    /**
     * Build knowledge base from analysis
     * @param {object} analysisResult - Result from AIProcessor
     * @param {string} connectionName - Name of the connection
     * @returns {object} Knowledge base object
     */
    build(analysisResult, connectionName) {
        console.log(`📚 [KnowledgeBuilder] Building knowledge base for: ${connectionName}`)

        const kb = {
            company: this.extractCompanyInfo(analysisResult),
            faqs: this.extractFAQs(analysisResult),
            pricing: this.extractPricing(analysisResult),
            communication: this.extractCommunicationStyle(analysisResult),
            objection_handling: this.extractObjectionHandling(analysisResult),
            scripts: this.extractScripts(analysisResult)
        }

        // Build prompt context (formatted for LLM consumption)
        kb.prompt_context = this.buildPromptContext(kb, connectionName)

        console.log(`✅ [KnowledgeBuilder] Knowledge base built with ${Object.keys(kb).length} sections`)

        return kb
    }

    extractCompanyInfo(analysis) {
        const info = analysis.company_info || {}
        return {
            name: info.name || null,
            location: info.location || null,
            business_type: info.business_type || null,
            working_hours: info.working_hours || null,
            payment_methods: analysis.products?.payment_methods || []
        }
    }

    extractFAQs(analysis) {
        return (analysis.faqs || []).map(faq => ({
            question: faq.question,
            answer: faq.best_answer,
            category: faq.category,
            frequency: faq.frequency || 1
        }))
    }

    extractPricing(analysis) {
        const products = analysis.products || {}
        const items = (products.items || []).map(item => ({
            item: item.name,
            price: item.price,
            mentions: item.mentions || 1
        }))
        const packages = (products.packages || []).map(pkg => ({
            item: pkg.name,
            price: pkg.price,
            details: pkg.description
        }))
        return [...items, ...packages]
    }

    extractCommunicationStyle(analysis) {
        const tone = analysis.tone_analysis || {}
        const leadProfile = analysis.lead_profile || {}

        return {
            style: tone.recommended_personality || 'amigável',
            formality_level: tone.formality_level || 3,
            emoji_usage: tone.emoji_usage || 'moderado',
            expressions: tone.characteristic_expressions || [],
            example_responses: tone.example_good_responses || [],
            language_style: leadProfile.language_style || 'informal',
            do: [
                'Responder rapidamente',
                'Ser prestativo e claro',
                'Personalizar respostas'
            ],
            dont: [
                'Ser muito formal',
                'Demorar a responder',
                'Usar linguagem técnica'
            ]
        }
    }

    extractObjectionHandling(analysis) {
        const objections = analysis.objections || []
        const handling = {}

        objections.forEach(obj => {
            handling[obj.type] = {
                response: obj.best_rebuttal,
                examples: obj.examples || [],
                frequency: obj.frequency || 1
            }
        })

        // Add from sales scripts if available
        const scriptHandling = analysis.sales_scripts?.objection_handling || {}
        Object.entries(scriptHandling).forEach(([key, value]) => {
            if (!handling[key]) {
                handling[key] = { response: value, examples: [], frequency: 1 }
            }
        })

        return handling
    }

    extractScripts(analysis) {
        const scripts = analysis.sales_scripts || {}
        return {
            greeting: scripts.opening || 'Olá! Como posso ajudar?',
            qualification_questions: scripts.qualification_questions || [],
            presentation: scripts.presentation || '',
            closing: scripts.closing || '',
            followup: [
                scripts.followup_day1 || '',
                scripts.followup_day3 || ''
            ].filter(Boolean)
        }
    }

    /**
     * Build a text context optimized for LLM prompts
     */
    buildPromptContext(kb, connectionName) {
        let context = `## INFORMAÇÕES DA EMPRESA: ${kb.company.name || connectionName}\n`

        if (kb.company.location) {
            context += `- Localização: ${kb.company.location}\n`
        }
        if (kb.company.business_type) {
            context += `- Tipo de negócio: ${kb.company.business_type}\n`
        }
        if (kb.company.working_hours) {
            context += `- Horário: ${kb.company.working_hours}\n`
        }

        // Pricing
        if (kb.pricing.length > 0) {
            context += `\n## PREÇOS E SERVIÇOS:\n`
            kb.pricing.forEach(p => {
                context += `- ${p.item}: ${p.price}${p.details ? ` (${p.details})` : ''}\n`
            })
        }

        // FAQs
        if (kb.faqs.length > 0) {
            context += `\n## PERGUNTAS FREQUENTES:\n`
            kb.faqs.slice(0, 10).forEach(faq => {
                context += `P: ${faq.question}\nR: ${faq.answer}\n\n`
            })
        }

        // Communication style
        context += `\n## TOM DE VOZ:\n`
        context += `- Estilo: ${kb.communication.style}\n`
        context += `- Formalidade: ${kb.communication.formality_level}/5\n`
        if (kb.communication.expressions.length > 0) {
            context += `- Expressões típicas: ${kb.communication.expressions.join(', ')}\n`
        }

        // Objection handling
        const objections = Object.entries(kb.objection_handling)
        if (objections.length > 0) {
            context += `\n## REBATIMENTO DE OBJEÇÕES:\n`
            objections.forEach(([type, data]) => {
                context += `- ${type}: ${data.response}\n`
            })
        }

        return context
    }
}

export default KnowledgeBuilder
