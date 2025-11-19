# 🚀 Guia: Aplicar Migration 002 - Adicionar Colunas Faltantes

## ⚠️ Problema Identificado

A tabela `whatsapp_connections` no Supabase está **incompleta**. Ela tem apenas 8 colunas, mas o código espera **17 colunas**.

### Colunas Existentes (8):
- ✅ `id`
- ✅ `user_id`
- ✅ `status`
- ✅ `phone_number_id`
- ✅ `waba_id`
- ✅ `api_credentials`
- ✅ `updated_at`
- ✅ `is_connected`

### Colunas FALTANDO (9):
- ❌ `instance_name` - **CRÍTICO** (usado em toda aplicação)
- ❌ `instance_token` - **CRÍTICO** (token da UAZAPI)
- ❌ `created_at` - Timestamp de criação
- ❌ `last_connected_at` - Última conexão
- ❌ `webhook_url` - URL do webhook
- ❌ `profile_name` - Nome do perfil WhatsApp
- ❌ `profile_pic_url` - Foto de perfil
- ❌ `phone_number` - Número formatado
- ❌ `metadata` - Dados extras (JSONB)

---

## 📋 Passo a Passo para Aplicar

### 1. Abrir SQL Editor no Supabase

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **"New query"**

---

### 2. Copiar e Colar a Migration

Copie **TODO** o conteúdo do arquivo:

```
database/migrations/002_add_missing_columns.sql
```

E cole no SQL Editor.

---

### 3. Executar a Migration

1. Clique em **"Run"** (ou pressione Ctrl/Cmd + Enter)
2. Aguarde a execução (deve levar ~2-5 segundos)
3. Verifique se aparece **"Success. No rows returned"**

---

### 4. Verificar o Resultado

A própria migration mostrará a estrutura atualizada ao final. Você deve ver **17 colunas**:

| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| id | uuid | NO |
| user_id | uuid | NO |
| instance_name | varchar | NO |
| instance_token | text | YES |
| waba_id | varchar | YES |
| phone_number_id | varchar | YES |
| status | varchar | NO |
| is_connected | boolean | YES |
| last_connected_at | timestamptz | YES |
| api_credentials | text | YES |
| webhook_url | text | YES |
| admin_field_01 | varchar | YES |
| admin_field_02 | varchar | YES |
| metadata | jsonb | YES |
| profile_name | varchar | YES |
| profile_pic_url | text | YES |
| phone_number | varchar | YES |
| created_at | timestamptz | YES |
| updated_at | timestamptz | YES |

---

## ✅ O Que a Migration Faz

### 1. Adiciona Colunas Faltantes
- Usa `ADD COLUMN IF NOT EXISTS` (seguro, não causa erro se já existir)
- Adiciona valores padrão onde necessário

### 2. Popula Dados Existentes
- Gera `instance_name` automaticamente para registros antigos:
  ```sql
  instance_name = 'swiftbot_' || user_id
  ```

### 3. Adiciona Constraints
- `instance_name` → NOT NULL e UNIQUE
- `unique_user_instance` → Combinação única de user_id + instance_name

### 4. Cria Índices
- Performance otimizada para buscas por:
  - `user_id`
  - `instance_name`
  - `status`
  - `profile_name`

### 5. Configura Trigger
- `updated_at` atualiza automaticamente em cada UPDATE

---

## 🔍 Troubleshooting

### Erro: "column already exists"
**Causa**: Alguma coluna já foi adicionada manualmente.
**Solução**: A migration usa `IF NOT EXISTS`, então é seguro executar novamente.

### Erro: "constraint already exists"
**Causa**: Constraint já existe no banco.
**Solução**: A migration usa blocos `DO $$` com verificação, é seguro.

### Erro: "duplicate key value violates unique constraint"
**Causa**: Existem registros com `instance_name` duplicado.
**Solução**: Execute antes da migration:
```sql
-- Ver duplicatas
SELECT instance_name, COUNT(*)
FROM whatsapp_connections
WHERE instance_name IS NOT NULL
GROUP BY instance_name
HAVING COUNT(*) > 1;

-- Deletar duplicatas (manter apenas o mais recente)
DELETE FROM whatsapp_connections
WHERE id NOT IN (
  SELECT DISTINCT ON (instance_name) id
  FROM whatsapp_connections
  ORDER BY instance_name, created_at DESC NULLS LAST
);
```

---

## 🎯 Verificação Final

Após aplicar a migration, execute:

```sql
-- Ver total de colunas
SELECT COUNT(*) as total_colunas
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'whatsapp_connections';
```

**Resultado esperado**: `total_colunas = 19` (ou próximo disso)

---

## 🔄 Rollback (Se Necessário)

Se precisar reverter (use com cuidado!):

```sql
-- ATENÇÃO: Isso remove as colunas e APAGA os dados nelas!
ALTER TABLE whatsapp_connections
  DROP COLUMN IF EXISTS instance_name CASCADE,
  DROP COLUMN IF EXISTS instance_token CASCADE,
  DROP COLUMN IF EXISTS created_at CASCADE,
  DROP COLUMN IF EXISTS last_connected_at CASCADE,
  DROP COLUMN IF EXISTS webhook_url CASCADE,
  DROP COLUMN IF EXISTS profile_name CASCADE,
  DROP COLUMN IF EXISTS profile_pic_url CASCADE,
  DROP COLUMN IF EXISTS phone_number CASCADE,
  DROP COLUMN IF EXISTS metadata CASCADE,
  DROP COLUMN IF EXISTS admin_field_01 CASCADE,
  DROP COLUMN IF EXISTS admin_field_02 CASCADE;
```

---

## 📞 Próximos Passos

Após aplicar a migration:

1. ✅ Testar conexão WhatsApp no frontend
2. ✅ Verificar logs no console (F12)
3. ✅ Confirmar que não há mais erros de "instance_name not found"
4. ✅ Validar que os dados são salvos corretamente

---

## 📝 Notas Importantes

- ⚠️ **Backup**: O Supabase mantém backups automáticos, mas é bom conferir
- ✅ **Segura**: A migration usa `IF NOT EXISTS` e `IF NOT EXISTS` em tudo
- ✅ **Idempotente**: Pode ser executada múltiplas vezes sem causar erro
- ✅ **Preserva Dados**: Não remove nenhum dado existente

---

**Criado em**: 2025-01-19
**Arquivo Migration**: `database/migrations/002_add_missing_columns.sql`
