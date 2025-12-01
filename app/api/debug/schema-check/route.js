/**
 * API Route de Diagnóstico: Verifica Schema do Banco de Dados
 * Acesse: GET /api/debug/schema-check
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { createChatSupabaseClient } from '@/lib/supabase/chat-client'

export async function GET(request) {
  const results = {
    timestamp: new Date().toISOString(),
    mainDatabase: {},
    chatDatabase: {},
    issues: [],
    summary: ''
  }

  try {
    // ==========================================
    // MAIN DATABASE
    // ==========================================
    const mainSupabase = createServerSupabaseClient()

    results.mainDatabase.configured = true
    results.mainDatabase.url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET'

    // Verificar whatsapp_connections
    try {
      const { data: connections, error } = await mainSupabase
        .from('whatsapp_connections')
        .select('*')
        .limit(1)

      if (error) {
        results.mainDatabase.whatsapp_connections = {
          status: 'ERROR',
          error: error.message
        }
        results.issues.push('Main DB: whatsapp_connections não acessível')
      } else {
        const columns = connections && connections[0] ? Object.keys(connections[0]) : []
        results.mainDatabase.whatsapp_connections = {
          status: 'OK',
          columns: columns,
          columnCount: columns.length,
          hasData: connections && connections.length > 0
        }
      }
    } catch (err) {
      results.mainDatabase.whatsapp_connections = {
        status: 'ERROR',
        error: err.message
      }
    }

    // Verificar se whatsapp_messages existe no Main DB
    try {
      const { data: messages, error } = await mainSupabase
        .from('whatsapp_messages')
        .select('*')
        .limit(1)

      if (error) {
        results.mainDatabase.whatsapp_messages = {
          status: 'NOT_EXISTS',
          note: 'Esperado se usando dual-database'
        }
      } else {
        const columns = messages && messages[0] ? Object.keys(messages[0]) : []
        results.mainDatabase.whatsapp_messages = {
          status: 'EXISTS',
          columns: columns,
          note: 'Tabela existe no Main DB (pode estar usando single-database)'
        }
      }
    } catch (err) {
      results.mainDatabase.whatsapp_messages = {
        status: 'ERROR',
        error: err.message
      }
    }

    // ==========================================
    // CHAT DATABASE
    // ==========================================
    if (!process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL) {
      results.chatDatabase.configured = false
      results.chatDatabase.note = 'Usando single-database (Main DB only)'
      results.issues.push('Chat DB não configurado - usando Main DB')
    } else {
      results.chatDatabase.configured = true
      results.chatDatabase.url = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL

      const chatSupabase = createChatSupabaseClient()

      // Verificar whatsapp_contacts
      try {
        const { data: contacts, error } = await chatSupabase
          .from('whatsapp_contacts')
          .select('*')
          .limit(1)

        if (error) {
          results.chatDatabase.whatsapp_contacts = {
            status: 'ERROR',
            error: error.message
          }
          results.issues.push('Chat DB: whatsapp_contacts não acessível')
        } else {
          const columns = contacts && contacts[0] ? Object.keys(contacts[0]) : []
          results.chatDatabase.whatsapp_contacts = {
            status: 'OK',
            columns: columns,
            columnCount: columns.length,
            hasData: contacts && contacts.length > 0
          }
        }
      } catch (err) {
        results.chatDatabase.whatsapp_contacts = {
          status: 'ERROR',
          error: err.message
        }
      }

      // Verificar whatsapp_conversations
      try {
        const { data: conversations, error } = await chatSupabase
          .from('whatsapp_conversations')
          .select('*')
          .limit(1)

        if (error) {
          results.chatDatabase.whatsapp_conversations = {
            status: 'ERROR',
            error: error.message
          }
          results.issues.push('Chat DB: whatsapp_conversations não acessível')
        } else {
          const columns = conversations && conversations[0] ? Object.keys(conversations[0]) : []
          results.chatDatabase.whatsapp_conversations = {
            status: 'OK',
            columns: columns,
            columnCount: columns.length,
            hasData: conversations && conversations.length > 0
          }
        }
      } catch (err) {
        results.chatDatabase.whatsapp_conversations = {
          status: 'ERROR',
          error: err.message
        }
      }

      // Verificar whatsapp_messages no Chat DB
      try {
        const { data: messages, error } = await chatSupabase
          .from('whatsapp_messages')
          .select('*')
          .limit(1)

        if (error) {
          results.chatDatabase.whatsapp_messages = {
            status: 'ERROR',
            error: error.message
          }
          results.issues.push('Chat DB: whatsapp_messages não acessível')
        } else {
          const columns = messages && messages[0] ? Object.keys(messages[0]) : []

          // Verificar colunas obrigatórias da migration
          const requiredColumns = ['conversation_id', 'contact_id', 'instance_name']
          const missingColumns = requiredColumns.filter(col => !columns.includes(col))

          results.chatDatabase.whatsapp_messages = {
            status: missingColumns.length === 0 ? 'OK' : 'INCOMPLETE',
            columns: columns,
            columnCount: columns.length,
            hasData: messages && messages.length > 0,
            requiredColumns: requiredColumns,
            missingColumns: missingColumns
          }

          if (missingColumns.length > 0) {
            results.issues.push(`Chat DB: whatsapp_messages falta colunas: ${missingColumns.join(', ')}`)
          }
        }
      } catch (err) {
        results.chatDatabase.whatsapp_messages = {
          status: 'ERROR',
          error: err.message
        }
      }
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    if (results.issues.length === 0) {
      results.summary = '✅ Schema OK - Nenhum problema encontrado'
    } else {
      results.summary = `⚠️ ${results.issues.length} problema(s) encontrado(s)`
    }

    return NextResponse.json(results, { status: 200 })

  } catch (error) {
    return NextResponse.json({
      error: 'Erro ao executar diagnóstico',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
