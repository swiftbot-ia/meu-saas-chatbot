-- Migration: Create lp_leads table for landing page form submissions
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS lp_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    source VARCHAR(100) DEFAULT 'lp-whatsapp-inteligente',
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term VARCHAR(255),
    utm_content VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_lp_leads_email ON lp_leads(email);

-- Index for faster whatsapp lookups
CREATE INDEX IF NOT EXISTS idx_lp_leads_whatsapp ON lp_leads(whatsapp);

-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_lp_leads_source ON lp_leads(source);

-- Index for date filtering
CREATE INDEX IF NOT EXISTS idx_lp_leads_created_at ON lp_leads(created_at DESC);

-- RLS Policy (optional - enable if using RLS)
-- ALTER TABLE lp_leads ENABLE ROW LEVEL SECURITY;
