#!/usr/bin/env node
/**
 * Script de Diagnóstico: Verifica Schema do Banco de Dados
 * Confirma se as migrations foram aplicadas corretamente
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MAIN_DB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const MAIN_DB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const CHAT_DB_URL = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL
const CHAT_DB_KEY = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY

console.log('🔍 Diagnóstico de Schema do Banco de Dados\n')

async function checkDatabaseSchema() {
  // Verificar configuração
  console.log('📋 Configuração:')
  console.log('  Main DB URL:', MAIN_DB_URL ? '✅ Configurado' : '❌ Não configurado')
  console.log('  Chat DB URL:', CHAT_DB_URL ? '✅ Configurado' : '❌ Não configurado')

  if (!MAIN_DB_URL || !MAIN_DB_KEY) {
    console.error('\n❌ Main Database não configurado!')
    process.exit(1)
  }

  // Conectar ao Main DB
  const mainSupabase = createClient(MAIN_DB_URL, MAIN_DB_KEY)

  console.log('\n🗄️  MAIN DATABASE (whatsapp_connections):')
  try {
    // Verificar tabela whatsapp_connections
    const { data: connections, error: connError } = await mainSupabase
      .from('whatsapp_connections')
      .select('*')
      .limit(1)

    if (connError) {
      console.error('  ❌ Erro ao acessar whatsapp_connections:', connError.message)
    } else {
      console.log('  ✅ whatsapp_connections: OK')
      console.log('     Colunas:', Object.keys(connections[0] || {}).join(', '))
    }

    // Verificar tabela whatsapp_messages no main DB
    const { data: messages, error: msgError } = await mainSupabase
      .from('whatsapp_messages')
      .select('*')
      .limit(1)

    if (msgError) {
      console.log('  ⚠️  whatsapp_messages: Não existe no Main DB (esperado se usando dual-database)')
    } else {
      console.log('  ⚠️  whatsapp_messages: Existe no Main DB')
      console.log('     Colunas:', Object.keys(messages[0] || {}).join(', '))
    }
  } catch (error) {
    console.error('  ❌ Erro:', error.message)
  }

  // Conectar ao Chat DB (se configurado)
  if (!CHAT_DB_URL || !CHAT_DB_KEY) {
    console.log('\n⚠️  CHAT DATABASE: Não configurado (usando Main DB)')
    return
  }

  const chatSupabase = createClient(CHAT_DB_URL, CHAT_DB_KEY)

  console.log('\n💬 CHAT DATABASE (mensagens, conversas, contatos):')

  try {
    // Verificar whatsapp_contacts
    const { data: contacts, error: contactsError } = await chatSupabase
      .from('whatsapp_contacts')
      .select('*')
      .limit(1)

    if (contactsError) {
      console.error('  ❌ whatsapp_contacts:', contactsError.message)
    } else {
      console.log('  ✅ whatsapp_contacts: OK')
      const cols = Object.keys(contacts[0] || {})
      console.log('     Colunas:', cols.length > 0 ? cols.join(', ') : 'Tabela vazia')
    }

    // Verificar whatsapp_conversations
    const { data: conversations, error: convError } = await chatSupabase
      .from('whatsapp_conversations')
      .select('*')
      .limit(1)

    if (convError) {
      console.error('  ❌ whatsapp_conversations:', convError.message)
    } else {
      console.log('  ✅ whatsapp_conversations: OK')
      const cols = Object.keys(conversations[0] || {})
      console.log('     Colunas:', cols.length > 0 ? cols.join(', ') : 'Tabela vazia')
    }

    // Verificar whatsapp_messages
    const { data: messages, error: msgError } = await chatSupabase
      .from('whatsapp_messages')
      .select('*')
      .limit(1)

    if (msgError) {
      console.error('  ❌ whatsapp_messages:', msgError.message)
    } else {
      console.log('  ✅ whatsapp_messages: OK')
      const cols = Object.keys(messages[0] || {})
      console.log('     Colunas:', cols.length > 0 ? cols.join(', ') : 'Tabela vazia')

      // Verificar se tem as colunas necessárias
      const requiredColumns = ['conversation_id', 'contact_id', 'instance_name']
      const hasAllColumns = requiredColumns.every(col => cols.includes(col))

      if (hasAllColumns) {
        console.log('  ✅ Migration aplicada: whatsapp_messages tem todas as colunas necessárias')
      } else {
        console.log('  ⚠️  Migration NÃO aplicada: faltam colunas:', requiredColumns.filter(col => !cols.includes(col)).join(', '))
      }
    }

    // Verificar funções do banco
    console.log('\n🔧 Verificando Funções do Banco:')
    const { data: contactResult, error: funcError1 } = await chatSupabase
      .rpc('get_or_create_contact', {
        p_whatsapp_number: 'test_function_check',
        p_name: 'Test'
      })
      .maybeSingle()

    if (funcError1) {
      console.error('  ❌ get_or_create_contact:', funcError1.message)
    } else {
      console.log('  ✅ get_or_create_contact: OK')
      // Limpar teste
      if (contactResult) {
        await chatSupabase.from('whatsapp_contacts').delete().eq('id', contactResult)
      }
    }

  } catch (error) {
    console.error('  ❌ Erro:', error.message)
  }

  console.log('\n✅ Diagnóstico concluído!\n')
}

checkDatabaseSchema().catch(console.error)
