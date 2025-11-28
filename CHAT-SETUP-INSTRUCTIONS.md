# 🚀 Instruções de Configuração - Chat ao Vivo

## ⚡ Setup Rápido (5 minutos)

### 1️⃣ Aplicar Migration do Banco de Dados

Você tem duas opções:

#### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Cole o conteúdo do arquivo: `supabase/migrations/20251128_create_chat_tables.sql`
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Aguarde a mensagem de sucesso

#### Opção B: Via Supabase CLI

```bash
# Se você tem o Supabase CLI instalado
supabase db push
```

### 2️⃣ Verificar Instalação

Execute este SQL no SQL Editor para verificar:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('whatsapp_contacts', 'whatsapp_conversations');

-- Deve retornar 2 linhas
```

### 3️⃣ Testar o Chat

1. Certifique-se de ter uma instância do WhatsApp conectada
2. Acesse: `http://localhost:3000/dashboard/chat`
3. Envie uma mensagem de teste do seu celular para o número conectado
4. A conversa deve aparecer automaticamente na lista

---

## ✅ Checklist Pós-Instalação

- [ ] Migration aplicada com sucesso
- [ ] Tabelas `whatsapp_contacts` e `whatsapp_conversations` existem
- [ ] Funções `get_or_create_contact()` e `get_or_create_conversation()` criadas
- [ ] Página `/dashboard/chat` carrega sem erros
- [ ] Instância do WhatsApp está conectada
- [ ] Webhook está recebendo mensagens (verifique logs)
- [ ] Mensagens recebidas aparecem na lista de conversas
- [ ] Envio de mensagens funciona

---

## 🐛 Problemas Comuns

### "relation whatsapp_contacts does not exist"

**Causa:** Migration não foi aplicada
**Solução:** Execute a migration novamente (passo 1)

### Página /dashboard/chat em branco

**Causa:** Erro no JavaScript
**Solução:**
1. Abra o DevTools (F12)
2. Vá na aba Console
3. Verifique erros
4. Certifique-se de que o servidor está rodando: `npm run dev`

### Conversas não aparecem

**Causa:** Webhook não está recebendo mensagens ou não está processando
**Solução:**
1. Envie uma mensagem de teste
2. Verifique os logs do servidor
3. Verifique se o webhook está configurado: `/api/webhooks/uazapi`

### Não consigo enviar mensagens

**Causa:** Instância desconectada
**Solução:**
1. Vá em `/dashboard`
2. Verifique status da conexão
3. Reconecte se necessário

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique o arquivo de logs
2. Leia a documentação completa: `docs/CHAT-IMPLEMENTATION-GUIDE.md`
3. Verifique as issues existentes no GitHub
4. Abra uma nova issue com:
   - Descrição do problema
   - Print do erro
   - Logs do servidor
   - Passos para reproduzir

---

## 🎉 Pronto!

Seu chat ao vivo está configurado e pronto para uso!

Acesse: **http://localhost:3000/dashboard/chat**

Documentação completa: `docs/CHAT-IMPLEMENTATION-GUIDE.md`
