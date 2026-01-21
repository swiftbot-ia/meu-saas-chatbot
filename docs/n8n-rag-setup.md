# Guia de Configuração RAG no N8N

## Pré-requisitos
- Endpoint `/api/agent/documents/search` ativo ✅
- Documentos adicionados via Modal do Agente
- `rag_enabled = true` no agente

---

## Passo 1: Adicionar Node IF (RAG Check)

**Após:** `Get AI agent`  
**Nome:** `RAG Enabled?`

```json
{
  "conditions": {
    "conditions": [
      {
        "leftValue": "={{ $('Get AI agent').first().json.rag_enabled }}",
        "rightValue": true,
        "operator": { "type": "boolean", "operation": "equals" }
      }
    ]
  }
}
```

---

## Passo 2: Adicionar HTTP Request (RAG Search)

**Conectar à saída TRUE do IF**  
**Nome:** `RAG Search`

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `https://swiftbot.com.br/api/agent/documents/search` |
| Body Type | JSON |

**Body:**
```json
{
  "query": "={{ $('Webhook Uazapi').item.json.body.processed_data.message.content }}",
  "agent_id": "={{ $('Get AI agent').first().json.id }}",
  "threshold": "={{ $('Get AI agent').first().json.rag_threshold || 0.7 }}",
  "limit": "={{ $('Get AI agent').first().json.rag_max_results || 5 }}"
}
```

---

## Passo 3: Adicionar Merge Node

**Conectar:**
- Saída FALSE do IF → Merge
- Saída do RAG Search → Merge

**Modo:** Wait

---

## Passo 4: Atualizar Variaveis Node

Adicionar nova variável:

| Name | Value | Type |
|------|-------|------|
| `rag_context` | `={{ $('RAG Search').first().json.context \|\| '' }}` | string |

---

## Passo 5: Atualizar System Prompt

Adicionar no XML do Atendente, após `</ConversationHistory>`:

```xml
<KnowledgeBaseContext active="{{ $('Variaveis').item.json.rag_context ? 'true' : 'false' }}">
    <Purpose>
        Informações relevantes da base de conhecimento para esta pergunta.
        Use estas informações como sua principal fonte de verdade.
    </Purpose>
    <RetrievedDocuments>
        {{ $('Variaveis').item.json.rag_context }}
    </RetrievedDocuments>
    <Instructions>
        - SEMPRE priorize informações do KnowledgeBaseContext quando disponíveis
        - Se encontrar a resposta aqui, use-a diretamente
        - Cite os documentos naturalmente quando relevante
        - Se não encontrar informação relevante, responda normalmente
    </Instructions>
</KnowledgeBaseContext>
```

---

## Fluxo Final

```
Webhook → Get AI Agent → IF(rag_enabled) 
                              ↓ true           ↓ false
                         RAG Search             │
                              ↓                 │
                           Merge  ←─────────────┘
                              ↓
                         Variaveis
                              ↓
                         Atendente
```
