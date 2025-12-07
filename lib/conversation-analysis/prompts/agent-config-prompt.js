// lib/conversation-analysis/prompts/agent-config-prompt.js
// ============================================================================
// AI Prompt for Agent Config Generation
// Generates personalized form values based on analysis data AND objective
// ============================================================================

export const AGENT_CONFIG_PROMPT = `
# GERADOR DE CONFIGURAÇÃO DE AGENTE DE IA

Você é um especialista em criação de agentes de IA para atendimento via WhatsApp.
Baseado na análise de conversas fornecida, gere uma configuração completa e personalizada.

## ANÁLISE DE CONVERSAS (Base de Conhecimento):
{{ANALISE_CONVERSAS}}

## CONFIGURAÇÕES SOLICITADAS:
- **Estilo de comunicação:** {{ESTILO_COMUNICACAO}}
- **Objetivo principal:** {{OBJETIVO_PRINCIPAL}}

---

## ESTRUTURA DE DADOS POR OBJETIVO:

### Se objetivo = "vendas_qualificacao":
- objectionsQA usa: [{"question": "objeção do cliente", "answer": "rebatimento"}]
- objectiveQuestions usa: [{"question": "pergunta de qualificação"}]
- salesCTA: Call to action para fechar venda

### Se objetivo = "suporte":
- objectionsQA usa: [{"question": "problema", "answer": "solução"}]
- objectiveQuestions usa: [{"problem": "problema comum", "solution": "solução detalhada"}]
- salesCTA: Mensagem de encerramento (ex: "Posso ajudar em algo mais?")

### Se objetivo = "informacoes":
- objectionsQA usa: [{"question": "dúvida informativa", "answer": "resposta"}]
- objectiveQuestions usa: [{"info": "tópico/assunto", "details": "detalhes/explicação"}]
- salesCTA: Mensagem de encerramento (ex: "Precisa de mais informações?")

---

## RETORNE UM JSON COM A SEGUINTE ESTRUTURA:

{
  "agentName": "<nome sugerido baseado no objetivo e tom>",
  "companyName": "<nome da empresa extraído>",
  "businessSector": "<setor: tecnologia|saude|educacao|comercio|financeiro|imobiliario|servicos|beleza|alimentacao|outro>",
  "personality": "<personalidade: amigavel|formal|tecnico|vendas|suporte>",
  "welcomeMessage": "<mensagem de boas-vindas APROPRIADA PARA O OBJETIVO>",
  "defaultResponse": "<resposta padrão quando não entender>",
  "productDescription": "<descrição detalhada dos produtos/serviços>",
  "botObjective": "{{OBJETIVO_PRINCIPAL}}",
  "priceRange": "<faixa de preços identificada>",
  
  "objectionsQA": [
    {"question": "<pergunta/objeção/problema>", "answer": "<resposta/rebatimento/solução>"}
  ],
  
  "objectiveQuestions": "<VEJA ESTRUTURA CORRETA ABAIXO>",
  
  "salesCTA": "<call to action apropriado para o objetivo>"
}

## ESTRUTURA DE objectiveQuestions POR OBJETIVO:

### Para "vendas_qualificacao":
"objectiveQuestions": [
  {"question": "Qual o tamanho da sua empresa?"},
  {"question": "Qual seu orçamento disponível?"},
  {"question": "Quando pretende tomar uma decisão?"}
]

### Para "suporte":
"objectiveQuestions": [
  {"problem": "Não consigo fazer login", "solution": "Para recuperar sua senha: 1) Acesse a página de login 2) Clique em 'Esqueci minha senha'..."},
  {"problem": "Pagamento não foi aprovado", "solution": "Verifique se: 1) O cartão está válido 2) Tem limite disponível..."},
  {"problem": "Como cancelo minha assinatura?", "solution": "Acesse Configurações > Assinatura > Cancelar..."}
]

### Para "informacoes":
"objectiveQuestions": [
  {"info": "Horário de funcionamento", "details": "Funcionamos de segunda a sexta, das 8h às 18h..."},
  {"info": "Localização", "details": "Estamos localizados na Av. Paulista, 1000..."},
  {"info": "Formas de pagamento", "details": "Aceitamos Pix, cartão em até 10x, débito e boleto..."}
]

---

## REGRAS CRÍTICAS:
1. Retorne APENAS o JSON válido, sem texto adicional
2. Use dados REAIS da análise - não invente
3. **USE A ESTRUTURA CORRETA DE objectiveQuestions PARA O OBJETIVO SELECIONADO**
4. Para "suporte": objectiveQuestions deve ter {problem, solution}
5. Para "informacoes": objectiveQuestions deve ter {info, details}
6. Para "vendas_qualificacao": objectiveQuestions deve ter {question}
7. Inclua no MÍNIMO 5 itens em objectionsQA
8. Inclua no MÍNIMO 5 itens em objectiveQuestions
9. Personalize as mensagens com o tom de voz identificado
10. Se objetivo for "suporte", extraia problemas reais mencionados nas conversas
11. Se objetivo for "informacoes", extraia informações frequentemente solicitadas
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
    .replace(/\{\{ANALISE_CONVERSAS\}\}/g, analysisStr)
    .replace(/\{\{ESTILO_COMUNICACAO\}\}/g, style)
    .replace(/\{\{OBJETIVO_PRINCIPAL\}\}/g, objective)
}
