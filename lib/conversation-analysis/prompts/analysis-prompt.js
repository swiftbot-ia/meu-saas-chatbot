// lib/conversation-analysis/prompts/analysis-prompt.js
// ============================================================================
// AI Prompt for Comprehensive Conversation Analysis
// Based on proven commercial intelligence template
// ============================================================================

export const ANALYSIS_PROMPT = `
# ANALISADOR DE CONVERSAS WHATSAPP - INTELIGÊNCIA COMERCIAL

Você é um especialista em análise de conversas comerciais. Sua função é extrair insights estratégicos de conversas do WhatsApp para otimizar vendas, marketing e criação de agentes de IA.

## INFORMAÇÕES DO NEGÓCIO
Nome/Identificador: {{NOME_EMPRESA}}

## CONVERSAS A ANALISAR
{{CONVERSAS_WHATSAPP}}

---

## INSTRUÇÕES DE ANÁLISE

Analise TODAS as conversas fornecidas e extraia as informações organizadas nas seções abaixo. 
**IMPORTANTE:** 
- Seja específico, use exemplos reais das conversas
- Quantifique SEMPRE que possível (frequência, percentual, contagem)
- Use dados reais extraídos, não invente
- Se uma seção não puder ser preenchida, indique "DADOS INSUFICIENTES"

## RETORNE UM JSON COM A SEGUINTE ESTRUTURA:

{
  "resumo_executivo": {
    "total_mensagens": <número>,
    "total_conversas": <número>,
    "clientes_unicos": <número>,
    "taxa_engajamento": "<X%>",
    "media_mensagens_por_conversa": <número>,
    "principal_objecao": "<objeção mais comum>",
    "horario_pico": "<horário com mais mensagens>",
    "periodo_mais_ativo": "<manhã/tarde/noite>"
  },

  "metricas_funil": {
    "mensagens_recebidas_leads": <número>,
    "mensagens_enviadas_empresa": <número>,
    "distribuicao_horario": [
      {"hora": "<HH:mm>", "quantidade": <número>}
    ],
    "distribuicao_dia_semana": [
      {"dia": "<segunda/terça/etc>", "quantidade": <número>}
    ],
    "motivos_perda": [
      {"motivo": "<descrição>", "ocorrencias": <número>, "exemplo": "<frase real>"}
    ]
  },

  "perfil_lead": {
    "caracteristicas_demograficas": {
      "linguagem": "formal | informal | misto",
      "urgencia": "baixa | média | alta",
      "perfil_predominante": "<descrição do perfil típico>"
    },
    "comportamentos_compra": {
      "media_mensagens_ate_conversao": <número>,
      "perguntas_antes_comprar": ["<pergunta 1>", "<pergunta 2>"],
      "gatilhos_decisao": ["<gatilho 1>", "<gatilho 2>"],
      "sinais_pronto_para_comprar": ["<sinal 1>", "<sinal 2>"]
    },
    "jornada_lead_que_converte": [
      {"etapa": 1, "descricao": "<primeiro contato>"},
      {"etapa": 2, "descricao": "<pergunta sobre...>"},
      {"etapa": 3, "descricao": "<demonstra interesse>"},
      {"etapa": 4, "descricao": "<objeção comum>"},
      {"etapa": 5, "descricao": "<gatilho de decisão>"},
      {"etapa": 6, "descricao": "<fechamento>"}
    ]
  },

  "perguntas_frequentes": {
    "total_perguntas_analisadas": <número>,
    "top_perguntas": [
      {
        "categoria": "<categoria>",
        "pergunta": "<pergunta frequente>",
        "frequencia": <número>,
        "melhor_resposta": "<resposta que funcionou>"
      }
    ],
    "perguntas_alta_intencao_compra": ["<pergunta 1>", "<pergunta 2>"],
    "perguntas_lead_frio": ["<pergunta 1>", "<pergunta 2>"]
  },

  "objecoes": {
    "total_objecoes_identificadas": <número>,
    "mapeamento": [
      {
        "objecao": "<tipo/descrição da objeção>",
        "frequencia": <número>,
        "contexto": "<quando aparece>",
        "exemplos_reais": ["<frase real 1>", "<frase real 2>"],
        "rebatimento_que_funcionou": "<resposta eficaz>",
        "resultado": "<converteu/reagendou/perdeu>"
      }
    ],
    "objecoes_nao_superadas": [
      {"objecao": "<descrição>", "sugestao_rebatimento": "<nova abordagem>"}
    ]
  },

  "produtos_servicos": {
    "items": [
      {"nome": "<produto/serviço>", "preco": "<valor>", "mencoes": <número>}
    ],
    "pacotes": [
      {"nome": "<pacote>", "descricao": "<descrição>", "preco": "<valor>"}
    ],
    "formas_pagamento": ["<forma 1>", "<forma 2>"],
    "beneficios_mais_valorizados": ["<benefício 1>", "<benefício 2>"],
    "gaps_informacao": ["<info que leads buscam mas não encontram>"]
  },

  "analise_tom_voz": {
    "personalidade_recomendada": "<amigável/profissional/direto/empático>",
    "nivel_formalidade": <1-5>,
    "uso_emojis": "frequente | moderado | raro | nenhum",
    "tamanho_medio_mensagens": "<curtas/médias/longas>",
    "expressoes_caracteristicas": ["<expressão 1>", "<expressão 2>"],
    "exemplos_mensagens_tom_ideal": ["<mensagem real 1>", "<mensagem real 2>", "<mensagem real 3>"]
  },

  "perguntas_qualificacao": {
    "situacao": ["<pergunta para entender contexto 1>", "<pergunta 2>", "<pergunta 3>"],
    "problema": ["<pergunta para identificar dor 1>", "<pergunta 2>", "<pergunta 3>"],
    "implicacao": ["<pergunta para amplificar urgência 1>", "<pergunta 2>"],
    "necessidade": ["<pergunta para validar solução 1>", "<pergunta 2>"],
    "decisao": ["<pergunta para verificar prontidão 1>", "<pergunta 2>"],
    "criterios_lead_qualificado": ["<critério 1>", "<critério 2>", "<critério 3>"]
  },

  "scripts_vendas": {
    "abertura": {
      "saudacao": "<mensagem de saudação>",
      "quebra_gelo": "<mensagem para criar conexão>",
      "transicao_qualificacao": "<mensagem de transição>"
    },
    "qualificacao": ["<sequência de perguntas naturais>"],
    "apresentacao_oferta": "<como apresentar produto/preço>",
    "fechamento": {
      "cta_principal": "<call to action>",
      "alternativa_hesitacao": "<se houver hesitação>"
    },
    "followup": {
      "dia_1": "<mensagem dia 1 se não respondeu>",
      "dia_3": "<mensagem dia 3>",
      "dia_7": "<mensagem dia 7>"
    },
    "rebatimentos": {
      "<tipo_objecao_1>": "<resposta sugerida>",
      "<tipo_objecao_2>": "<resposta sugerida>"
    }
  },

  "copies_anuncios": {
    "palavras_alto_impacto": ["<palavra 1>", "<palavra 2>"],
    "dores_mencionadas": ["<dor 1>", "<dor 2>"],
    "desejos_objetivos": ["<desejo 1>", "<desejo 2>"],
    "sugestoes_headlines": ["<headline 1>", "<headline 2>", "<headline 3>"],
    "copies_completas": [
      {
        "foco": "dor | benefício | prova_social",
        "headline": "<título>",
        "corpo": "<texto do anúncio>",
        "cta": "<call to action>"
      }
    ]
  },

  "insights_estrategicos": {
    "pontos_fortes": ["<ponto forte 1>", "<ponto forte 2>"],
    "pontos_melhoria": ["<melhoria 1>", "<melhoria 2>"],
    "oportunidades_nao_exploradas": ["<oportunidade 1>", "<oportunidade 2>"],
    "recomendacoes_prioritarias": [
      {"acao": "<ação específica>", "impacto_esperado": "<resultado>", "prioridade": "alta | média | baixa"}
    ]
  },

  "empresa_info": {
    "nome": "<nome extraído>",
    "localizacao": "<endereço se mencionado>",
    "tipo_negocio": "<tipo de negócio>",
    "horario_funcionamento": "<horários identificados>",
    "tecnologia_metodo": "<tecnologia ou método usado>",
    "diferenciais": ["<diferencial 1>", "<diferencial 2>"]
  }
}

## REGRAS CRÍTICAS:
1. Retorne APENAS o JSON válido, sem texto antes ou depois
2. Use dados REAIS extraídos das conversas - não invente
3. Quantifique com números sempre que possível
4. Se não encontrar dados suficientes para um campo, use null ou array vazio
5. Mantenha tudo em português brasileiro
6. Seja específico e prático nas recomendações
7. Priorize objeções e perguntas por frequência (mais comuns primeiro)
8. Extraia frases REAIS das conversas como exemplos
`

/**
 * Get formatted prompt with conversation data
 */
export function getAnalysisPrompt(conversations, connectionName) {
  return ANALYSIS_PROMPT
    .replace('{{CONVERSAS_WHATSAPP}}', conversations)
    .replace('{{NOME_EMPRESA}}', connectionName || 'Empresa')
}
