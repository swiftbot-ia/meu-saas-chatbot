/**
 * Single Template API Route
 * GET /api/automations/templates/[id] - Get template
 * PUT /api/automations/templates/[id] - Update template
 * DELETE /api/automations/templates/[id] - Delete template
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const supabase = await createAuthClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('message_templates')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Erro ao buscar template:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const supabase = await createAuthClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { name, content, type, mediaUrl, isActive } = body;

        const updateData = { updated_at: new Date().toISOString() };
        if (name !== undefined) updateData.name = name.trim();
        if (content !== undefined) updateData.content = content.trim();
        if (type !== undefined) updateData.type = type;
        if (mediaUrl !== undefined) updateData.media_url = mediaUrl || null;
        if (isActive !== undefined) updateData.is_active = isActive;

        const { data, error } = await supabase
            .from('message_templates')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar template:', error);
            return NextResponse.json({ error: 'Erro ao atualizar template' }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Erro ao atualizar template:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const supabase = await createAuthClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { error } = await supabase
            .from('message_templates')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Erro ao deletar template:', error);
            return NextResponse.json({ error: 'Erro ao deletar template' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Erro ao deletar template:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
