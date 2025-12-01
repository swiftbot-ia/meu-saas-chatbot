# Estrutura de Clientes Supabase

Esta pasta contém a configuração segura dos clientes Supabase separados por contexto de uso.

## 📁 Estrutura

```
lib/supabase/
├── client.js   # Cliente público (ANON_KEY) - Frontend seguro
├── server.js   # Cliente admin (SERVICE_ROLE_KEY) - Backend apenas
└── README.md   # Este arquivo
```

## 🔒 Segurança

### ⚠️ **CRÍTICO**: SERVICE_ROLE_KEY

A `SUPABASE_SERVICE_ROLE_KEY` **bypassa** todas as políticas de Row Level Security (RLS) do Supabase.

**NUNCA** exponha esta chave para o frontend:
- ❌ **NÃO** use prefixo `NEXT_PUBLIC_` na variável
- ❌ **NÃO** importe `lib/supabase/server.js` em componentes React
- ❌ **NÃO** envie esta chave para o navegador
- ✅ **USE APENAS** em API Routes (pasta `app/api/`)

## 📚 Guia de Uso

### 1️⃣ Frontend (Componentes React)

**Use**: `lib/supabase/client.js`

```jsx
// app/components/MyComponent.tsx
import { supabase } from '@/lib/supabase/client'

export default function MyComponent() {
  const fetchData = async () => {
    // Este cliente respeita RLS - seguro para o frontend
    const { data } = await supabase
      .from('public_table')
      .select('*')

    return data
  }

  return <div>...</div>
}
```

**Características**:
- ✅ Usa `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ Respeita Row Level Security (RLS)
- ✅ Seguro para o navegador
- ✅ Acesso limitado por políticas RLS

---

### 2️⃣ Backend (API Routes)

**Use**: `lib/supabase/server.js`

```javascript
// app/api/admin/route.js
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  // Este cliente BYPASSA RLS - use com cuidado!
  const { data } = await supabaseAdmin
    .from('private_table')
    .select('*')

  return NextResponse.json({ data })
}
```

**Características**:
- ⚠️ Usa `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ **BYPASSA** Row Level Security (RLS)
- ⚠️ Acesso total ao banco de dados
- ✅ Apenas para API routes seguras

---

### 3️⃣ Compatibilidade (Código Legado)

**Use**: `lib/supabase.js` (será depreciado)

```javascript
// Código antigo que ainda funciona
import { supabase, supabaseAdmin } from '@/lib/supabase'
```

Este arquivo re-exporta os clientes corretos para manter compatibilidade.

**Recomendação**: Migre para imports explícitos (`client.js` ou `server.js`)

---

## 🔐 Variáveis de Ambiente

Configure no arquivo `.env.local`:

```bash
# ============================
# MAIN DATABASE (Auth, Connections)
# ============================

# Público - pode ser exposto no frontend
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-main.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Privado - NUNCA exponha no frontend
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# ============================
# CHAT DATABASE (Messages, Conversations, Contacts)
# ============================

# Público - pode ser exposto no frontend
NEXT_PUBLIC_CHAT_SUPABASE_URL=https://seu-projeto-chat.supabase.co
NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY=eyJhbGc...

# Privado - RECOMENDADO para bypass de RLS no chat
# O chat database não compartilha auth com main database,
# então RLS com auth.uid() não funciona. Use service role key.
CHAT_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Arquitetura Dual-Database

O sistema usa dois bancos de dados Supabase separados:

| Database | Tabelas | Proposito |
|----------|---------|-----------|
| **Main** | `auth.users`, `whatsapp_connections`, `profiles` | Autenticacao e conexoes WhatsApp |
| **Chat** | `whatsapp_messages`, `whatsapp_conversations`, `whatsapp_contacts` | Mensagens e conversas do chat |

**Por que separados?**
- Escalabilidade: Mensagens podem crescer muito
- Performance: Queries de chat nao afetam o main database
- Isolamento: Problemas no chat nao afetam autenticacao

### Validação Automática

Os arquivos validam automaticamente as variáveis:

- `client.js`: Valida `NEXT_PUBLIC_*` (obrigatórias)
- `server.js`: Valida `SUPABASE_SERVICE_ROLE_KEY` + detecta uso no cliente

Se `server.js` for importado no navegador, lançará erro:

```
🚨 ERRO DE SEGURANÇA: lib/supabase/server.js não deve ser importado no cliente!
Use lib/supabase/client.js para componentes React.
```

---

## 🧪 Quando Usar Cada Cliente

| Contexto | Cliente | Arquivo | RLS |
|----------|---------|---------|-----|
| Componente React | `supabase` | `client.js` | ✅ Respeitado |
| Página Next.js (cliente) | `supabase` | `client.js` | ✅ Respeitado |
| Server Component | `supabase` | `client.js` | ✅ Respeitado |
| API Route (sem admin) | `supabase` | `client.js` | ✅ Respeitado |
| API Route (admin) | `supabaseAdmin` | `server.js` | ❌ Bypassado |
| Função Helper (backend) | `supabaseAdmin` | `server.js` | ❌ Bypassado |

---

## 📝 Exemplos de Uso Correto

### ✅ Frontend: Buscar dados do usuário atual

```jsx
// app/components/Profile.tsx
import { supabase } from '@/lib/supabase/client'

const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single()
```

RLS garante que o usuário só acessa seus próprios dados.

---

### ✅ Backend: Admin buscar todos os usuários

```javascript
// app/api/admin/users/route.js
import { supabaseAdmin } from '@/lib/supabase/server'

const { data: allUsers } = await supabaseAdmin
  .from('profiles')
  .select('*')
```

Admin bypassa RLS e acessa todos os usuários.

---

### ❌ ERRADO: Admin no Frontend

```jsx
// ❌ NUNCA FAÇA ISSO!
import { supabaseAdmin } from '@/lib/supabase/server'

// Expõe SERVICE_ROLE_KEY no navegador
const { data } = await supabaseAdmin.from('users').select('*')
```

Isso causará erro de segurança!

---

## 🛡️ Melhores Práticas

1. **Frontend**: Sempre use `client.js` + configure políticas RLS no Supabase
2. **Backend**: Use `server.js` apenas quando realmente precisar bypassar RLS
3. **Validação**: Sempre valide permissões do usuário nas API routes
4. **Auditoria**: Revise código que usa `supabaseAdmin` com atenção
5. **Logs**: Log de operações com `supabaseAdmin` para auditoria

---

## 📚 Links Úteis

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Service Role Key](https://supabase.com/docs/guides/api/api-keys)

---

**Última atualização**: 2025-01-19
