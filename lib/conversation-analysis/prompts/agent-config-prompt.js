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

## INSTRUÇÕES PARA CADA OBJETIVO:

### Se objetivo = "vendas_qualificacao":
- objectionsQA: Preencha com objeções de VENDA e rebatimentos para conversão
- objectiveQuestions: Perguntas para QUALIFICAR o lead (orçamento, timing, necessidade)
- salesCTA: Call to action para FECHAR venda ou agendar demonstração

### Se objetivo = "suporte":
- objectionsQA: Preencha com PROBLEMAS COMUNS que clientes enfrentam e SOLUÇÕES
  - question = problema reportado (ex: "Não consigo acessar minha conta")
  - answer = solução ou procedimento (ex: "Para redefinir sua senha, acesse...")
- objectiveQuestions: Perguntas para DIAGNOSTICAR o problema do cliente
- salesCTA: Mensagem de encerramento de suporte (ex: "Posso ajudar em algo mais?")

### Se objetivo = "informacoes" (fornecer informações):
- objectionsQA: Preencha com DÚVIDAS INFORMATIVAS e RESPOSTAS claras
  - question = pergunta frequente sobre informações (ex: "Qual o horário de funcionamento?")
  - answer = resposta informativa completa
- objectiveQuestions: Perguntas para ENTENDER o que o usuário precisa saber
- salesCTA: Mensagem de encerramento informativo (ex: "Espero ter ajudado! Precisa de mais alguma informação?")

### Se objetivo = "agendamento":
- objectionsQA: Objeções de AGENDA e como contornar
  - question = objeção de horário/disponibilidade
  - answer = alternativas e flexibilidade
- objectiveQuestions: Perguntas para AGENDAR (data preferida, horário, etc)
- salesCTA: Confirmação de agendamento

### Se objetivo = "nutricao":
- objectionsQA: Dúvidas comuns durante nutrição de leads
- objectiveQuestions: Perguntas para manter engajamento
- salesCTA: Próximo passo no funil de nutrição

---

## RETORNE UM JSON COM A SEGUINTE ESTRUTURA:

{
  "agentName": "<nome sugerido baseado no objetivo e tom>",
  
  "companyName": "<nome da empresa extraído>",
  
  "businessSector": "<setor: tecnologia|saude|educacao|comercio|financeiro|imobiliario|servicos|beleza|alimentacao|outro>",
  
  "personality": "<personalidade: amigavel|formal|tecnico|vendas|suporte>",
  
  "welcomeMessage": "<mensagem de boas-vindas APROPRIADA PARA O OBJETIVO, no tom identificado>",
  
  "defaultResponse": "<resposta padrão quando não entender, no tom identificado>",
  
  "productDescription": "<descrição detalhada dos produtos/serviços, preços e pacotes>",
  
  "botObjective": "{{OBJETIVO_PRINCIPAL}}",
  
  "priceRange": "<faixa de preços identificada>",
  
  "objectionsQA": [
    {
      "question": "<ADAPTAR CONFORME OBJETIVO - veja instruções acima>",
      "answer": "<ADAPTAR CONFORME OBJETIVO - veja instruções acima>"
    }
  ],
  
  "objectiveQuestions": [
    {"question": "<ADAPTAR CONFORME OBJETIVO - pergunta relevante>"}
  ],
  
  "salesCTA": "<ADAPTAR CONFORME OBJETIVO - call to action apropriado>",
  
  "followupMessages": {
    "dia1": "<mensagem de follow-up para dia 1>",
    "dia3": "<mensagem de follow-up para dia 3>",
    "dia7": "<mensagem de follow-up para dia 7>"
  },
  
  "knowledgeSnippets": [
    "<informação importante 1>",
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

## REGRAS CRÍTICAS:
1. Retorne APENAS o JSON válido, sem texto adicional
2. Use dados REAIS da análise - não invente
3. **ADAPTE O CONTEÚDO DE objectionsQA e objectiveQuestions AO OBJETIVO**
4. Para "suporte": objectionsQA deve ter PROBLEMAS e SOLUÇÕES, não objeções de venda
5. Para "informacoes": objectionsQA deve ter PERGUNTAS INFORMATIVAS e RESPOSTAS
6. Para objectionsQA, inclua no MÍNIMO 5 itens relevantes para o objetivo
7. Para objectiveQuestions, inclua no MÍNIMO 5 perguntas relevantes para o objetivo
8. Personalize as mensagens com o tom de voz identificado
9. Se o objetivo for "suporte", sugira agentName como "Suporte", "Assistente", etc
10. Se o objetivo for "informacoes", sugira agentName como "Informações", "Central de Ajuda", etc

## EXEMPLOS POR OBJETIVO:

### Exemplo para "suporte":
{
  "objectionsQA": [
    {"question": "Não consigo fazer login na minha conta", "answer": "Para recuperar seu acesso: 1) Clique em 'Esqueci minha senha' 2) Digite seu email cadastrado 3) Verifique sua caixa de entrada e siga as instruções"},
    {"question": "Meu pagamento não foi aprovado", "answer": "Isso pode ocorrer por: limite indisponível, cartão vencido ou dados incorretos. Tente outro cartão ou entre em contato com seu banco"},
    {"question": "Como cancelo minha assinatura?", "answer": "Você pode cancelar em Configurações > Assinatura > Cancelar. O acesso permanece até o fim do período pago"}
  ],
  "objectiveQuestions": [
    {"question": "Qual problema você está enfrentando?"},
    {"question": "Quando o problema começou a acontecer?"},
    {"question": "Você já tentou alguma solução?"}
  ],
  "salesCTA": "Seu problema foi resolvido? Posso ajudar em mais alguma coisa? 😊"
}

### Exemplo para "informacoes":
{
  "objectionsQA": [
    {"question": "Qual o horário de funcionamento?", "answer": "Funcionamos de segunda a sexta, das 8h às 18h, e aos sábados das 9h às 13h"},
    {"question": "Onde vocês ficam localizados?", "answer": "Estamos na Av. Paulista, 1000 - São Paulo/SP. Próximo à estação Trianon-MASP"},
    {"question": "Quais formas de pagamento aceitam?", "answer": "Aceitamos Pix, cartão de crédito em até 10x, débito e boleto bancário"}
  ],
  "objectiveQuestions": [
    {"question": "Sobre qual assunto você gostaria de informações?"},
    {"question": "Você já é nosso cliente?"},
    {"question": "Posso enviar mais detalhes por aqui?"}
  ],
  "salesCTA": "Espero ter ajudado! Precisa de mais alguma informação? 📋"
}
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
