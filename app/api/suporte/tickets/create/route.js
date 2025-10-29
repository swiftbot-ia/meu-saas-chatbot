// app/api/suporte/tickets/create/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
    const { data, error } = await supabaseAdmin
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