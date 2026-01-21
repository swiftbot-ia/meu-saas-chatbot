import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * DELETE /api/agent/documents/[id]
 * Delete a specific document by ID
 */
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'ID do documento é obrigatório' },
                { status: 400 }
            );
        }

        // Get user session using server client
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            );
        }

        // Get agent for this user
        const { data: agent, error: agentError } = await supabaseAdmin
            .from('ai_agents')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (agentError || !agent) {
            return NextResponse.json(
                { error: 'Agente não encontrado' },
                { status: 404 }
            );
        }

        // Verify document belongs to this user's agent
        const { data: doc, error: docError } = await supabaseAdmin
            .from('documents')
            .select('id, agent_id, title')
            .eq('id', id)
            .single();

        if (docError || !doc) {
            return NextResponse.json(
                { error: 'Documento não encontrado' },
                { status: 404 }
            );
        }

        if (doc.agent_id !== agent.id) {
            return NextResponse.json(
                { error: 'Você não tem permissão para deletar este documento' },
                { status: 403 }
            );
        }

        // Delete the document
        const { error: deleteError } = await supabaseAdmin
            .from('documents')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('❌ Error deleting document:', deleteError);
            return NextResponse.json(
                { error: 'Erro ao deletar documento' },
                { status: 500 }
            );
        }

        console.log(`🗑️ Document ${id} "${doc.title}" deleted for agent ${agent.id}`);

        return NextResponse.json({
            success: true,
            message: 'Documento deletado com sucesso'
        });

    } catch (error) {
        console.error('❌ Error in DELETE /api/agent/documents/[id]:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/agent/documents/[id]
 * Get a specific document by ID
 */
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'ID do documento é obrigatório' },
                { status: 400 }
            );
        }

        // Get user session using server client
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            );
        }

        // Get agent for this user
        const { data: agent, error: agentError } = await supabaseAdmin
            .from('ai_agents')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (agentError || !agent) {
            return NextResponse.json(
                { error: 'Agente não encontrado' },
                { status: 404 }
            );
        }

        // Fetch document
        const { data: doc, error: docError } = await supabaseAdmin
            .from('documents')
            .select('id, content, agent_id, title, category, file_type, file_name, chunk_number, total_chunks, context_summary, chunk_before, chunk_after, created_at')
            .eq('id', id)
            .single();

        if (docError || !doc) {
            return NextResponse.json(
                { error: 'Documento não encontrado' },
                { status: 404 }
            );
        }

        if (doc.agent_id !== agent.id) {
            return NextResponse.json(
                { error: 'Você não tem permissão para acessar este documento' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            document: {
                id: doc.id,
                content: doc.content,
                title: doc.title || 'Documento sem título',
                category: doc.category,
                file_type: doc.file_type,
                file_name: doc.file_name,
                chunk_number: doc.chunk_number,
                total_chunks: doc.total_chunks,
                context_summary: doc.context_summary,
                chunk_before: doc.chunk_before,
                chunk_after: doc.chunk_after,
                created_at: doc.created_at
            }
        });

    } catch (error) {
        console.error('❌ Error in GET /api/agent/documents/[id]:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
