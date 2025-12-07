// lib/conversation-analysis/knowledge-builder.js
// ============================================================================
// Knowledge Builder - Constructs rich knowledge base from analysis results
// ============================================================================

/**
 * Builds a comprehensive knowledge base from AI analysis results
 */
export class KnowledgeBuilder {
    /**
     * Build knowledge base from analysis
     * @param {object} analysisResult - Result from AIProcessor (new structure)
     * @param {string} connectionName - Name of the connection
     * @returns {object} Knowledge base object
     */
    build(analysisResult, connectionName) {
        console.log(`📚 [KnowledgeBuilder] Building knowledge base for: ${connectionName}`)

        const kb = {
            company: this.extractCompanyInfo(analysisResult),
            resumo_executivo: this.extractResumoExecutivo(analysisResult),
            metricas: this.extractMetricas(analysisResult),
            perfil_lead: this.extractPerfilLead(analysisResult),
            faqs: this.extractFAQs(analysisResult),
            pricing: this.extractPricing(analysisResult),
            objections: this.extractObjections(analysisResult),
            communication: this.extractCommunicationStyle(analysisResult),
            scripts: this.extractScripts(analysisResult),
            perguntas_qualificacao: this.extractPerguntasQualificacao(analysisResult),
            insights: this.extractInsights(analysisResult),
            copies: this.extractCopies(analysisResult)
        }

        // Build prompt context (formatted for LLM consumption)
        kb.prompt_context = this.buildPromptContext(kb, connectionName)

        console.log(`✅ [KnowledgeBuilder] Knowledge base built with ${Object.keys(kb).length} sections`)

        return kb
    }

    extractCompanyInfo(analysis) {
        const info = analysis.empresa_info || {}
        const produtos = analysis.produtos_servicos || {}

        return {
            name: info.nome || null,
            location: info.localizacao || null,
            business_type: info.tipo_negocio || null,
            working_hours: info.horario_funcionamento || null,
            technology: info.tecnologia_metodo || null,
            diferenciais: info.diferenciais || [],
            payment_methods: produtos.formas_pagamento || []
        }
    }

    extractResumoExecutivo(analysis) {
        return analysis.resumo_executivo || null
    }

    extractMetricas(analysis) {
        const metricas = analysis.metricas_funil || {}
        return {
            mensagens_recebidas: metricas.mensagens_recebidas_leads || 0,
            mensagens_enviadas: metricas.mensagens_enviadas_empresa || 0,
            distribuicao_horario: metricas.distribuicao_horario || [],
            distribuicao_dia: metricas.distribuicao_dia_semana || [],
            motivos_perda: metricas.motivos_perda || []
        }
    }

    extractPerfilLead(analysis) {
        return analysis.perfil_lead || null
    }

    extractFAQs(analysis) {
        const faqs = analysis.perguntas_frequentes || {}
        const topPerguntas = faqs.top_perguntas || []

        return topPerguntas.map(faq => ({
            question: faq.pergunta,
            answer: faq.melhor_resposta,
            category: faq.categoria,
            frequency: faq.frequencia || 1
        }))
    }

    extractPricing(analysis) {
        const produtos = analysis.produtos_servicos || {}
        const items = (produtos.items || []).map(item => ({
            item: item.nome,
            price: item.preco,
            mentions: item.mencoes || 1
        }))
        const packages = (produtos.pacotes || []).map(pkg => ({
            item: pkg.nome,
            price: pkg.preco,
            details: pkg.descricao
        }))
        return {
            items,
            packages,
            beneficios_valorizados: produtos.beneficios_mais_valorizados || [],
            gaps_informacao: produtos.gaps_informacao || []
        }
    }

    extractObjections(analysis) {
        const objections = analysis.objecoes || {}
        return {
            total: objections.total_objecoes_identificadas || 0,
            mapeamento: objections.mapeamento || [],
            nao_superadas: objections.objecoes_nao_superadas || []
        }
    }

    extractCommunicationStyle(analysis) {
        const tone = analysis.analise_tom_voz || {}
        const perfil = analysis.perfil_lead || {}

        return {
            style: tone.personalidade_recomendada || 'amigável',
            formality_level: tone.nivel_formalidade || 3,
            emoji_usage: tone.uso_emojis || 'moderado',
            message_size: tone.tamanho_medio_mensagens || 'curtas',
            expressions: tone.expressoes_caracteristicas || [],
            example_responses: tone.exemplos_mensagens_tom_ideal || [],
            language_style: perfil?.caracteristicas_demograficas?.linguagem || 'informal'
        }
    }

    extractScripts(analysis) {
        const scripts = analysis.scripts_vendas || {}
        return {
            abertura: scripts.abertura || {},
            qualificacao: scripts.qualificacao || [],
            apresentacao: scripts.apresentacao_oferta || '',
            fechamento: scripts.fechamento || {},
            followup: scripts.followup || {},
            rebatimentos: scripts.rebatimentos || {}
        }
    }

    extractPerguntasQualificacao(analysis) {
        return analysis.perguntas_qualificacao || null
    }

    extractInsights(analysis) {
        return analysis.insights_estrategicos || null
    }

    extractCopies(analysis) {
        return analysis.copies_anuncios || null
    }

    /**
     * Build a text context optimized for LLM prompts
     */
    buildPromptContext(kb, connectionName) {
        let context = `## INFORMAÇÕES DA EMPRESA: ${kb.company.name || connectionName}\n`

        // Company info
        if (kb.company.location) {
            context += `- Localização: ${kb.company.location}\n`
        }
        if (kb.company.business_type) {
            context += `- Tipo de negócio: ${kb.company.business_type}\n`
        }
        if (kb.company.working_hours) {
            context += `- Horário: ${kb.company.working_hours}\n`
        }
        if (kb.company.technology) {
            context += `- Tecnologia/Método: ${kb.company.technology}\n`
        }
        if (kb.company.payment_methods?.length > 0) {
            context += `- Formas de pagamento: ${kb.company.payment_methods.join(', ')}\n`
        }

        // Resumo Executivo
        if (kb.resumo_executivo) {
            context += `\n## RESUMO EXECUTIVO:\n`
            context += `- Total de mensagens: ${kb.resumo_executivo.total_mensagens || 'N/A'}\n`
            context += `- Clientes únicos: ${kb.resumo_executivo.clientes_unicos || 'N/A'}\n`
            context += `- Taxa de engajamento: ${kb.resumo_executivo.taxa_engajamento || 'N/A'}\n`
            context += `- Principal objeção: ${kb.resumo_executivo.principal_objecao || 'N/A'}\n`
            context += `- Horário de pico: ${kb.resumo_executivo.horario_pico || 'N/A'}\n`
        }

        // Pricing
        if (kb.pricing.items?.length > 0 || kb.pricing.packages?.length > 0) {
            context += `\n## PREÇOS E SERVIÇOS:\n`
            kb.pricing.items?.forEach(p => {
                context += `- ${p.item}: ${p.price}\n`
            })
            kb.pricing.packages?.forEach(p => {
                context += `- ${p.item}: ${p.price}${p.details ? ` (${p.details})` : ''}\n`
            })
        }

        // FAQs
        if (kb.faqs?.length > 0) {
            context += `\n## PERGUNTAS FREQUENTES:\n`
            kb.faqs.slice(0, 15).forEach(faq => {
                context += `P: ${faq.question}\nR: ${faq.answer}\n\n`
            })
        }

        // Objections
        if (kb.objections?.mapeamento?.length > 0) {
            context += `\n## OBJEÇÕES E REBATIMENTOS:\n`
            kb.objections.mapeamento.slice(0, 10).forEach(obj => {
                context += `- Objeção: ${obj.objecao}\n`
                context += `  Rebatimento: ${obj.rebatimento_que_funcionou}\n\n`
            })
        }

        // Communication style
        context += `\n## TOM DE VOZ:\n`
        context += `- Estilo: ${kb.communication.style}\n`
        context += `- Formalidade: ${kb.communication.formality_level}/5\n`
        context += `- Uso de emojis: ${kb.communication.emoji_usage}\n`
        if (kb.communication.expressions?.length > 0) {
            context += `- Expressões típicas: ${kb.communication.expressions.join(', ')}\n`
        }

        // Scripts
        if (kb.scripts?.abertura?.saudacao) {
            context += `\n## SCRIPTS:\n`
            context += `- Abertura: ${kb.scripts.abertura.saudacao}\n`
            if (kb.scripts.fechamento?.cta_principal) {
                context += `- Fechamento: ${kb.scripts.fechamento.cta_principal}\n`
            }
        }

        // Perfil do Lead
        if (kb.perfil_lead?.comportamentos_compra?.sinais_pronto_para_comprar?.length > 0) {
            context += `\n## SINAIS DE COMPRA:\n`
            kb.perfil_lead.comportamentos_compra.sinais_pronto_para_comprar.forEach(sinal => {
                context += `- ${sinal}\n`
            })
        }

        return context
    }
}

export default KnowledgeBuilder
