-- Create crm_stages table
CREATE TABLE IF NOT EXISTS public.crm_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL,
  name text NOT NULL,
  position integer NOT NULL,
  color_key text NOT NULL,
  stage_key text NOT NULL, -- Used for querying leads (e.g. 'novo', 'apresentacao', or uuid for custom ones)
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crm_stages_pkey PRIMARY KEY (id),
  CONSTRAINT crm_stages_connection_id_fkey FOREIGN KEY (connection_id) REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_crm_stages_connection_id ON public.crm_stages(connection_id);
CREATE INDEX IF NOT EXISTS idx_crm_stages_stage_key ON public.crm_stages(stage_key);

-- Populate default stages for existing connections that don't have stages yet
DO $$
DECLARE
    conn RECORD;
BEGIN
    FOR conn IN SELECT id FROM public.whatsapp_connections LOOP
        IF NOT EXISTS (SELECT 1 FROM public.crm_stages WHERE connection_id = conn.id) THEN
            INSERT INTO public.crm_stages (connection_id, name, position, color_key, stage_key)
            VALUES
            (conn.id, 'Novo', 0, 'purple_blue', 'novo'),
            (conn.id, 'Apresentação', 1, 'orange_yellow', 'apresentacao'),
            (conn.id, 'Negociação', 2, 'purple_pink', 'negociacao'),
            (conn.id, 'Fechamento', 3, 'blue_green', 'fechamento');
        END IF;
    END LOOP;
END $$;
