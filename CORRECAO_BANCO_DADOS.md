# 🔧 Correção Urgente: Permitir Múltiplas Conexões WhatsApp

## 🔴 Problema Identificado

O banco de dados tem uma **UNIQUE constraint** na coluna `user_id` que está impedindo que um usuário crie múltiplas conexões WhatsApp.

### Erro nos Logs:
```
❌ duplicate key value violates unique constraint "whatsapp_connections_user_id_unique"
```

---

## ✅ Solução: Executar Script SQL no Supabase

### **Passo 1: Acessar o SQL Editor**

1. Acesse seu projeto no Supabase: https://supabase.com/dashboard
2. Vá para **SQL Editor** (ícone de terminal no menu lateral)
3. Clique em **New Query**

### **Passo 2: Executar o Script**

Cole o seguinte SQL e clique em **RUN**:

```sql
-- ============================================================================
-- Remover constraint UNIQUE de user_id
-- ============================================================================

-- 1. Remover a constraint que está bloqueando múltiplas conexões
ALTER TABLE public.whatsapp_connections
DROP CONSTRAINT IF EXISTS whatsapp_connections_user_id_unique;

-- 2. Adicionar índice para manter performance (sem bloquear múltiplas conexões)
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_user_id
ON public.whatsapp_connections(user_id);

-- 3. Verificar se foi removido corretamente
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'whatsapp_connections'
  AND table_schema = 'public';
```

### **Passo 3: Verificar Resultado**

Após executar, você deve ver uma lista de constraints **SEM** `whatsapp_connections_user_id_unique`.

**Exemplo de resultado correto**:
```
constraint_name                           | constraint_type
------------------------------------------|----------------
whatsapp_connections_pkey                 | PRIMARY KEY
whatsapp_connections_user_id_fkey         | FOREIGN KEY
```

✅ Se `whatsapp_connections_user_id_unique` **NÃO aparece** na lista, está correto!

---

## 🧪 Testar Após a Correção

1. **Reiniciar servidor** (se ainda não fez):
   ```bash
   npm run dev
   ```

2. **Criar segunda conexão**:
   - No dashboard, clique em "+ Adicionar Nova Conexão"
   - Verifique os logs:
   ```
   ✅ [CreateConnection] Pode criar nova conexão: 2/2
   ✅ [CreateConnection] Registro criado com sucesso: {uuid}
   ```

3. **Verificar no dashboard**:
   - Deve mostrar "2 de 2 ativas"
   - Cada conexão com QR code separado

---

## 📊 O Que Mudou?

### **Antes** (❌ BLOQUEADO):
- Constraint: `UNIQUE (user_id)`
- Resultado: Apenas 1 conexão por usuário
- Erro: "duplicate key value violates unique constraint"

### **Depois** (✅ PERMITIDO):
- Sem constraint UNIQUE
- Índice não-único para performance
- Resultado: Múltiplas conexões (respeitando limite contratado)
- Validação de limite no código backend

---

## 🔍 Por Que Isso Aconteceu?

A tabela foi criada originalmente com a suposição de que cada usuário teria apenas 1 conexão WhatsApp. Com o novo modelo de negócio (planos com 2+ conexões), essa constraint se tornou um bloqueio.

---

## 🆘 Problemas?

Se após executar o script você ainda tiver erros:

1. **Verifique se o script foi executado**:
   ```sql
   SELECT * FROM information_schema.table_constraints
   WHERE table_name = 'whatsapp_connections';
   ```

2. **Force a remoção manualmente**:
   ```sql
   ALTER TABLE public.whatsapp_connections
   DROP CONSTRAINT whatsapp_connections_user_id_unique CASCADE;
   ```

3. **Verifique permissões**:
   - Certifique-se de estar usando o **Service Role Key** ou **conta owner** do Supabase

---

## ✅ Checklist de Verificação

- [ ] Script SQL executado com sucesso
- [ ] Constraint `whatsapp_connections_user_id_unique` removida
- [ ] Índice `idx_whatsapp_connections_user_id` criado
- [ ] Servidor Next.js reiniciado
- [ ] Segunda conexão criada com sucesso
- [ ] Dashboard mostrando múltiplas conexões

---

**Após completar esses passos, o sistema estará funcionando corretamente com suporte a múltiplas conexões!** 🚀
