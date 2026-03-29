-- Migration: Add Duitku payment columns to topup_requests
-- Run this in Supabase SQL Editor

ALTER TABLE public.topup_requests
  ADD COLUMN IF NOT EXISTS payment_url TEXT,
  ADD COLUMN IF NOT EXISTS duitku_reference TEXT,
  ADD COLUMN IF NOT EXISTS va_number TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Allow proof_url to be nullable (for Duitku payments, we don't need manual proof)
ALTER TABLE public.topup_requests 
  ALTER COLUMN proof_url DROP NOT NULL;

-- Grant service_role access for admin_note column (for merchantOrderId lookup)
COMMENT ON COLUMN public.topup_requests.admin_note IS 'Stores Duitku merchantOrderId for automatic payment tracking';
