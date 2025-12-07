// lib/conversation-analysis/prompts/agent-config-prompt.js
// ============================================================================
// AI Prompt for Agent Config Generation
// Generates personalized form values based on analysis data
// ============================================================================

export const AGENT_CONFIG_PROMPT = `
# GERADOR DE CONFIGURAÇÃO DE AGENTE DE IA

Você é um especialista em criação de agentes de IA para atendimento via WhatsApp.
Baseado na análise de conversas fornecida abaixo, gere uma configuração completa e personalizada para o agente.

## ANÁLISE DE CONVERSAS (Base de Conhecimento):
{{ANALISE_CONVERSAS}}

## PREFERÊNCIAS DO USUÁRIO:
- Estilo de comunicação preferido: {{ESTILO_COMUNICACAO}}
- Objetivo principal: {{OBJETIVO_PRINCIPAL}}

---

## INSTRUÇÕES:

Gere valores ESPECÍFICOS e PERSONALIZADOS para cada campo, baseados nos dados reais da análise.
Não use textos genéricos - extraia exemplos reais das conversas quando possível.

## RETORNE UM JSON COM A SEGUINTE ESTRUTURA:

{
  "agentName": "<nome sugerido para o agente baseado no tom identificado>",
  
  "companyName": "<nome da empresa extraído da análise>",
  
  "businessSector": "<setor identificado: tecnologia|saude|educacao|comercio|financeiro|imobiliario|servicos|beleza|alimentacao|outro>",
  
  "personality": "<personalidade: amigavel|formal|tecnico|vendas|suporte>",
  
  "welcomeMessage": "<mensagem de boas-vindas personalizada, use o tom identificado na análise, pode incluir emojis se apropriado>",
  
  "defaultResponse": "<resposta padrão quando não entender, no tom identificado>",
  
  "productDescription": "<descrição detalhada dos produtos/serviços, preços e pacotes identificados na análise>",
  
  "botObjective": "<objetivo: vendas_qualificacao|agendamento|suporte|nutricao|informativo>",
  
  "priceRange": "<faixa de preços identificada, ex: R$ 99,90 - R$ 599,00>",
  
  "objectionsQA": [
    {
      "question": "<objeção real identificada nas conversas>",
      "answer": "<rebatimento eficaz baseado no que funcionou nas conversas>"
    }
  ],
  
  "objectiveQuestions": [
    {"question": "<pergunta de qualificação baseada na análise>"}
  ],
  
  "salesCTA": "<call to action de fechamento baseado no que funcionou>",
  
  "followupMessages": {
    "dia1": "<mensagem de follow-up para dia 1>",
    "dia3": "<mensagem de follow-up para dia 3>",
    "dia7": "<mensagem de follow-up para dia 7>"
  },
  
  "knowledgeSnippets": [
    "<informação importante 1 para o agente saber>",
    "<informação importante 2>",
    "<informação importante 3>"
  ],
  
  "caracteristicas_identificadas": {
    "tom_voz": "<descrição do tom ideal>",
    "uso_emojis": "<frequente|moderado|raro>",
    "tamanho_mensagens": "<curtas|médias|longas>",
    "expressoes_tipicas": ["<expressão 1>", "<expressão 2>"]
  }
}

## REGRAS:
1. Retorne APENAS o JSON válido
2. Use dados REAIS da análise - não invente
3. Para objectionsQA, inclua no MÍNIMO 5 objeções se disponíveis na análise
4. Para objectiveQuestions, inclua no MÍNIMO 5 perguntas de qualificação
5. Personalize as mensagens com o tom de voz identificado
6. Se usar emojis, use com moderação e de acordo com o padrão identificado
7. Priorize objeções e perguntas por frequência (mais comuns primeiro)
`

/**
 * Get formatted prompt for agent config generation
 */
export function getAgentConfigPrompt(analysisData, preferences = {}) {
    const { style = 'amigavel', objective = 'vendas_qualificacao' } = preferences

    // Convert analysis data to string for prompt
    const analysisStr = typeof analysisData === 'string'
        ? analysisData
        : JSON.stringify(analysisData, null, 2)

    return AGENT_CONFIG_PROMPT
        .replace('{{ANALISE_CONVERSAS}}', analysisStr)
        .replace('{{ESTILO_COMUNICACAO}}', style)
        .replace('{{OBJETIVO_PRINCIPAL}}', objective)
}
