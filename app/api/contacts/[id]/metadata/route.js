/**
 * Contact Metadata API Route
 * GET /api/contacts/[id]/metadata - Get contact metadata
 * PATCH /api/contacts/[id]/metadata - Merge fields into metadata
 * PUT /api/contacts/[id]/metadata - Replace all metadata
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createChatSupabaseAdminClient } from '@/lib/supabase/chat-server';

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

/**
 * GET - Get contact metadata
 */
export async function GET(request, { params }) {
    try {
        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'ID do contato é obrigatório' }, { status: 400 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        const { data: contact, error } = await chatSupabase
            .from('whatsapp_contacts')
            .select('id, metadata')
            .eq('id', id)
            .single();

        if (error || !contact) {
            return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
        }

        return NextResponse.json({ success: true, metadata: contact.metadata || {} });

    } catch (error) {
        console.error('Erro na API de metadata GET:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

/**
 * PATCH - Merge fields into existing metadata
 * Body: { fieldName: value, anotherField: value }
 */
export async function PATCH(request, { params }) {
    try {
        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'ID do contato é obrigatório' }, { status: 400 });
        }

        const body = await request.json();

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return NextResponse.json({ error: 'Body deve ser um objeto com campos' }, { status: 400 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        // Get current contact metadata
        const { data: contact, error: fetchError } = await chatSupabase
            .from('whatsapp_contacts')
            .select('id, metadata')
            .eq('id', id)
            .single();

        if (fetchError || !contact) {
            return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
        }

        // Merge new fields into existing metadata
        const currentMetadata = contact.metadata || {};
        const updatedMetadata = { ...currentMetadata, ...body };

        // Update contact metadata
        const { error: updateError } = await chatSupabase
            .from('whatsapp_contacts')
            .update({ metadata: updatedMetadata, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (updateError) {
            console.error('Erro ao atualizar metadata:', updateError);
            return NextResponse.json({ error: 'Erro ao atualizar metadata' }, { status: 500 });
        }

        return NextResponse.json({ success: true, metadata: updatedMetadata });

    } catch (error) {
        console.error('Erro na API de metadata PATCH:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

/**
 * PUT - Replace all metadata
 * Body: { fieldName: value, anotherField: value }
 */
export async function PUT(request, { params }) {
    try {
        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'ID do contato é obrigatório' }, { status: 400 });
        }

        const body = await request.json();

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return NextResponse.json({ error: 'Body deve ser um objeto com campos' }, { status: 400 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        // Verify contact exists
        const { data: contact, error: fetchError } = await chatSupabase
            .from('whatsapp_contacts')
            .select('id')
            .eq('id', id)
            .single();

        if (fetchError || !contact) {
            return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
        }

        // Replace all metadata
        const { error: updateError } = await chatSupabase
            .from('whatsapp_contacts')
            .update({ metadata: body, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (updateError) {
            console.error('Erro ao substituir metadata:', updateError);
            return NextResponse.json({ error: 'Erro ao substituir metadata' }, { status: 500 });
        }

        return NextResponse.json({ success: true, metadata: body });

    } catch (error) {
        console.error('Erro na API de metadata PUT:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
