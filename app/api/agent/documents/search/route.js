import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import embeddingsService from '@/lib/EmbeddingsService';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/agent/documents/search
 * Search for similar documents using vector similarity
 * 
 * Body: { 
 *   query: string,           // Text to search for
 *   agent_id: string,        // Agent ID to filter by
 *   category?: string,       // Optional category filter
 *   limit?: number,          // Max results (default: 5)
 *   threshold?: number       // Similarity threshold 0-1 (default: 0.7)
 * }
 * 
 * This endpoint is designed to be called from n8n workflow
 */
export async function POST(request) {
    try {
        // Parse request body
        const body = await request.json();
        const {
            query,
            agent_id,
            category,
            limit = 5,
            threshold = 0.7
        } = body;

        // Validate required fields
        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { error: 'Query é obrigatória' },
                { status: 400 }
            );
        }

        if (!agent_id) {
            return NextResponse.json(
                { error: 'agent_id é obrigatório' },
                { status: 400 }
            );
        }

        // Check embeddings service
        if (!embeddingsService.isConfigured()) {
            return NextResponse.json(
                { error: 'Serviço de embeddings não configurado' },
                { status: 500 }
            );
        }

        console.log(`🔍 RAG search for agent ${agent_id}: "${query.substring(0, 50)}..."`);

        // Generate embedding for the query
        const { embedding } = await embeddingsService.generateEmbedding(query);

        // Build filter object
        const filter = { agent_id: agent_id };
        if (category) {
            filter.category = category;
        }

        // Search for similar documents using the match_documents function
        const { data: matches, error: searchError } = await supabaseAdmin.rpc(
            'match_documents',
            {
                query_embedding: embedding,
                match_count: limit,
                filter: filter
            }
        );

        if (searchError) {
            console.error('❌ RAG search error:', searchError);

            // Fallback: direct query if function doesn't exist
            if (searchError.message?.includes('function') || searchError.code === '42883') {
                console.log('⚠️ match_documents function not found, using fallback query');

                // Direct similarity search
                let fallbackQuery = supabaseAdmin
                    .from('documents')
                    .select('id, content, title, category, chunk_number, context_summary, chunk_before, chunk_after')
                    .eq('agent_id', agent_id)
                    .limit(limit);

                if (category) {
                    fallbackQuery = fallbackQuery.eq('category', category);
                }

                const { data: directMatches, error: directError } = await fallbackQuery;

                if (directError) {
                    return NextResponse.json(
                        { error: 'Erro na busca direta: ' + directError.message },
                        { status: 500 }
                    );
                }

                // Return documents without similarity score (fallback mode)
                return NextResponse.json({
                    results: (directMatches || []).map(doc => ({
                        id: doc.id,
                        content: doc.content,
                        title: doc.title,
                        category: doc.category,
                        chunk_number: doc.chunk_number,
                        context_summary: doc.context_summary,
                        chunk_before: doc.chunk_before,
                        chunk_after: doc.chunk_after,
                        similarity: null,
                        fallback_mode: true
                    })),
                    query_tokens: 0,
                    fallback_mode: true
                });
            }

            return NextResponse.json(
                { error: 'Erro na busca: ' + searchError.message },
                { status: 500 }
            );
        }

        // Filter by threshold and format results with context
        const filteredMatches = (matches || [])
            .filter(m => m.similarity >= threshold)
            .map(match => ({
                id: match.id,
                content: match.content,
                title: match.title,
                category: match.category,
                file_type: match.file_type,
                chunk_number: match.chunk_number,
                context_summary: match.context_summary,
                chunk_before: match.chunk_before,
                chunk_after: match.chunk_after,
                similarity: match.similarity
            }));

        console.log(`✅ RAG search found ${filteredMatches.length} relevant documents`);

        return NextResponse.json({
            results: filteredMatches,
            total_found: filteredMatches.length,
            threshold_used: threshold,
            category_filter: category || null
        });

    } catch (error) {
        console.error('❌ Error in POST /api/agent/documents/search:', error);
        return NextResponse.json(
            { error: 'Erro na busca: ' + error.message },
            { status: 500 }
        );
    }
}
