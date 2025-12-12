-- RPC Function para adicionar campo personalizado a todos os contatos
-- Execute isso no Supabase SQL Editor (chatDb - sbtchat)

CREATE OR REPLACE FUNCTION add_global_metadata_field(
    p_instance_name TEXT,
    p_user_id UUID,
    p_field_name TEXT,
    p_field_value TEXT DEFAULT ''
)
RETURNS TABLE(updated_count INTEGER, total_count INTEGER) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated INTEGER;
    v_total INTEGER;
BEGIN
    -- Contar total de contatos para esta instância
    SELECT COUNT(DISTINCT wc.id) INTO v_total
    FROM whatsapp_contacts wc
    INNER JOIN whatsapp_conversations conv ON conv.contact_id = wc.id
    WHERE conv.instance_name = p_instance_name
      AND conv.user_id = p_user_id
      AND wc.id IS NOT NULL;

    -- Atualizar todos os contatos que não têm o campo
    UPDATE whatsapp_contacts
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(p_field_name, p_field_value),
        updated_at = NOW()
    WHERE id IN (
        SELECT DISTINCT wc.id
        FROM whatsapp_contacts wc
        INNER JOIN whatsapp_conversations conv ON conv.contact_id = wc.id
        WHERE conv.instance_name = p_instance_name
          AND conv.user_id = p_user_id
          AND wc.id IS NOT NULL
          AND (
            wc.metadata IS NULL 
            OR NOT wc.metadata ? p_field_name
          )
    );

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    RETURN QUERY SELECT v_updated, v_total;
END;
$$;

-- Grant permissão para a service role usar
GRANT EXECUTE ON FUNCTION add_global_metadata_field(TEXT, UUID, TEXT, TEXT) TO service_role;

-- Função para listar campos de metadata únicos
CREATE OR REPLACE FUNCTION get_metadata_fields(
    p_instance_name TEXT,
    p_user_id UUID
)
RETURNS TABLE(field_name TEXT, sample_value TEXT, contact_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        key::TEXT as field_name,
        (SELECT value::TEXT 
         FROM whatsapp_contacts wc2 
         INNER JOIN whatsapp_conversations conv2 ON conv2.contact_id = wc2.id
         WHERE conv2.instance_name = p_instance_name
           AND conv2.user_id = p_user_id
           AND wc2.metadata ? key
         LIMIT 1
        ) as sample_value,
        COUNT(*) as contact_count
    FROM whatsapp_contacts wc
    INNER JOIN whatsapp_conversations conv ON conv.contact_id = wc.id,
    jsonb_object_keys(COALESCE(wc.metadata, '{}'::jsonb)) AS key
    WHERE conv.instance_name = p_instance_name
      AND conv.user_id = p_user_id
    GROUP BY key
    ORDER BY contact_count DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_metadata_fields(TEXT, UUID) TO service_role;
