-- Table for storing OTP Verifications
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    session_id TEXT, -- Optional, for tracking session
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '5 minutes'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_verifications(phone);

-- Function to prune expired OTPs (Optional)
-- CREATE OR REPLACE FUNCTION prune_expired_otps() RETURNS void AS $$
-- BEGIN
--     DELETE FROM public.otp_verifications WHERE expires_at < now();
-- END;
-- $$ LANGUAGE plpgsql;

-- Set up RLS (Row Level Security) - Admin Only
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to OTP" ON public.otp_verifications
    FOR ALL
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'ADMIN'))
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'ADMIN'));
