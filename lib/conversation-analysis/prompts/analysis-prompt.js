// lib/conversation-analysis/prompts/analysis-prompt.js
// ============================================================================
// AI Prompt for Conversation Analysis
// ============================================================================

export const ANALYSIS_PROMPT = `
# ANÁLISE DE CONVERSAS WHATSAPP - {{NOME_EMPRESA}}

Você é um especialista em análise de conversas comerciais de WhatsApp.
Analise as conversas abaixo e retorne APENAS um JSON válido seguindo a estrutura especificada.

## CONVERSAS A ANALISAR:
{{CONVERSAS_WHATSAPP}}

## INSTRUÇÕES:
1. Analise minuciosamente todas as conversas
2. Identifique padrões de comportamento de leads
3. Extraia informações sobre produtos/serviços e preços mencionados
4. Identifique objeções comuns e como foram respondidas
5. Detecte o tom de voz e personalidade usados nas respostas
6. Extraia perguntas frequentes e suas melhores respostas

## RETORNE UM JSON COM A SEGUINTE ESTRUTURA:

{
  "executive_summary": {
    "total_conversations_analyzed": <número>,
    "engagement_rate": <número 0-100>,
    "avg_messages_per_conversation": <número>,
    "main_objection": "<objeção mais comum>",
    "conversion_indicators": <número de leads com sinais de conversão>
  },
  
  "company_info": {
    "name": "<nome extraído das conversas>",
    "location": "<localização se mencionada, ou null>",
    "business_type": "<tipo de negócio identificado>",
    "working_hours": "<horários identificados, ou null>"
  },
  
  "products": {
    "items": [
      {"name": "<nome do produto/serviço>", "price": "<preço mencionado>", "mentions": <número>}
    ],
    "packages": [
      {"name": "<nome do pacote>", "description": "<descrição>", "price": "<preço>"}
    ],
    "payment_methods": ["<método 1>", "<método 2>"]
  },
  
  "objections": [
    {
      "type": "<tipo da objeção: preço, tempo, concorrência, confiança, necessidade>",
      "examples": ["<exemplo real da conversa>"],
      "best_rebuttal": "<melhor resposta que funcionou>",
      "frequency": <1-10>
    }
  ],
  
  "faqs": [
    {
      "category": "<categoria: preço, funcionamento, agendamento, pagamento, outro>",
      "question": "<pergunta frequente>",
      "best_answer": "<melhor resposta encontrada>",
      "frequency": <1-10>
    }
  ],
  
  "lead_profile": {
    "language_style": "formal | informal | misto",
    "urgency_level": "baixa | média | alta",
    "decision_speed": "rápido | médio | lento",
    "high_intent_signals": ["<sinal de compra 1>", "<sinal 2>"],
    "low_intent_signals": ["<sinal de desistência 1>"]
  },
  
  "tone_analysis": {
    "formality_level": <1-5>,
    "emoji_usage": "frequente | moderado | raro | nenhum",
    "characteristic_expressions": ["<expressão típica 1>", "<expressão 2>"],
    "recommended_personality": "<descrição do tom ideal>",
    "example_good_responses": ["<resposta exemplar 1>", "<resposta 2>"]
  },
  
  "sales_scripts": {
    "opening": "<mensagem de abertura sugerida>",
    "qualification_questions": ["<pergunta 1>", "<pergunta 2>", "<pergunta 3>"],
    "presentation": "<como apresentar o produto/serviço>",
    "closing": "<mensagem de fechamento sugerida>",
    "followup_day1": "<mensagem de follow-up dia 1>",
    "followup_day3": "<mensagem de follow-up dia 3>",
    "objection_handling": {
      "<tipo_objeção>": "<resposta sugerida>"
    }
  },
  
  "strategic_insights": {
    "strengths": ["<ponto forte 1>", "<ponto forte 2>"],
    "weaknesses": ["<ponto a melhorar 1>", "<ponto 2>"],
    "opportunities": ["<oportunidade 1>", "<oportunidade 2>"],
    "recommendations": [
      {
        "action": "<ação recomendada>",
        "impact": "<impacto esperado>",
        "priority": "alta | média | baixa"
      }
    ]
  }
}

## REGRAS IMPORTANTES:
- Retorne APENAS o JSON, sem texto antes ou depois
- Use dados reais extraídos das conversas
- Se algum campo não puder ser preenchido, use null ou array vazio []
- Mantenha as respostas em português brasileiro
- Quantifique sempre que possível
- Seja específico e prático nas recomendações
`

/**
 * Get formatted prompt with conversation data
 */
export function getAnalysisPrompt(conversations, connectionName) {
    return ANALYSIS_PROMPT
        .replace('{{CONVERSAS_WHATSAPP}}', conversations)
        .replace('{{NOME_EMPRESA}}', connectionName || 'Empresa')
}
