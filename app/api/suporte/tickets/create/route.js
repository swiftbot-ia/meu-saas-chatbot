// app/api/suporte/tickets/create/route.js
import { NextResponse } from 'next/server';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy initialization with dynamic import to avoid build-time errors
let supabaseAdmin = null;
async function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const { createClient } = await import('@supabase/supabase-js');
      supabaseAdmin = createClient(url, key);
    }
  }
  return supabaseAdmin;
}

export async function POST(request) {
  try {
    const { userId, subject, message, priority, category } = await request.json();

    // Validações
    if (!userId || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Criar ticket
    const { data, error } = await getSupabaseAdmin()
      .from('support_tickets')
      .insert({
        user_id: userId,
        subject,
        message,
        priority: priority || 'normal',
        category: category || null,
        status: 'open'
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar ticket:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket: data,
      message: 'Ticket criado com sucesso! Nossa equipe responderá em breve.'
    });

  } catch (error) {
    console.error('Erro fatal:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}