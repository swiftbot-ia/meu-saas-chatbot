// app/api/portal-interno/tickets/dashboard/route.js
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Buscar tickets com informações do usuário
    const { data: tickets, error } = await supabaseAdmin
      .from('support_tickets')
      .select(`
        *,
        user_profiles (
          id,
          email,
          full_name,
          company_name,
          phone
        ),
        support_users!assigned_to (
          id,
          full_name,
          email
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar tickets:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tickets: tickets || []
    });

  } catch (error) {
    console.error('Erro ao buscar tickets:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}