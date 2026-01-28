import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateApiKey } from '@/lib/api-auth'; // Keep legacy auth as fallback or parallel? Manual says HMAC primarily.
import { FieldMapper } from '@/lib/webhooks/field-mapper';
import { WebhookActionsExecutor } from '@/lib/webhooks/actions-executor';
import { validateWebhookSignature, logger } from '@/lib/webhooks/utils';
import { WebhookConfig } from '@/lib/webhooks/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const mainSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const mainSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const mainDb = createClient(mainSupabaseUrl, mainSupabaseServiceKey, {
    auth: { persistSession: false }
});

export async function POST(request: Request, { params }: { params: Promise<{ webhookId: string }> }) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID(); // Internal tracking ID

    try {
        const { webhookId } = await params;

        if (!webhookId) {
            return NextResponse.json({ success: false, error: 'webhookId required' }, { status: 400 });
        }

        // 1. Fetch Webhook Config
        const { data: webhook, error: fetchError } = await mainDb
            .from('incoming_webhooks')
            .select('*')
            .eq('id', webhookId)
            .single();

        if (fetchError || !webhook) {
            return NextResponse.json({ success: false, error: 'Webhook not found' }, { status: 404 });
        }

        if (!webhook.is_active) {
            return NextResponse.json({ success: false, error: 'Webhook inactive' }, { status: 400 });
        }

        // 2. Read Payload
        const rawBody = await request.text();
        let payload: any = {};
        try {
            payload = JSON.parse(rawBody);
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
        }

        // 3. HMAC Validation (Optional but recommended)
        const signature = request.headers.get('x-webhook-signature');
        if (webhook.secret && signature) {
            const isValid = validateWebhookSignature(rawBody, signature, webhook.secret);
            if (!isValid) {
                logger.warn(`Invalid signature for webhook ${webhookId}`);
                return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
            }
        }

        // 4. Idempotency Check
        // Try to get unique ID from header or payload
        const externalId = request.headers.get('x-request-id') ||
            payload.id ||
            payload.uuid ||
            payload.event_id;

        if (externalId) {
            const { data: existingRequest } = await mainDb
                .from('webhook_requests')
                .select('id')
                .eq('webhook_id', webhookId)
                .eq('webhook_request_id', String(externalId))
                .single();

            if (existingRequest) {
                logger.info(`Duplicate webhook request ${externalId} for ${webhookId}`);
                return NextResponse.json({ success: true, message: 'Already processed (idempotent)' });
            }

            // Record request
            await mainDb.from('webhook_requests').insert({
                webhook_id: webhookId,
                webhook_request_id: String(externalId),
                payload
            });
        }

        // 5. Update Stats & Last Payload
        await mainDb
            .from('incoming_webhooks')
            .update({
                total_received: (webhook.total_received || 0) + 1,
                last_received_at: new Date().toISOString(),
                last_payload: payload
            })
            .eq('id', webhookId);

        // 6. Map Fields
        const mapper = new FieldMapper();
        // Use auto-map if no mapping configured or if explicit flag (not in current schema but good practice)
        // Manual says: "Mapeia usando configuração explícita" if config exists
        const mappedData = (webhook.field_mapping && Object.keys(webhook.field_mapping).length > 0)
            ? mapper.mapWithConfig(payload, webhook as WebhookConfig)
            : mapper.autoMapFields(payload);

        if (!mappedData.phone) {
            logger.warn(`Phone not found in webhook ${webhookId}`, { payload });
            return NextResponse.json({
                success: false,
                message: 'Phone number not found in payload. Please configure field mapping.',
                payload_saved: true
            });
        }

        // 7. Get Connection Info (need instance name for contact creation)
        const { data: connection } = await mainDb
            .from('whatsapp_connections')
            .select('instance_name, id, user_id')
            .eq('id', webhook.connection_id)
            .single();

        if (!connection) {
            return NextResponse.json({ success: false, error: 'Connection linked to webhook not found' }, { status: 500 });
        }

        // 8. Execute Actions
        const executor = new WebhookActionsExecutor();
        const result = await executor.execute(
            webhook as WebhookConfig,
            mappedData,
            connection.instance_name,
            connection.id,
            connection.user_id
        );

        // 9. Log Result
        await mainDb.from('webhook_results').insert({
            request_id: requestId,
            webhook_id: webhookId,
            contact_id: result.contactId,
            actions_executed: result.results
        });

        const processingTime = Date.now() - startTime;
        return NextResponse.json({
            success: true,
            ...result,
            processingTime: `${processingTime}ms`
        });

    } catch (error) {
        logger.error('Webhook Handler Error', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
