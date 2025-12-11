/**
 * Templates API Route
 * GET /api/automations/templates - List templates
 * POST /api/automations/templates - Create template
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getOwnerUserIdFromMember } from '@/lib/account-service';

export const dynamic = 'force-dynamic';

async function createAuthClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) { return cookieStore.get(name)?.value; },
                set(name, value, options) { cookieStore.set({ name, value, ...options }); },
                remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
            },
        }
    );
}

export async function GET(request) {
    try {
        const supabase = await createAuthClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Get owner's user ID for team data sharing
        let ownerUserId = user.id;
        try {
            const ownerFromService = await getOwnerUserIdFromMember(user.id);
            if (ownerFromService) {
                ownerUserId = ownerFromService;
                if (ownerUserId !== user.id) {
                    console.log('👥 [Templates API] Team member, using owner data:', ownerUserId);
                }
            }
        } catch (accountError) {
            console.log('⚠️ [Templates API] Account check failed:', accountError.message);
        }

        const { searchParams } = new URL(request.url);
        const connectionId = searchParams.get('connectionId');

        let query = supabase
            .from('message_templates')
            .select('*')
            .eq('user_id', ownerUserId)
            .order('created_at', { ascending: false });

        if (connectionId) {
            query = query.or(`connection_id.eq.${connectionId},connection_id.is.null`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar templates:', error);
            return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 });
        }

        return NextResponse.json({ templates: data || [] });

    } catch (error) {
        console.error('Erro na API de templates:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const supabase = await createAuthClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { name, content, type = 'text', mediaUrl, connectionId } = body;

        if (!name?.trim() || !content?.trim()) {
            return NextResponse.json({ error: 'Nome e conteúdo são obrigatórios' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('message_templates')
            .insert({
                user_id: user.id,
                connection_id: connectionId || null,
                name: name.trim(),
                content: content.trim(),
                type,
                media_url: mediaUrl || null
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar template:', error);
            return NextResponse.json({ error: 'Erro ao criar template' }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });

    } catch (error) {
        console.error('Erro na API de templates:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
