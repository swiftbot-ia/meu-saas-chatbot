-- [MAIN DB] Migration
-- Run this on your MAIN Supabase project (where whatsapp_connections and crm_stages exist)

-- 1. Function to create default stages for a new connection
CREATE OR REPLACE FUNCTION public.create_default_crm_stages()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert 'Novo' stage (Protected, key='novo')
    INSERT INTO public.crm_stages (connection_id, name, position, color_key, stage_key)
    VALUES (NEW.id, 'Novo', 0, 'purple_blue', 'novo');

    -- Insert other default stages (Editable/Deletable)
    INSERT INTO public.crm_stages (connection_id, name, position, color_key, stage_key)
    VALUES 
    (NEW.id, 'Apresentação', 1, 'orange_yellow', 'apresentacao'),
    (NEW.id, 'Negociação', 2, 'purple_pink', 'negociacao'),
    (NEW.id, 'Fechamento', 3, 'blue_green', 'fechamento');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger to run after a new connection is created
DROP TRIGGER IF EXISTS trigger_create_default_crm_stages ON public.whatsapp_connections;
CREATE TRIGGER trigger_create_default_crm_stages
AFTER INSERT ON public.whatsapp_connections
FOR EACH ROW
EXECUTE FUNCTION public.create_default_crm_stages();

-- 3. Backfill: Ensure existing connections have the 'Novo' stage
DO $$
DECLARE
    conn RECORD;
BEGIN
    FOR conn IN SELECT id FROM public.whatsapp_connections LOOP
        -- Check if 'novo' stage exists
        IF NOT EXISTS (SELECT 1 FROM public.crm_stages WHERE connection_id = conn.id AND stage_key = 'novo') THEN
            INSERT INTO public.crm_stages (connection_id, name, position, color_key, stage_key)
            VALUES (conn.id, 'Novo', 0, 'purple_blue', 'novo');
        END IF;
    END LOOP;
END $$;
