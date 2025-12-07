// lib/conversation-analysis/agent-config-builder.js
// ============================================================================
// Agent Config Builder - Generates suggested agent configuration from analysis
// ============================================================================

/**
 * Builds suggested agent configuration from analysis
 * Mapped to the agent-config form fields
 */
export class AgentConfigBuilder {
    /**
     * Build suggested agent configuration
     * @param {object} analysisResult - Result from AIProcessor
     * @param {object} knowledgeBase - Result from KnowledgeBuilder
     * @param {string} connectionName - Name of the connection
     * @returns {object} Suggested agent config mapped to form fields
     */
    build(analysisResult, knowledgeBase, connectionName) {
        console.log(`🤖 [AgentConfigBuilder] Building agent config for: ${connectionName}`)

        const companyInfo = analysisResult.company_info || {}
        const toneAnalysis = analysisResult.tone_analysis || {}
        const salesScripts = analysisResult.sales_scripts || {}
        const leadProfile = analysisResult.lead_profile || {}

        // Map personality based on tone analysis
        const personality = this.mapPersonality(toneAnalysis, leadProfile)

        // Map business sector
        const businessSector = this.mapBusinessSector(companyInfo.business_type)

        // Build objections QA array
        const objectionsQA = this.buildObjectionsQA(analysisResult.objections)

        // Build objective questions
        const objectiveQuestions = this.buildObjectiveQuestions(salesScripts.qualification_questions)

        // Build suggested config
        const config = {
            // Basic Info
            name: connectionName || companyInfo.name,
            description: `Agente de atendimento para ${companyInfo.name || connectionName}`,

            // Personality & Style
            personality,
            objective: 'vendas_qualificacao', // Default to sales qualification

            // Form values (mapped to agent-config form)
            form_values: {
                companyName: companyInfo.name || connectionName || '',
                businessSector,
                personality,
                businessHours: '24h',
                welcomeMessage: salesScripts.opening || 'Olá! Seja bem-vindo! Como posso ajudar você hoje?',
                defaultResponse: 'Desculpe, não entendi sua pergunta. Pode reformular?',
                productDescription: this.buildProductDescription(analysisResult.products),
                botObjective: 'vendas_qualificacao',
                productUrl: '',
                priceRange: this.extractPriceRange(analysisResult.products),
                startTime: '08:00',
                endTime: '18:00',
                offHoursMessage: 'Estamos fora do horário de atendimento. Retornaremos em breve!',
                agentName: this.suggestAgentName(personality),
                objectionsQA,
                objectiveQuestions,
                salesCTA: salesScripts.closing || 'Gostaria de agendar uma demonstração gratuita?',
                notifyLeads: true
            },

            // System prompt suggestion
            system_prompt: this.buildSystemPrompt(companyInfo, toneAnalysis, knowledgeBase),

            // Conversation flow
            conversation_flow: {
                opening: salesScripts.opening,
                qualification_questions: salesScripts.qualification_questions || [],
                presentation_template: salesScripts.presentation,
                closing_cta: salesScripts.closing,
                followup_sequence: [
                    salesScripts.followup_day1,
                    salesScripts.followup_day3
                ].filter(Boolean)
            },

            // Knowledge snippets for agent
            knowledge_snippets: this.extractKnowledgeSnippets(knowledgeBase)
        }

        console.log(`✅ [AgentConfigBuilder] Config built with ${objectionsQA.length} objections and ${objectiveQuestions.length} questions`)

        return config
    }

    mapPersonality(toneAnalysis, leadProfile) {
        const formality = toneAnalysis.formality_level || 3
        const style = leadProfile.language_style || 'informal'

        if (formality >= 4) return 'formal'
        if (formality <= 2 || style === 'informal') return 'amigavel'
        if (toneAnalysis.recommended_personality?.toLowerCase().includes('técnico')) return 'tecnico'
        if (toneAnalysis.recommended_personality?.toLowerCase().includes('venda')) return 'vendas'

        return 'amigavel' // Default
    }

    mapBusinessSector(businessType) {
        if (!businessType) return ''

        const type = businessType.toLowerCase()

        if (type.includes('tech') || type.includes('software') || type.includes('ti')) return 'tecnologia'
        if (type.includes('saúde') || type.includes('clinica') || type.includes('médic')) return 'saude'
        if (type.includes('educa') || type.includes('curso') || type.includes('escola')) return 'educacao'
        if (type.includes('comércio') || type.includes('loja') || type.includes('varejo')) return 'comercio'
        if (type.includes('financ') || type.includes('banco') || type.includes('invest')) return 'financeiro'
        if (type.includes('imob') || type.includes('casa') || type.includes('apart')) return 'imobiliario'

        return 'servicos' // Default
    }

    buildObjectionsQA(objections) {
        if (!objections || objections.length === 0) {
            return [{ question: '', answer: '' }]
        }

        return objections.slice(0, 10).map(obj => ({
            question: obj.examples?.[0] || obj.type,
            answer: obj.best_rebuttal || ''
        }))
    }

    buildObjectiveQuestions(qualificationQuestions) {
        if (!qualificationQuestions || qualificationQuestions.length === 0) {
            return []
        }

        return qualificationQuestions.slice(0, 10).map(q => ({
            question: q
        }))
    }

    buildProductDescription(products) {
        if (!products) return ''

        const items = products.items || []
        const packages = products.packages || []

        let description = ''

        if (items.length > 0) {
            description += 'Produtos/Serviços oferecidos:\n'
            items.slice(0, 5).forEach(item => {
                description += `- ${item.name}${item.price ? ` (${item.price})` : ''}\n`
            })
        }

        if (packages.length > 0) {
            description += '\nPacotes disponíveis:\n'
            packages.slice(0, 5).forEach(pkg => {
                description += `- ${pkg.name}: ${pkg.description || ''} ${pkg.price ? `- ${pkg.price}` : ''}\n`
            })
        }

        return description.trim()
    }

    extractPriceRange(products) {
        if (!products) return ''

        const allPrices = []

        if (products.items) {
            products.items.forEach(item => {
                if (item.price) allPrices.push(item.price)
            })
        }

        if (products.packages) {
            products.packages.forEach(pkg => {
                if (pkg.price) allPrices.push(pkg.price)
            })
        }

        if (allPrices.length === 0) return ''
        if (allPrices.length === 1) return allPrices[0]

        return `${allPrices[0]} - ${allPrices[allPrices.length - 1]}`
    }

    suggestAgentName(personality) {
        const names = {
            amigavel: ['Ana', 'Bia', 'Luna', 'Sofia'],
            formal: ['Carlos', 'Roberto', 'Assistente', 'Atendente'],
            tecnico: ['Max', 'Tech', 'Assistente Técnico'],
            vendas: ['Lucas', 'Pedro', 'Vendedor Virtual'],
            suporte: ['Sara', 'Suporte', 'Atendimento']
        }

        const options = names[personality] || names.amigavel
        return options[Math.floor(Math.random() * options.length)]
    }

    buildSystemPrompt(companyInfo, toneAnalysis, knowledgeBase) {
        let prompt = `Você é um assistente virtual da ${companyInfo.name || 'empresa'}.\n\n`

        prompt += `PERSONALIDADE:\n`
        prompt += `- ${toneAnalysis.recommended_personality || 'Seja amigável e prestativo'}\n`
        prompt += `- Formalidade: ${toneAnalysis.formality_level || 3}/5\n`
        prompt += `- Uso de emojis: ${toneAnalysis.emoji_usage || 'moderado'}\n\n`

        prompt += `BASE DE CONHECIMENTO:\n`
        prompt += knowledgeBase.prompt_context || ''

        prompt += `\n\nREGRAS:\n`
        prompt += `- Responda apenas com base nas informações fornecidas\n`
        prompt += `- Seja conciso mas completo\n`
        prompt += `- Sempre direcione para um próximo passo (agendamento, compra, etc)\n`

        return prompt
    }

    extractKnowledgeSnippets(knowledgeBase) {
        const snippets = []

        // Add FAQs
        knowledgeBase.faqs?.slice(0, 5).forEach(faq => {
            snippets.push(`P: ${faq.question} R: ${faq.answer}`)
        })

        // Add pricing
        knowledgeBase.pricing?.slice(0, 5).forEach(p => {
            snippets.push(`${p.item}: ${p.price}`)
        })

        return snippets
    }
}

export default AgentConfigBuilder
