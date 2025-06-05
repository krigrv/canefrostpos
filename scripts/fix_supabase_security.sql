-- Fix Supabase Security Issues

-- 1. Fix SECURITY DEFINER views by recreating them without SECURITY DEFINER

-- Drop and recreate product_inventory_summary view
DROP VIEW IF EXISTS public.product_inventory_summary;
CREATE VIEW public.product_inventory_summary AS
SELECT 
  p.id,
  p.name,
  p.category,
  p.price,
  p.stock,
  CASE 
    WHEN p.stock <= 5 THEN 'Low Stock'
    WHEN p.stock = 0 THEN 'Out of Stock'
    ELSE 'In Stock'
  END as stock_status
FROM products p;

-- Drop and recreate sales_summary view
DROP VIEW IF EXISTS public.sales_summary;
CREATE VIEW public.sales_summary AS
SELECT 
  DATE(created_at) as sale_date,
  COUNT(*) as total_sales,
  SUM(total) as total_revenue,
  AVG(total) as average_sale
FROM sales
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- 2. Fix functions with mutable search paths

-- Fix get_sales_stats function
CREATE OR REPLACE FUNCTION public.get_sales_stats()
RETURNS TABLE (
  date_range text,
  total_sales bigint,
  total_revenue numeric,
  average_sale numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN DATE(created_at) = CURRENT_DATE THEN 'Today'
      WHEN DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' THEN 'Yesterday'
      WHEN DATE(created_at) BETWEEN CURRENT_DATE - INTERVAL '7 days' AND CURRENT_DATE - INTERVAL '2 days' THEN 'Last 7 days'
      WHEN DATE(created_at) BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE - INTERVAL '8 days' THEN 'Last 30 days'
      ELSE 'Older'
    END as date_range,
    COUNT(*) as total_sales,
    SUM(total) as total_revenue,
    AVG(total) as average_sale
  FROM sales
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY date_range
  ORDER BY
    CASE date_range
      WHEN 'Today' THEN 1
      WHEN 'Yesterday' THEN 2
      WHEN 'Last 7 days' THEN 3
      WHEN 'Last 30 days' THEN 4
      ELSE 5
    END;
  
  RETURN;
END;
$$;

-- Fix update_product_stock_after_sale function
CREATE OR REPLACE FUNCTION public.update_product_stock_after_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update product stock quantities based on sale items
  UPDATE products
  SET stock = stock - (sale_items.quantity)
  FROM (
    SELECT jsonb_array_elements(NEW.items)->>'id' as product_id,
           (jsonb_array_elements(NEW.items)->>'quantity')::numeric as quantity
    FROM sales
    WHERE id = NEW.id
  ) as sale_items
  WHERE products.id = sale_items.product_id;
  
  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Create missing tables

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can manage own profile" ON public.user_profiles;
CREATE POLICY "Users can manage own profile" ON public.user_profiles
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;
CREATE POLICY "Users can manage own settings" ON public.user_settings
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);