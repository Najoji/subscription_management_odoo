-- Seed Data for Brightloop Subscription Management System
-- Run this in the Supabase SQL Editor after running 001_initial_schema.sql

-- 1. Insert Default Taxes
INSERT INTO public.taxes (id, name, rate, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'GST 18%', 18.00, true),
  ('11111111-1111-1111-1111-111111111112', 'VAT 5%', 5.00, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Default Products & Variants
-- Product: Brightloop CRM Suite (Sales Price: 1000)
INSERT INTO public.products (id, name, product_type, sales_price, cost_price, notes, tax_id, is_active)
VALUES 
  ('22222222-2222-2222-2222-222222222221', 'Brightloop CRM Core', 'service', 1000.00, 350.00, 'Core SaaS subscription for customer relationship management', '11111111-1111-1111-1111-111111111111', true),
  ('22222222-2222-2222-2222-222222222222', 'Brightloop ERP Starter', 'service', 2500.00, 800.00, 'Enterprise resource planning basic package', '11111111-1111-1111-1111-111111111111', true)
ON CONFLICT (id) DO NOTHING;

-- Variant: Odoo Brand Integration (+560 extra price)
INSERT INTO public.product_variants (id, product_id, name, extra_price, is_active)
VALUES 
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221', 'Odoo Brand Connector', 560.00, true),
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222221', 'Enterprise Priority Support', 400.00, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Default Plans
INSERT INTO public.plans (id, name, billing_interval, interval_count, minimum_quantity, auto_close, allow_early_close, allow_pause, allow_renewal, is_active)
VALUES
  ('44444444-4444-4444-4444-444444444441', 'Monthly Standard Plan', 'monthly', 1, 1, false, true, true, true, true),
  ('44444444-4444-4444-4444-444444444442', 'Annual Value Plan', 'yearly', 1, 1, false, true, true, true, true),
  ('44444444-4444-4444-4444-444444444443', 'Weekly Flex Plan', 'weekly', 1, 1, false, true, true, true, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Initial Discount
INSERT INTO public.discounts (id, name, code, discount_type, value, minimum_purchase, minimum_quantity, is_active)
VALUES
  ('55555555-5555-5555-5555-555555555551', 'Welcome 10% Off', 'WELCOME10', 'percentage', 10.00, 500.00, 1, true)
ON CONFLICT (id) DO NOTHING;

-- 5. How to set the first Admin:
-- After a user registers via Supabase Auth (e.g. admin@brightloop.com), run:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@brightloop.com';
