// lib/conversation-analysis/agent-config-builder.js
// ============================================================================
// Agent Config Builder - Generates suggested agent configuration from analysis
// This is used for the initial suggestion; the /generate endpoint uses AI
// ============================================================================

/**
 * Builds suggested agent configuration from analysis
 * Mapped to the agent-config form fields
 */
export class AgentConfigBuilder {
    /**
     * Build suggested agent configuration
     * @param {object} analysisResult - Result from AIProcessor (new structure)
     * @param {object} knowledgeBase - Result from KnowledgeBuilder
     * @param {string} connectionName - Name of the connection
     * @returns {object} Suggested agent config mapped to form fields
     */
    build(analysisResult, knowledgeBase, connectionName) {
        console.log(`🤖 [AgentConfigBuilder] Building agent config for: ${connectionName}`)

        const empresaInfo = analysisResult.empresa_info || {}
        const tomVoz = analysisResult.analise_tom_voz || {}
        const scripts = analysisResult.scripts_vendas || {}
        const perfilLead = analysisResult.perfil_lead || {}
        const objecoes = analysisResult.objecoes || {}
        const perguntasQual = analysisResult.perguntas_qualificacao || {}

        // Map personality based on tone analysis
        const personality = this.mapPersonality(tomVoz)

        // Map business sector
        const businessSector = this.mapBusinessSector(empresaInfo.tipo_negocio)

        // Build objections QA array from mapped objections
        const objectionsQA = this.buildObjectionsQA(objecoes.mapeamento)

        // Build objective questions from qualification questions
        const objectiveQuestions = this.buildObjectiveQuestions(perguntasQual)

        // Build suggested config
        const config = {
            // Basic Info
            name: connectionName || empresaInfo.nome,
            description: `Agente de atendimento para ${empresaInfo.nome || connectionName}`,

            // Personality & Style
            personality,
            objective: 'vendas_qualificacao',

            // Form values (mapped to agent-config form)
            form_values: {
                companyName: empresaInfo.nome || connectionName || '',
                businessSector,
                personality,
                businessHours: '24h',
                welcomeMessage: scripts.abertura?.saudacao || 'Olá! Seja bem-vindo! Como posso ajudar você hoje?',
                defaultResponse: 'Desculpe, não entendi sua pergunta. Pode reformular?',
                productDescription: this.buildProductDescription(analysisResult.produtos_servicos),
                botObjective: 'vendas_qualificacao',
                productUrl: '',
                priceRange: this.extractPriceRange(analysisResult.produtos_servicos),
                startTime: '08:00',
                endTime: '18:00',
                offHoursMessage: 'Estamos fora do horário de atendimento. Retornaremos em breve!',
                agentName: this.suggestAgentName(personality),
                objectionsQA,
                objectiveQuestions,
                salesCTA: scripts.fechamento?.cta_principal || 'Gostaria de agendar uma demonstração gratuita?',
                notifyLeads: true
            },

            // System prompt suggestion
            system_prompt: this.buildSystemPrompt(empresaInfo, tomVoz, knowledgeBase),

            // Conversation flow
            conversation_flow: {
                opening: scripts.abertura || {},
                qualification_questions: scripts.qualificacao || [],
                presentation_template: scripts.apresentacao_oferta,
                closing_cta: scripts.fechamento?.cta_principal,
                followup_sequence: scripts.followup || {}
            },

            // Knowledge snippets for agent
            knowledge_snippets: this.extractKnowledgeSnippets(knowledgeBase),

            // Insights for user
            insights: analysisResult.insights_estrategicos || null
        }

        console.log(`✅ [AgentConfigBuilder] Config built with ${objectionsQA.length} objections and ${objectiveQuestions.length} questions`)

        return config
    }

    mapPersonality(tomVoz) {
        const formality = tomVoz.nivel_formalidade || 3
        const personalidade = tomVoz.personalidade_recomendada || ''

        if (formality >= 4 || personalidade.toLowerCase().includes('profissional')) return 'formal'
        if (formality <= 2 || personalidade.toLowerCase().includes('amig')) return 'amigavel'
        if (personalidade.toLowerCase().includes('técn')) return 'tecnico'
        if (personalidade.toLowerCase().includes('venda')) return 'vendas'
        if (personalidade.toLowerCase().includes('suporte')) return 'suporte'

        return 'amigavel' // Default
    }

    mapBusinessSector(businessType) {
        if (!businessType) return 'servicos'

        const type = businessType.toLowerCase()

        if (type.includes('tech') || type.includes('software') || type.includes('ti')) return 'tecnologia'
        if (type.includes('saúde') || type.includes('clinica') || type.includes('médic')) return 'saude'
        if (type.includes('educa') || type.includes('curso') || type.includes('escola')) return 'educacao'
        if (type.includes('comércio') || type.includes('loja') || type.includes('varejo')) return 'comercio'
        if (type.includes('financ') || type.includes('banco') || type.includes('invest')) return 'financeiro'
        if (type.includes('imob') || type.includes('casa') || type.includes('apart')) return 'imobiliario'
        if (type.includes('beleza') || type.includes('estétic') || type.includes('laser') || type.includes('depila')) return 'beleza'
        if (type.includes('restaur') || type.includes('comida') || type.includes('food')) return 'alimentacao'

        return 'servicos' // Default
    }

    buildObjectionsQA(objecoesMapeamento) {
        if (!objecoesMapeamento || objecoesMapeamento.length === 0) {
            return [{ question: '', answer: '' }]
        }

        return objecoesMapeamento.slice(0, 10).map(obj => ({
            question: obj.exemplos_reais?.[0] || obj.objecao || '',
            answer: obj.rebatimento_que_funcionou || ''
        })).filter(o => o.question && o.answer)
    }

    buildObjectiveQuestions(perguntasQualificacao) {
        if (!perguntasQualificacao) return []

        const questions = []

        // Collect from all categories
        const categories = ['situacao', 'problema', 'implicacao', 'necessidade', 'decisao']
        categories.forEach(cat => {
            const catQuestions = perguntasQualificacao[cat] || []
            catQuestions.forEach(q => {
                if (q) questions.push({ question: q })
            })
        })

        return questions.slice(0, 15)
    }

    buildProductDescription(produtos) {
        if (!produtos) return ''

        const items = produtos.items || []
        const packages = produtos.pacotes || []

        let description = ''

        if (items.length > 0) {
            description += 'Produtos/Serviços oferecidos:\n'
            items.slice(0, 10).forEach(item => {
                description += `- ${item.nome}${item.preco ? ` (${item.preco})` : ''}\n`
            })
        }

        if (packages.length > 0) {
            description += '\nPacotes disponíveis:\n'
            packages.slice(0, 10).forEach(pkg => {
                description += `- ${pkg.nome}: ${pkg.descricao || ''} ${pkg.preco ? `- ${pkg.preco}` : ''}\n`
            })
        }

        return description.trim()
    }

    extractPriceRange(produtos) {
        if (!produtos) return ''

        const allPrices = []

        if (produtos.items) {
            produtos.items.forEach(item => {
                if (item.preco) allPrices.push(item.preco)
            })
        }

        if (produtos.pacotes) {
            produtos.pacotes.forEach(pkg => {
                if (pkg.preco) allPrices.push(pkg.preco)
            })
        }

        if (allPrices.length === 0) return ''
        if (allPrices.length === 1) return allPrices[0]

        return `${allPrices[0]} - ${allPrices[allPrices.length - 1]}`
    }

    suggestAgentName(personality) {
        const names = {
            amigavel: ['Ana', 'Bia', 'Luna', 'Sofia', 'Mia'],
            formal: ['Carlos', 'Roberto', 'Assistente', 'Atendente'],
            tecnico: ['Max', 'Tech', 'Assistente Técnico'],
            vendas: ['Lucas', 'Pedro', 'Vendedor Virtual'],
            suporte: ['Sara', 'Suporte', 'Atendimento']
        }

        const options = names[personality] || names.amigavel
        return options[Math.floor(Math.random() * options.length)]
    }

    buildSystemPrompt(empresaInfo, tomVoz, knowledgeBase) {
        let prompt = `Você é um assistente virtual da ${empresaInfo.nome || 'empresa'}.\n\n`

        prompt += `PERSONALIDADE:\n`
        prompt += `- ${tomVoz.personalidade_recomendada || 'Seja amigável e prestativo'}\n`
        prompt += `- Formalidade: ${tomVoz.nivel_formalidade || 3}/5\n`
        prompt += `- Uso de emojis: ${tomVoz.uso_emojis || 'moderado'}\n\n`

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
        knowledgeBase.pricing?.items?.slice(0, 5).forEach(p => {
            snippets.push(`${p.item}: ${p.price}`)
        })

        // Add objections
        knowledgeBase.objections?.mapeamento?.slice(0, 3).forEach(obj => {
            snippets.push(`Objeção "${obj.objecao}": ${obj.rebatimento_que_funcionou}`)
        })

        return snippets
    }
}

export default AgentConfigBuilder
