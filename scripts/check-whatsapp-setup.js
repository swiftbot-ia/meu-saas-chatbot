#!/usr/bin/env node
/**
 * Script de Diagnóstico Completo
 * Verifica configuração do WhatsApp e banco de dados de chat
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('\n🔍 DIAGNÓSTICO COMPLETO DO SISTEMA\n');
console.log('='.repeat(60));

async function runDiagnostics() {
  const results = {
    timestamp: new Date().toISOString(),
    checks: []
  };

  try {
    // ========================================
    // 1. VERIFICAR VARIÁVEIS DE AMBIENTE
    // ========================================
    console.log('\n📋 1. VARIÁVEIS DE AMBIENTE\n');

    const mainUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const mainKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const chatUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL;
    const chatKey = process.env.NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY;
    const uazapiUrl = process.env.UAZAPI_BASE_URL;
    const uazapiToken = process.env.UAZAPI_TOKEN;

    console.log('   Main DB URL:', mainUrl ? '✅ Configurado' : '❌ Faltando');
    console.log('   Main DB Key:', mainKey ? '✅ Configurado' : '❌ Faltando');
    console.log('   Chat DB URL:', chatUrl ? '✅ Configurado' : '❌ Faltando');
    console.log('   Chat DB Key:', chatKey ? '✅ Configurado' : '❌ Faltando');
    console.log('   UAZapi URL:', uazapiUrl ? '✅ Configurado' : '❌ Faltando');
    console.log('   UAZapi Token:', uazapiToken ? '✅ Configurado' : '❌ Faltando');

    results.checks.push({
      name: 'Variáveis de Ambiente',
      status: (mainUrl && mainKey && chatUrl && chatKey && uazapiUrl && uazapiToken) ? 'OK' : 'INCOMPLETO',
      details: {
        mainDbUrl: !!mainUrl,
        mainDbKey: !!mainKey,
        chatDbUrl: !!chatUrl,
        chatDbKey: !!chatKey,
        uazapiUrl: !!uazapiUrl,
        uazapiToken: !!uazapiToken
      }
    });

    if (!mainUrl || !mainKey) {
      console.log('\n❌ ERRO: Variáveis do banco principal não configuradas!\n');
      return;
    }

    // ========================================
    // 2. VERIFICAR INSTÂNCIAS WHATSAPP
    // ========================================
    console.log('\n📱 2. INSTÂNCIAS WHATSAPP (Banco Principal)\n');

    const mainSupabase = createClient(mainUrl, mainKey);

    const { data: connections, error: connError, count: connCount } = await mainSupabase
      .from('whatsapp_connections')
      .select('id, user_id, instance_name, phone_number_id, status, is_connected, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (connError) {
      console.log('   ❌ Erro ao buscar conexões:', connError.message);
      results.checks.push({
        name: 'Instâncias WhatsApp',
        status: 'ERRO',
        error: connError.message
      });
    } else {
      console.log('   Total de instâncias:', connCount || 0);

      if (connections && connections.length > 0) {
        console.log('\n   Instâncias encontradas:');
        connections.forEach((conn, i) => {
          console.log(`\n   ${i + 1}. ID: ${conn.id}`);
          console.log(`      User ID: ${conn.user_id}`);
          console.log(`      Instance Name: ${conn.instance_name}`);
          console.log(`      Phone: ${conn.phone_number_id || 'N/A'}`);
          console.log(`      Status: ${conn.status}`);
          console.log(`      Conectado: ${conn.is_connected ? '✅ Sim' : '❌ Não'}`);
          console.log(`      Criado em: ${new Date(conn.created_at).toLocaleString('pt-BR')}`);
        });
      } else {
        console.log('   ⚠️  Nenhuma instância WhatsApp encontrada!');
        console.log('   💡 Você precisa conectar um WhatsApp primeiro.');
      }

      results.checks.push({
        name: 'Instâncias WhatsApp',
        status: connCount > 0 ? 'OK' : 'VAZIO',
        total: connCount,
        connections: connections
      });
    }

    // ========================================
    // 3. VERIFICAR BANCO DE CHAT
    // ========================================
    if (chatUrl && chatKey) {
      console.log('\n💬 3. BANCO DE DADOS DE CHAT\n');

      const chatSupabase = createClient(chatUrl, chatKey);

      // Contatos
      const { count: contactsCount, error: contactsError } = await chatSupabase
        .from('whatsapp_contacts')
        .select('*', { count: 'exact', head: true });

      // Conversas
      const { data: conversations, count: conversationsCount, error: conversationsError } = await chatSupabase
        .from('whatsapp_conversations')
        .select('id, instance_name, user_id, contact_phone, created_at', { count: 'exact' })
        .limit(10);

      // Mensagens
      const { count: messagesCount, error: messagesError } = await chatSupabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true });

      console.log('   Contatos:', contactsCount || 0);
      console.log('   Conversas:', conversationsCount || 0);
      console.log('   Mensagens:', messagesCount || 0);

      if (conversations && conversations.length > 0) {
        console.log('\n   Últimas conversas:');
        conversations.forEach((conv, i) => {
          console.log(`   ${i + 1}. Instance: ${conv.instance_name} | Phone: ${conv.contact_phone} | User: ${conv.user_id}`);
        });
      }

      results.checks.push({
        name: 'Banco de Chat',
        status: conversationsCount > 0 ? 'OK' : 'VAZIO',
        contacts: contactsCount || 0,
        conversations: conversationsCount || 0,
        messages: messagesCount || 0
      });
    }

    // ========================================
    // 4. VERIFICAR WEBHOOKS CONFIGURADOS
    // ========================================
    console.log('\n🔗 4. WEBHOOKS\n');

    const { data: webhooks, error: webhookError } = await mainSupabase
      .from('whatsapp_connections')
      .select('instance_name, webhook_url')
      .not('webhook_url', 'is', null);

    if (webhookError) {
      console.log('   ❌ Erro ao verificar webhooks:', webhookError.message);
    } else if (webhooks && webhooks.length > 0) {
      console.log('   Webhooks configurados:', webhooks.length);
      webhooks.forEach((w, i) => {
        console.log(`   ${i + 1}. ${w.instance_name}: ${w.webhook_url}`);
      });
    } else {
      console.log('   ⚠️  Nenhum webhook configurado');
      console.log('   💡 Configure webhooks para receber mensagens');
    }

    results.checks.push({
      name: 'Webhooks',
      status: (webhooks && webhooks.length > 0) ? 'OK' : 'VAZIO',
      total: webhooks?.length || 0
    });

    // ========================================
    // 5. RESUMO E DIAGNÓSTICO
    // ========================================
    console.log('\n📊 RESUMO\n');
    console.log('='.repeat(60));

    const hasInstances = connCount > 0;
    const hasConversations = results.checks.find(c => c.name === 'Banco de Chat')?.conversations > 0;
    const hasWebhooks = webhooks && webhooks.length > 0;

    if (!hasInstances) {
      console.log('❌ PROBLEMA: Nenhuma instância WhatsApp conectada');
      console.log('   SOLUÇÃO: Vá para o dashboard e conecte um WhatsApp');
    } else if (!hasWebhooks) {
      console.log('⚠️  AVISO: Instâncias existem mas sem webhooks');
      console.log('   SOLUÇÃO: Configure o webhook para receber mensagens');
    } else if (!hasConversations) {
      console.log('⚠️  AVISO: Webhooks OK mas sem conversas no banco');
      console.log('   POSSÍVEL CAUSA:');
      console.log('   1. Webhook não está sendo chamado pela UAZapi');
      console.log('   2. Webhook está falhando ao processar mensagens');
      console.log('   3. Nenhuma mensagem foi enviada/recebida ainda');
      console.log('   SOLUÇÃO: Envie uma mensagem de teste para o WhatsApp');
    } else {
      console.log('✅ TUDO OK: Sistema configurado e funcionando!');
    }

    // Salvar resultados
    const fs = require('fs');
    fs.writeFileSync('diagnostic-results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Resultados salvos em: diagnostic-results.json\n');

  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:', error.message);
    console.error(error.stack);
  }
}

runDiagnostics();
