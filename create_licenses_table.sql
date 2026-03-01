-- Create table for License Management
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    domain_url TEXT,
    bundle_id TEXT,
    package_name TEXT, -- Misal: Basic, Pro, Enterprise
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, EXPIRED, PENDING
    expired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for Invite Tokens (Single-use)
CREATE TABLE IF NOT EXISTS invite_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL, -- Kode acak untuk masuk ke halaman regis
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expired_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Enable RLS
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Only service_role can manage
CREATE POLICY "Admins can do everything on licenses" ON licenses FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Admins can do everything on tokens" ON invite_tokens FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
