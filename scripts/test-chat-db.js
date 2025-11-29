/**
 * Script de Diagnóstico do Banco de Chat
 * Testa a conexão e verifica se há dados
 */

const { createClient } = require('@supabase/supabase-js');

// URLs do banco de chat
const chatUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL;
const chatKey = process.env.NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY;

console.log('\n🔍 DIAGNÓSTICO DO BANCO DE CHAT\n');
console.log('================================\n');

// 1. Verificar variáveis de ambiente
console.log('1️⃣ Variáveis de Ambiente:');
console.log('   NEXT_PUBLIC_CHAT_SUPABASE_URL:', chatUrl ? '✅ Configurada' : '❌ Faltando');
console.log('   NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY:', chatKey ? '✅ Configurada' : '❌ Faltando');
console.log('   URL:', chatUrl);
console.log('');

if (!chatUrl || !chatKey) {
  console.error('❌ Variáveis de ambiente não configuradas!\n');
  process.exit(1);
}

// 2. Criar cliente
console.log('2️⃣ Criando cliente Supabase...');
const supabase = createClient(chatUrl, chatKey);
console.log('   ✅ Cliente criado com sucesso\n');

// 3. Testar conexão e buscar dados
async function testDatabase() {
  try {
    console.log('3️⃣ Testando conexão com o banco...\n');

    // Testar tabela de contatos
    console.log('   📋 Tabela: whatsapp_contacts');
    const { data: contacts, error: contactsError, count: contactsCount } = await supabase
      .from('whatsapp_contacts')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (contactsError) {
      console.log('   ❌ Erro:', contactsError.message);
    } else {
      console.log('   ✅ Total de contatos:', contactsCount);
      console.log('   📝 Primeiros registros:', contacts?.length || 0);
      if (contacts && contacts.length > 0) {
        console.log('   Exemplo:', JSON.stringify(contacts[0], null, 2));
      }
    }
    console.log('');

    // Testar tabela de conversas
    console.log('   📋 Tabela: whatsapp_conversations');
    const { data: conversations, error: conversationsError, count: conversationsCount } = await supabase
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (conversationsError) {
      console.log('   ❌ Erro:', conversationsError.message);
    } else {
      console.log('   ✅ Total de conversas:', conversationsCount);
      console.log('   📝 Primeiros registros:', conversations?.length || 0);
      if (conversations && conversations.length > 0) {
        console.log('   Exemplo:', JSON.stringify(conversations[0], null, 2));
      }
    }
    console.log('');

    // Testar tabela de mensagens
    console.log('   📋 Tabela: whatsapp_messages');
    const { data: messages, error: messagesError, count: messagesCount } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (messagesError) {
      console.log('   ❌ Erro:', messagesError.message);
    } else {
      console.log('   ✅ Total de mensagens:', messagesCount);
      console.log('   📝 Primeiros registros:', messages?.length || 0);
      if (messages && messages.length > 0) {
        console.log('   Exemplo:', JSON.stringify(messages[0], null, 2));
      }
    }
    console.log('');

    // 4. Resumo
    console.log('4️⃣ RESUMO:\n');
    console.log('   Contatos:', contactsCount || 0);
    console.log('   Conversas:', conversationsCount || 0);
    console.log('   Mensagens:', messagesCount || 0);
    console.log('');

    if (!conversationsCount || conversationsCount === 0) {
      console.log('⚠️  ATENÇÃO: Nenhuma conversa encontrada!');
      console.log('   Isso explica por que as conversas não aparecem na interface.');
      console.log('   As conversas são criadas quando:');
      console.log('   1. Uma mensagem é recebida via webhook');
      console.log('   2. Uma mensagem é enviada pela primeira vez para um contato');
      console.log('');
    }

    // 5. Verificar RLS (se possível)
    console.log('5️⃣ Verificando RLS (Row Level Security):\n');
    console.log('   ℹ️  Para ver conversas, o user_id na tabela whatsapp_conversations');
    console.log('   precisa corresponder ao ID do usuário autenticado.');
    console.log('');

    if (conversations && conversations.length > 0) {
      const userIds = [...new Set(conversations.map(c => c.user_id))];
      console.log('   user_id encontrados nas conversas:', userIds);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro ao testar banco:', error);
  }
}

testDatabase();
