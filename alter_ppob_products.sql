-- Alter table to add new columns if they don't exist
ALTER TABLE public.ppob_products 
ADD COLUMN IF NOT EXISTS brand VARCHAR(50),
ADD COLUMN IF NOT EXISTS type VARCHAR(50),
ADD COLUMN IF NOT EXISTS seller_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS provider_price NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS markup NUMERIC NOT NULL DEFAULT 0;

-- Drop existing price column if it's not a generated column, to recreate it as generated
ALTER TABLE public.ppob_products DROP COLUMN IF EXISTS price;
ALTER TABLE public.ppob_products ADD COLUMN price NUMERIC GENERATED ALWAYS AS (provider_price + markup) STORED;

-- Update RLS so Admin can view all products (active or not)
DROP POLICY IF EXISTS "Anyone can view active products" ON public.ppob_products;
CREATE POLICY "Anyone can view products" 
ON public.ppob_products FOR SELECT 
USING (
    is_active = true 
    OR 
    (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'))
);

-- Update RLS so Admin can update products (markup, is_active)
DROP POLICY IF EXISTS "Admin can update products" ON public.ppob_products;
CREATE POLICY "Admin can update products" 
ON public.ppob_products FOR UPDATE 
USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
);
