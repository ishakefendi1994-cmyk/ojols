-- Seed Data for PPOB Products
INSERT INTO public.ppob_products (product_code, product_name, category, provider, price, is_active)
VALUES 
('tl10', 'Telkomsel 10,000', 'pulsa', 'telkomsel', 10500, true),
('tl20', 'Telkomsel 20,000', 'pulsa', 'telkomsel', 20500, true),
('tl50', 'Telkomsel 50,000', 'pulsa', 'telkomsel', 50500, true),
('is10', 'Indosat 10,000', 'pulsa', 'indosat', 10800, true),
('is20', 'Indosat 20,000', 'pulsa', 'indosat', 20800, true),
('pln20', 'PLN Token 20,000', 'pln', 'pln', 22000, true),
('pln50', 'PLN Token 50,000', 'pln', 'pln', 52000, true),
('pln100', 'PLN Token 100,000', 'pln', 'pln', 102000, true)
ON CONFLICT (product_code) DO UPDATE 
SET price = EXCLUDED.price, is_active = EXCLUDED.is_active;
